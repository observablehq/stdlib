import template from "./template.mjs";

export default template(function(string) {
  var root = document.createElementNS("http://www.w3.org/2000/svg", "g");
  root.innerHTML = string.trim();
  return root;
}, function() {
  return document.createElementNS("http://www.w3.org/2000/svg", "g");
});
