import assert from "assert";
import UID from "../../src/dom/uid.mjs";

it("UID", () => {
  global.location = "https://test.com/";
  const hi = UID("hi");
  assert.deepEqual(hi, {id: "O-hi-1", href: "https://test.com/#O-hi-1"});
  assert.strictEqual(hi.toString(), "url(https://test.com/#O-hi-1)");
  const anon = UID();
  assert.strictEqual(anon.toString(), "url(https://test.com/#O-2)");
});
