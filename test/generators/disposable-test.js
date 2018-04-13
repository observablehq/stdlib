import tape from "tape-await";
import disposable from "../../src/generators/disposable";

tape("disposable(value, dispose) yields the specified value", async test => {
  const foo = {};
  const generator = disposable(foo, () => {});
  test.deepEqual(generator.next(), {done: false, value: foo});
  test.deepEqual(generator.next(), {done: true});
});

tape("disposable(value, dispose) defines generator.return", async test => {
  let passedFoo;
  const foo = {};
  const returnValue = {};
  const generator = disposable(foo, _ => passedFoo = _);
  test.equal(generator.return(returnValue), returnValue);
  test.equal(passedFoo, foo);
  test.deepEqual(generator.next(), {done: true});
});

tape("disposable(value, dispose) defines generator.throw", async test => {
  const generator = disposable(42, () => {});
  test.deepEqual(generator.throw(new Error), {done: true});
  test.deepEqual(generator.next(), {done: true});
});
