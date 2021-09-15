import {test} from "tap";
import {Workbook} from "../src/xlsx.js";
import ExcelJS from "exceljs";

function exceljs(contents) {
  const workbook = new ExcelJS.Workbook();
  for (const [sheet, rows] of Object.entries(contents)) {
    const ws = workbook.addWorksheet(sheet);
    for (const row of rows) ws.addRow(row);
  }
  return workbook;
}

test("FileAttachment.xlsx reads sheet names", (t) => {
  const workbook = new Workbook(exceljs({Sheet1: []}));
  t.same(workbook.sheetNames, ["Sheet1"]);
  t.end();
});

test("FileAttachment.xlsx sheet(name) throws on unknown sheet name", (t) => {
  const workbook = new Workbook(exceljs({Sheet1: []}));
  t.throws(() => workbook.sheet("bad"));
  t.end();
});

test("FileAttachment.xlsx reads sheets", (t) => {
  const workbook = new Workbook(
    exceljs({
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
  t.equal(workbook.sheet(0)[0]["#"], 1);
  t.equal(workbook.sheet(0)[1]["#"], 2);
  t.end();
});

test("FileAttachment.xlsx reads sheets with different types", (t) => {
  t.same(
    new Workbook(
      exceljs({
        Sheet1: [
          [],
          [null, undefined],
          ["hello", "", "0", "1"],
          [1, 1.2],
          [true, false],
          [new Date(Date.UTC(2020, 0, 1)), {}],
        ],
      })
    ).sheet(0),
    [
      {},
      {},
      {A: "hello", B: "", C: "0", D: "1"},
      {A: 1, B: 1.2},
      {A: true, B: false},
      {A: new Date(Date.UTC(2020, 0, 1)), B: {}},
    ],
    "nullish, strings, numbers, booleans, dates, objects"
  );
  t.same(
    new Workbook(
      exceljs({
        Sheet1: [
          [
            {richText: [{text: "two"}, {text: "three"}]}, // A
            {text: "plain text"}, // B
            {text: "https://example.com", hyperlink: "https://example.com"}, // C
            {
              text: {richText: [{text: "https://example.com"}]}, // D
              hyperlink: "https://example.com",
            },
            {text: `link&</a>"'?`, hyperlink: 'https://example.com?q="'}, // E
            {
              text: {richText: [{text: "first"}, {text: "second"}]}, // F
              hyperlink: "https://example.com",
            },
          ],
        ],
      })
    ).sheet(0),
    [
      {
        A: "twothree",
        B: "plain text",
        C: "https://example.com",
        D: "https://example.com",
        E: `https://example.com?q=" link&</a>"'?`,
        F: "https://example.com firstsecond",
      },
    ],
    "rich text, text, hyperlink text"
  );
  t.same(
    new Workbook(
      exceljs({
        Sheet1: [
          [
            {formula: "=B2*5", result: 10},
            {sharedFormula: "=B2*6", result: 12},
            {sharedFormula: "=Z2*6", result: {error: "#REF!"}},
          ],
        ],
      })
    ).sheet(0),
    [{A: 10, B: 12, C: NaN}],
    "formula results, errors"
  );

  t.end();
});

test("FileAttachment.xlsx reads sheets with headers", (t) => {
  const workbook = new Workbook(
    exceljs({
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
    "#",
    "A",
    "one",
    "one_",
    "two",
    "A_",
    "0",
  ]);
  t.end();
});

test("FileAttachment.xlsx throws on invalid ranges", (t) => {
  const workbook = new Workbook(exceljs({Sheet1: []}));
  const malformed = new Error("Malformed range specifier");

  t.throws(() => t.same(workbook.sheet(0, {range: 0})), malformed);
  t.throws(() => t.same(workbook.sheet(0, {range: ""})), malformed);
  t.throws(() => t.same(workbook.sheet(0, {range: "-:"})), malformed);
  t.throws(() => t.same(workbook.sheet(0, {range: " :"})), malformed);
  t.throws(
    () => t.same(workbook.sheet(0, {range: "a1:"})),
    malformed,
    "lowercase"
  );
  t.throws(() => t.same(workbook.sheet(0, {range: "1A:"})), malformed);

  t.end();
});

test("FileAttachment.xlsx reads sheet ranges", (t) => {
  const workbook = new Workbook(
    exceljs({
      Sheet1: [
        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
        [10, 11, 12, 13, 14, 15, 16, 17, 18, 19],
        [20, 21, 22, 23, 24, 25, 26, 27, 28, 29],
        [30, 31, 32, 33, 34, 35, 36, 37, 38, 39],
      ],
    })
  );

  // undefined
  // ":"
  const entireSheet = [
    {A: 0, B: 1, C: 2, D: 3, E: 4, F: 5, G: 6, H: 7, I: 8, J: 9},
    {A: 10, B: 11, C: 12, D: 13, E: 14, F: 15, G: 16, H: 17, I: 18, J: 19},
    {A: 20, B: 21, C: 22, D: 23, E: 24, F: 25, G: 26, H: 27, I: 28, J: 29},
    {A: 30, B: 31, C: 32, D: 33, E: 34, F: 35, G: 36, H: 37, I: 38, J: 39},
  ];
  t.same(workbook.sheet(0), entireSheet);
  t.same(workbook.sheet(0, {range: ":"}), entireSheet);
  t.same(workbook.sheet(0).columns, ["#", ...Object.keys(entireSheet[0])]);

  // "B2:C3"
  t.same(workbook.sheet(0, {range: "B2:C3"}), [
    {B: 11, C: 12},
    {B: 21, C: 22},
  ]);

  // ":C3"
  t.same(workbook.sheet(0, {range: ":C3"}), [
    {A: 0, B: 1, C: 2},
    {A: 10, B: 11, C: 12},
    {A: 20, B: 21, C: 22},
  ]);

  // "B2:"
  t.same(workbook.sheet(0, {range: "B2:"}), [
    {B: 11, C: 12, D: 13, E: 14, F: 15, G: 16, H: 17, I: 18, J: 19},
    {B: 21, C: 22, D: 23, E: 24, F: 25, G: 26, H: 27, I: 28, J: 29},
    {B: 31, C: 32, D: 33, E: 34, F: 35, G: 36, H: 37, I: 38, J: 39},
  ]);

  // "H:"
  t.same(workbook.sheet(0, {range: "H:"}), [
    {H: 7, I: 8, J: 9},
    {H: 17, I: 18, J: 19},
    {H: 27, I: 28, J: 29},
    {H: 37, I: 38, J: 39},
  ]);

  // ":C"
  t.same(workbook.sheet(0, {range: ":C"}), [
    {A: 0, B: 1, C: 2},
    {A: 10, B: 11, C: 12},
    {A: 20, B: 21, C: 22},
    {A: 30, B: 31, C: 32},
  ]);

  // ":Z"
  t.same(workbook.sheet(0, {range: ":Z"}), entireSheet);
  t.same(
    workbook.sheet(0, {range: ":Z"}).columns,
    "#ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")
  );

  // "2:"
  t.same(workbook.sheet(0, {range: "2:"}), entireSheet.slice(1));

  // ":2"
  t.same(workbook.sheet(0, {range: ":2"}), entireSheet.slice(0, 2));

  t.end();
});

test("FileAttachment.xlsx derives column names such as A AA AAA…", (t) => {
  const l0 = 26 * 26 * 23;
  const workbook = new Workbook(
    exceljs({
      Sheet1: [Array.from({length: l0}).fill(1)],
    })
  );
  t.same(
    workbook.sheet(0).columns.filter((d) => d.match(/^A+$/)),
    ["A", "AA", "AAA"]
  );
  t.end();
});
