import dependency from "./dependency.mjs";
import * as ddb from "@duckdb/duckdb-wasm"
export const d3 = dependency("d3", "7.6.1", "dist/d3.min.js");
export const inputs = dependency("@observablehq/inputs", "0.10.4", "dist/inputs.min.js");
export const plot = dependency("@observablehq/plot", "0.6.0", "dist/plot.umd.min.js");
export const graphviz = dependency("@observablehq/graphviz", "0.2.1", "dist/graphviz.min.js");
export const highlight = dependency("@observablehq/highlight.js", "2.0.0", "highlight.min.js");
export const katex = dependency("@observablehq/katex", "0.11.1", "dist/katex.min.js");
export const lodash = dependency("lodash", "4.17.21", "lodash.min.js");
export const htl = dependency("htl", "0.3.1", "dist/htl.min.js");
export const jszip = dependency("jszip", "3.10.0", "dist/jszip.min.js");
export const marked = dependency("marked", "0.3.12", "marked.min.js");
export const sql = dependency("sql.js", "1.7.0", "dist/sql-wasm.js");
export const vega = dependency("vega", "5.22.1", "build/vega.min.js");
export const vegalite = dependency("vega-lite", "5.5.0", "build/vega-lite.min.js");
export const vegaliteApi = dependency("vega-lite-api", "5.0.0", "build/vega-lite-api.min.js");
export const arrow = dependency("apache-arrow", "^8", "Arrow.es2015.min.js");
export const arquero = dependency("arquero", "4.8.8", "dist/arquero.min.js");
export const topojson = dependency("topojson-client", "3.1.0", "dist/topojson-client.min.js");
export const exceljs = dependency("exceljs", "4.3.0", "dist/exceljs.min.js");
export const mermaid = dependency("mermaid", "9.1.6", "dist/mermaid.min.js");
export const leaflet = dependency("leaflet", "1.8.0", "dist/leaflet.js");
export const duckdb = ddb;
// export const duckdb = dependency("@duckdb/duckdb-wasm", "1.17.0", "dist/duckdb-browser.cjs");
// export const duckdb = dependency("@duckdb/duckdb-wasm", "1.17.0", "");
// export const duckdb = dependency("@duckdb/duckdb-wasm", "1.17.0", "?min");
// tried: dependency("@duckdb/duckdb-wasm", "1.17.0", "+esm");
// dependency("@duckdb/duckdb-wasm", "1.17.0", "dist/duckdb-browser.cjs");
// dependency("@duckdb/duckdb-wasm", "1.17.0", "dist/duckdb-browser.mjs");