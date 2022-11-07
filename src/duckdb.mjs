import {arrow9 as arrow, duckdb} from "./dependencies.mjs";
import {FileAttachment} from "./fileAttachment.mjs";

// Adapted from https://observablehq.com/@cmudig/duckdb-client
// Copyright 2021 CMU Data Interaction Group
//
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are met:
//
// 1. Redistributions of source code must retain the above copyright notice,
//    this list of conditions and the following disclaimer.
//
// 2. Redistributions in binary form must reproduce the above copyright notice,
//    this list of conditions and the following disclaimer in the documentation
//    and/or other materials provided with the distribution.
//
// 3. Neither the name of the copyright holder nor the names of its contributors
//    may be used to endorse or promote products derived from this software
//    without specific prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
// AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
// IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
// ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
// LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
// CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
// SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
// INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
// CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
// ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
// POSSIBILITY OF SUCH DAMAGE.

// TODO Allow this to be overridden using the Library’s resolver.
const cdn = "https://cdn.observableusercontent.com/npm/";

export class DuckDBClient {
  constructor(db) {
    Object.defineProperties(this, {
      _db: {value: db}
    });
  }

  async queryStream(query, params) {
    const connection = await this._db.connect();
    let reader, schema, batch;
    try {
      reader = await connection.send(query, params);
      batch = await reader.next();
      if (batch.done) throw new Error("missing first batch");
      schema = batch.value.schema;
    } catch (error) {
      await connection.close();
      throw error;
    }
    return {
      schema: schema.fields.map(({name, type}) => ({
        name,
        type: getType(String(type)),
        databaseType: String(type)
      })),
      async *readRows() {
        try {
          while (!batch.done) {
            yield batch.value.toArray();
            batch = await reader.next();
          }
        } finally {
          await connection.close();
        }
      }
    };
  }

  async query(query, params) {
    const result = await this.queryStream(query, params);
    const results = [];
    for await (const rows of result.readRows()) {
      for (const row of rows) {
        results.push(row);
      }
    }
    results.schema = result.schema;
    return results;
  }

  async queryRow(query, params) {
    const result = await this.queryStream(query, params);
    const reader = result.readRows();
    try {
      const {done, value} = await reader.next();
      return done || !value.length ? null : value[0];
    } finally {
      await reader.return();
    }
  }

  async sql(strings, ...args) {
    return await this.query(strings.join("?"), args);
  }

  queryTag(strings, ...params) {
    return [strings.join("?"), params];
  }

  escape(name) {
    return `"${name}"`;
  }

  async describeTables() {
    const tables = await this.query(`SHOW TABLES`);
    return tables.map(({name}) => ({name}));
  }

  async describeColumns({table} = {}) {
    const columns = await this.query(`DESCRIBE ${table}`);
    return columns.map(({column_name, column_type}) => {
      return {
        name: column_name,
        type: getType(column_type),
        databaseType: column_type
      };
    });
  }

  static async of(sources = {}, config = {}) {
    const db = await createDuckDB();
    if (config.query?.castTimestampToDate === undefined) {
      config = {...config, query: {...config.query, castTimestampToDate: true}};
    }
    await db.open(config);
    await Promise.all(
      Object.entries(sources).map(async ([name, source]) => {
        if ("array" in source) { // array + options
          const {array, ...options} = source;
          await insertArray(db, name, array, options);
        } else if ("file" in source) { // file + options
          const {file, ...options} = source;
          await insertFile(db, name, file, options);
        } else if (source instanceof FileAttachment) { // bare file
          await insertFile(db, name, source);
        } else if (Array.isArray(source)) { // bare data
          await insertArray(db, name, source);
        } else {
          throw new Error(`invalid source: ${source}`);
        }
      })
    );
    return new DuckDBClient(db);
  }
}

async function insertFile(database, name, file, options) {
  const url = await file.url();
  if (url.startsWith("blob:")) {
    const buffer = await file.arrayBuffer();
    await database.registerFileBuffer(file.name, new Uint8Array(buffer));
  } else {
    await database.registerFileURL(file.name, url);
  }
  const connection = await database.connect();
  try {
    switch (file.mimeType) {
      case "text/csv":
        await connection.insertCSVFromPath(file.name, {
          name,
          schema: "main",
          ...options
        });
        break;
      case "application/json":
        await connection.insertJSONFromPath(file.name, {
          name,
          schema: "main",
          ...options
        });
        break;
      default:
        if (file.name.endsWith(".parquet")) {
          await connection.query(
            `CREATE VIEW '${name}' AS SELECT * FROM parquet_scan('${file.name}')`
          );
        } else {
          throw new Error(`unknown file type: ${file.mimeType}`);
        }
    }
  } finally {
    await connection.close();
  }
}

async function insertArray(database, name, array, options) {
  const arrow = await loadArrow();
  const table = arrow.tableFromJSON(array);
  const buffer = arrow.tableToIPC(table);
  const connection = await database.connect();
  try {
    await connection.insertArrowFromIPCStream(buffer, {
      name,
      schema: "main",
      ...options
    });
  } finally {
    await connection.close();
  }
}

async function createDuckDB() {
  const duck = await import(`${cdn}${duckdb.resolve()}`);
  const bundle = await duck.selectBundle({
    mvp: {
      mainModule: `${cdn}${duckdb.resolve("dist/duckdb-mvp.wasm")}`,
      mainWorker: `${cdn}${duckdb.resolve("dist/duckdb-browser-mvp.worker.js")}`
    },
    eh: {
      mainModule: `${cdn}${duckdb.resolve("dist/duckdb-eh.wasm")}`,
      mainWorker: `${cdn}${duckdb.resolve("dist/duckdb-browser-eh.worker.js")}`
    }
  });
  const logger = new duck.ConsoleLogger();
  const worker = await duck.createWorker(bundle.mainWorker);
  const db = new duck.AsyncDuckDB(logger, worker);
  await db.instantiate(bundle.mainModule);
  return db;
}

async function loadArrow() {
  return await import(`${cdn}${arrow.resolve()}`);
}

function getType(type) {
  switch (type.toLowerCase()) {
    case "bigint":
    case "int8":
    case "long":
      return "bigint";

    case "double":
    case "float8":
    case "numeric":
    case "decimal":
    case "decimal(s, p)":
    case "real":
    case "float4":
    case "float":
    case "float32":
    case "float64":
      return "number";

    case "hugeint":
    case "integer":
    case "smallint":
    case "tinyint":
    case "ubigint":
    case "uinteger":
    case "usmallint":
    case "utinyint":
    case "int4":
    case "int":
    case "signed":
    case "int2":
    case "short":
    case "int1":
    case "int64":
    case "int32":
      return "integer";

    case "boolean":
    case "bool":
    case "logical":
      return "boolean";

    case "date":
    case "interval": // date or time delta
    case "time":
    case "timestamp":
    case "timestamp with time zone":
    case "datetime":
    case "timestamptz":
    case "date64<millisecond>":
      return "date";

    case "uuid":
    case "varchar":
    case "char":
    case "bpchar":
    case "text":
    case "string":
    case "utf8": // this type is unlisted in the `types`, but is returned by the db as `column_type`...
      return "string";
    default:
      return "other";
  }
}
