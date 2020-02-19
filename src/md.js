import template from "./template.js";

const HL_ROOT =
  "https://cdn.jsdelivr.net/npm/@observablehq/highlight.js@2.0.0/";

export default function(require) {
  return function() {
    return require("marked@0.3.12/marked.min.js").then(function(marked) {
      return template(
        function(string) {
          var root = document.createElement("div");
          root.innerHTML = marked(string, {langPrefix: ""}).trim();
          var code = root.querySelectorAll("pre code[class]");
          if (code.length > 0) {
            require(HL_ROOT + "highlight.min.js").then(function(hl) {
              code.forEach(function(block) {
                function done() {
                  hl.highlightBlock(block);
                  block.parentNode.classList.add("observablehq--md-pre");
                }
                if (hl.getLanguage(block.className)) {
                  done();
                } else {
                  require(HL_ROOT + "async-languages/index.js")
                    .then(index => {
                      if (index.has(block.className)) {
                        return require(HL_ROOT +
                          "async-languages/" +
                          index.get(block.className)).then(language => {
                          hl.registerLanguage(block.className, language);
                        });
                      }
                    })
                    .then(done, done);
                }
              });
            });
          }
          return root;
        },
        function() {
          return document.createElement("div");
        }
      );
    });
  };
}
