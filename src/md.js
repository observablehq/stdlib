import template from "./template";
import marked from "marked";

export default function(require) {
  return function() {
    return template(function(string) {
      var root = document.createElement("div");
      root.innerHTML = marked(string, {langPrefix: ""}).trim();
      var code = root.querySelectorAll("pre code[class]");
      if (code.length > 0) {
        require("@observablehq/highlight.js@1.1.1/highlight.min.js").then(function(hl) {
          code.forEach(function (block) {
            hl.highlightBlock(block);
            block.parentNode.classList.add('observablehq--md-pre');
          });
        });
      }
      return root;
    }, function() {
      return document.createElement("div");
    });
  };
}
