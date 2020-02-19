import {require as requireDefault} from "d3-require";
import constant from "./constant.js";
import DOM from "./dom/index.js";
import Files from "./files/index.js";
import {NoFileAttachments} from "./fileAttachment.js";
import Generators from "./generators/index.js";
import html from "./html.js";
import md from "./md.js";
import Mutable from "./mutable.js";
import now from "./now.js";
import Promises from "./promises/index.js";
import resolve from "./resolve.js";
import requirer from "./require.js";
import svg from "./svg.js";
import tex from "./tex.js";
import width from "./width.js";

export default Object.assign(function Library(resolver) {
  const require = requirer(resolver);
  Object.defineProperties(this, {
    DOM: {value: DOM, writable: true, enumerable: true},
    FileAttachment: {value: constant(NoFileAttachments), writable: true, enumerable: true},
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
}, {resolve: requireDefault.resolve});
