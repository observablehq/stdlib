import template from "./template";

export default template(function(string) {
  var fragment = document.createDocumentFragment(),
      svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.innerHTML = string;
  while (svg.firstChild) fragment.appendChild(svg.firstChild);
  return fragment;
});
