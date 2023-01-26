import {
  coerceToType,
  getTypeValidator,
  inferSchema,
  makeQueryTemplate,
  __table
} from "../src/table.js";
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
    assert.deepStrictEqual(makeQueryTemplate(operationsColumnsNull, source), [["SELECT * FROM table1"]]);
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
    assert.deepStrictEqual(parts.join("?"), "SELECT col1, col2 FROM table1\nWHERE col1 = ?");
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
      "SELECT _col1_, _col2_ FROM _table1_\nWHERE _col2_ = ?"
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
        "SELECT _col1_, _col2_ FROM _table1_\nWHERE _col2_ = ?"
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
    assert.deepStrictEqual(parts.join("?"), "SELECT col1, col2 FROM table1\nWHERE col1 IN (?,?,?)\nAND col1 NOT IN (?)");
    assert.deepStrictEqual(params, ["val1", "val2", "val3", "val4"]);
  });

  it("makeQueryTemplate filter valid and not valid", () => {
    const source = {name: "db", dialect: "postgres"};
    const operations = {
      ...baseOperations,
      filter: [
        {
          type: "v",
          operands: [
            {type: "column", value: "col1"},
            {type: "primitive", value: "string"}
          ]
        },
        {
          type: "nv",
          operands: [
            {type: "column", value: "col2"},
            {type: "primitive", value: "number"}
          ]
        }
      ]
    };
    const [parts] = makeQueryTemplate(operations, source);
    assert.deepStrictEqual(parts.join("?"), "SELECT col1, col2 FROM table1\nWHERE col1 IS NOT NULL\nAND col2 IS NULL");
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
    assert.deepStrictEqual(parts.join("?"), "SELECT col1, col2, col3 FROM table1");
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
    assert.deepStrictEqual(parts.join("?"), "SELECT col1, col2 FROM table1\nORDER BY col1 ASC, col2 DESC");
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
      "SELECT _col1_, _col2_ FROM _table1_\nORDER BY _col1_ ASC, _col2_ DESC"
    );
    assert.deepStrictEqual(params, []);
  });

  it("makeQueryTemplate slice", () => {
    const source = {name: "db", dialect: "mysql"};
    const operations = {...baseOperations};

    operations.slice = {from: 10, to: 20};
    let [parts, ...params] = makeQueryTemplate(operations, source);
    assert.deepStrictEqual(parts.join("?"), "SELECT col1, col2 FROM table1\nLIMIT 10 OFFSET 10");
    assert.deepStrictEqual(params, []);

    operations.slice = {from: null, to: 20};
    [parts, ...params] = makeQueryTemplate(operations, source);
    assert.deepStrictEqual(parts.join("?"), "SELECT col1, col2 FROM table1\nLIMIT 20");
    assert.deepStrictEqual(params, []);

    operations.slice = {from: 10, to: null};
    [parts, ...params] = makeQueryTemplate(operations, source);
    assert.deepStrictEqual(parts.join("?"), `SELECT col1, col2 FROM table1\nLIMIT ${1e9} OFFSET 10`);
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
    assert.deepStrictEqual(parts.join("?"), "SELECT col1, col2, col3 FROM table1\nWHERE col1 >= ?\nAND col2 = ?\nORDER BY col1 ASC\nLIMIT 90 OFFSET 10");
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
      "SELECT _col1_, _col2_, _col3_ FROM _table1_\nORDER BY _col1_ ASC\nOFFSET 0 ROWS\nFETCH NEXT 100 ROWS ONLY"
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
    assert.deepStrictEqual(parts.join("?"), "SELECT col1, col2, col3 FROM table1\nWHERE col1 >= ?\nAND col2 = ?\nORDER BY col2 DESC\nOFFSET 10 ROWS\nFETCH NEXT 90 ROWS ONLY");
    assert.deepStrictEqual(params, ["val1", "val2"]);
  });

  it("makeQueryTemplate throw if no columns are explicitly specified for mssql dialect", () => {
    const source = {name: "db", dialect: "mssql"};
    const operations = {
      ...baseOperations,
      select: {
        columns: null
      },
      sort: [],
      slice: {from: 10, to: 100}
    };

    assert.throws(() => {
      makeQueryTemplate(operations, source);
    }, Error);
  });

  it("makeQueryTemplate the sort and slice if no columns are explicitly BUT sort has value for mssql dialect", () => {
    const source = {name: "db", dialect: "mssql"};
    const operations = {
      ...baseOperations,
      select: {
        columns: null
      },
      sort: [{column: "col2", direction: "desc"}],
      slice: {from: 10, to: 100}
    };

    const [parts, ...params] = makeQueryTemplate(operations, source);
    assert.deepStrictEqual(parts.join("?"), "SELECT * FROM table1\nORDER BY col2 DESC\nOFFSET 10 ROWS\nFETCH NEXT 90 ROWS ONLY");
    assert.deepStrictEqual(params, []);
  });

  it("makeQueryTemplate throw if no columns are explicitly specified for oracle dialect", () => {
    const source = {name: "db", dialect: "oracle"};
    const operations = {
      ...baseOperations,
      select: {
        columns: null
      },
      sort: [],
      slice: {from: 10, to: 100}
    };

    assert.throws(() => {
      makeQueryTemplate(operations, source);
    }, Error);
  });

  it("makeQueryTemplate select, sort, slice, filter indexed with oracle syntax", () => {
    const source = {name: "db", dialect: "oracle"};
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
    assert.deepStrictEqual(
      parts.join("?"),
      "SELECT col1, col2, col3 FROM table1\nWHERE col1 >= ?\nAND col2 = ?\nORDER BY col2 DESC\nOFFSET 10 ROWS\nFETCH NEXT 90 ROWS ONLY"
    );
    assert.deepStrictEqual(params, ["val1", "val2"]);
  });
});

describe("__table", () => {
  let source;

  beforeEach(() => {
    source = [
      {a: 1, b: 2, c: 3},
      {a: 2, b: 4, c: 6},
      {a: 3, b: 6, c: 9}
    ];
    source.schema = [
      {name: "a", type: "integer"},
      {name: "b", type: "integer"},
      {name: "c", type: "integer"}
    ];
  });

  it("__table no operations", () => {
    assert.deepStrictEqual(
      __table(source, EMPTY_TABLE_DATA.operations),
      source
    );
  });

  it("__table columns", () => {
    const operationsNullColumns = {
      ...EMPTY_TABLE_DATA.operations,
      select: {columns: null}
    };
    assert.deepStrictEqual(__table(source, operationsNullColumns), source);
    const operationsEmptyColumns = {
      ...EMPTY_TABLE_DATA.operations,
      select: {columns: []}
    };
    const expectedEmpty = [{}, {}, {}];
    expectedEmpty.schema = [];
    assert.deepStrictEqual(
      __table(source, operationsEmptyColumns),
      expectedEmpty
    );
    const operationsSelectedColumns = {
      ...EMPTY_TABLE_DATA.operations,
      select: {columns: ["a"]}
    };
    const expectedSelected = [{a: 1}, {a: 2}, {a: 3}];
    expectedSelected.schema = [{name: "a", type: "integer"}];
    assert.deepStrictEqual(
      __table(source, operationsSelectedColumns),
      expectedSelected
    );
  });

  it("__table unknown filter", () => {
    const operations = {
      ...EMPTY_TABLE_DATA.operations,
      filter: [{type: "xyz", operands: [{type: "column", value: "a"}]}]
    };
    assert.throws(
      () => __table(source, operations),
      /unknown filter type: xyz/
    );
  });

  it("__table filter lt + gt", () => {
    const operationsEquals = {
      ...EMPTY_TABLE_DATA.operations,
      filter: [
        {
          type: "eq",
          operands: [
            {type: "column", value: "a"},
            {type: "resolved", value: 1}
          ]
        }
      ]
    };
    const expectedEq = [{a: 1, b: 2, c: 3}];
    expectedEq.schema = source.schema;
    assert.deepStrictEqual(__table(source, operationsEquals), expectedEq);
    const operationsComparison = {
      ...EMPTY_TABLE_DATA.operations,
      filter: [
        {
          type: "lt",
          operands: [
            {type: "column", value: "a"},
            {type: "resolved", value: 3}
          ]
        },
        {
          type: "gt",
          operands: [
            {type: "column", value: "b"},
            {type: "resolved", value: 2}
          ]
        }
      ]
    };
    const expectedLtGt = [{a: 2, b: 4, c: 6}];
    expectedLtGt.schema = source.schema;
    assert.deepStrictEqual(__table(source, operationsComparison), expectedLtGt);
  });

  it("__table filter lte + gte", () => {
    const operationsEquals = {
      ...EMPTY_TABLE_DATA.operations,
      filter: [
        {
          type: "eq",
          operands: [
            {type: "column", value: "a"},
            {type: "resolved", value: 1}
          ]
        }
      ]
    };
    const expectedEq = [{a: 1, b: 2, c: 3}];
    expectedEq.schema = source.schema;
    assert.deepStrictEqual(__table(source, operationsEquals), expectedEq);
    const operationsComparison = {
      ...EMPTY_TABLE_DATA.operations,
      filter: [
        {
          type: "lte",
          operands: [
            {type: "column", value: "a"},
            {type: "resolved", value: 2.5}
          ]
        },
        {
          type: "gte",
          operands: [
            {type: "column", value: "b"},
            {type: "resolved", value: 2.5}
          ]
        }
      ]
    };
    const expectedLteGte = [{a: 2, b: 4, c: 6}];
    expectedLteGte.schema = source.schema;
    assert.deepStrictEqual(
      __table(source, operationsComparison),
      expectedLteGte
    );
  });

  it("__table filter primitive lte + gte", () => {
    const expectedPrimitive = [1];
    expectedPrimitive.schema = [{name: "value", type: "integer"}];
    assert.deepStrictEqual(
      __table([1, 2, 3], {
        ...EMPTY_TABLE_DATA.operations,
        filter: [
          {
            type: "eq",
            operands: [
              {type: "column", value: "value"},
              {type: "resolved", value: 1}
            ]
          }
        ]
      }),
      expectedPrimitive
    );
    const expectedUint32Array = [1];
    expectedUint32Array.schema = [];
    assert.deepStrictEqual(
      __table(Uint32Array.of(1, 2, 3), {
        ...EMPTY_TABLE_DATA.operations,
        filter: [
          {
            type: "eq",
            operands: [
              {type: "column", value: "value"},
              {type: "resolved", value: 1}
            ]
          }
        ]
      }),
      expectedUint32Array
    );
  });

  it("__table filter eq date", () => {
    const operationsEquals = {
      ...EMPTY_TABLE_DATA.operations,
      filter: [
        {
          type: "eq",
          operands: [
            {type: "column", value: "a"},
            {type: "resolved", value: new Date("2021-01-02")}
          ]
        }
      ]
    };
    const source = [
      {a: new Date("2021-01-01")},
      {a: new Date("2021-01-02")},
      {a: new Date("2021-01-03")}
    ];
    const expected = [{a: new Date("2021-01-02")}];
    expected.schema = [{name: "a", type: "date"}];
    assert.deepStrictEqual(__table(source, operationsEquals), expected);
  });

  it("__table sort", () => {
    const operationsDesc = {
      ...EMPTY_TABLE_DATA.operations,
      sort: [{column: "a", direction: "desc"}]
    };
    const expectedDesc = [
      {a: 3, b: 6, c: 9},
      {a: 2, b: 4, c: 6},
      {a: 1, b: 2, c: 3}
    ];
    expectedDesc.schema = source.schema;
    assert.deepStrictEqual(__table(source, operationsDesc), expectedDesc);
    const operationsAsc = {
      ...EMPTY_TABLE_DATA.operations,
      sort: [{column: "a", direction: "asc"}]
    };
    const expectedAsc = [
      {a: 1, b: 2, c: 3},
      {a: 2, b: 4, c: 6},
      {a: 3, b: 6, c: 9}
    ];
    expectedAsc.schema = source.schema;
    assert.deepStrictEqual(__table(source, operationsAsc), expectedAsc);
    const sourceExtended = [...source, {a: 1, b: 3, c: 3}, {a: 1, b: 5, c: 3}];
    const operationsMulti = {
      ...EMPTY_TABLE_DATA.operations,
      sort: [
        {column: "a", direction: "desc"},
        {column: "b", direction: "desc"}
      ]
    };
    const expectedExtended = [
      {a: 3, b: 6, c: 9},
      {a: 2, b: 4, c: 6},
      {a: 1, b: 5, c: 3},
      {a: 1, b: 3, c: 3},
      {a: 1, b: 2, c: 3}
    ];
    expectedExtended.schema = source.schema;
    assert.deepStrictEqual(
      __table(sourceExtended, operationsMulti),
      expectedExtended
    );
  });

  it("__table sort missing values", () => {
    const sourceWithMissing = [
      {a: 1}, {a: null}, {a: undefined}, {a: 10}, {a: 5}, {a: NaN}, {a: null}, {a: 20}
    ];
    const operationsDesc = {
      ...EMPTY_TABLE_DATA.operations,
      sort: [{column: "a", direction: "desc"}]
    };
    const expectedDesc = [
      {a: 20}, {a: 10}, {a: 5}, {a: 1}, {a: NaN}, {a: undefined}, {a: NaN}, {a: NaN}
    ];
    expectedDesc.schema = [{name: "a", type: "integer"}];
    assert.deepStrictEqual(
      __table(sourceWithMissing, operationsDesc),
      expectedDesc
    );
    const operationsAsc = {
      ...EMPTY_TABLE_DATA.operations,
      sort: [{column: "a", direction: "asc"}]
    };
    const expectedAsc = [
      {a: 1}, {a: 5}, {a: 10}, {a: 20}, {a: NaN}, {a: undefined}, {a: NaN}, {a: NaN}
    ];
    expectedAsc.schema = [{name: "a", type: "integer"}];
    assert.deepStrictEqual(
      __table(sourceWithMissing, operationsAsc),
      expectedAsc
    );
  });

  it("__table sort does not mutate input", () => {
    const operations = {
      ...EMPTY_TABLE_DATA.operations,
      sort: [{column: "a", direction: "desc"}]
    };
    const sorted = [
      {a: 3, b: 6, c: 9},
      {a: 2, b: 4, c: 6},
      {a: 1, b: 2, c: 3}
    ];
    sorted.schema = source.schema;
    assert.deepStrictEqual(__table(source, operations), sorted);
    const originalOrder = [
      {a: 1, b: 2, c: 3},
      {a: 2, b: 4, c: 6},
      {a: 3, b: 6, c: 9}
    ];
    originalOrder.schema = source.schema;
    assert.deepStrictEqual(source, originalOrder);
  });

  it("__table slice", () => {
    const operationsToNull = {
      ...EMPTY_TABLE_DATA.operations,
      slice: {from: 1, to: null}
    };
    const expectedToNull = [
      {a: 2, b: 4, c: 6},
      {a: 3, b: 6, c: 9}
    ];
    expectedToNull.schema = source.schema;
    assert.deepStrictEqual(__table(source, operationsToNull), expectedToNull);
    const operationsFromNull = {
      ...EMPTY_TABLE_DATA.operations,
      slice: {from: null, to: 1}
    };
    const expectedFromNull = [{a: 1, b: 2, c: 3}];
    expectedFromNull.schema = source.schema;
    assert.deepStrictEqual(
      __table(source, operationsFromNull),
      expectedFromNull
    );
    const operations = {
      ...EMPTY_TABLE_DATA.operations,
      slice: {from: 1, to: 2}
    };
    const expectedSlice = [{a: 2, b: 4, c: 6}];
    expectedSlice.schema = source.schema;
    assert.deepStrictEqual(__table(source, operations), expectedSlice);
  });

  it("__table retains schema and columns info", () => {
    source.columns = ["a", "b", "c"];
    assert.deepStrictEqual(
      __table(source, EMPTY_TABLE_DATA.operations).columns,
      ["a", "b", "c"]
    );
    source.schema = [
      {name: "a", type: "number"},
      {name: "b", type: "number"},
      {name: "c", type: "number"}
    ];
    assert.deepStrictEqual(
      __table(source, EMPTY_TABLE_DATA.operations).schema,
      [
        {name: "a", type: "number"},
        {name: "b", type: "number"},
        {name: "c", type: "number"}
      ]
    );
  });
});

describe("getTypeValidator filters accurately", () => {
  let source = [
    {label: "string", value: "string"},
    {label: "object", value: {}},
    {label: "buffer", value: new ArrayBuffer()},
    {label: "boolean", value: true},
    {label: "array", value: [1, 2, 3]},
    {label: "number", value: 10},
    {label: "date", value: new Date(1)},
    // eslint-disable-next-line no-undef
    {label: "bigint", value: BigInt(10)},
    {label: "null", value: null},
    {label: "NaN", value: NaN},
    {label: "undefined"}
   ];

  it("filters strings", () => {
    const isValid = getTypeValidator("string");
    assert.deepStrictEqual(source.filter(d => isValid(d.value)), [{label: "string", value: "string"}]);
  });

  it("filters buffers", () => {
    const isValid = getTypeValidator("buffer");
    assert.deepStrictEqual(source.filter(d => isValid(d.value)), [{label: "buffer", value: new ArrayBuffer()}]);
  });

  it("filters numbers", () => {
    const isValid = getTypeValidator("number");
    assert.deepStrictEqual(source.filter(d => isValid(d.value)), [{label: "number", value: 10}]);
  });

  it("filters booleans", () => {
    const isValid = getTypeValidator("boolean");
    assert.deepStrictEqual(source.filter(d => isValid(d.value)), [{label: "boolean", value: true}]);
  });

  it("filters arrays", () => {
    const isValid = getTypeValidator("array");
    assert.deepStrictEqual(source.filter(d => isValid(d.value)), [{label: "array", value: [1, 2, 3]}]);
  });

  it("filters dates", () => {
    const isValid = getTypeValidator("date");
    assert.deepStrictEqual(source.filter(d => isValid(d.value)), [{label: "date", value: new Date(1)}]);
  });

  it("filters BigInts", () => {
    const isValid = getTypeValidator("bigint");
    // eslint-disable-next-line no-undef
    assert.deepStrictEqual(source.filter(d => isValid(d.value)), [{label: "bigint", value: BigInt(10)}]);
  });

  it("filters objects", () => {
    const isValid = getTypeValidator("object");
    assert.deepStrictEqual(source.filter(d => isValid(d.value)),
      [
        {label: "object", value: {}},
        {label: "buffer", value: new ArrayBuffer()},
        {label: "array", value: [1, 2, 3]},
        {label: "date", value: new Date(1)}]
    );
  });

  it("filters other", () => {
    const isValid = getTypeValidator("other");
    assert.deepStrictEqual(source.filter(d => isValid(d.value)),
    [
      {label: "string", value: "string"},
      {label: "object", value: {}},
      {label: "buffer", value: new ArrayBuffer()},
      {label: "boolean", value: true},
      {label: "array", value: [1, 2, 3]},
      {label: "number", value: 10},
      {label: "date", value: new Date(1)},
      // eslint-disable-next-line no-undef
      {label: "bigint", value: BigInt(10)},
      {label: "NaN", value: NaN}
    ]
    );
  });
});

describe("inferSchema", () => {
  it("infers schema", () => {
    assert.deepStrictEqual(
      inferSchema(
        [
          {a: 1, b: 2, c: 3},
          {a: "", b: 4, c: 6},
          {a: "", b: 6, c: 9}
        ]
      ),
      [
        {name: "a", type: "integer"},
        {name: "b", type: "integer"},
        {name: "c", type: "integer"}
      ]
    );
  });

  it("infers numbers", () => {
    assert.deepStrictEqual(
      inferSchema([{a: 1.2}, {a: 3.4}, {a: 5.67}]),
      [{name: "a", type: "number"}]
    );
  });

  it("infers booleans", () => {
    assert.deepStrictEqual(
      inferSchema([{a: "true"}, {a: false}, {a: "false"}, {a: null}]),
      [{name: "a", type: "boolean"}]
    );
  });

  it("infers dates", () => {
    assert.deepStrictEqual(
      inferSchema(
        [{a: "1/2/20"}, {a: "2020-11-12 12:23:00"}, {a: new Date()}, {a: null}]
      ),
      [{name: "a", type: "date"}]
    );
  });

  it("infers strings", () => {
    assert.deepStrictEqual(
      inferSchema([{a: "cat"}, {a: "dog"}, {a: "1,000"}, {a: null}]),
      [{name: "a", type: "string"}]
    );
  });

  it("infers arrays", () => {
    assert.deepStrictEqual(
      inferSchema([{a: ["cat"]}, {a: ["dog"]}, {a: []}, {a: null}]),
      [{name: "a", type: "array"}]
    );
  });

  it("infers objects", () => {
    assert.deepStrictEqual(
      inferSchema([{a: {d: ["cat"]}}, {a: {d: "dog"}}, {a: {d: 12}}, {a: null}]),
      [{name: "a", type: "object"}]
    );
  });

  it("infers bigints", () => {
    assert.deepStrictEqual(
      inferSchema([{a: 10n}, {a: 22n}, {a: 22}, {a: null}]),
      [{name: "a", type: "bigint"}]
    );
  });

  it("infers buffers", () => {
    assert.deepStrictEqual(
      inferSchema([{a: new ArrayBuffer()}, {a: new ArrayBuffer()}, {a: null}]),
      [{name: "a", type: "buffer"}]
    );
  });

  it("infers other", () => {
    assert.deepStrictEqual(
      inferSchema([{a: Symbol("a")}, {a: Symbol("b")}, {a: null}]),
      [{name: "a", type: "other"}]
    );
  });
});

describe("coerceToType", () => {
  it("coerces to number", () => {
    assert.deepStrictEqual(coerceToType("1.2", "number"), 1.2);
    assert.deepStrictEqual(coerceToType("A", "number"), NaN);
  });

  it("soft coerces to number", () => {
    assert.deepStrictEqual(coerceToType("1.2", "number", {soft: true}), 1.2);
    assert.deepStrictEqual(coerceToType("a", "number", {soft: true}), "a");
  });

  it("coerces to boolean", () => {
    assert.deepStrictEqual(coerceToType("true", "boolean"), true);
    assert.deepStrictEqual(coerceToType(true, "boolean"), true);
    assert.deepStrictEqual(coerceToType("A", "boolean"), null);
  });

  it("soft coerces to boolean", () => {
    assert.deepStrictEqual(coerceToType("false", "boolean", {soft: true}), false);
    assert.deepStrictEqual(coerceToType("a", "boolean", {soft: true}), "a");
  });

  it("coerces to date", () => {
    const invalidDate = new Date("a");
    assert.deepStrictEqual(
      coerceToType("12/12/2020", "date"),
      new Date("12/12/2020")
    );
    assert.deepStrictEqual(
      coerceToType("2022-01-01T12:34:00Z", "date"),
      new Date("2022-01-01T12:34:00Z")
    );
    assert.deepStrictEqual(
      coerceToType("B", "date").toString(),
      invalidDate.toString()
    );
    assert.deepStrictEqual(
      coerceToType({a: 1}, "date").toString(),
      invalidDate.toString()
    );
  });

  it("soft coerces to date", () => {
    assert.deepStrictEqual(
      coerceToType("12/12/2020", "date", {soft: true}),
      new Date("12/12/2020")
    );
    assert.deepStrictEqual(coerceToType("B", "date", {soft: true}), "B");
    assert.deepStrictEqual(
      coerceToType({a: 1}, "date", {soft: true}).toString(),
      "[object Object]"
    );
  });

  it("coerces to string", () => {
    assert.deepStrictEqual(coerceToType(true, "string"), "true");
    assert.deepStrictEqual(coerceToType(10, "string"), "10");
    assert.deepStrictEqual(coerceToType({a: 1}, "string"), "[object Object]");
    assert.deepStrictEqual(coerceToType(0, "string"), "0");
    assert.deepStrictEqual(coerceToType(null, "string"), null);
    assert.deepStrictEqual(coerceToType(undefined, "string"), null);
  });

  it("soft coerces to string", () => {
    assert.deepStrictEqual(coerceToType(true, "string", {soft: true}), "true");
    assert.deepStrictEqual(coerceToType(null, "string", {soft: true}), null);
    assert.deepStrictEqual(
      coerceToType(undefined, "string", {soft: true}),
      undefined
    );
  });

  it("coerces to array", () => {
    assert.deepStrictEqual(coerceToType("true", "array"), ["t", "r", "u", "e"]);
    assert.deepStrictEqual(coerceToType([1,2,3], "array"), [1,2,3]);
    assert.deepStrictEqual(coerceToType(null, "array"), null);
    assert.deepStrictEqual(coerceToType(undefined, "array"), null);
  });

  it("soft coerces to array", () => {
    assert.deepStrictEqual(coerceToType([1,2,3], "array", {soft: true}), [1,2,3]);
    assert.deepStrictEqual(
      coerceToType(undefined, "array", {soft: true}),
      undefined
    );
  });

  it("coerces to object", () => {
    assert.deepStrictEqual(coerceToType("true", "object"), "true");
    assert.deepStrictEqual(coerceToType({a: 1, b: 2}, "object"), {a: 1, b: 2});
    assert.deepStrictEqual(coerceToType(null, "object"), null);
    assert.deepStrictEqual(coerceToType(undefined, "object"), null);
  });

  it("soft coerces to object", () => {
    assert.deepStrictEqual(coerceToType("true", "object", {soft: true}), "true");
    assert.deepStrictEqual(coerceToType(null, "object", {soft: true}), null);
    assert.deepStrictEqual(
      coerceToType(undefined, "object", {soft: true}),
      undefined
    );
  });

  it("coerces to bigint", () => {
    assert.deepStrictEqual(coerceToType("32", "bigint"), 32n);
    assert.deepStrictEqual(coerceToType(32n, "bigint"), 32n);
    assert.deepStrictEqual(coerceToType("A", "bigint"), NaN);
  });

  it("soft coerces to bigint", () => {
    assert.deepStrictEqual(coerceToType("32", "bigint", {soft: true}), 32n);
    assert.deepStrictEqual(coerceToType("A", "bigint", {soft: true}), "A");
  });

  it("coerces to buffer", () => {
    assert.deepStrictEqual(
      coerceToType(new ArrayBuffer(), "buffer"),
      new ArrayBuffer()
    );
    assert.deepStrictEqual(coerceToType("A", "buffer"), "A");
    assert.deepStrictEqual(coerceToType(undefined, "buffer"), null);
  });

  it("soft coerces to buffer", () => {
    assert.deepStrictEqual(coerceToType("A", "buffer"), "A");
    assert.deepStrictEqual(
      coerceToType(undefined, "buffer", {soft: true}),
      undefined
    );
  });

  it("coerces to other", () => {
    assert.deepStrictEqual(coerceToType(0, "other"), 0);
    assert.deepStrictEqual(coerceToType("a", "other"), "a");
    assert.deepStrictEqual(coerceToType(undefined, "other"), null);
  });

  it("soft coerces to other", () => {
    assert.deepStrictEqual(coerceToType("a", "other", {soft: true}), "a");
    assert.deepStrictEqual(
      coerceToType(undefined, "other", {soft: true}),
      undefined
    );
  });
});
