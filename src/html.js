import template from "./template";

export default template(function(string) {
  var template = document.createElement("template");
  template.innerHTML = string;
  var content = template.content;
  if (content.childNodes.length === 1) return content;
  var div = document.createElement("div");
  div.appendChild(content);
  return div;
});
