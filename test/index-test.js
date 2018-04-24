import tape from "tape-await";
import Library from "../src/library";

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
