import {test} from "tap";
import {Library} from "../src/index.js";

test("new Library returns a library with the expected keys", async t => {
  t.deepEqual(Object.keys(new Library()).sort(), [
    "Arrow",
    "DOM",
    "FileAttachment",
    "Files",
    "Generators",
    "Inputs",
    "Mutable",
    "Plot",
    "Promises",
    "SQLite",
    "SQLiteDatabaseClient",
    "_",
    "aq",
    "d3",
    "dot",
    "htl",
    "html",
    "md",
    "now",
    "require",
    "resolve",
    "svg",
    "tex",
    "topojson",
    "vl",
    "width"
  ]);
  t.end();
});
