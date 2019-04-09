import template from "./template";
import marked from "marked";

const LANGUAGE_ROOT =
  "https://cdn.jsdelivr.net/npm/@observablehq/highlight.js@2.0.0-alpha.1/async-languages/";

export default function(require) {
  return function() {
    return template(
      function(string) {
        var root = document.createElement("div");
        root.innerHTML = marked(string, { langPrefix: "" }).trim();
        var code = root.querySelectorAll("pre code[class]");
        var bundledLanguages = new Set([
          "json",
          "javascript",
          "js",
          "html",
          "css",
          "html",
          "xhtml",
          "rss",
          "atom",
          "xjb",
          "xsd",
          "xsl",
          "plist"
        ]);
        if (code.length > 0) {
          (async function highlight() {
            const hl = await require("@observablehq/highlight.js@2.0.0-alpha.1/highlight.min.js");
            let requiredLanguages = Array.from(code)
              .map(element => element.className)
              .filter(className => !bundledLanguages.has(className));
            if (requiredLanguages.length) {
              const {
                default: index
              } = await import(`${LANGUAGE_ROOT}index.js`);
              for (let name of requiredLanguages) {
                if (index.hasOwnProperty(name)) {
                  const { default: language } = await import(`${LANGUAGE_ROOT}${
                    index[name]
                  }`);
                  hl.registerLanguage(name, language);
                }
              }
            }

            code.forEach(function(block) {
              hl.highlightBlock(block);
              block.parentNode.classList.add("observablehq--md-pre");
            });
          })();
        }
        return root;
      },
      function() {
        return document.createElement("div");
      }
    );
  };
}
