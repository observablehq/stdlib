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
    "cars",
    "d3",
    "diamonds",
    "dot",
    "htl",
    "html",
    "md",
    "mermaid",
    "now",
    "olympians",
    "penguins",
    "require",
    "resolve",
    "svg",
    "tex",
    "topojson",
    "vl",
    "weather",
    "width"
  ]);
  t.end();
});
