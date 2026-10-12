// Runs SQLite (sql.js) or PostgreSQL (PGlite) off the main thread, so a slow
// query can be stopped without freezing the page. Loaded only when someone
// clicks "Run in your browser". Each run starts from an empty database.
let engine = null;

async function initSqlite(cdn) {
  // sql-wasm.js is a classic script; evaluate it with a CommonJS-shaped scope
  // so it hands back initSqlJs, then point it at the wasm next to it.
  const source = await fetch(`${cdn}sql-wasm.js`).then((r) => {
    if (!r.ok) throw new Error(`sql-wasm.js: HTTP ${r.status}`);
    return r.text();
  });
  const module = { exports: {} };
  new Function('module', 'exports', source)(module, module.exports);
  const SQL = await module.exports({ locateFile: (file) => `${cdn}${file}` });
  const probe = new SQL.Database();
  const version = probe.exec('select sqlite_version()')[0].values[0][0];
  probe.close();
  return {
    version,
    run(statements) {
      const db = new SQL.Database();
      try {
        let columns = [];
        let rows = [];
        for (const sql of statements) {
          const stmt = db.prepare(sql);
          try {
            columns = stmt.getColumnNames();
            rows = [];
            while (stmt.step()) rows.push(stmt.get());
          } finally {
            stmt.free();
          }
        }
        return { columns, rows };
      } finally {
        db.close();
      }
    },
  };
}

async function initPostgres(url) {
  const { PGlite } = await import(url);
  // Dates, timestamps and numerics come back as text, the way psql prints
  // them, so the comparison with expected.json sees the same strings CI did.
  const raw = (v) => v;
  const pg = new PGlite({
    parsers: { 1082: raw, 1114: raw, 1184: raw, 1186: raw, 1700: Number, 20: Number, 114: JSON.parse, 3802: JSON.parse },
  });
  await pg.waitReady;
  const text = (await pg.query('select version()')).rows[0].version;
  const version = text.match(/PostgreSQL (\d+(?:\.\d+)?)/)?.[1] ?? text;
  return {
    version,
    async run(statements) {
      await pg.exec('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
      let columns = [];
      let rows = [];
      for (const sql of statements) {
        const res = await pg.query(sql, [], { rowMode: 'array' });
        columns = (res.fields ?? []).map((f) => f.name);
        rows = res.rows ?? [];
      }
      return { columns, rows };
    },
  };
}

self.onmessage = async ({ data }) => {
  if (data.type === 'init') {
    try {
      engine = data.engine === 'sqlite' ? await initSqlite(data.url) : await initPostgres(data.url);
      self.postMessage({ type: 'ready', version: engine.version });
    } catch (err) {
      self.postMessage({ type: 'failed', message: String(err?.message ?? err) });
    }
    return;
  }
  if (data.type === 'run') {
    try {
      const { columns, rows } = await engine.run(data.statements);
      self.postMessage({ type: 'result', id: data.id, columns, rows: rows.map((r) => r.map(plain)) });
    } catch (err) {
      self.postMessage({ type: 'result', id: data.id, columns: [], rows: [], error: String(err?.message ?? err) });
    }
  }
};

/** Values the main thread can receive: no BigInt, no Date objects, no typed arrays. */
function plain(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'bigint') return Number(value);
  if (value instanceof Date) return value.toISOString();
  if (value instanceof Uint8Array) return new TextDecoder().decode(value);
  if (Array.isArray(value)) return value.map(plain);
  if (typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, plain(v)]));
  return value;
}
