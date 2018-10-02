const options = {files: [], format: "svg", engine: "dot"};

export default function(require) {
  return function() {
    return require("viz.js@2.0.0/lite.render.js").then(function(Viz) {
      let module = Viz.Module(Object.assign({}, options));
      return function dot(strings) {
        let string = strings[0] + "", i = 0, n = arguments.length;
        while (++i < n) string += arguments[i] + "" + strings[i];
        const template = document.createElement("template");
        try {
          template.innerHTML = Viz.render(module, string, options);
        } catch (error) {
          module = Viz.Module(Object.assign({}, options)); // See Viz.js caveats.
          throw error;
        }
        const svg = document.importNode(template.content.firstElementChild, true);
        svg.style.maxWidth = "100%";
        svg.style.height = "auto";
        return svg;
      };
    });
  };
}
