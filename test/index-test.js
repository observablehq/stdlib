import {test} from "tap";
import {Library, FileAttachments} from "../src";

test("new Library returns a library with the expected keys", async t => {
  t.deepEqual(Object.keys(new Library()).sort(), [
    "DOM",
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

test("FileAttachments is exported by stdlib/index", t => {
  t.equal(typeof FileAttachments, "function");
  t.equal(FileAttachments.name, "FileAttachments");
  t.end();
});
