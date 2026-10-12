// The Run panel: loads a real engine compiled to WebAssembly, runs the
// recipe's setup and query on it, and compares the rows with expected.json.
// SQLite (sql.js) and PostgreSQL (PGlite) run in ./run-worker.js; DuckDB runs
// in the worker that duckdb-wasm brings along. This file is a separate chunk,
// fetched only when someone clicks "Run in your browser".
import { activeDialect, selectDialect } from './app';

type Cell = null | number | string | boolean | Cell[] | { [key: string]: Cell };
type Row = Record<string, Cell>;

interface RunData {
  slug: string;
  ordered: boolean;
  expected: Row[];
  setup: Record<string, string>;
  queries: Record<string, string>;
  files: Record<string, string>;
  unsupported: Record<string, string>;
  versions: Record<string, string>;
  labels: Record<string, string>;
}

interface Result {
  columns: string[];
  rows: Cell[][];
  error?: string;
}

interface Engine {
  version: string;
  run: (statements: string[]) => Promise<Result>;
  stop: () => void;
}

const $ = <T extends HTMLElement = HTMLElement>(s: string) => document.querySelector<T>(s);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const base = document.documentElement.dataset.base ?? '/';
const TIMEOUT_MS = 10_000;

const CDN = {
  sqlite: 'https://cdn.jsdelivr.net/npm/sql.js@1.14.0/dist/',
  postgres: 'https://cdn.jsdelivr.net/npm/@electric-sql/pglite@0.5.9/dist/index.js',
  duckdb: 'https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@1.32.0/+esm',
};
const SIZES: Record<string, string> = { sqlite: '1 MB', postgres: '17 MB', duckdb: '35 MB' };
const LIBS: Record<string, string> = { sqlite: 'sql.js', postgres: 'PGlite', duckdb: 'duckdb-wasm' };
const RUNNABLE = ['sqlite', 'postgres', 'duckdb'];

const data: RunData = JSON.parse($('#run-data')?.textContent ?? '{}');
const engines: Partial<Record<string, Promise<Engine>>> = {};
let current = '';
let wired = false;
let latest = 0;

const el = {
  runner: () => $('#runner')!,
  sql: () => $<HTMLTextAreaElement>('#run-sql')!,
  note: () => $('#run-sql-note')!,
  out: () => $('#run-out')!,
  status: () => $('#run-status')!,
  progress: () => $('#run-progress')!,
  go: () => $<HTMLButtonElement>('#run-go')!,
  buttons: () => [...document.querySelectorAll<HTMLButtonElement>('.run-eng')],
};

function progress(text: string, state: '' | 'ready' | 'error' = '') {
  const p = el.progress();
  p.textContent = text;
  p.className = `run-progress ${state}`.trim();
}

function status(text: string, state: '' | 'pass' | 'fail' = '') {
  const s = el.status();
  s.textContent = text;
  s.className = `run-status ${state}`.trim();
}

/* ---------- SQL text ---------- */

/** Splits on semicolons outside quotes and comments; drops empty statements. The same rule as tools/cook/sql.py. */
export function splitStatements(sql: string): string[] {
  const out: string[] = [];
  let buf = '';
  let i = 0;
  const n = sql.length;
  while (i < n) {
    const ch = sql[i];
    const two = sql.slice(i, i + 2);
    if (two === '--') {
      let end = sql.indexOf('\n', i);
      if (end === -1) end = n;
      buf += sql.slice(i, end);
      i = end;
      continue;
    }
    if (two === '/*') {
      let end = sql.indexOf('*/', i + 2);
      end = end === -1 ? n : end + 2;
      buf += sql.slice(i, end);
      i = end;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') {
      let end = i + 1;
      while (end < n) {
        if (sql[end] === ch) {
          if (ch === "'" && sql.slice(end, end + 2) === "''") {
            end += 2;
            continue;
          }
          break;
        }
        end++;
      }
      buf += sql.slice(i, end + 1);
      i = end + 1;
      continue;
    }
    if (ch === ';') {
      out.push(buf);
      buf = '';
      i++;
      continue;
    }
    buf += ch;
    i++;
  }
  out.push(buf);
  const stripComments = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/--[^\n]*/g, '');
  return out.filter((s) => stripComments(s).trim()).map((s) => s.trim());
}

/* ---------- normalisation, the same rules as cook.engines.normalize ---------- */

const TS = /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}(:?\d{2})?)?$/;

export function normalize(value: unknown): Cell {
  if (value === null || value === undefined) return null;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'bigint') return Number(value);
  if (typeof value === 'number') {
    const r = Math.round(value * 1e6) / 1e6;
    return Object.is(r, -0) ? 0 : r;
  }
  if (value instanceof Date) {
    const iso = value.toISOString();
    return iso.endsWith('T00:00:00.000Z') ? iso.slice(0, 10) : iso.slice(0, 19).replace('T', ' ');
  }
  if (value instanceof Uint8Array) return new TextDecoder().decode(value);
  if (Array.isArray(value)) return value.map(normalize);
  if (typeof value === 'object') {
    const out: Record<string, Cell> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) out[k] = normalize(v);
    return out;
  }
  if (typeof value === 'string') {
    const first = value[0];
    const last = value[value.length - 1];
    if ((first === '[' && last === ']') || (first === '{' && last === '}')) {
      try {
        return normalize(JSON.parse(value));
      } catch {
        return value;
      }
    }
    if (TS.test(value)) return value.replace('T', ' ').slice(0, 19);
    return value;
  }
  return String(value);
}

function same(a: Cell, b: Cell): boolean {
  if (typeof a === 'number' && typeof b === 'number') return Math.abs(a - b) <= 1e-6 * Math.max(1, Math.abs(a), Math.abs(b));
  if (typeof a === 'number' && typeof b === 'string' && b.trim() !== '' && !Number.isNaN(Number(b))) return same(a, Number(b));
  if (typeof b === 'number' && typeof a === 'string') return same(b, a);
  if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((v, i) => same(v, b[i]));
  if (a && b && typeof a === 'object' && typeof b === 'object' && !Array.isArray(a) && !Array.isArray(b)) {
    const ka = Object.keys(a).sort();
    const kb = Object.keys(b).sort();
    return ka.length === kb.length && ka.every((k, i) => k === kb[i] && same(a[k], b[k]));
  }
  return a === b;
}

const key = (row: Row) => JSON.stringify(Object.keys(row).sort().map((k) => [k, row[k]]));

function toRows(result: Result): Row[] {
  return result.rows.map((r) => {
    const row: Row = {};
    result.columns.forEach((c, i) => (row[c.toLowerCase()] = normalize(r[i])));
    return row;
  });
}

/** An empty string when the rows match; otherwise what differs. */
export function diff(expected: Row[], got: Row[], ordered: boolean): string {
  let want = expected.map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k.toLowerCase(), normalize(v)])) as Row);
  if (!ordered) {
    want = [...want].sort((a, b) => key(a).localeCompare(key(b)));
    got = [...got].sort((a, b) => key(a).localeCompare(key(b)));
  }
  const rowSame = (w: Row, g: Row) => same(w, g);
  if (want.length === got.length && want.every((w, i) => rowSame(w, got[i]))) return '';
  const lines = [`expected ${want.length} row${want.length === 1 ? '' : 's'}, got ${got.length}`];
  for (let i = 0; i < Math.min(want.length, got.length); i++) {
    if (!rowSame(want[i], got[i])) {
      lines.push(`row ${i}: expected ${JSON.stringify(want[i])}`, `row ${i}:      got ${JSON.stringify(got[i])}`);
      break;
    }
  }
  if (want.length !== got.length) {
    const extra = got.length > want.length ? got.slice(want.length) : want.slice(got.length);
    lines.push(`unmatched: ${JSON.stringify(extra[0])}`);
  }
  return lines.join('\n');
}

/* ---------- engines ---------- */

function startWorker(kind: 'sqlite' | 'postgres'): Promise<Engine> {
  return new Promise<Engine>((resolve, reject) => {
    const w = new Worker(`${base}run-worker.js`, { type: 'module' });
    let seq = 0;
    const fail = (message: string) => {
      w.terminate();
      reject(new Error(message));
    };
    w.addEventListener('error', (e) => fail(e.message || `The ${LIBS[kind]} worker failed to start.`), { once: true });
    const onReady = ({ data }: MessageEvent) => {
      if (data.type === 'failed') {
        w.removeEventListener('message', onReady);
        fail(data.message);
        return;
      }
      if (data.type !== 'ready') return;
      w.removeEventListener('message', onReady);
      resolve({
        version: data.version ?? '',
        stop: () => w.terminate(),
        run: (statements) =>
          new Promise<Result>((done) => {
            const id = ++seq;
            const onResult = ({ data }: MessageEvent) => {
              if (data.type !== 'result' || data.id !== id) return;
              w.removeEventListener('message', onResult);
              done(data as Result);
            };
            w.addEventListener('message', onResult);
            w.postMessage({ type: 'run', id, statements });
          }),
      });
    };
    w.addEventListener('message', onReady);
    w.postMessage({ type: 'init', engine: kind, url: CDN[kind] });
  });
}

/* DuckDB: duckdb-wasm runs in its own worker; the main thread only talks to it. */
interface ArrowField {
  name: string;
  type: { typeId: number; scale?: number; unit?: number; toString(): string };
}
interface ArrowTable {
  schema: { fields: ArrowField[] };
  numRows: number;
  getChildAt(i: number): { get(j: number): unknown } | null;
}

const ARROW = { Date: 8, Timestamp: 10, Decimal: 7 };

function fromArrow(value: unknown, field: ArrowField): unknown {
  if (value === null || value === undefined) return null;
  const type = field.type;
  if (type.typeId === ARROW.Decimal && value instanceof Uint32Array) {
    let big = 0n;
    for (let i = value.length - 1; i >= 0; i--) big = (big << 32n) | BigInt(value[i]);
    if (big >= 1n << BigInt(value.length * 32 - 1)) big -= 1n << BigInt(value.length * 32);
    return Number(big) / 10 ** (type.scale ?? 0);
  }
  if (type.typeId === ARROW.Date) {
    const ms = value instanceof Date ? value.getTime() : Number(value);
    return new Date(ms).toISOString().slice(0, 10);
  }
  if (type.typeId === ARROW.Timestamp) {
    const ms = value instanceof Date ? value.getTime() : Number(value);
    return new Date(ms).toISOString().slice(0, 19).replace('T', ' ');
  }
  if (typeof value === 'bigint') return Number(value);
  if (typeof value === 'object' && value !== null && typeof (value as { toArray?: unknown }).toArray === 'function') {
    return [...(value as { toArray(): unknown[] }).toArray()].map((v) => fromArrow(v, { name: '', type: { typeId: 0, toString: () => '' } }));
  }
  if (typeof value === 'object' && value !== null && typeof (value as { toJSON?: unknown }).toJSON === 'function') {
    return (value as { toJSON(): unknown }).toJSON();
  }
  return value;
}

async function startDuckDB(): Promise<Engine> {
  const duckdb = await import(/* @vite-ignore */ CDN.duckdb);
  const bundle = await duckdb.selectBundle(duckdb.getJsDelivrBundles());
  const workerUrl = URL.createObjectURL(new Blob([`importScripts("${bundle.mainWorker}");`], { type: 'text/javascript' }));
  const worker = new Worker(workerUrl);
  const db = new duckdb.AsyncDuckDB(new duckdb.VoidLogger(), worker);
  await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
  URL.revokeObjectURL(workerUrl);
  const version = String(await db.getVersion()).replace(/^v/, '');
  return {
    version,
    stop: () => {
      void db.terminate();
      worker.terminate();
    },
    run: async (statements) => {
      const conn = await db.connect();
      try {
        // A fresh catalog for every run.
        const existing = (await conn.query("SELECT table_name AS t, table_type AS k FROM information_schema.tables WHERE table_schema = 'main'")) as ArrowTable;
        const names = existing.getChildAt(0);
        const kinds = existing.getChildAt(1);
        for (let i = 0; i < existing.numRows; i++) {
          const kind = String(kinds?.get(i)).toUpperCase().includes('VIEW') ? 'VIEW' : 'TABLE';
          await conn.query(`DROP ${kind} IF EXISTS "${String(names?.get(i)).replace(/"/g, '""')}" CASCADE`);
        }
        // duckdb-wasm fetches the json extension from extensions.duckdb.org on
        // first use; load it up front so a blocked download reads as what it is.
        if (statements.some((s) => /\bjson/i.test(s))) await conn.query('LOAD json');
        let last: ArrowTable | null = null;
        for (const s of statements) last = (await conn.query(s)) as ArrowTable;
        if (!last) return { columns: [], rows: [] };
        const fields = last.schema.fields;
        const vectors = fields.map((_, i) => last!.getChildAt(i));
        const rows: Cell[][] = [];
        for (let r = 0; r < last.numRows; r++) rows.push(fields.map((f, i) => fromArrow(vectors[i]?.get(r), f) as Cell));
        return { columns: fields.map((f) => f.name), rows };
      } catch (err) {
        let message = String((err as Error)?.message ?? err);
        if (/extensions\.duckdb\.org/.test(message)) message += '\n\nDuckDB keeps JSON support in an extension that it downloads on first use (about 1 MB from extensions.duckdb.org). That download was blocked here.';
        return { columns: [], rows: [], error: message };
      } finally {
        await conn.close();
      }
    },
  };
}

function engineFor(kind: string): Promise<Engine> {
  engines[kind] ??= (kind === 'duckdb' ? startDuckDB() : startWorker(kind as 'sqlite' | 'postgres')).catch((err: Error) => {
    delete engines[kind];
    throw err;
  });
  return engines[kind]!;
}

function dropEngine(kind: string) {
  void engines[kind]?.then((e) => e.stop()).catch(() => {});
  delete engines[kind];
}

/* ---------- rendering ---------- */

const node = (tag: string, cls?: string, text?: string) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
};

const isObj = (v: Cell): v is { [key: string]: Cell } => v !== null && typeof v === 'object' && !Array.isArray(v);
function jsonLine(v: Cell): string {
  if (Array.isArray(v)) return `[${v.map(jsonLine).join(', ')}]`;
  if (isObj(v)) return `{${Object.entries(v).map(([k, x]) => `${JSON.stringify(k)}: ${jsonLine(x)}`).join(', ')}}`;
  return JSON.stringify(v);
}
function jsonCompact(v: Cell): string {
  if (Array.isArray(v) && v.length > 1 && v.every((x) => typeof x === 'object' && x !== null)) return `[\n${v.map((x) => `  ${jsonLine(x)}`).join(',\n')}\n]`;
  return jsonLine(v);
}

function grid(columns: string[], rows: Cell[][]): HTMLElement {
  const wrap = node('div', 'grid-wrap live');
  const scroll = node('div', 'grid-scroll');
  const table = node('table', 'grid');
  const caption = node('caption', 'visually-hidden', 'Rows from the engine in your browser');
  const thead = node('thead');
  const tr = node('tr');
  const numeric = columns.map((_, i) => rows.some((r) => typeof r[i] === 'number'));
  columns.forEach((c, i) => {
    const th = node('th', numeric[i] ? 'n' : '', c);
    th.scope = 'col';
    tr.append(th);
  });
  thead.append(tr);
  const tbody = node('tbody');
  for (const r of rows) {
    const line = node('tr');
    columns.forEach((_, i) => {
      const v = r[i];
      let td: HTMLElement;
      if (v === null || v === undefined) {
        td = node('td', 'null');
        td.append(node('i', '', 'NULL'));
      } else if (typeof v === 'number') td = node('td', 'n', String(v));
      else if (typeof v === 'boolean') td = node('td', 'b', v ? 'true' : 'false');
      else if (typeof v === 'object') {
        td = node('td', 'json');
        td.append(node('code', '', jsonCompact(v)));
      } else td = node('td', numeric[i] ? 'n' : '', String(v));
      line.append(td);
    });
    tbody.append(line);
  }
  table.append(caption, thead, tbody);
  scroll.append(table);
  wrap.append(scroll, node('p', 'rowcount', `(${rows.length} row${rows.length === 1 ? '' : 's'})`));
  return wrap;
}

function showError(message: string) {
  const pre = node('pre', 'err');
  pre.textContent = message.replace(/\n$/, '');
  el.out().replaceChildren(pre);
}

/* ---------- running ---------- */

async function run() {
  const kind = current;
  if (!RUNNABLE.includes(kind) || data.unsupported[kind]) return;
  const mine = ++latest;
  const label = data.labels[kind];
  let engine: Engine;
  const fresh = !engines[kind];
  try {
    if (fresh) {
      progress(`Loading ${label} in your browser: ${LIBS[kind]}, about ${SIZES[kind]}, cached after the first time…`);
      el.go().disabled = true;
    }
    engine = await engineFor(kind);
  } catch (err) {
    progress(`Couldn't load ${label}: ${(err as Error).message}. Check your connection and try again.`, 'error');
    el.go().disabled = false;
    return;
  }
  if (mine !== latest || current !== kind) return;
  progress(`${label} ${engine.version} is running in this page. Edit the query and run it again; the setup runs first every time.`, 'ready');
  el.go().disabled = false;
  status('Running…');
  const statements = [...splitStatements(data.setup[kind] ?? ''), ...splitStatements(el.sql().value)];
  const timer = new Promise<Result>((resolve) =>
    setTimeout(() => resolve({ columns: [], rows: [], error: `Stopped after ${TIMEOUT_MS / 1000} seconds. The engine was shut down; the next run starts a fresh one.` }), TIMEOUT_MS),
  );
  const result = await Promise.race([engine.run(statements), timer]);
  if (mine !== latest) return;
  if (result.error?.startsWith('Stopped after')) dropEngine(kind);
  if (result.error) {
    showError(result.error);
    status(`${label} returned an error.`, 'fail');
    return;
  }
  const rows = toRows(result);
  const problem = diff(data.expected, rows, data.ordered);
  const out = el.out();
  const verdict = node('p', `verdict ${problem ? 'fail' : 'pass'}`);
  if (problem) {
    verdict.append(`✗ differs from the expected rows`, node('span', 'd', `\n${problem}`));
  } else {
    verdict.append(`✓ matches the expected rows${data.ordered ? ', in order' : ''} on ${label} ${engine.version}`);
  }
  out.replaceChildren(verdict, grid(result.columns, result.rows.map((r) => r.map(normalize))));
  status(problem ? `${rows.length} rows from ${label} ${engine.version}; they differ from the expected rows.` : `${rows.length} rows from ${label} ${engine.version}; they match the expected rows.`, problem ? 'fail' : 'pass');
}

function selectEngine(kind: string, { fromTab = false } = {}) {
  current = kind;
  for (const b of el.buttons()) b.setAttribute('aria-pressed', b.dataset.engine === kind ? 'true' : 'false');
  const sql = el.sql();
  const query = data.queries[kind];
  const edited = sql.value !== sql.defaultValue;
  if (query !== undefined && (!edited || fromTab)) {
    sql.value = query;
    sql.defaultValue = query;
  }
  el.note().textContent = data.files[kind] ? `· ${data.files[kind]}` : '';
  el.out().replaceChildren();
  status('');
  if (kind === 'mysql') {
    progress($('#run-mysql')?.textContent ?? 'MySQL runs in CI only.', 'error');
    el.go().disabled = true;
    return;
  }
  if (data.unsupported[kind]) {
    progress(`${data.labels[kind]} can't run this recipe: ${data.unsupported[kind]}`, 'error');
    el.go().disabled = true;
    sql.value = `-- ${data.labels[kind]}: ${data.unsupported[kind]}`;
    return;
  }
  el.go().disabled = false;
  void run();
}

function reset() {
  const sql = el.sql();
  sql.value = data.queries[current] ?? sql.defaultValue;
  status('Reset to the recipe’s query.');
  void run();
}

/** Tab indents; Escape then Tab leaves the editor, so the keyboard is never trapped. */
function editorKeys(area: HTMLTextAreaElement) {
  let escaped = false;
  area.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      void run();
      return;
    }
    if (e.key === 'Escape') {
      escaped = true;
      return;
    }
    if (e.key === 'Tab' && !escaped && !e.shiftKey && !e.altKey && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      const { selectionStart: s, selectionEnd: end, value } = area;
      area.value = value.slice(0, s) + '    ' + value.slice(end);
      area.selectionStart = area.selectionEnd = s + 4;
    }
    escaped = false;
  });
}

function pickEngine(): string {
  const block = $('main [data-dialect-block]');
  const active = block ? activeDialect(block) : '';
  if (RUNNABLE.includes(active) && data.queries[active] && !data.unsupported[active]) return active;
  return RUNNABLE.find((k) => data.queries[k] && !data.unsupported[k]) ?? 'sqlite';
}

export function openRunner() {
  const runner = el.runner();
  const button = $('#run-btn');
  if (!wired) {
    wired = true;
    const mac = /Mac|iPhone|iPad/.test(navigator.platform);
    runner.querySelectorAll('kbd.mod').forEach((k) => (k.textContent = mac ? '⌘' : 'Ctrl'));
    el.go().addEventListener('click', () => void run());
    $('#run-reset')?.addEventListener('click', reset);
    editorKeys(el.sql());
    for (const b of el.buttons()) {
      b.disabled = false;
      b.addEventListener('click', () => {
        selectEngine(b.dataset.engine!);
        const block = $('main [data-dialect-block]');
        if (block && activeDialect(block) !== b.dataset.engine) selectDialect(block, b.dataset.engine!);
      });
    }
    document.addEventListener('dialect', (e) => {
      const d = (e as CustomEvent<string>).detail;
      if (!runner.hidden && d !== current) selectEngine(d, { fromTab: true });
    });
    selectEngine(pickEngine());
  }
  if (runner.hidden) {
    runner.hidden = false;
    button?.setAttribute('aria-expanded', 'true');
    runner.scrollIntoView({ block: 'nearest', behavior: reduced ? 'auto' : 'smooth' });
  }
  el.sql().focus({ preventScroll: true });
}
