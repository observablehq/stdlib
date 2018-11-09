export default function(width, height) {
  var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", [0, 0, width, height]);
  svg.setAttribute("width", width);
  svg.setAttribute("height", height);
  svg.setAttributeNS("http://www.w3.org/XML/1998/namespace", "base", window.location.href);
  return svg;
}
