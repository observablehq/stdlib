import that from "../that.js";

export default function(initialize) {
  const queue = [];
  let resolve;
  let dispose = initialize(push);

  if (dispose != null && typeof dispose !== "function") {
    console.warn("dispose is not a function; ignoring", dispose);
    dispose = null;
  }

  function push(x) {
    queue.push(x);
    if (resolve) resolve(queue.shift()), resolve = null;
    return x;
  }

  function next() {
    return {done: false, value: queue.length
        ? Promise.resolve(queue.shift())
        : new Promise(_ => (resolve = _))};
  }

  return {
    [Symbol.iterator]: that,
    throw: () => ({done: true}),
    return: () => (dispose != null && dispose(), {done: true}),
    next
  };
}
