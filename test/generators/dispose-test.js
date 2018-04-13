import tape from "tape-await";
import dispose from "../../src/generators/dispose";

tape("dispose(value, disposer) yields the specified value", async test => {
  const foo = {};
  const generator = dispose(foo, () => {});
  test.deepEqual(generator.next(), {done: false, value: foo});
  test.deepEqual(generator.next(), {done: true});
});

tape("dispose(value, disposer) defines generator.return", async test => {
  let passedFoo;
  const foo = {};
  const returnValue = {};
  const generator = dispose(foo, _ => passedFoo = _);
  test.equal(generator.return(returnValue), returnValue);
  test.equal(passedFoo, foo);
  test.deepEqual(generator.next(), {done: true});
});

tape("dispose(value, disposer) defines generator.throw", async test => {
  const generator = dispose(42, () => {});
  test.deepEqual(generator.throw(new Error), {done: true});
  test.deepEqual(generator.next(), {done: true});
});
