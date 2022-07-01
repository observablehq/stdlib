import {makeQueryTemplate} from "../src/table.mjs";
import assert from "assert";

export const EMPTY_TABLE_DATA = {
  source: {
    name: null,
    type: null
  },
  operations: {
    select: {
      columns: null
    },
    from: {
      table: null,
      mimeType: null
    },
    filter: [],
    sort: [],
    slice: {
      from: null,
      to: null
    }
  },
  ui: {
    showCharts: true
  }
};

const baseOperations = {
  ...EMPTY_TABLE_DATA.operations,
  select: {columns: ["col1", "col2"]},
  from: {
    table: "table1",
    mimeType: null
  }
};

it("makeQueryTemplate null table", () => {
  const source = {};
  assert.strictEqual(makeQueryTemplate(EMPTY_TABLE_DATA.operations, source), undefined);
});

it("makeQueryTemplate no selected columns", () => {
  const source = {name: "db", dialect: "postgres"};
  const operationsColumnsNull = {...baseOperations, select: {columns: null}};
  assert.strictEqual(makeQueryTemplate(operationsColumnsNull, source), undefined);
  const operationsColumnsEmpty = {...baseOperations, select: {columns: []}};
  assert.strictEqual(makeQueryTemplate(operationsColumnsEmpty, source), undefined);
});

it("makeQueryTemplate invalid filter operation", () => {
  const source = {name: "db", dialect: "postgres"};
  const invalidFilters = [
    {
      type: "n",
      operands: [
        {type: "column", value: "col1"},
        {type: "primitive", value: "val1"}
      ]
    },
    {
      type: "eq",
      operands: [{type: "column", value: "col1"}]
    },
    {
      type: "lt",
      operands: [
        {type: "column", value: "col1"},
        {type: "primitive", value: "val1"},
        {type: "primitive", value: "val2"}
      ]
    }
  ];

  invalidFilters.map((filter) => {
    const operations = {
      ...baseOperations,
      filter: [filter]
    };
    assert.throws(() => makeQueryTemplate(operations, source), /Invalid filter operation/);
  });
});

it("makeQueryTemplate filter", () => {
  const source = {name: "db", dialect: "postgres"};
  const operations = {
    ...baseOperations,
    filter: [
      {
        type: "eq",
        operands: [
          {type: "column", value: "col1"},
          {type: "primitive", value: "val1"}
        ]
      }
    ]
  };

  const [parts, ...params] = makeQueryTemplate(operations, source);
  assert.deepStrictEqual(parts.join("?"), "SELECT t.col1,t.col2 FROM table1 t\nWHERE t.col1 = ?");
  assert.deepStrictEqual(params, ["val1"]);
});

it("makeQueryTemplate filter list", () => {
  const source = {name: "db", dialect: "postgres"};
  const operations = {
    ...baseOperations,
    filter: [
      {
        type: "in",
        operands: [
          {type: "column", value: "col1"},
          {type: "primitive", value: "val1"},
          {type: "primitive", value: "val2"},
          {type: "primitive", value: "val3"}
        ]
      },
      {
        type: "nin",
        operands: [
          {type: "column", value: "col1"},
          {type: "primitive", value: "val4"}
        ]
      }
    ]
  };

  const [parts, ...params] = makeQueryTemplate(operations, source);
  assert.deepStrictEqual(parts.join("?"), "SELECT t.col1,t.col2 FROM table1 t\nWHERE t.col1 IN (?,?,?)\nAND t.col1 NOT IN (?)");
  assert.deepStrictEqual(params, ["val1", "val2", "val3", "val4"]);
});

it("makeQueryTemplate select", () => {
  const source = {name: "db", dialect: "mysql"};
  const operations = {
    ...baseOperations,
    select: {
      columns: ["col1", "col2", "col3"]
    }
  };

  const [parts, ...params] = makeQueryTemplate(operations, source);
  assert.deepStrictEqual(parts.join("?"), "SELECT t.col1,t.col2,t.col3 FROM table1 t");
  assert.deepStrictEqual(params, []);
});

it("makeQueryTemplate sort", () => {
  const source = {name: "db", dialect: "mysql"};
  const operations = {
    ...baseOperations,
    sort: [
      {column: "col1", direction: "asc"},
      {column: "col2", direction: "desc"}
    ]
  };

  const [parts, ...params] = makeQueryTemplate(operations, source);
  assert.deepStrictEqual(parts.join("?"), "SELECT t.col1,t.col2 FROM table1 t\nORDER BY t.col1 ASC, t.col2 DESC");
  assert.deepStrictEqual(params, []);
});

it("makeQueryTemplate slice", () => {
  const source = {name: "db", dialect: "mysql"};
  const operations = {...baseOperations};

  operations.slice = {from: 10, to: 20};
  let [parts, ...params] = makeQueryTemplate(operations, source);
  assert.deepStrictEqual(parts.join("?"), "SELECT t.col1,t.col2 FROM table1 t\nLIMIT 10 OFFSET 10");
  assert.deepStrictEqual(params, []);

  operations.slice = {from: null, to: 20};
  [parts, ...params] = makeQueryTemplate(operations, source);
  assert.deepStrictEqual(parts.join("?"), "SELECT t.col1,t.col2 FROM table1 t\nLIMIT 20");
  assert.deepStrictEqual(params, []);

  operations.slice = {from: 10, to: null};
  [parts, ...params] = makeQueryTemplate(operations, source);
  assert.deepStrictEqual(parts.join("?"), `SELECT t.col1,t.col2 FROM table1 t\nLIMIT ${1e9} OFFSET 10`);
  assert.deepStrictEqual(params, []);
});

it("makeQueryTemplate select, sort, slice, filter indexed", () => {
  const source = {name: "db", dialect: "postgres"};
  const operations = {
    ...baseOperations,
    select: {
      columns: ["col1", "col2", "col3"]
    },
    sort: [{column: "col1", direction: "asc"}],
    slice: {from: 10, to: 100},
    filter: [
      {
        type: "gte",
        operands: [
          {type: "column", value: "col1"},
          {type: "primitive", value: "val1"}
        ]
      },
      {
        type: "eq",
        operands: [
          {type: "column", value: "col2"},
          {type: "primitive", value: "val2"}
        ]
      }
    ]
  };

  const [parts, ...params] = makeQueryTemplate(operations, source);
  assert.deepStrictEqual(parts.join("?"), "SELECT t.col1,t.col2,t.col3 FROM table1 t\nWHERE t.col1 >= ?\nAND t.col2 = ?\nORDER BY t.col1 ASC\nLIMIT 90 OFFSET 10");
  assert.deepStrictEqual(params, ["val1", "val2"]);
});
