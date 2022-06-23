import {pyodide as Pyodide} from "./dependencies.js";

export default async function py(require) {
  const pyodide = await (await require(Pyodide.resolve())).loadPyodide();
  let patch; // a promise for patching matplotlib (if needed)
  return async function py(strings, ...values) {
    const globals = {};
    const code = strings.reduce((code, string, i) => {
      if (!(i in values)) return code + string;
      const name = `_${i}`;
      globals[name] = values[i];
      return code + string + name;
    }, "");
    const imports = findImports(pyodide, code);
    if (imports.includes("matplotlib") && !patch) await (patch = patchMatplotlib(require, pyodide));
    if (imports.length) await pyodide.loadPackagesFromImports(code);
    const value = await pyodide.runPythonAsync(code, {globals: pyodide.toPy(globals)});
    return pyodide.isPyProxy(value) ? value.toJs() : value;
  };
}

// https://github.com/pyodide/pyodide/blob/1624e4a62445876a2d810fdbfc9ddb69a8321a8e/src/js/api.ts#L119-L125
function findImports(pyodide, code) {
  const imports = pyodide.pyodide_py.find_imports(code);
  try {
    return imports.toJs();
  } finally {
    imports.destroy();
  }
}

// Overrides matplotlib’s show function to return a DIV such that when used as
// the last expression in an Observable cell, the inspector will display it.
async function patchMatplotlib(require, pyodide) {
  require.resolve("font-awesome@4.7.0/css/font-awesome.min.css").then(href => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
  });
  await pyodide.loadPackage("matplotlib");
  await pyodide.runPythonAsync(`from matplotlib import pyplot as plt

_show = plt.show

def show(self):
  from js import document
  def create_root_element(self):
    div = document.createElement("div")
    document.body.appendChild(div)
    return div
  c = plt.gcf().canvas
  c.create_root_element = create_root_element.__get__(c, c.__class__)
  _show()
  div = c.get_element("")
  div.remove()
  return div

plt._show = _show
plt.show = show.__get__(plt, plt.__class__)
`);
}
