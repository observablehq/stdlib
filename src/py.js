import {pyodide as Pyodide} from "./dependencies.js";

export default async function py(require) {
  const pyodide = await (await require(Pyodide.resolve())).loadPyodide();
  return async function py() {
    const code = String.raw.apply(String, arguments);
    await pyodide.loadPackagesFromImports(code);
    const value = await pyodide.runPython(code);
    return pyodide.isPyProxy(value) ? value.toJs() : value;
  };
}
