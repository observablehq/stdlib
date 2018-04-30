import {resolve as resolveDefault, requireFrom} from "d3-require";
import constant from "./constant";
import DOM from "./dom/index";
import Files from "./files/index";
import Generators from "./generators/index";
import html from "./html";
import md from "./md";
import Mutable from "./mutable";
import now from "./now";
import Promises from "./promises/index";
import svg from "./svg";
import tex from "./tex";
import width from "./width";

export default function Library(resolve) {
  if (resolve == null) resolve = resolveDefault;
  var require = requireFrom(resolve);
  Object.defineProperties(this, {
    DOM: {value: DOM, enumerable: true},
    Files: {value: Files, enumerable: true},
    Generators: {value: Generators, enumerable: true},
    Mutable: {value: Mutable, enumerable: true},
    Promises: {value: Promises, enumerable: true},
    require: {value: constant(require), enumerable: true},
    resolve: {value: constant(resolve), enumerable: true},
    html: {value: constant(html), enumerable: true},
    md: {value: md(require, resolve), enumerable: true},
    svg: {value: constant(svg), enumerable: true},
    tex: {value: tex(require, resolve), enumerable: true},
    now: {value: now, enumerable: true},
    width: {value: width, enumerable: true}
  });
}
