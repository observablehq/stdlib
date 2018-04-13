export default function disposable(value, dispose) {
  let done = false;
  return {
    next: () => done ? {done: true} : (done = true, {done: false, value}),
    return: x => (done = true, dispose(value), x),
    throw: () => ({done: done = true})
  };
}
