import {test} from "tap";
import {FileAttachments} from "../src/index.js";

test("FileAttachments is exported by stdlib", t => {
  t.equal(typeof FileAttachments, "function");
  t.equal(FileAttachments.name, "FileAttachments");
  t.end();
});
