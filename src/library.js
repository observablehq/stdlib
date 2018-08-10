import constant from "./constant";
import DOM from "./dom/index";
import Files from "./files/index";
import Generators from "./generators/index";
import html from "./html";
import md from "./md";
import Mutable from "./mutable";
import now from "./now";
import Promises from "./promises/index";
import resolve from "./resolve";
import requirer from "./require";
import svg from "./svg";
import tex from "./tex";
import width from "./width";

export default function Library(resolver) {
  const require = requirer(resolver);
  Object.defineProperties(this, {
    DOM: {value: DOM, writable: true, enumerable: true},
    Files: {value: Files, writable: true, enumerable: true},
    Generators: {value: Generators, writable: true, enumerable: true},
    html: {value: constant(html), writable: true, enumerable: true},
    md: {value: md(require), writable: true, enumerable: true},
    Mutable: {value: constant(Mutable), writable: true, enumerable: true},
    now: {value: now, writable: true, enumerable: true},
    Promises: {value: Promises, writable: true, enumerable: true},
    require: {value: constant(require), writable: true, enumerable: true},
    resolve: {value: constant(resolve), writable: true, enumerable: true},
    svg: {value: constant(svg), writable: true, enumerable: true},
    tex: {value: tex(require), writable: true, enumerable: true},
    width: {value: width, writable: true, enumerable: true}
  });
}
