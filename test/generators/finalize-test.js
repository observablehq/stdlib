import tape from "tape-await";
import finalize from "../../src/generators/finalize";

tape("finalize(value, finalizer) yields the specified value", async test => {
  const foo = {};
  const generator = finalize(foo, () => {});
  test.deepEqual(generator.next(), {done: false, value: foo});
  test.deepEqual(generator.next(), {done: true});
});

tape("finalize(value, finalizer) defines generator.return", async test => {
  let passedFoo;
  const foo = {};
  const returnValue = {};
  const generator = finalize(foo, _ => passedFoo = _);
  test.equal(generator.return(returnValue), returnValue);
  test.equal(passedFoo, foo);
  test.deepEqual(generator.next(), {done: true});
});

tape("finalize(value, finalizer) defines generator.throw", async test => {
  const generator = finalize(42, () => {});
  test.deepEqual(generator.throw(new Error), {done: true});
  test.deepEqual(generator.next(), {done: true});
});
