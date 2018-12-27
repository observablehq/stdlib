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
import documentation from "./documentation";

const root = {
  DOM,
  Files,
  Generators,
  html,
  md,
  Mutable,
  now,
  Promises,
  require,
  resolve,
  svg,
  tex,
  width
};

let m = new Map();

for (let {name, section} of documentation) {
  try {
    let parts = name.split(".");
    let obj = root[parts[0]];
    for (let i = 1; i < parts.length; i++) {
      obj = obj[parts[i]];
    }
    m.set(obj, {description: section});
  } catch (e) {}
}

console.log(m);

export default m;
