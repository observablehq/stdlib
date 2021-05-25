import {require as requireDefault} from "d3-require";
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
import SQLite from "./sqlite.js";
import svg from "./svg.js";
import tex from "./tex.js";
import vegalite from "./vegalite.js";
import width from "./width.js";

export default Object.assign(function Library(resolver) {
  const require = requirer(resolver);
  Object.defineProperties(this, properties({
    FileAttachment: () => NoFileAttachments,
    Inputs: () => require("@observablehq/inputs@0.8.0/dist/inputs.umd.min.js"),
    Mutable: () => Mutable,
    Plot: () => require("@observablehq/plot@0.1.0/dist/plot.umd.min.js"),
    SQLite: () => SQLite(require),
    _: () => require("lodash@4.17.21/lodash.min.js"),
    d3: () => require("d3@6.7.0/dist/d3.min.js"),
    dot: () => require("@observablehq/graphviz@0.2.1/dist/graphviz.min.js"),
    htl: () => require("htl@0.2.5/dist/htl.min.js"),
    html: () => html,
    md: () => md(require),
    now,
    require: () => require,
    resolve: () => resolve,
    svg: () => svg,
    tex: () => tex(require),
    vl: () => vegalite(require),
    width,

    // Note: these are namespace objects, and thus exposed directly rather than
    // being wrapped in a function. This allows library.Generators to resolve,
    // rather than needing module.value.
    DOM,
    Files,
    Generators,
    Promises
  }));
}, {resolve: requireDefault.resolve});

function properties(values) {
  return Object.fromEntries(Object.entries(values).map(property));
}

function property([key, value]) {
  return [key, ({value, writable: true, enumerable: true})];
}
