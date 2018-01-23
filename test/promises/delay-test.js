import tape from "tape-await";
import delay from "../../src/promises/delay";

tape("delay(duration) resolves with undefined", async test => {
  test.equal(await delay(50), undefined);
});

tape("delay(duration) resolves after the specified duration", async test => {
  const then = Date.now();
  await delay(150);
  const delta = Date.now() - then;
  test.ok(130 <= delta && delta <= 170);
});

tape("delay(duration, value) resolves with the specified value", async test => {
  test.equal(await delay(50, "foo"), "foo");
});

tape("delay(duration, value) resolves with the specified value after the specified duration", async test => {
  const then = Date.now();
  test.equal(await delay(150, "foo"), "foo");
  const delta = Date.now() - then;
  test.ok(130 <= delta && delta <= 170);
});
