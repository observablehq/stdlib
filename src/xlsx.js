export class Workbook {
  constructor(workbook) {
    Object.defineProperty(this, "_", {value: workbook});
    this.sheetNames = this._.worksheets.map((sheet) => sheet.name);
  }
  sheet(name, {range, headers = false} = {}) {
    const sname =
      typeof name === "number"
        ? this.sheetNames[name]
        : this.sheetNames.includes(name + "")
        ? name + ""
        : null;
    if (sname == null) throw new Error(`Sheet not found: ${name}`);
    const sheet = this._.getWorksheet(sname);
    return extract(sheet, {range, headers});
  }
}

function extract(sheet, {range, headers}) {
  let [[c0, r0], [c1, r1]] = parseRange(range, sheet);
  const headerRow = headers && sheet._rows[r0++];
  let names = new Set();
  for (let n = c0; n <= c1; n++) {
    let name = (headerRow ? valueOf(headerRow._cells[n]) : null) || AA(n);
    while (names.has(name)) name += "_";
    names.add(name);
  }
  names = new Array(c0).concat(Array.from(names));

  const output = new Array(r1 - r0 + 1).fill({});
  for (let r = r0; r <= r1; r++) {
    const _row = sheet._rows[r];
    if (!_row || !_row.hasValues) continue;
    const row = (output[r - r0] = {});
    for (let c = c0; c <= c1; c++) {
      const value = valueOf(_row._cells[c]);
      if (value != null) row[names[c]] = value;
    }
  }

  output.columns = names.filter(() => true);
  return output;
}

function valueOf(cell) {
  if (!cell) return;
  const {value} = cell;
  if (value && value instanceof Date) return value;
  if (value && typeof value === "object") {
    if (value.formula || value.sharedFormula) return value.result;
    if (value.richText) return value.richText.map((d) => d.text).join("");
    if (value.text)
      return value.hyperlink
        ? `<a href="${encodeURI(value.hyperlink)}">${value.text.replace(
            /</g,
            "&lt;"
          )}</a>`
        : value.text;
    return value;
  }
  return value;
}

function parseRange(specifier = [], {columnCount, rowCount}) {
  if (typeof specifier === "string") {
    const [[c0 = 0, r0 = 0], [c1 = columnCount - 1, r1 = rowCount - 1] = []] =
      specifier.split(":").map(NN);
    return [
      [c0, r0],
      [c1, r1],
    ];
  } else if (typeof specifier === "object") {
    const [
      [c0 = 0, r0 = 0] = [],
      [c1 = columnCount - 1, r1 = rowCount - 1] = [],
    ] = specifier;
    return [
      [c0, r0],
      [c1, r1],
    ];
  } else {
    throw new Error(`Unknown range specifier`);
  }
}

function AA(c) {
  let sc = "";
  c++;
  do {
    sc = String.fromCharCode(64 + (c % 26 || 26)) + sc;
  } while ((c = Math.floor((c - 1) / 26)));
  return sc;
}

function NN(s) {
  const [, sc, sr] = s.match(/^([A-Z]*)(\d*)$/i);
  let c = undefined;
  if (sc) {
    c = 0;
    for (let i = 0; i < sc.length; i++)
      c += Math.pow(26, sc.length - i - 1) * (sc.charCodeAt(i) - 64);
  }
  return [c ? c - 1 : undefined, sr ? +sr - 1 : undefined];
}
