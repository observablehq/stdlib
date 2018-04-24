import observe from "./generators/observe";

export default function Mutable(value) {
  let change;
  Object.defineProperties(this, {
    generator: {value: observe(_ => void (change = _))},
    value: {get: () => value, set: x => change(value = x)}
  });
  if (value !== undefined) change(value);
}

Mutable.value = function(init) {
  return function() {
    return new Mutable(init.apply(this, arguments));
  };
};
