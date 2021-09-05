export class ExcelWorkbook {
  constructor(workbook) {
    Object.defineProperty(this, "_", {value: workbook});
  }
  sheetNames() {
    return this._.worksheets.map((sheet) => sheet.name);
  }
  sheet(name, {range, headers = false} = {}) {
    const sheet = this._.getWorksheet(
      typeof name === "number" ? this.sheetNames()[name] : name + ""
    );
    if (!sheet) throw new Error(`Sheet not found: ${name}`);
    return extract(sheet, {range, headers});
  }
}

function extract(sheet, {range, headers}) {
  let [[c0, r0], [c1, r1]] = parseRange(range, sheet);
  const seen = new Set();
  const names = [];
  const headerRow = headers && sheet._rows[r0++];
  function name(n) {
    if (!names[n]) {
      let name = (headerRow ? valueOf(headerRow._cells[n]) : AA(n)) || AA(n);
      while (seen.has(name)) name += "_";
      seen.add((names[n] = name));
    }
    return names[n];
  }
  if (headerRow) for (let c = c0; c <= c1; c++) name(c);

  const output = new Array(r1 - r0 + 1).fill({});
  for (let r = r0; r <= r1; r++) {
    const _row = sheet._rows[r];
    if (!_row || !_row.hasValues) continue;
    const row = (output[r - r0] = {});
    for (let c = c0; c <= c1; c++) {
      const value = valueOf(_row._cells[c]);
      if (value !== null && value !== undefined) row[name(c)] = value;
    }
  }

  output.columns = names.filter(() => true);
  return output;
}

function valueOf(cell) {
  if (!cell) return;
  const {value} = cell;
  if (value && typeof value === "object") {
    if (value.formula) return value.result;
    if (value.richText) return value.richText.map((d) => d.text).join("");
    if (value.text && value.hyperlink)
      return `<a href="${value.hyperlink}">${value.text}</a>`;
  }
  return value;
}

function parseRange(specifier = [], {columnCount, rowCount}) {
  if (typeof specifier === "string") {
    const [
      [c0 = 0, r0 = 0] = [],
      [c1 = columnCount - 1, r1 = rowCount - 1] = [],
    ] = specifier.split(":").map(NN);
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

function NN(s = "") {
  const [, sc, sr] = s.match(/^([a-zA-Z]+)?(\d+)?$/);
  let c = undefined;
  if (sc) {
    c = 0;
    for (let i = 0; i < sc.length; i++)
      c += Math.pow(26, sc.length - i - 1) * (sc.charCodeAt(i) - 64);
  }
  return [c && c - 1, sr && +sr - 1];
}
