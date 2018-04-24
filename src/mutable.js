import observe from "./generators/observe";

export default function Mutable(value) {
  let change;
  Object.defineProperties(this, {
    generator: {value: observe(_ => change = _)},
    value: {
      get: function() { return value; },
      set: function(x) { return change((value = x)); }
    }
  });
  if (value !== undefined) change(value);
}

Mutable.value = function(init) {
  return function() {
    return new Mutable(init.apply(this, arguments));
  };
};
