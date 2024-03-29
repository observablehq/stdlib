import assert from "assert";
import {Library} from "../src/index.js";

it("new Library returns a library with the expected keys", () => {
  assert.deepStrictEqual(Object.keys(new Library()).sort(), [
    "Arrow",
    "DOM",
    "DuckDBClient",
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
    "__query",
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
    "pizza",
    "require",
    "resolve",
    "svg",
    "tex",
    "topojson",
    "vl",
    "weather",
    "width"
  ]);
});
