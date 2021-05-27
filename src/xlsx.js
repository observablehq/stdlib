let XLSX; // set lazily

export default async function xslx(require) {
  return XLSX = await require("xlsx@0.17.0/dist/xlsx.mini.min.js");
}

export class XlsxWorkbook {
  constructor(workbook) {
    Object.defineProperties(this, {
      _: {value: workbook}
    });
  }
  sheetNames() {
    return this._.SheetNames.slice();
  }
  sheet(name, options) {
    if (!Object.prototype.hasOwnProperty.call(this._.Sheets, name)) throw new Error("unknown sheet");
    return XLSX.utils.sheet_to_json(this._.Sheets[name], options);
  }
}
