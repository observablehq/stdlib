import {test} from "tap";
import {Library, FileAttachments} from "../src/index.js";
import UID from "../src/dom/uid.js";

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

test("UID", t => {
  global.location = "https://test.com/";
  const hi = UID("hi");
  t.deepEqual(hi, {
    id: "O-hi-1",
    href: "https://test.com/#O-hi-1"
  });
  t.equal(hi.toString(), "url(https://test.com/#O-hi-1)");
  const anon = UID();
  t.equal(anon.toString(), "url(https://test.com/#O-2)");
  t.end();
});
