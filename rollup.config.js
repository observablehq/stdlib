import node from "rollup-plugin-node-resolve";
import uglify from "rollup-plugin-uglify";

const copyright = `// @observablehq/notebook-stdlib Copyright ${(new Date).getFullYear()} Observable, Inc.`;

function config(output) {
  return {
    input: "src/index.js",
    plugins: [
      node(),
      uglify({
        toplevel: output.format === "es",
        output: {preamble: copyright}
      })
    ],
    output
  };
}

export default [
  config({
    format: "es",
    file: "dist/notebook-stdlib.js"
  }),
  config({
    format: "umd",
    extend: true,
    name: "observablehq",
    file: "dist/notebook-stdlib.umd.js"
  })
];
