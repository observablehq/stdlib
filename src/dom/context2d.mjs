export default function(width, height, options) {
  var scale = devicePixelRatio;
  if (options == null) {
    options = {};
  } else if (options == +options) {
    scale = +options;
    options = {};
  } else {
    if (options.scale) scale = +options.scale;
    delete options.scale;
  }
  var canvas = document.createElement("canvas");
  canvas.width = width * scale;
  canvas.height = height * scale;
  canvas.style.width = width + "px";
  var context;
  context = canvas.getContext("2d", options);
  context.scale(scale, scale);
  return context;
}
