import {require as requireDefault} from "d3-require";
import DOM from "./dom/index.js";
import Files from "./files/index.js";
import {AbstractFile, FileAttachment, NoFileAttachments} from "./fileAttachment.js";
import Generators from "./generators/index.js";
import html from "./html.js";
import md from "./md.js";
import mermaid from "./mermaid.js";
import Mutable from "./mutable.js";
import now from "./now.js";
import Promises from "./promises/index.js";
import resolve from "./resolve.js";
import requirer from "./require.js";
import SQLite, {SQLiteDatabaseClient} from "./sqlite.js";
import svg from "./svg.js";
import tex from "./tex.js";
import vegalite from "./vegalite.js";
import width from "./width.js";
import {arquero, arrow, d3, graphviz, htl, inputs, lodash, plot, topojson} from "./dependencies.js";

export default Object.assign(function Library(resolver) {
  const require = requirer(resolver);
  Object.defineProperties(this, properties({
    FileAttachment: () => NoFileAttachments,
    Mutable: () => Mutable,
    now,
    width,

    // Tagged template literals
    dot: () => require(graphviz.resolve()),
    htl: () => require(htl.resolve()),
    html: () => html,
    md: () => md(require),
    svg: () => svg,
    tex: () => tex(require),

    // Recommended libraries
    _: () => require(lodash.resolve()),
    aq: () => require.alias({"apache-arrow": arrow.resolve()})(arquero.resolve()),
    Arrow: () => require(arrow.resolve()),
    d3: () => require(d3.resolve()),
    Inputs: () => require(inputs.resolve()).then(Inputs => ({...Inputs, file: Inputs.fileOf(AbstractFile)})),
    mermaid: () => mermaid(require),
    Plot: () => require(plot.resolve()),
    require: () => require,
    resolve: () => resolve, // deprecated; use async require.resolve instead
    SQLite: () => SQLite(require),
    SQLiteDatabaseClient: () => SQLiteDatabaseClient,
    topojson: () => require(topojson.resolve()),
    vl: () => vegalite(require),

    // Sample datasets
    cars: () => new FileAttachment("https://static.observableusercontent.com/files/048ec3dfd528110c0665dfa363dd28bc516ffb7247231f3ab25005036717f5c4c232a5efc7bb74bc03037155cb72b1abe85a33d86eb9f1a336196030443be4f6").csv({typed: true}),
    diamonds: () => new FileAttachment("https://static.observableusercontent.com/files/87942b1f5d061a21fa4bb8f2162db44e3ef0f7391301f867ab5ba718b225a63091af20675f0bfe7f922db097b217b377135203a7eab34651e21a8d09f4e37252").csv({typed: true}),
    olympians: () => new FileAttachment("https://static.observableusercontent.com/files/31ca24545a0603dce099d10ee89ee5ae72d29fa55e8fc7c9ffb5ded87ac83060d80f1d9e21f4ae8eb04c1e8940b7287d179fe8060d887fb1f055f430e210007c").csv({typed: true}),
    penguins: () => new FileAttachment("https://static.observableusercontent.com/files/715db1223e067f00500780077febc6cebbdd90c151d3d78317c802732252052ab0e367039872ab9c77d6ef99e5f55a0724b35ddc898a1c99cb14c31a379af80a").csv({typed: true}),
    weather: () => new FileAttachment("https://static.observableusercontent.com/files/693a46b22b33db0f042728700e0c73e836fa13d55446df89120682d55339c6db7cc9e574d3d73f24ecc9bc7eb9ac9a1e7e104a1ee52c00aab1e77eb102913c1f").csv({typed: true}),

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
