const fs = require("fs");
const readme = fs.readFileSync("README.md", "utf8");

const matches = (function() {
  let itemLine = /(<a href.*)/g;
  let match;
  let matches = [];
  while ((match = itemLine.exec(readme))) {
    matches.push(match);
  }
  return matches;
})();

const sections = (function() {
  let sections = [];
  for (let i = 0; i < matches.length; i++) {
    sections.push(
      readme.substring(
        matches[i].index,
        i < matches.length - 1 ? matches[i + 1].index : Infinity
      )
    );
  }
  return sections;
})();

const items = (function() {
  let items = [];
  for (let section of sections) {
    section = section
      .replace(/<a href="#\w+" name="\w+">#<\/a>\s/, "")
      .replace(/^###.*/g, "");
    let trailer = section.match(/###/);
    if (trailer) {
      section = section.substring(0, trailer.index);
    }
    let name = section.match(/([^(`\s\\]+)/)[0].replace(/<\/?b>/g, "");
    items.push({
      name,
      section: section.trim()
    });
  }
  return items;
})();

fs.writeFileSync(
  "src/documentation.js",
  `export default ${JSON.stringify(items)}`
);
