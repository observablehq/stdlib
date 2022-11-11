export default typeof AbortController === "undefined" ? mockit : it;

function mockit(description, run) {
  return it(description, withMock(run));
}

mockit.skip = (description, run) => {
  return it.skip(description, withMock(run));
};

mockit.only = (description, run) => {
  return it.only(description, withMock(run));
};

class MockAbortController {
  abort() {
    // mock noop for node 14
  }
}

function withMock(run) {
  return async () => {
    global.AbortController = MockAbortController;
    try {
      return await run();
    } finally {
      delete global.AbortController;
    }
  };
}

export function invalidator() {
  let invalidate;
  const invalidation = new Promise((resolve) => (invalidate = resolve));
  return [invalidation, invalidate];
}
