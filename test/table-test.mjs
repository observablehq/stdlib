import {operationsToSqlTemplate} from "../src/table.mjs";
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

it("operationsToSqlTemplate null table", () => {
  const source = {};
  assert.strictEqual(operationsToSqlTemplate(EMPTY_TABLE_DATA.operations, source), undefined);
});

it("operationsToSqlTemplate no selected columns", () => {
  const source = {name: "db", dialect: "postgres"};
  const operationsColumnsNull = {...baseOperations, select: {columns: null}};
  assert.strictEqual(operationsToSqlTemplate(operationsColumnsNull, source), undefined);
  const operationsColumnsEmpty = {...baseOperations, select: {columns: []}};
  assert.strictEqual(operationsToSqlTemplate(operationsColumnsEmpty, source), undefined);
});

it("operationsToSqlTemplate invalid filter operation", () => {
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
    assert.throws(() => operationsToSqlTemplate(operations, source), /Invalid filter operation/);
  });
});

it("operationsToSqlTemplate filter", () => {
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

  const [parts, ...params] = operationsToSqlTemplate(operations, source);
  assert.deepStrictEqual(parts.join("?"), "SELECT t.col1,t.col2 FROM table1 t\nWHERE t.col1 = ?");
  assert.deepStrictEqual(params, ["val1"]);
});

it("operationsToSqlTemplate filter list", () => {
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

  const [parts, ...params] = operationsToSqlTemplate(operations, source);
  assert.deepStrictEqual(parts.join("?"), "SELECT t.col1,t.col2 FROM table1 t\nWHERE t.col1 IN (?,?,?)\nAND t.col1 NOT IN (?)");
  assert.deepStrictEqual(params, ["val1", "val2", "val3", "val4"]);
});

it("operationsToSqlTemplate select", () => {
  const source = {name: "db", dialect: "mysql"};
  const operations = {
    ...baseOperations,
    select: {
      columns: ["col1", "col2", "col3"]
    }
  };

  const [parts, ...params] = operationsToSqlTemplate(operations, source);
  assert.deepStrictEqual(parts.join("?"), "SELECT t.col1,t.col2,t.col3 FROM table1 t");
  assert.deepStrictEqual(params, []);
});

it("operationsToSqlTemplate sort", () => {
  const source = {name: "db", dialect: "mysql"};
  const operations = {
    ...baseOperations,
    sort: [
      {column: "col1", direction: "asc"},
      {column: "col2", direction: "desc"}
    ]
  };

  const [parts, ...params] = operationsToSqlTemplate(operations, source);
  assert.deepStrictEqual(parts.join("?"), "SELECT t.col1,t.col2 FROM table1 t\nORDER BY t.col1 ASC, t.col2 DESC");
  assert.deepStrictEqual(params, []);
});

it("operationsToSqlTemplate slice", () => {
  const source = {name: "db", dialect: "mysql"};
  const operations = {...baseOperations};

  operations.slice = {from: 10, to: 20};
  let [parts, ...params] = operationsToSqlTemplate(operations, source);
  assert.deepStrictEqual(parts.join("?"), "SELECT t.col1,t.col2 FROM table1 t\nLIMIT 10 OFFSET 10");
  assert.deepStrictEqual(params, []);

  operations.slice = {from: null, to: 20};
  [parts, ...params] = operationsToSqlTemplate(operations, source);
  assert.deepStrictEqual(parts.join("?"), "SELECT t.col1,t.col2 FROM table1 t\nLIMIT 20");
  assert.deepStrictEqual(params, []);

  operations.slice = {from: 10, to: null};
  [parts, ...params] = operationsToSqlTemplate(operations, source);
  assert.deepStrictEqual(parts.join("?"), `SELECT t.col1,t.col2 FROM table1 t\nLIMIT ${1e9} OFFSET 10`);
  assert.deepStrictEqual(params, []);
});

it("operationsToSqlTemplate select, sort, slice, filter indexed", () => {
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

  const [parts, ...params] = operationsToSqlTemplate(operations, source);
  assert.deepStrictEqual(parts.join("?"), "SELECT t.col1,t.col2,t.col3 FROM table1 t\nWHERE t.col1 >= ?\nAND t.col2 = ?\nORDER BY t.col1 ASC\nLIMIT 90 OFFSET 10");
  assert.deepStrictEqual(params, ["val1", "val2"]);
});
