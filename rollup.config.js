import node from "rollup-plugin-node-resolve";

export default {
  input: "src/index.js",
  plugins: [
    node()
  ],
  output: {
    banner: `// @observablehq/notebook-stdlib Copyright ${(new Date).getFullYear()} Observable, Inc.`,
    file: "build/notebook-stdlib.js",
    format: "umd",
    name: "O"
  }
};
