import {test} from "tap";
import {Library} from "../src/index.js";

test("new Library returns a library with the expected keys", async t => {
  t.deepEqual(Object.keys(new Library()).sort(), [
    "DOM",
    "FileAttachment",
    "Files",
    "Generators",
    "Inputs",
    "Mutable",
    "Plot",
    "Promises",
    "SQLite",
    "_",
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
    "vl",
    "width"
  ]);
  t.end();
});
