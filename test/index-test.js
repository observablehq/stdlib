import tape from "tape-await";
import {runtimeLibrary} from "../src/";

tape("runtimeLibrary() returns a library with the expected keys", async test => {
  test.deepEqual(Object.keys(runtimeLibrary()).sort(), [
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
