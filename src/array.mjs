// These are copied from d3-array; TODO import once this package adopts type: module.

export function descending(a, b) {
  return a == null || b == null ? NaN : b < a ? -1 : b > a ? 1 : b >= a ? 0 : NaN;
}

export function ascending(a, b) {
  return a == null || b == null ? NaN : a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
}

export function reverse(values) {
  if (typeof values[Symbol.iterator] !== "function") throw new TypeError("values is not iterable");
  return Array.from(values).reverse();
}
