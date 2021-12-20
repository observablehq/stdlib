export default function(width, height, options) {
  let scale;
  if (options == null) {
    options = undefined;
  } else if (typeof options === "number") {
    scale = options;
    options = undefined;
  } else {
    ({scale, ...options} = options);
  }
  if (scale === undefined) scale = devicePixelRatio;
  const canvas = document.createElement("canvas");
  canvas.width = width * scale;
  canvas.height = height * scale;
  canvas.style.width = width + "px";
  const context = canvas.getContext("2d", options);
  context.scale(scale, scale);
  return context;
}
