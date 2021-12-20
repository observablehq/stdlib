export default function(width, height, options) {
  var colorSpace = "srgb";
  var scale = devicePixelRatio;
  if (options == +options) {
    scale = +options;
  } else {
    if (options.scale) scale = +options.scale;
    if (options.colorSpace === "display-p3") colorSpace = options.colorSpace;
  }
  var canvas = document.createElement("canvas");
  canvas.width = width * scale;
  canvas.height = height * scale;
  canvas.style.width = width + "px";
  var context;
  try {
    context = canvas.getContext("2d", {colorSpace});
  } catch(e) {
    context = canvas.getContext("2d");
  }
  context.scale(scale, scale);
  return context;
}
