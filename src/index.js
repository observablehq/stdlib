import {resolve as resolveDefault, requireFrom} from "d3-require";
import constant from "./constant";
import DOM from "./dom/index";
import Files from "./files/index";
import Generators from "./generators/index";
import html from "./html";
import md from "./md";
import now from "./now";
import Promises from "./promises/index";
import svg from "./svg";
import tex from "./tex";
import width from "./width";
import _loadFile from "./load_file";

export function runtimeLibrary(resolve) {
  if (resolve == null) resolve = resolveDefault;
  var require = requireFrom(resolve);
  return {
    DOM: DOM,
    Files: Files,
    Generators: Generators,
    Promises: Promises,
    require: constant(require),
    resolve: constant(resolve),
    html: constant(html),
    md: md(require, resolve),
    svg: constant(svg),
    tex: tex(require, resolve),
    now: now,
    width: width,
    _loadFile: _loadFile(require)
  };
}
