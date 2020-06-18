import {test} from "tap";
import {FileAttachments} from "../src/index.js";

test("FileAttachments is exported by stdlib", t => {
  t.equal(typeof FileAttachments, "function");
  t.equal(FileAttachments.name, "FileAttachments");
  t.end();
});

test("FileAttachment ensures that URLs are strings", async t => {
  const fileAttachments = FileAttachments((name) =>
    new URL(`https://example.com/${name}.js`)
  );
  const file = fileAttachments("filename");
  t.equal(file.constructor.name, "FileAttachment");
  t.equal(await file.url(), "https://example.com/filename.js");
  t.end();
});
