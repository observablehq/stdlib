import {require as requireDefault, requireFrom} from "d3-require";

export const resolve = requireDefault.resolve;

export default function(resolve) {
  return resolve == null ? requireDefault : requireFrom(resolve);
}
