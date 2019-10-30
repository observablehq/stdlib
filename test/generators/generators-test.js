import { test } from "tap";
import filter from "../../src/generators/filter";
import map from "../../src/generators/map";
import range from "../../src/generators/range";
import valueAt from "../../src/generators/valueAt";

test("filter(value, fn) filters", t => {
  function* input() {
    yield* [1, 2, 3, 4];
  }
  t.deepEqual(Array.from(filter(input(), i => i % 2 === 0)), [2, 4]);
  t.end();
});

test("map(value, fn) maps", t => {
  function* input() {
    yield* [1, 2, 3, 4];
  }
  t.deepEqual(Array.from(map(input(), i => i * 2)), [2, 4, 6, 8]);
  t.end();
});

test("range(start, stop) generates a range", t => {
  t.deepEqual(Array.from(range(1, 4)), [1, 2, 3]);
  t.deepEqual(Array.from(range(1, 5, 2)), [1, 3]);
  t.deepEqual(Array.from(range(3)), [0, 1, 2]);
  t.end();
});

test("valueAt(generator, i) picks a value", t => {
  function* input() {
    yield* [1, 2, 3, 4];
  }
  t.equal(valueAt(input(), 2), 3);
  t.equal(valueAt(input()), undefined);
  t.end();
});
