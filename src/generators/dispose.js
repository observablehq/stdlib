export default function dispose(value, disposer) {
  let done = false;
  return {
    next: () => done ? {done: true} : (done = true, {done: false, value}),
    return: x => (done = true, disposer(value), x),
    throw: () => ({done: done = true})
  };
}
