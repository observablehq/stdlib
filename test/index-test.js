import tape from "tape-await";
import Library from "../src/";
import {DOM, Files, Generators, Promises} from "../src/";

tape("new Library returns a library with the expected keys", async test => {
  test.deepEqual(Object.keys(new Library()).sort(), [
    "DOM",
    "Files",
    "Generators",
    "Promises",
    "html",
    "md",
    "now",
    "require",
    "resolve",
    "svg",
    "tex",
    "width"
  ]);
});

tape("index.js also exports static values independently of the library", async test => {
  const library = new Library();
  test.deepEqual(DOM, library.DOM);
  test.deepEqual(Files, library.Files);
  test.deepEqual(Generators, library.Generators);
  test.deepEqual(Promises, library.Promises);
});
