import template from "./template";

export default template(function(string) {
  var content = document.createRange().createContextualFragment(string.trim());
  if (content.childNodes.length === 1) return content;
  var div = document.createElement("div");
  div.appendChild(content);
  return div;
});
