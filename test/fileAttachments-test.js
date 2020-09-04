import {test} from "tap";
import {FileAttachments} from "../src/index.js";

test("FileAttachments is exported by stdlib", t => {
  t.equal(typeof FileAttachments, "function");
  t.equal(FileAttachments.name, "FileAttachments");
  t.end();
});

test("FileAttachment ensures that URLs are strings", async t => {
  const FileAttachment = FileAttachments((name) =>
    new URL(`https://example.com/${name}.js`)
  );
  const file = FileAttachment("filename");
  t.equal(file.constructor.name, "FileAttachment");
  t.equal(await file.url(), "https://example.com/filename.js");
  t.end();
});

test("FileAttachment returns instances of FileAttachment", async t => {
  const FileAttachment = FileAttachments((name) =>
    new URL(`https://example.com/${name}.js`)
  );
  const file = FileAttachment("filename");
  t.true(file instanceof FileAttachment);
  t.end();
});

test("FileAttachment cannot be used as a constructor", async t => {
  const FileAttachment = FileAttachments((name) =>
    new URL(`https://example.com/${name}.js`)
  );
  try {
    new FileAttachment("filename");
    t.fail();
  } catch (error) {
    t.equal(error.message, "FileAttachment is not a constructor");
  }
  t.end();
});

test("FileAttachment works with Promises that resolve to URLs", async t => {
  const FileAttachment = FileAttachments(async (name) =>
    new URL(`https://example.com/${name}.js`)
  );
  const file = FileAttachment("otherfile");
  t.equal(file.constructor.name, "FileAttachment");
  t.equal(await file.url(), "https://example.com/otherfile.js");
  t.end();
});
