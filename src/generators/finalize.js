export default function finalize(value, finalizer) {
  let done = false;
  return {
    next: () => done ? {done: true} : (done = true, {done: false, value}),
    return: x => (done = true, finalizer(value), x),
    throw: () => ({done: done = true})
  };
}
