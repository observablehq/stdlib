import template from "./template";

// TODO
// var code = root.querySelectorAll("pre code[class]");
// if (code.length > 0) require("@observablehq/highlight.js@1.0.0/highlight.min.js").then(function(hl) { code.forEach(hl.highlightBlock); });

export default function(require) {
  return function() {
    return require("marked@0.3.9/marked.min.js").then(function(marked) {
      return template(function(string) {
        return marked(string, {langPrefix: ""}).trim();
      });
    });
  };
}
