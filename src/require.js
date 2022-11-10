import {require as initialRequire, requireFrom} from "d3-require";

export let requireDefault = initialRequire;

export function setDefaultRequire(require) {
  requireDefault = require;
}

export function requirer(resolver) {
  return resolver == null ? requireDefault : requireFrom(resolver);
}
