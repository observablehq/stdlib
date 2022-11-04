import {makeQueryTemplate, __table} from "../src/table.mjs";
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

describe("makeQueryTemplate", () => {
  it("makeQueryTemplate null table", () => {
    const source = {};
    assert.throws(() => makeQueryTemplate(EMPTY_TABLE_DATA.operations, source), /missing from table/);
  });

  it("makeQueryTemplate no selected columns", () => {
    const source = {name: "db", dialect: "postgres"};
    const operationsColumnsEmpty = {...baseOperations, select: {columns: []}};
    assert.throws(() => makeQueryTemplate(operationsColumnsEmpty, source), /at least one column must be selected/);
  });

  it("makeQueryTemplate select all", () => {
    const source = {name: "db", dialect: "postgres"};
    const operationsColumnsNull = {...baseOperations, select: {columns: null}};
    assert.deepStrictEqual(makeQueryTemplate(operationsColumnsNull, source), [["SELECT * FROM table1 t"]]);
  });

  it("makeQueryTemplate invalid filter operation", () => {
    const source = {name: "db", dialect: "postgres"};
    const invalidFilters = [
      {
        type: "n",
        operands: [
          {type: "column", value: "col1"},
          {type: "resolved", value: "val1"}
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
          {type: "resolved", value: "val1"},
          {type: "resolved", value: "val2"}
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
            {type: "resolved", value: "val1"}
          ]
        }
      ]
    };

    const [parts, ...params] = makeQueryTemplate(operations, source);
    assert.deepStrictEqual(parts.join("?"), "SELECT t.col1,t.col2 FROM table1 t\nWHERE t.col1 = ?");
    assert.deepStrictEqual(params, ["val1"]);
  });

  it("makeQueryTemplate filter and escape filters column", () => {
    const source = {name: "db", dialect: "postgres", escape: (i) => `_${i}_`};
    const operations = {
      ...baseOperations,
      filter: [
        {
          type: "eq",
          operands: [
            {type: "column", value: "col2"},
            {type: "resolved", value: "val1"}
          ]
        }
      ]
    };

    const [parts, ...params] = makeQueryTemplate(operations, source);
    assert.deepStrictEqual(
      parts.join("?"),
      "SELECT t._col1_,t._col2_ FROM table1 t\nWHERE t._col2_ = ?"
    );
    assert.deepStrictEqual(params, ["val1"]);
  });

  it("makeQueryTemplate filter and escape filters column only once", () => {
    const source = {name: "db", dialect: "postgres", escape: (i) => `_${i}_`};
    const operations = {
      ...baseOperations,
      filter: [
        {
          type: "eq",
          operands: [
            {type: "column", value: "col2"},
            {type: "resolved", value: "val1"}
          ]
        }
      ]
    };

    makeQueryTemplate(operations, source);
    const [parts, ...params] = makeQueryTemplate(operations, source);
    assert.deepStrictEqual(
        parts.join("?"),
        "SELECT t._col1_,t._col2_ FROM table1 t\nWHERE t._col2_ = ?"
    );
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
            {type: "resolved", value: "val1"},
            {type: "resolved", value: "val2"},
            {type: "resolved", value: "val3"}
          ]
        },
        {
          type: "nin",
          operands: [
            {type: "column", value: "col1"},
            {type: "resolved", value: "val4"}
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

  it("makeQueryTemplate sort and escape sort column", () => {
    const source = {name: "db", dialect: "mysql", escape: (i) => `_${i}_`};
    const operations = {
      ...baseOperations,
      sort: [
        {column: "col1", direction: "asc"},
        {column: "col2", direction: "desc"}
      ]
    };

    const [parts, ...params] = makeQueryTemplate(operations, source);
    assert.deepStrictEqual(
      parts.join("?"),
      "SELECT t._col1_,t._col2_ FROM table1 t\nORDER BY t._col1_ ASC, t._col2_ DESC"
    );
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
            {type: "resolved", value: "val1"}
          ]
        },
        {
          type: "eq",
          operands: [
            {type: "column", value: "col2"},
            {type: "resolved", value: "val2"}
          ]
        }
      ]
    };

    const [parts, ...params] = makeQueryTemplate(operations, source);
    assert.deepStrictEqual(parts.join("?"), "SELECT t.col1,t.col2,t.col3 FROM table1 t\nWHERE t.col1 >= ?\nAND t.col2 = ?\nORDER BY t.col1 ASC\nLIMIT 90 OFFSET 10");
    assert.deepStrictEqual(params, ["val1", "val2"]);
  });

  it("makeQueryTemplate select, slice and escape column name with mssql syntax", () => {
    const source = {name: "db", dialect: "mssql", escape: (i) => `_${i}_`};
    const operations = {
      ...baseOperations,
      select: {
        columns: ["col1", "col2", "col3"]
      },
      slice: {to: 100}
    };

    const [parts] = makeQueryTemplate(operations, source);
    assert.deepStrictEqual(
      parts.join("?"),
      "SELECT t._col1_,t._col2_,t._col3_ FROM table1 t\nORDER BY t._col1_ ASC\nOFFSET 0 ROWS\nFETCH NEXT 100 ROWS ONLY"
    );
  });

  it("makeQueryTemplate select, sort, slice, filter indexed with mssql syntax", () => {
    const source = {name: "db", dialect: "mssql"};
    const operations = {
      ...baseOperations,
      select: {
        columns: ["col1", "col2", "col3"]
      },
      sort: [{column: "col2", direction: "desc"}],
      slice: {from: 10, to: 100},
      filter: [
        {
          type: "gte",
          operands: [
            {type: "column", value: "col1"},
            {type: "resolved", value: "val1"}
          ]
        },
        {
          type: "eq",
          operands: [
            {type: "column", value: "col2"},
            {type: "resolved", value: "val2"}
          ]
        }
      ]
    };

    const [parts, ...params] = makeQueryTemplate(operations, source);
    assert.deepStrictEqual(parts.join("?"), "SELECT t.col1,t.col2,t.col3 FROM table1 t\nWHERE t.col1 >= ?\nAND t.col2 = ?\nORDER BY t.col2 DESC\nOFFSET 10 ROWS\nFETCH NEXT 90 ROWS ONLY");
    assert.deepStrictEqual(params, ["val1", "val2"]);
  });

  it("makeQueryTemplate throw if no columns are explicitly specified for mssql dialect", () => {
    const source = {name: "db", dialect: "mssql"};
    const operations = {
      ...baseOperations,
      select: {
        columns: []
      },
      sort: [{column: "col2", direction: "desc"}],
      slice: {from: 10, to: 100},
      filter: [
        {
          type: "gte",
          operands: [
            {type: "column", value: "col1"},
            {type: "resolved", value: "val1"}
          ]
        },
        {
          type: "eq",
          operands: [
            {type: "column", value: "col2"},
            {type: "resolved", value: "val2"}
          ]
        }
      ]
    };

    assert.throws(() => {
      makeQueryTemplate(operations, source);
    }, Error);
  });
});

describe("__table", () => {
  let source;

  beforeEach(() => {
    source = [{a: 1, b: 2, c: 3}, {a: 2, b: 4, c: 6}, {a: 3, b: 6, c: 9}];
  });

  it("__table no operations", () => {
    assert.deepStrictEqual(__table(source, EMPTY_TABLE_DATA.operations), source);
  });

  it("__table columns", () => {
    const operationsNullColumns = {...EMPTY_TABLE_DATA.operations, select: {columns: null}};
    assert.deepStrictEqual(__table(source, operationsNullColumns), source);
    const operationsEmptyColumns = {...EMPTY_TABLE_DATA.operations, select: {columns: []}};
    assert.deepStrictEqual(__table(source, operationsEmptyColumns), [{}, {}, {}]);
    const operationsSelectedColumns = {...EMPTY_TABLE_DATA.operations, select: {columns: ["a"]}};
    assert.deepStrictEqual(__table(source, operationsSelectedColumns), [{a: 1}, {a: 2}, {a: 3}]);
  });

  it("__table unknown filter", () => {
    const operations = {
      ...EMPTY_TABLE_DATA.operations,
      filter: [{type: "xyz", operands: [{type: "column", value: "a"}]}]
    };
    assert.throws(() => __table(source, operations), /unknown filter type: xyz/);
  });

  it("__table filter lt + gt", () => {
    const operationsEquals = {
      ...EMPTY_TABLE_DATA.operations,
      filter: [{type: "eq", operands: [{type: "column", value: "a"}, {type: "resolved", value: 1}]}]
    };
    assert.deepStrictEqual(__table(source, operationsEquals), [{a: 1, b: 2, c: 3}]);
    const operationsComparison = {
      ...EMPTY_TABLE_DATA.operations,
      filter: [
        {type: "lt", operands: [{type: "column", value: "a"}, {type: "resolved", value: 3}]},
        {type: "gt", operands: [{type: "column", value: "b"}, {type: "resolved", value: 2}]}
      ]
    };
    assert.deepStrictEqual(__table(source, operationsComparison), [{a: 2, b: 4, c: 6}]);
  });

  it("__table filter lte + gte", () => {
    const operationsEquals = {
      ...EMPTY_TABLE_DATA.operations,
      filter: [{type: "eq", operands: [{type: "column", value: "a"}, {type: "resolved", value: 1}]}]
    };
    assert.deepStrictEqual(__table(source, operationsEquals), [{a: 1, b: 2, c: 3}]);
    const operationsComparison = {
      ...EMPTY_TABLE_DATA.operations,
      filter: [
        {type: "lte", operands: [{type: "column", value: "a"}, {type: "resolved", value: 2.5}]},
        {type: "gte", operands: [{type: "column", value: "b"}, {type: "resolved", value: 2.5}]}
      ]
    };
    assert.deepStrictEqual(__table(source, operationsComparison), [{a: 2, b: 4, c: 6}]);
  });

  it("__table filter primitive lte + gte", () => {
    assert.deepStrictEqual(__table([1, 2, 3], {
      ...EMPTY_TABLE_DATA.operations,
      filter: [{type: "eq", operands: [{type: "column", value: "value"}, {type: "resolved", value: 1}]}]
    }), [1]);
    assert.deepStrictEqual(__table(Uint32Array.of(1, 2, 3), {
      ...EMPTY_TABLE_DATA.operations,
      filter: [{type: "eq", operands: [{type: "column", value: "value"}, {type: "resolved", value: 1}]}]
    }), [1]);
  });

  it("__table filter eq date", () => {
    const operationsEquals = {
      ...EMPTY_TABLE_DATA.operations,
      filter: [{type: "eq", operands: [{type: "column", value: "a"}, {type: "resolved", value: new Date("2021-01-02")}]}]
    };
    const source = [{a: new Date("2021-01-01")}, {a: new Date("2021-01-02")}, {a: new Date("2021-01-03")}];
    assert.deepStrictEqual(__table(source, operationsEquals), [{a: new Date("2021-01-02")}]);
  });

  it("__table sort", () => {
    const operations1 = {...EMPTY_TABLE_DATA.operations, sort: [{column: "a", direction: "desc"}]};
    assert.deepStrictEqual(
      __table(source, operations1),
      [{a: 3, b: 6, c: 9}, {a: 2, b: 4, c: 6}, {a: 1, b: 2, c: 3}]
    );
    const sourceExtended = [...source, {a: 1, b: 3, c: 3}, {a: 1, b: 5, c: 3}];
    const operations2 = {
      ...EMPTY_TABLE_DATA.operations,
      sort: [{column: "a", direction: "desc"}, {column: "b", direction: "desc"}]
    };
    assert.deepStrictEqual(
      __table(sourceExtended, operations2),
      [{a: 3, b: 6, c: 9}, {a: 2, b: 4, c: 6}, {a: 1, b: 5, c: 3}, {a: 1, b: 3, c: 3}, {a: 1, b: 2, c: 3}]
    );
  });

  it("__table sort does not mutate input", () => {
    const operations = {...EMPTY_TABLE_DATA.operations, sort: [{column: "a", direction: "desc"}]};
    assert.deepStrictEqual(
      __table(source, operations),
      [{a: 3, b: 6, c: 9}, {a: 2, b: 4, c: 6}, {a: 1, b: 2, c: 3}]
    );
    assert.deepStrictEqual(
      source,
      [{a: 1, b: 2, c: 3}, {a: 2, b: 4, c: 6}, {a: 3, b: 6, c: 9}]
    );
  });

  it("__table slice", () => {
    const operationsToNull = {...EMPTY_TABLE_DATA.operations, slice: {from: 1, to: null}};
    assert.deepStrictEqual(__table(source, operationsToNull), [{a: 2, b: 4, c: 6}, {a: 3, b: 6, c: 9}]);
    const operationsFromNull = {...EMPTY_TABLE_DATA.operations, slice: {from: null, to: 1}};
    assert.deepStrictEqual(__table(source, operationsFromNull), [{a: 1, b: 2, c: 3}]);
    const operations = {...EMPTY_TABLE_DATA.operations, slice: {from: 1, to: 2}};
    assert.deepStrictEqual(__table(source, operations), [{a: 2, b: 4, c: 6}]);
  });

  it("__table retains schema and columns info", () => {
    source.columns = ["a", "b", "c"];
    assert.deepStrictEqual(__table(source, EMPTY_TABLE_DATA.operations).columns, ["a", "b", "c"]);
    source.schema = [{name: "a", type: "number"}, {name: "b", type: "number"}, {name: "c", type: "number"}];
    assert.deepStrictEqual(
      __table(source, EMPTY_TABLE_DATA.operations).schema,
      [{name: "a", type: "number"}, {name: "b", type: "number"}, {name: "c", type: "number"}]
    );
  });
});
