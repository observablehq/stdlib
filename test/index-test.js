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
    "L",
    "Mutable",
    "Plot",
    "Promises",
    "SQLite",
    "SQLiteDatabaseClient",
    "_",
    "aapl",
    "alphabet",
    "aq",
    "cars",
    "citywages",
    "d3",
    "diamonds",
    "dot",
    "flare",
    "htl",
    "html",
    "industries",
    "md",
    "mermaid",
    "miserables",
    "now",
    "olympians",
    "penguins",
    "py",
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
