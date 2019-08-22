var raw = String.raw;

function style(href) {
  return new Promise(function(resolve, reject) {
    var link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.onerror = reject;
    link.onload = resolve;
    document.head.appendChild(link);
  });
}

export default function(require) {
  return function() {
    return Promise.all([
      require("@observablehq/katex@0.11.1/dist/katex.min.js"),
      require.resolve("@observablehq/katex@0.11.1/dist/katex.min.css").then(style)
    ]).then(function(values) {
      var katex = values[0], tex = renderer();

      function renderer(options) {
        return function() {
          var root = document.createElement("div");
          katex.render(raw.apply(String, arguments), root, options);
          return root.removeChild(root.firstChild);
        };
      }

      tex.options = renderer;
      tex.block = renderer({displayMode: true});
      return tex;
    });
  };
}
