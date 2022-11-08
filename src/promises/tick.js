import when from "./when.js";

export default function(duration, value) {
  return when(Math.ceil((Date.now() + 1) / duration) * duration, value);
}
