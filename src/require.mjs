import {require as initialRequire, requireFrom} from "d3-require";

export let requireDefault = initialRequire;

export function setDefaultRequire(require) {
  requireDefault = require;
}

export default function(resolve) {
  return resolve == null ? requireDefault : requireFrom(resolve);
}
