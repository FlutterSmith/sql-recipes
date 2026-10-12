// Reads the fixture SQL (CREATE TABLE + INSERT ... VALUES) into tables with
// rows, so the fixtures page can draw them as grids.

/** Splits a VALUES list `(1, 'a', NULL), (2, 'b', 3.5)` into rows of cells. */
function parseTuples(text) {
  const rows = [];
  let row = null;
  let i = 0;
  const n = text.length;
  while (i < n) {
    const ch = text[i];
    if (ch === '(') {
      row = [];
      i++;
      continue;
    }
    if (ch === ')') {
      if (row) rows.push(row);
      row = null;
      i++;
      continue;
    }
    if (!row || /[\s,]/.test(ch)) {
      i++;
      continue;
    }
    if (ch === "'") {
      let j = i + 1;
      let out = '';
      while (j < n) {
        if (text[j] === "'" && text[j + 1] === "'") {
          out += "'";
          j += 2;
        } else if (text[j] === "'") break;
        else out += text[j++];
      }
      row.push(out);
      i = j + 1;
      continue;
    }
    let j = i;
    while (j < n && !/[\s,)]/.test(text[j])) j++;
    const token = text.slice(i, j);
    if (/^null$/i.test(token)) row.push(null);
    else if (/^-?\d+(\.\d+)?$/.test(token)) row.push(Number(token));
    else row.push(token);
    i = j;
  }
  return rows;
}

/**
 * @param {string} sql
 * @returns {{ name: string, columns: string[], rows: (string | number | null)[][] }[]}
 */
export function parseFixture(sql) {
  const tables = [];
  const re = /INSERT\s+INTO\s+(\w+)\s*\(([^)]*)\)\s*VALUES\s*([\s\S]*?);/gi;
  for (const m of sql.matchAll(re)) {
    tables.push({
      name: m[1],
      columns: m[2].split(',').map((c) => c.trim()),
      rows: parseTuples(m[3]),
    });
  }
  return tables;
}

/** "4 customers, 6 products, 8 orders" from a parsed fixture. */
export function fixtureCounts(tables) {
  return tables.map((t) => `${t.rows.length} ${t.name.replace(/_/g, ' ')}`).join(', ');
}
