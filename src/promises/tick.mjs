import when from "./when.mjs";

export default function(duration, value) {
  return when(Math.ceil((Date.now() + 1) / duration) * duration, value);
}
