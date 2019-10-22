import { test } from "tap";
import {Library, ResolveFileAttachment} from "../src";

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

test("ResolveFileAttachment is exported by stdlib/index", t => {
  t.equal(typeof ResolveFileAttachment, "function");
  t.equal(ResolveFileAttachment.name, "ResolveFileAttachment");
  t.end();
});
