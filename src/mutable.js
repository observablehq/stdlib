import observe from "./generators/observe.js";

export default function Mutable(value) {
  let change;
  Object.defineProperties(this, {
    generator: {value: observe(_ => void (change = _))},
    value: {get: () => value, set: x => change(value = x)}
  });
  if (value !== undefined) change(value);
}
