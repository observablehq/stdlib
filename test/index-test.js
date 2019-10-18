import { test } from "tap";
import Library from "../src/library";

test("new Library returns a library with the expected keys", async t => {
  t.deepEqual(Object.keys(new Library()).sort(), [
    "DOM",
    "FileAttachment",
    "Files",
    "Generators",
    "Mutable",
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
  t.end();
});
