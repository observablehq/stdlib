import {require as requireDefault} from "d3-require";

export default async function sqlite(require) {
  const sql = await require("sql.js@1.5.0/dist/sql-wasm.js");
  return sql({locateFile: file => `https://cdn.jsdelivr.net/npm/sql.js@1.5.0/dist/${file}`});
}

export class SQLiteDatabaseClient {
  constructor(db) {
    Object.defineProperties(this, {
      _db: {value: db}
    });
  }
  async query(query, params) {
    return await exec(this._db, query, params);
  }
  async queryRow(query, params) {
    return (await this.query(query, params))[0] || null;
  }
  async explain(query, params) {
    const rows = (await this.query(`EXPLAIN QUERY PLAN ${query}`, params));
    const text = rows.map(row => row.detail).join("\n");
    const pre = document.createElement("PRE");
    pre.className = "observablehq--inspect";
    pre.appendChild(document.createTextNode(text));
    return pre;
  }
  async describe(object) {
    return table(
      await (object === undefined
        ? this.query(`SELECT name FROM sqlite_master WHERE type = 'table'`)
        : this.query(`SELECT * FROM pragma_table_info(?)`, [object]))
    );
  }
}

async function exec(db, query, params) {
  const [result] = await db.exec(query, params);
  if (!result) return [];
  const {columns, values} = result;
  const rows = values.map(row => Object.fromEntries(row.map((value, i) => [columns[i], value])));
  rows.columns = columns;
  return rows;
}

async function table(data, options) {
  const Inputs = await requireDefault("@observablehq/inputs@0.8.0/dist/inputs.umd.min.js");
  return Inputs.table(data, options);
}
