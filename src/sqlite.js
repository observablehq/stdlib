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
    return formatText(
      (await this.query(`EXPLAIN QUERY PLAN ${query}`, params))
      .map(row => row.detail).join("\n")
    );
  }
  async describe(object) {
    return formatTable(
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

function formatTable(rows, columns = rows.columns) {
  if (!rows.length) throw new Error("Not found");
  const table = document.createElement("table");
  const thead = table.appendChild(document.createElement("thead"));
  const tr = thead.appendChild(document.createElement("tr"));
  for (const column of columns) {
    const th = tr.appendChild(document.createElement("th"));
    th.appendChild(document.createTextNode(column));
  }
  const tbody = table.appendChild(document.createElement("tbody"));
  for (const row of rows) {
    const tr = tbody.appendChild(document.createElement("tr"));
    for (const column of columns) {
      const td = tr.appendChild(document.createElement("td"));
      td.appendChild(document.createTextNode(row[column]));
    }
  }
  table.value = rows;
  return table;
}

function formatText(text) {
  const pre = document.createElement("pre");
  pre.className = "observablehq--inspect";
  pre.appendChild(document.createTextNode(text));
  return pre;
}
