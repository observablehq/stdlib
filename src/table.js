import {ascending, descending, reverse} from "d3-array";
import {FileAttachment} from "./fileAttachment.js";
import {isArqueroTable} from "./arquero.js";
import {isArrowTable, loadArrow} from "./arrow.js";
import {DuckDBClient} from "./duckdb.js";

const nChecks = 20; // number of values to check in each array

// We support two levels of DatabaseClient. The simplest DatabaseClient
// implements only the client.sql tagged template literal. More advanced
// DatabaseClients implement client.query and client.queryStream, which support
// streaming and abort, and the client.queryTag tagged template literal is used
// to translate the contents of a SQL cell or Table cell into the appropriate
// arguments for calling client.query or client.queryStream. For table cells, we
// additionally require client.describeColumns. The client.describeTables method
// is optional.
export function isDatabaseClient(value, mode) {
  return (
    value &&
    (typeof value.sql === "function" ||
      (typeof value.queryTag === "function" &&
        (typeof value.query === "function" ||
          typeof value.queryStream === "function"))) &&
    (mode !== "table" || typeof value.describeColumns === "function") &&
    value !== __query // don’t match our internal helper
  );
}

// Returns true if the value is a typed array (for a single-column table), or if
// it’s an array. In the latter case, the elements of the array must be
// consistently typed: either plain objects or primitives or dates.
export function isDataArray(value) {
  return (
    (Array.isArray(value) &&
      (isQueryResultSetSchema(value.schema) ||
        isQueryResultSetColumns(value.columns) ||
        arrayContainsObjects(value) ||
        arrayContainsPrimitives(value) ||
        arrayContainsDates(value))) ||
    isTypedArray(value)
  );
}

// Given an array, checks that the given value is an array that does not contain
// any primitive values (at least for the first few values that we check), and
// that the first object contains enumerable keys (see computeSchema for how we
// infer the columns). We assume that the contents of the table are homogenous,
// but we don’t currently enforce this.
// https://observablehq.com/@observablehq/database-client-specification#§1
function arrayContainsObjects(value) {
  const n = Math.min(nChecks, value.length);
  for (let i = 0; i < n; ++i) {
    const v = value[i];
    if (v === null || typeof v !== "object") return false;
  }
  return n > 0 && objectHasEnumerableKeys(value[0]);
}

// Using a for-in loop here means that we can abort after finding at least one
// enumerable key (whereas Object.keys would require materializing the array of
// all keys, which would be considerably slower if the value has many keys!).
// This function assumes that value is an object; see arrayContainsObjects.
function objectHasEnumerableKeys(value) {
  for (const _ in value) return true;
  return false;
}

function isQueryResultSetSchema(schemas) {
  return (Array.isArray(schemas) && schemas.every((s) => s && typeof s.name === "string"));
}

function isQueryResultSetColumns(columns) {
  return (Array.isArray(columns) && columns.every((name) => typeof name === "string"));
}

// Returns true if the value represents an array of primitives (i.e., a
// single-column table). This should only be passed values for which
// isDataArray returns true.
export function arrayIsPrimitive(value) {
  return (
    isTypedArray(value) ||
    arrayContainsPrimitives(value) ||
    arrayContainsDates(value)
  );
}

// Given an array, checks that the first n elements are primitives (number,
// string, boolean, bigint) of a consistent type.
function arrayContainsPrimitives(value) {
  const n = Math.min(nChecks, value.length);
  if (!(n > 0)) return false;
  let type;
  let hasPrimitive = false; // ensure we encounter 1+ primitives
  for (let i = 0; i < n; ++i) {
    const v = value[i];
    if (v == null) continue; // ignore null and undefined
    const t = typeof v;
    if (type === undefined) {
      switch (t) {
        case "number":
        case "boolean":
        case "string":
        case "bigint":
          type = t;
          break;
        default:
          return false;
      }
    } else if (t !== type) {
      return false;
    }
    hasPrimitive = true;
  }
  return hasPrimitive;
}

// Given an array, checks that the first n elements are dates.
function arrayContainsDates(value) {
  const n = Math.min(nChecks, value.length);
  if (!(n > 0)) return false;
  let hasDate = false; // ensure we encounter 1+ dates
  for (let i = 0; i < n; ++i) {
    const v = value[i];
    if (v == null) continue; // ignore null and undefined
    if (!(v instanceof Date)) return false;
    hasDate = true;
  }
  return hasDate;
}

function isTypedArray(value) {
  return (
    value instanceof Int8Array ||
    value instanceof Int16Array ||
    value instanceof Int32Array ||
    value instanceof Uint8Array ||
    value instanceof Uint8ClampedArray ||
    value instanceof Uint16Array ||
    value instanceof Uint32Array ||
    value instanceof Float32Array ||
    value instanceof Float64Array
  );
}

// __query is used by table cells; __query.sql is used by SQL cells.
export const __query = Object.assign(
  async (source, operations, invalidation, name) => {
    source = await loadTableDataSource(await source, name);
    if (isDatabaseClient(source)) return evaluateQuery(source, makeQueryTemplate(operations, source), invalidation);
    if (isDataArray(source)) return __table(source, operations);
    if (!source) throw new Error("missing data source");
    throw new Error("invalid data source");
  },
  {
    sql(source, invalidation, name) {
      return async function () {
        return evaluateQuery(await loadSqlDataSource(await source, name), arguments, invalidation);
      };
    }
  }
);

export async function loadDataSource(source, mode, name) {
  switch (mode) {
    case "table": return loadTableDataSource(source, name);
    case "sql": return loadSqlDataSource(source, name);
  }
  return source;
}

// We use a weak map to cache loaded data sources by key so that we don’t have
// to e.g. create separate SQLiteDatabaseClients every time we’re querying the
// same SQLite file attachment. Since this is a weak map, unused references will
// be garbage collected when they are no longer desired. Note: the name should
// be consistent, as it is not part of the cache key!
function sourceCache(loadSource) {
  const cache = new WeakMap();
  return (source, name) => {
    if (!source) throw new Error("data source not found");
    let promise = cache.get(source);
    if (!promise || (isDataArray(source) && source.length !== promise._numRows)) {
      // Warning: do not await here! We need to populate the cache synchronously.
      promise = loadSource(source, name);
      promise._numRows = source.length; // This will be undefined for DatabaseClients
      cache.set(source, promise);
    }
    return promise;
  };
}

const loadTableDataSource = sourceCache(async (source, name) => {
  if (source instanceof FileAttachment) {
    switch (source.mimeType) {
      case "text/csv": return source.csv({typed: true});
      case "text/tab-separated-values": return source.tsv({typed: true});
      case "application/json": return source.json();
      case "application/x-sqlite3": return source.sqlite();
    }
    if (/\.(arrow|parquet)$/i.test(source.name)) return loadDuckDBClient(source, name);
    throw new Error(`unsupported file type: ${source.mimeType}`);
  }
  if (isArrowTable(source) || isArqueroTable(source)) return loadDuckDBClient(source, name);
  return source;
});

const loadSqlDataSource = sourceCache(async (source, name) => {
  if (source instanceof FileAttachment) {
    switch (source.mimeType) {
      case "text/csv":
      case "text/tab-separated-values":
      case "application/json": return loadDuckDBClient(source, name);
      case "application/x-sqlite3": return source.sqlite();
    }
    if (/\.(arrow|parquet)$/i.test(source.name)) return loadDuckDBClient(source, name);
    throw new Error(`unsupported file type: ${source.mimeType}`);
  }
  if (isDataArray(source)) return loadDuckDBClient(await asArrowTable(source, name), name);
  if (isArrowTable(source) || isArqueroTable(source)) return loadDuckDBClient(source, name);
  return source;
});

async function asArrowTable(array, name) {
  const arrow = await loadArrow();
  return arrayIsPrimitive(array)
    ? arrow.tableFromArrays({[name]: array})
    : arrow.tableFromJSON(array);
}

function loadDuckDBClient(
  source,
  name = source instanceof FileAttachment
    ? getFileSourceName(source)
    : "__table"
) {
  return DuckDBClient.of({[name]: source});
}

function getFileSourceName(file) {
  return file.name
    .replace(/@\d+(?=\.|$)/, "") // strip Observable file version number
    .replace(/\.\w+$/, ""); // strip file extension
}

async function evaluateQuery(source, args, invalidation) {
  if (!source) throw new Error("missing data source");

  // If this DatabaseClient supports abort and streaming, use that.
  if (typeof source.queryTag === "function") {
    const abortController = new AbortController();
    const options = {signal: abortController.signal};
    invalidation.then(() => abortController.abort("invalidated"));
    if (typeof source.queryStream === "function") {
      return accumulateQuery(
        source.queryStream(...source.queryTag.apply(source, args), options)
      );
    }
    if (typeof source.query === "function") {
      return source.query(...source.queryTag.apply(source, args), options);
    }
  }

  // Otherwise, fallback to the basic sql tagged template literal.
  if (typeof source.sql === "function") {
    return source.sql.apply(source, args);
  }

  // TODO: test if source is a file attachment, and support CSV etc.
  throw new Error("source does not implement query, queryStream, or sql");
}

// Generator function that yields accumulated query results client.queryStream
async function* accumulateQuery(queryRequest) {
  let then = performance.now();
  const queryResponse = await queryRequest;
  const values = [];
  values.done = false;
  values.error = null;
  values.schema = queryResponse.schema;
  try {
    for await (const rows of queryResponse.readRows()) {
      if (performance.now() - then > 10 && values.length > 0) {
        yield values;
        then = performance.now();
      }
      for (const value of rows) {
        values.push(value);
      }
    }
    values.done = true;
    yield values;
  } catch (error) {
    values.error = error;
    yield values;
  }
}

/**
 * Returns a SQL query in the form [[parts], ...params] where parts is an array
 * of sub-strings and params are the parameter values to be inserted between each
 * sub-string.
 */
export function makeQueryTemplate(operations, source) {
  const escaper =
    typeof source.escape === "function" ? source.escape : (i) => i;
  const {select, from, filter, sort, slice} = operations;
  if (!from.table)
    throw new Error("missing from table");
  if (select.columns && select.columns.length === 0)
    throw new Error("at least one column must be selected");
  const columns = select.columns ? select.columns.map(escaper).join(", ") : "*";
  const args = [
    [`SELECT ${columns} FROM ${formatTable(from.table, escaper)}`]
  ];
  for (let i = 0; i < filter.length; ++i) {
    appendSql(i ? `\nAND ` : `\nWHERE `, args);
    appendWhereEntry(filter[i], args, escaper);
  }
  for (let i = 0; i < sort.length; ++i) {
    appendSql(i ? `, ` : `\nORDER BY `, args);
    appendOrderBy(sort[i], args, escaper);
  }
  if (source.dialect === "mssql" || source.dialect === "oracle") {
    if (slice.to !== null || slice.from !== null) {
      if (!sort.length) {
        if (!select.columns)
          throw new Error(
              "at least one column must be explicitly specified. Received '*'."
          );
        appendSql(`\nORDER BY `, args);
        appendOrderBy(
          {column: select.columns[0], direction: "ASC"},
          args,
          escaper
        );
      }
      appendSql(`\nOFFSET ${slice.from || 0} ROWS`, args);
      appendSql(
        `\nFETCH NEXT ${
          slice.to !== null ? slice.to - (slice.from || 0) : 1e9
        } ROWS ONLY`,
        args
      );
    }
  } else {
    if (slice.to !== null || slice.from !== null) {
      appendSql(
        `\nLIMIT ${slice.to !== null ? slice.to - (slice.from || 0) : 1e9}`,
        args
      );
    }
    if (slice.from !== null) {
      appendSql(` OFFSET ${slice.from}`, args);
    }
  }
  return args;
}

function formatTable(table, escaper) {
  if (typeof table === "object") { // i.e., not a bare string specifier
    let from = "";
    if (table.database != null) from += escaper(table.database) + ".";
    if (table.schema != null) from += escaper(table.schema) + ".";
    from += escaper(table.table);
    return from;
  } else {
    return escaper(table);
  }
}

function appendSql(sql, args) {
  const strings = args[0];
  strings[strings.length - 1] += sql;
}

function appendOrderBy({column, direction}, args, escaper) {
  appendSql(`${escaper(column)} ${direction.toUpperCase()}`, args);
}

function appendWhereEntry({type, operands}, args, escaper) {
  if (operands.length < 1) throw new Error("Invalid operand length");

  // Unary operations
  if (operands.length === 1) {
    appendOperand(operands[0], args, escaper);
    switch (type) {
      case "n":
        appendSql(` IS NULL`, args);
        return;
      case "nn":
        appendSql(` IS NOT NULL`, args);
        return;
      default:
        throw new Error("Invalid filter operation");
    }
  }

  // Binary operations
  if (operands.length === 2) {
    if (["in", "nin"].includes(type)) {
      // Fallthrough to next parent block.
    } else if (["c", "nc"].includes(type)) {
      // TODO: Case (in)sensitive?
      appendOperand(operands[0], args, escaper);
      switch (type) {
        case "c":
          appendSql(` LIKE `, args);
          break;
        case "nc":
          appendSql(` NOT LIKE `, args);
          break;
      }
      appendOperand(likeOperand(operands[1]), args, escaper);
      return;
    } else {
      appendOperand(operands[0], args, escaper);
      switch (type) {
        case "eq":
          appendSql(` = `, args);
          break;
        case "ne":
          appendSql(` <> `, args);
          break;
        case "gt":
          appendSql(` > `, args);
          break;
        case "lt":
          appendSql(` < `, args);
          break;
        case "gte":
          appendSql(` >= `, args);
          break;
        case "lte":
          appendSql(` <= `, args);
          break;
        default:
          throw new Error("Invalid filter operation");
      }
      appendOperand(operands[1], args, escaper);
      return;
    }
  }

  // List operations
  appendOperand(operands[0], args, escaper);
  switch (type) {
    case "in":
      appendSql(` IN (`, args);
      break;
    case "nin":
      appendSql(` NOT IN (`, args);
      break;
    default:
      throw new Error("Invalid filter operation");
  }
  appendListOperands(operands.slice(1), args);
  appendSql(")", args);
}

function appendOperand(o, args, escaper) {
  if (o.type === "column") {
    appendSql(escaper(o.value), args);
  } else {
    args.push(o.value);
    args[0].push("");
  }
}

// TODO: Support column operands here?
function appendListOperands(ops, args) {
  let first = true;
  for (const op of ops) {
    if (first) first = false;
    else appendSql(",", args);
    args.push(op.value);
    args[0].push("");
  }
}

function likeOperand(operand) {
  return {...operand, value: `%${operand.value}%`};
}

// This function applies table cell operations to an in-memory table (array of
// objects); it should be equivalent to the corresponding SQL query. TODO Use
// DuckDBClient for data arrays, too, and then we wouldn’t need our own __table
// function to do table operations on in-memory data?
export function __table(source, operations) {
  const input = source;
  let {schema, columns} = source;
  let primitive = arrayIsPrimitive(source);
  if (primitive) source = Array.from(source, (value) => ({value}));
  for (const {type, operands} of operations.filter) {
    const [{value: column}] = operands;
    const values = operands.slice(1).map(({value}) => value);
    switch (type) {
      case "eq": {
        const [value] = values;
        if (value instanceof Date) {
          const time = +value; // compare as primitive
          source = source.filter((d) => +d[column] === time);
        } else {
          source = source.filter((d) => d[column] === value);
        }
        break;
      }
      case "ne": {
        const [value] = values;
        source = source.filter((d) => d[column] !== value);
        break;
      }
      case "c": {
        const [value] = values;
        source = source.filter(
          (d) => typeof d[column] === "string" && d[column].includes(value)
        );
        break;
      }
      case "nc": {
        const [value] = values;
        source = source.filter(
          (d) => typeof d[column] === "string" && !d[column].includes(value)
        );
        break;
      }
      case "in": {
        const set = new Set(values); // TODO support dates?
        source = source.filter((d) => set.has(d[column]));
        break;
      }
      case "nin": {
        const set = new Set(values); // TODO support dates?
        source = source.filter((d) => !set.has(d[column]));
        break;
      }
      case "n": {
        source = source.filter((d) => d[column] == null);
        break;
      }
      case "nn": {
        source = source.filter((d) => d[column] != null);
        break;
      }
      case "lt": {
        const [value] = values;
        source = source.filter((d) => d[column] < value);
        break;
      }
      case "lte": {
        const [value] = values;
        source = source.filter((d) => d[column] <= value);
        break;
      }
      case "gt": {
        const [value] = values;
        source = source.filter((d) => d[column] > value);
        break;
      }
      case "gte": {
        const [value] = values;
        source = source.filter((d) => d[column] >= value);
        break;
      }
      default:
        throw new Error(`unknown filter type: ${type}`);
    }
  }
  for (const {column, direction} of reverse(operations.sort)) {
    const compare = direction === "desc" ? descending : ascending;
    if (source === input) source = source.slice(); // defensive copy
    source.sort((a, b) => compare(a[column], b[column]));
  }
  let {from, to} = operations.slice;
  from = from == null ? 0 : Math.max(0, from);
  to = to == null ? Infinity : Math.max(0, to);
  if (from > 0 || to < Infinity) {
    source = source.slice(Math.max(0, from), Math.max(0, to));
  }
  if (operations.select.columns) {
    if (schema) {
      const schemaByName = new Map(schema.map((s) => [s.name, s]));
      schema = operations.select.columns.map((c) => schemaByName.get(c));
    }
    if (columns) {
      columns = operations.select.columns;
    }
    source = source.map((d) =>
      Object.fromEntries(operations.select.columns.map((c) => [c, d[c]]))
    );
  }
  if (primitive) source = source.map((d) => d.value);
  if (source !== input) {
    if (schema) source.schema = schema;
    if (columns) source.columns = columns;
  }
  return source;
}
