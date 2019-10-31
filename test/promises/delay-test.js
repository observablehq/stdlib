import {test} from "tap";
import delay from "../../src/promises/delay.js";
import tick from "../../src/promises/tick.js";

test("delay(duration) resolves with undefined", async t => {
  t.equal(await delay(50), undefined);
  t.end();
});

test("delay(duration) resolves after the specified duration", async t => {
  const then = Date.now();
  await delay(150);
  const delta = Date.now() - then;
  t.ok(130 <= delta && delta <= 170);
  t.end();
});

test("delay(duration, value) resolves with the specified value", async t => {
  t.equal(await delay(50, "foo"), "foo");
  t.end();
});

test("delay(duration, value) resolves with the specified value after the specified duration", async t => {
  const then = Date.now();
  t.equal(await delay(150, "foo"), "foo");
  const delta = Date.now() - then;
  t.ok(130 <= delta && delta <= 170);
  t.end();
});

test("tick(1000) resolves near the second boundary", async t => {
  await tick(1000);
  const now = Date.now();
  t.ok(now % 1000 < 10, `${now % 1000} deviation from the second`);
  t.end();
});
