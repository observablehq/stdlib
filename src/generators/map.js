import thenable from "../promises/thenable";

export default function map(generator, f) {
  let index = -1;
  return {
    next: () => {
      const {value: v, done} = generator.next();
      return done ? {done} : {done, value: thenable(v) ? v.then(v => f(v, ++index)) : f(v, ++index)};
    },
    throw: generator.throw && generator.throw.bind(generator),
    return: generator.return && generator.return.bind(generator)
  };
}
