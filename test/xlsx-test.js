import {test} from "tap";
import {Workbook} from "../src/xlsx.js";

function mockWorkbook(contents, overrides = {}) {
  return {
    worksheets: Object.keys(contents).map((name) => ({name})),
    getWorksheet(name) {
      const _rows = contents[name];
      return Object.assign(
        {
          _rows: _rows.map((row) => ({
            _cells: row.map((cell) => ({value: cell})),
            hasValues: !!row.length,
          })),
          rowCount: _rows.length,
          columnCount: Math.max(..._rows.map((r) => r.length)),
        },
        overrides
      );
    },
  };
}

test("FileAttachment.xlsx reads sheet names", (t) => {
  const workbook = new Workbook(mockWorkbook({Sheet1: []}));
  t.same(workbook.sheetNames, ["Sheet1"]);
  t.end();
});

test("FileAttachment.xlsx sheet(name) throws on unknown sheet name", (t) => {
  const workbook = new Workbook(mockWorkbook({Sheet1: []}));
  t.throws(() => workbook.sheet("bad"));
  t.end();
});

test("FileAttachment.xlsx reads sheets", (t) => {
  const workbook = new Workbook(
    mockWorkbook({
      Sheet1: [
        ["one", "two", "three"],
        [1, 2, 3],
      ],
    })
  );
  t.same(workbook.sheet(0), [
    {A: "one", B: "two", C: "three"},
    {A: 1, B: 2, C: 3},
  ]);
  t.same(workbook.sheet("Sheet1"), [
    {A: "one", B: "two", C: "three"},
    {A: 1, B: 2, C: 3},
  ]);
  t.end();
});

test("FileAttachment.xlsx reads sheets with different types", (t) => {
  const workbook = new Workbook(
    mockWorkbook({
      Sheet1: [
        ["one", null, {richText: [{text: "two"}, {text: "three"}]}, undefined],
        [
          {text: "plain text"},
          {text: `link&</a>"'?`, hyperlink: 'https://example.com?q="'},
          2,
          {formula: "=B2*5", result: 10},
          {sharedFormula: "=B2*6", result: 12},
          {sharedFormula: "=Z2*6", result: {error: "#REF!"}},
        ],
        [{}, new Date(Date.UTC(2020, 0, 1))],
        [],
      ],
    })
  );
  t.same(workbook.sheet(0), [
    {A: "one", C: "twothree"},
    {
      A: "plain text",
      B: `<a href="https://example.com?q=%22">link&amp;&lt;/a&gt;&quot;&#39;?</a>`,
      C: 2,
      D: 10,
      E: 12,
      F: NaN,
    },
    {A: {}, B: new Date(Date.UTC(2020, 0, 1))},
    {},
  ]);
  t.end();
});

test("FileAttachment.xlsx reads sheets with headers", (t) => {
  const workbook = new Workbook(
    mockWorkbook({
      Sheet1: [
        [null, "one", "one", "two", "A", "0"],
        [1, null, 3, 4, 5, "zero"],
        [6, 7, 8, 9, 10],
      ],
    })
  );
  t.same(workbook.sheet(0, {headers: true}), [
    {A: 1, one_: 3, two: 4, A_: 5, 0: "zero"},
    {A: 6, one: 7, one_: 8, two: 9, A_: 10},
  ]);
  t.same(workbook.sheet(0, {headers: true}).columns, [
    "A",
    "one",
    "one_",
    "two",
    "A_",
    "0",
  ]);
  t.end();
});

test("FileAttachment.xlsx reads sheet ranges", (t) => {
  const workbook = new Workbook(
    mockWorkbook({
      Sheet1: [
        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
        [10, 11, 12, 13, 14, 15, 16, 17, 18, 19],
        [20, 21, 22, 23, 24, 25, 26, 27, 28, 29],
        [30, 31, 32, 33, 34, 35, 36, 37, 38, 39],
      ],
    })
  );

  // undefined
  // ""
  // []
  const entireSheet = [
    {A: 0, B: 1, C: 2, D: 3, E: 4, F: 5, G: 6, H: 7, I: 8, J: 9},
    {A: 10, B: 11, C: 12, D: 13, E: 14, F: 15, G: 16, H: 17, I: 18, J: 19},
    {A: 20, B: 21, C: 22, D: 23, E: 24, F: 25, G: 26, H: 27, I: 28, J: 29},
    {A: 30, B: 31, C: 32, D: 33, E: 34, F: 35, G: 36, H: 37, I: 38, J: 39},
  ];
  t.same(workbook.sheet(0), entireSheet);
  t.same(workbook.sheet(0, {range: ""}), entireSheet);
  t.same(workbook.sheet(0, {range: []}), entireSheet);
  t.same(workbook.sheet(0, {range: []}).columns, Object.keys(entireSheet[0]));

  // "B2:C3"
  // [[1,1],[2,2]]
  t.same(workbook.sheet(0, {range: "B2:C3"}), [
    {B: 11, C: 12},
    {B: 21, C: 22},
  ]);
  t.same(
    workbook.sheet(0, {
      range: [
        [1, 1],
        [2, 2],
      ],
    }),
    [
      {B: 11, C: 12},
      {B: 21, C: 22},
    ]
  );

  // ":C3"
  // [,[2,2]]
  t.same(workbook.sheet(0, {range: ":C3"}), [
    {A: 0, B: 1, C: 2},
    {A: 10, B: 11, C: 12},
    {A: 20, B: 21, C: 22},
  ]);
  t.same(workbook.sheet(0, {range: [undefined, [2, 2]]}), [
    {A: 0, B: 1, C: 2},
    {A: 10, B: 11, C: 12},
    {A: 20, B: 21, C: 22},
  ]);

  // "B2"
  // [[1,1]]
  t.same(workbook.sheet(0, {range: "B2"}), [
    {B: 11, C: 12, D: 13, E: 14, F: 15, G: 16, H: 17, I: 18, J: 19},
    {B: 21, C: 22, D: 23, E: 24, F: 25, G: 26, H: 27, I: 28, J: 29},
    {B: 31, C: 32, D: 33, E: 34, F: 35, G: 36, H: 37, I: 38, J: 39},
  ]);
  t.same(workbook.sheet(0, {range: [[1, 1]]}), [
    {B: 11, C: 12, D: 13, E: 14, F: 15, G: 16, H: 17, I: 18, J: 19},
    {B: 21, C: 22, D: 23, E: 24, F: 25, G: 26, H: 27, I: 28, J: 29},
    {B: 31, C: 32, D: 33, E: 34, F: 35, G: 36, H: 37, I: 38, J: 39},
  ]);

  // "H"
  // [[7]]
  t.same(workbook.sheet(0, {range: "H"}), [
    {H: 7, I: 8, J: 9},
    {H: 17, I: 18, J: 19},
    {H: 27, I: 28, J: 29},
    {H: 37, I: 38, J: 39},
  ]);
  t.same(workbook.sheet(0, {range: [[7]]}), [
    {H: 7, I: 8, J: 9},
    {H: 17, I: 18, J: 19},
    {H: 27, I: 28, J: 29},
    {H: 37, I: 38, J: 39},
  ]);

  // ":I"
  // [,[1,]]
  const sheetJ = [
    {I: 8, J: 9},
    {I: 18, J: 19},
    {I: 28, J: 29},
    {I: 38, J: 39},
  ];
  t.same(workbook.sheet(0, {range: "I"}), sheetJ);
  t.same(workbook.sheet(0, {range: [[8, undefined], undefined]}), sheetJ);

  // ":ZZ" (doesn't cause extra column fields)
  t.same(workbook.sheet(0, {range: ":ZZ"}), entireSheet);

  // "2"
  // [[,1]]
  t.same(workbook.sheet(0, {range: "2"}), entireSheet.slice(1));
  t.same(workbook.sheet(0, {range: [[undefined, 1]]}), entireSheet.slice(1));

  // ":2"
  // [[,],[,1]]
  t.same(workbook.sheet(0, {range: ":2"}), entireSheet.slice(0, 2));
  t.same(
    workbook.sheet(0, {range: [[], [undefined, 1]]}),
    entireSheet.slice(0, 2)
  );

  t.end();
});

test("FileAttachment.xlsx throws on unknown range specifier", (t) => {
  const workbook = new Workbook(mockWorkbook({Sheet1: []}));
  t.throws(() => workbook.sheet(0, {range: 0}));
  t.end();
});

test("FileAttachment.xlsx derives column names such as A AA AAA…", (t) => {
  const l0 = 26 * 26 * 26 + 26 * 26 + 26;
  const workbook = new Workbook(
    mockWorkbook({
      Sheet1: [Array.from({length: l0}).fill(1)],
    })
  );
  t.same(
    workbook.sheet(0, {headers: false}).columns.filter((d) => d.match(/^A*$/)),
    ["A", "AA", "AAA"]
  );
  const workbook1 = new Workbook(
    mockWorkbook({
      Sheet1: [Array.from({length: l0 + 1}).fill(1)],
    })
  );
  t.same(
    workbook1.sheet(0, {headers: false}).columns.filter((d) => d.match(/^A*$/)),
    ["A", "AA", "AAA", "AAAA"]
  );
  t.end();
});
