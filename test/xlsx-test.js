import {test} from "tap";
import {ExcelWorkbook} from "../src/xlsx.js";

function mockWorkbook(contents) {
  return {
    worksheets: Object.keys(contents).map((name) => ({name})),
    getWorksheet(name) {
      const _rows = contents[name];
      return {
        _rows: _rows.map((row) => ({
          _cells: row.map((cell) => ({value: cell})),
          hasValues: !!row.length,
        })),
        rowCount: _rows.length,
        columnCount: Math.max(..._rows.map((r) => r.length)),
      };
    },
  };
}

test("FileAttachment.xlsx reads sheet names", (t) => {
  const workbook = new ExcelWorkbook(mockWorkbook({Sheet1: []}));
  t.same(workbook.sheetNames(), ["Sheet1"]);
  t.end();
});

test("FileAttachment.xlsx reads sheets", (t) => {
  const workbook = new ExcelWorkbook(
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
  t.end();
});

test("FileAttachment.xlsx reads sheets with different types", (t) => {
  const workbook = new ExcelWorkbook(
    mockWorkbook({
      Sheet1: [
        ["one", {richText: [{text: "two"}, {text: "three"}]}],
        [
          {text: "link", hyperlink: "https://example.com"},
          2,
          {formula: "=B2*5", result: 10},
        ],
      ],
    })
  );
  t.same(workbook.sheet(0), [
    {A: "one", B: "twothree"},
    {A: `<a href="https://example.com">link</a>`, B: 2, C: 10},
  ]);
  t.end();
});

test("FileAttachment.xlsx reads sheets with headers", (t) => {
  const workbook = new ExcelWorkbook(
    mockWorkbook({
      Sheet1: [
        ["one", "one", "one", "two"],
        [1, null, 3, 4],
        [5, 6, 7, 8],
      ],
    })
  );
  t.same(workbook.sheet(0, {headers: true}), [
    {one: 1, one_: 3, two: 4},
    {one: 5, one__: 6, one_: 7, two: 8},
  ]);
  t.end();
});

test("FileAttachment.xlsx reads sheet ranges", (t) => {
  const workbook = new ExcelWorkbook(
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

  // "2"
  // [[,1]]
  t.same(workbook.sheet(0, {range: "2"}), entireSheet.slice(1));
  t.same(workbook.sheet(0, {range: [[undefined, 1]]}), entireSheet.slice(1));

  t.end();
});
