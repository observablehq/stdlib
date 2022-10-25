export default function (width, height, options = {}) {
  const {scale = devicePixelRatio, ...contextOptions} = !isNaN(options)
    ? {...(options != null && {scale: options})}
    : options;
  const canvas = document.createElement("canvas");
  canvas.width = width * scale;
  canvas.height = height * scale;
  canvas.style.width = width + "px";
  const context = canvas.getContext(
    "2d",
    options === null ? options : contextOptions
  );
  context.scale(scale, scale);
  return context;
}
