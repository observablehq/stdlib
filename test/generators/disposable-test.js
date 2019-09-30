import { test } from "tap";
import disposable from "../../src/generators/disposable";

test("disposable(value, dispose) yields the specified value", async t => {
  const foo = {};
  const generator = disposable(foo, () => {});
  t.deepEqual(generator.next(), { done: false, value: foo });
  t.deepEqual(generator.next(), { done: true });
  t.end();
});

test("disposable(value, dispose) defines generator.return", async t => {
  let passedFoo;
  const foo = {};
  const generator = disposable(foo, _ => (passedFoo = _));
  t.deepEqual(generator.return(), { done: true });
  t.equal(passedFoo, foo);
  t.deepEqual(generator.next(), { done: true });
  t.end();
});

test("disposable(value, dispose) defines generator.throw", async t => {
  const generator = disposable(42, () => {});
  t.deepEqual(generator.throw(new Error()), { done: true });
  t.deepEqual(generator.next(), { done: true });
  t.end();
});
