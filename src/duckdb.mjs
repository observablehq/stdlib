// TODO I wasn't able to use the `.resolve()` approach with a .mjs file
import {arrow as arr, duckdb as duck} from "./dependencies.mjs";

export default async function duckdb(require) {
    
  const arrow = await require(arr.resolve()); // TODO is this right...?
  const bundles = await duck.getJsDelivrBundles();
  const bundle = await duck.selectBundle(bundles);
  async function makeDB() {
    const logger = new duck.ConsoleLogger();
    const worker = await duck.createWorker(bundle.mainWorker);
    const db = new duck.AsyncDuckDB(logger, worker);
    await db.instantiate(bundle.mainModule);
    return db;
  }

// Adapted from: https://observablehq.com/@cmudig/duckdb-client
// Follows the DatabaseClient specification: https://observablehq.com/@observablehq/database-client-specification
class DuckDBClient {
    constructor(_db) {
      this._db = _db;
      this._counter = 0;
    }
  
    async queryStream(query, params) {
      const conn = await this.connection();
      let result;
  
      if (params) {
        const stmt = await conn.prepare(query);
        result = await stmt.query(...params);
      } else {
        result = await conn.query(query);
      }
      // Populate the schema of the results
      const schema = result.schema.fields.map(({ name, type }) => ({
        name,
        type: getType(String(type)),
        databaseType: String(type)
      }));
      return {
        schema,
        async *readRows() {
          let rows = result.toArray().map((r) => Object.fromEntries(r));
          yield rows;
        }
      };
    }
  
    // This function gets called to prepare the `query` parameter of the `queryStream` method
    queryTag(strings, ...params) {
      return [strings.join("?"), params];
    }
    async db() {
        if (!this._db) {
          this._db = await makeDB();
          await this._db.open({
            query: {
              castTimestampToDate: true
            }
          });
        }
        return this._db;
      }
  
    async connection() {
      if (!this._conn) {
        const db = await this.db();
        this._conn = await db.connect();
      }
      return this._conn;
    }
  
    async reconnect() {
      if (this._conn) {
        this._conn.close();
      }
      delete this._conn;
    }
  
    // query a single row
    async queryRow(query, params) {
      const key = `Query ${this._counter++}: ${query}`;
  
      console.time(key);
      const conn = await this.connection();
      // use send as we can stop iterating after we get the first batch
      const result = await conn.send(query, params);
      const batch = (await result.next()).value;
      console.timeEnd(key);
  
      return batch?.get(0);
    }
  
    async insertJSON(name, buffer, options) {
      const db = await this.db();
      await db.registerFileBuffer(name, new Uint8Array(buffer));
      const conn = await db.connect();
      await conn.insertJSONFromPath(name, { name, schema: "main", ...options });
      await conn.close();
  
      return this;
    }
  
    async insertCSV(name, buffer, options) {
      const db = await this.db();
      await db.registerFileBuffer(name, new Uint8Array(buffer));
      const conn = await db.connect();
      await conn.insertCSVFromPath(name, { name, schema: "main", ...options });
      await conn.close();
  
      return this;
    }
  
    async insertParquet(name, buffer) {
      const db = await this.db();
      await db.registerFileBuffer(name, new Uint8Array(buffer));
      const conn = await db.connect();
      await conn.query(
        `CREATE VIEW '${name}' AS SELECT * FROM parquet_scan('${name}')`
      );
      await conn.close();
  
      return this;
    }
  
    async insertArrowTable(name, table, options) {
      const buffer = arrow.tableToIPC(table);
      return this.insertArrowFromIPCStream(name, buffer, options);
    }
  
    async insertArrowFromIPCStream(name, buffer, options) {
      const db = await this.db();
      const conn = await db.connect();
      await conn.insertArrowFromIPCStream(buffer, {
        name,
        schema: "main",
        ...options
      });
      await conn.close();
  
      return this;
    }
  
    // Create a database from FileArrachments
    static async of(files = []) {
      const db = await makeDB();
      await db.open({
        query: {
          castTimestampToDate: true
        }
      });
  
      const toName = (file) =>
        file.name.split(".").slice(0, -1).join(".").replace(/\@.+?/, ""); // remove the "@X" versions Observable adds to file names
  
      if (files.constructor.name === "FileAttachment") {
        files = [[toName(files), files]];
      } else if (!Array.isArray(files)) {
        files = Object.entries(files);
      }
  
      // Add all files to the database. Import JSON and CSV. Create view for Parquet.
      await Promise.all(
        files.map(async (entry) => {
          let file;
          let name;
          let options = {};
  
          if (Array.isArray(entry)) {
            [name, file] = entry;
            if (file.hasOwnProperty("file")) {
              ({ file, ...options } = file);
            }
          } else if (entry.constructor.name === "FileAttachment") {
            [name, file] = [toName(entry), entry];
          } else if (typeof entry === "object") {
            ({ file, name, ...options } = entry);
            name = name ?? toName(file);
          } else {
            console.error("Unrecognized entry", entry);
          }
  
          if (!file.url && Array.isArray(file)) {
            const data = file;            
  
            const table = arrow.tableFromJSON(data);
            const buffer = arrow.tableToIPC(table);
  
            const conn = await db.connect();
            await conn.insertArrowFromIPCStream(buffer, {
              name,
              schema: "main",
              ...options
            });
            await conn.close();
            return;
          } else {
            const url = await file.url();
            if (url.indexOf("blob:") === 0) {
              const buffer = await file.arrayBuffer();
              await db.registerFileBuffer(file.name, new Uint8Array(buffer));
            } else {
              await db.registerFileURL(file.name, url);
            }
          }
  
          const conn = await db.connect();
          if (file.name.endsWith(".csv")) {
            await conn.insertCSVFromPath(file.name, {
              name,
              schema: "main",
              ...options
            });
          } else if (file.name.endsWith(".json")) {
            await conn.insertJSONFromPath(file.name, {
              name,
              schema: "main",
              ...options
            });
          } else if (file.name.endsWith(".parquet")) {
            await conn.query(
              `CREATE VIEW '${name}' AS SELECT * FROM parquet_scan('${file.name}')`
            );
          } else {
            console.warn(`Don't know how to handle file type of ${file.name}`);
          }
          await conn.close();
        })
      );
  
      return new DuckDBClient(db);
    }
  }
  return function duckdb(obj) {        
    return DuckDBClient.of(obj)
  };
}

function getType (type)  {
  const typeLower = type.toLowerCase();
  switch (typeLower) {
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

function element(name, props, children) {
    if (arguments.length === 2) children = props, props = undefined;
    const element = document.createElement(name);
    if (props !== undefined) for (const p in props) element[p] = props[p];
    if (children !== undefined) for (const c of children) element.appendChild(c);
    return element;
}

function text(value) {
return document.createTextNode(value);
}