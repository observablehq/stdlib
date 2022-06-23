import {pyodide as Pyodide} from "./dependencies.js";

export default async function py(require) {
  const pyodide = await (await require(Pyodide.resolve())).loadPyodide();
  return async function py(strings, ...values) {
    let globals = {};
    const code = strings.reduce((code, string, i) => {
      if (!(i in values)) return code + string;
      const name = `_${i}`;
      globals[name] = values[i];
      return code + string + name;
    }, "");
    globals = pyodide.toPy(globals);
    await pyodide.loadPackagesFromImports(code);
    const value = await pyodide.runPythonAsync(code, {globals});
    return pyodide.isPyProxy(value) ? value.toJs() : value;
  };
}
