import {test} from "tap";
import UID from "../../src/dom/uid.js";

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
