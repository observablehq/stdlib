export const __query = Object.assign(
  // This function is used by table cells.
  async (source, operations, invalidation) => {
    const args = makeQueryTemplate(operations, await source);
    if (!args) return null; // the empty state
    return evaluateQuery(await source, args, invalidation);
  },
  {
    // This function is used by SQL cells.
    sql(source, invalidation) {
      return async function () {
        return evaluateQuery(source, arguments, invalidation);
      };
    }
  }
);

async function evaluateQuery(source, args, invalidation) {
  if (!source) return;

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
  const queryResponse = await queryRequest;
  const values = [];
  values.done = false;
  values.error = null;
  values.schema = queryResponse.schema;
  try {
    const iterator = queryResponse.readRows();
    do {
      const result = await iterator.next();
      if (result.done) {
        values.done = true;
      } else {
        for (const value of result.value) {
          values.push(value);
        }
      }
      yield values;
    } while (!values.done);
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
    source && typeof source.escape === "function" ? source.escape : (i) => i;
  const {select, from, filter, sort, slice} = operations;
  if (
    from.table === null ||
    select.columns === null ||
    (select.columns && select.columns.length === 0)
  )
    return;
  const columns = select.columns.map((c) => `t.${escaper(c)}`);
  const args = [
    [`SELECT ${columns} FROM ${formatTable(from.table, escaper)} t`]
  ];
  for (let i = 0; i < filter.length; ++i) {
    appendSql(i ? `\nAND ` : `\nWHERE `, args);
    appendWhereEntry(filter[i], args);
  }
  for (let i = 0; i < sort.length; ++i) {
    appendSql(i ? `, ` : `\nORDER BY `, args);
    appendOrderBy(sort[i], args);
  }
  if (slice.to !== null || slice.from !== null) {
    appendSql(
      `\nLIMIT ${slice.to !== null ? slice.to - (slice.from || 0) : 1e9}`,
      args
    );
  }
  if (slice.from !== null) {
    appendSql(` OFFSET ${slice.from}`, args);
  }
  return args;
}

function formatTable(table, escaper) {
  if (typeof table === "object") {
    let from = "";
    if (table.database != null) from += escaper(table.database) + ".";
    if (table.schema != null) from += escaper(table.schema) + ".";
    from += escaper(table.table);
    return from;
  }
  return table;
}

function appendSql(sql, args) {
  const strings = args[0];
  strings[strings.length - 1] += sql;
}

function appendOrderBy({column, direction}, args) {
  appendSql(`t.${column} ${direction.toUpperCase()}`, args);
}

function appendWhereEntry({type, operands}, args) {
  if (operands.length < 1) throw new Error("Invalid operand length");

  // Unary operations
  if (operands.length === 1) {
    appendOperand(operands[0], args);
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
      appendOperand(operands[0], args);
      switch (type) {
        case "c":
          appendSql(` LIKE `, args);
          break;
        case "nc":
          appendSql(` NOT LIKE `, args);
          break;
      }
      appendOperand(likeOperand(operands[1]), args);
      return;
    } else {
      appendOperand(operands[0], args);
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
      appendOperand(operands[1], args);
      return;
    }
  }

  // List operations
  appendOperand(operands[0], args);
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

function appendOperand(o, args) {
  if (o.type === "column") {
    appendSql(`t.${o.value}`, args);
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

