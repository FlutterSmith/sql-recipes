// Builds the site's console blocks as hast: the highlighted SQL block, the
// dialect block (tabs + SQL + result grid + engine strip) and the ledger
// strips. Pages and the Markdown pipeline share this, so every console on
// the site is drawn the same way.
import { createHighlighter } from 'shiki';

/** Syntax colours on the console (dark in both themes). Checked for AA on #14181F. */
const theme = {
  name: 'sr-console',
  type: 'dark',
  colors: { 'editor.background': '#00000000', 'editor.foreground': '#E6E9EF' },
  tokenColors: [
    { settings: { foreground: '#E6E9EF' } },
    { scope: ['comment', 'punctuation.definition.comment'], settings: { foreground: '#7D8798', fontStyle: 'italic' } },
    { scope: ['keyword', 'storage', 'storage.type', 'storage.modifier', 'keyword.other'], settings: { foreground: '#8FBCFF' } },
    { scope: ['keyword.operator', 'keyword.operator.star', 'keyword.operator.math', 'keyword.operator.comparison'], settings: { foreground: '#C9CFDA' } },
    { scope: ['support.function', 'entity.name.function'], settings: { foreground: '#F2D38A' } },
    { scope: ['string', 'string.quoted', 'punctuation.definition.string'], settings: { foreground: '#A8DCA0' } },
    { scope: ['constant.numeric'], settings: { foreground: '#FFB38A' } },
    { scope: ['constant.other.database-name', 'constant.other.table-name', 'punctuation.section'], settings: { foreground: '#E6E9EF' } },
  ],
};

let highlighterPromise;
function highlighter() {
  highlighterPromise ??= createHighlighter({ themes: [theme], langs: ['sql'] });
  return highlighterPromise;
}

export const el = (tagName, properties = {}, children = []) => ({ type: 'element', tagName, properties, children });
export const text = (value) => ({ type: 'text', value });
const hidden = (value) => el('span', { className: ['visually-hidden'] }, [text(value)]);

const COPY_ICON = el('svg', { viewBox: '0 0 16 16', ariaHidden: 'true' }, [
  el('rect', { x: 5, y: 5, width: 9, height: 9, rx: 1, fill: 'none', stroke: 'currentColor', strokeWidth: 1.4 }),
  el('path', { d: 'M3 11V3a1 1 0 0 1 1-1h7', fill: 'none', stroke: 'currentColor', strokeWidth: 1.4 }),
]);
const copyButton = (label = 'Copy') =>
  el('button', { type: 'button', className: ['copy'], dataCopy: '', ariaLabel: `${label} the SQL` }, [COPY_ICON, el('span', {}, [text(label)])]);

/** Highlights SQL into `.line` elements, one per source line. */
export async function highlightLines(code) {
  const hl = await highlighter();
  const root = hl.codeToHast(code.replace(/\n$/, ''), { lang: 'sql', theme: 'sr-console' });
  const pre = root.children.find((c) => c.type === 'element' && c.tagName === 'pre');
  const codeEl = pre.children.find((c) => c.type === 'element' && c.tagName === 'code');
  return codeEl.children.filter((c) => c.type === 'element');
}

async function sqlPre(code, label) {
  const lines = await highlightLines(code);
  return el('pre', { className: ['sql'], tabIndex: 0, ariaLabel: label }, [
    el('code', {}, lines.flatMap((l, i) => (i ? [text('\n'), l] : [l]))),
  ]);
}

/**
 * A plain console block with one SQL text and a copy button.
 * @param {{ code: string, label?: string, note?: string }} input
 */
export async function buildSql({ code, label = 'sql', note }) {
  const head = [el('span', { className: ['file'] }, [text(label)])];
  if (note) head.push(el('span', { className: ['scope'] }, [text(note)]));
  return el('figure', { className: ['console', 'console-sql'] }, [
    el('div', { className: ['console-head'], dataPagefindIgnore: '' }, [...head, el('span', { className: ['spacer'] }), copyButton()]),
    await sqlPre(code, `SQL: ${label}`),
  ]);
}

/* ---------- cells ---------- */

const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

/** JSON on one line with breathing space: {"id": 1, "name": "Ada"}. */
function jsonLine(value) {
  if (Array.isArray(value)) return `[${value.map(jsonLine).join(', ')}]`;
  if (isPlainObject(value)) return `{${Object.entries(value).map(([k, v]) => `${JSON.stringify(k)}: ${jsonLine(v)}`).join(', ')}}`;
  return JSON.stringify(value);
}

/** Compact JSON: an array of several objects gets one object per line. */
export function jsonCompact(value) {
  if (Array.isArray(value) && value.length > 1 && value.every((v) => typeof v === 'object' && v !== null)) {
    return `[\n${value.map((v) => `  ${jsonLine(v)}`).join(',\n')}\n]`;
  }
  return jsonLine(value);
}

/** The hast for one cell's content and the class that aligns it. */
export function cell(value) {
  if (value === null || value === undefined) return { className: ['null'], children: [el('i', {}, [text('NULL')])] };
  if (typeof value === 'number' || typeof value === 'bigint') return { className: ['n'], children: [text(String(value))] };
  if (typeof value === 'boolean') return { className: ['b'], children: [text(value ? 'true' : 'false')] };
  if (typeof value === 'object') return { className: ['json'], children: [el('code', {}, [text(jsonCompact(value))])] };
  return { className: [], children: [text(String(value))] };
}

/**
 * A result grid: a real table in monospace.
 * @param {Record<string, unknown>[]} rows
 * @param {{ caption?: string, columns?: string[] }} [options]
 */
export function buildGrid(rows, { caption = 'Result rows', columns } = {}) {
  const cols = columns ?? (rows.length ? Object.keys(rows[0]) : []);
  const numeric = cols.map((c) => rows.some((r) => typeof r[c] === 'number' || typeof r[c] === 'bigint'));
  const table = el('table', { className: ['grid'] }, [
    el('caption', { className: ['visually-hidden'] }, [text(caption)]),
    el('thead', {}, [el('tr', {}, cols.map((c, i) => el('th', { scope: 'col', className: numeric[i] ? ['n'] : [] }, [text(c)])))]),
    el(
      'tbody',
      {},
      rows.map((r) =>
        el(
          'tr',
          {},
          cols.map((c, i) => {
            const { className, children } = cell(r[c]);
            if (numeric[i] && !className.includes('n') && !className.includes('null')) className.push('n');
            return el('td', { className }, children);
          }),
        ),
      ),
    ),
  ]);
  const count = el('p', { className: ['rowcount'] }, [text(`(${rows.length} row${rows.length === 1 ? '' : 's'})`)]);
  return el('div', { className: ['grid-wrap'] }, [el('div', { className: ['grid-scroll'] }, [table]), count]);
}

/* ---------- engines ---------- */

/** What one engine's tick says about a recipe. */
export function engineState(recipe, d) {
  const query = recipe.queries[d];
  const outcome = recipe.results[d];
  if (recipe.unsupported[d] || outcome?.status === 'unsupported') return { kind: 'unsupported', reason: recipe.unsupported[d] ?? outcome?.detail ?? '' };
  if (!query) return { kind: 'none', reason: '' };
  if (outcome?.status === 'pass') return { kind: query.variant ? 'variant' : 'pass', reason: '' };
  if (outcome && outcome.status !== 'pass') return { kind: 'fail', reason: outcome.detail };
  return { kind: 'unknown', reason: 'not run on this machine' };
}

const MARKS = { pass: '✓', variant: '✓', unsupported: '–', fail: '✗', unknown: '·', none: '·' };

/** "passes on PostgreSQL 16.13 (with its own variant)" */
export function engineTitle(state, label, version) {
  const engine = `${label} ${version}`;
  switch (state.kind) {
    case 'pass':
      return `passes on ${engine}`;
    case 'variant':
      return `passes on ${engine}, with a ${label} variant of the query`;
    case 'unsupported':
      return `not supported on ${label}: ${state.reason}`;
    case 'fail':
      return `fails on ${engine}: ${state.reason}`;
    default:
      return `not run on ${label}`;
  }
}

/**
 * The engine strip above a result grid: name, version and tick per engine.
 * @param {object} recipe
 * @param {{ dialects: string[], labels: Record<string,string>, versions: Record<string,string> }} meta
 */
export function buildEngineStrip(recipe, { dialects, labels, versions }) {
  return el(
    'ul',
    { className: ['engines'], ariaLabel: 'Checked on' },
    dialects.map((d) => {
      const state = engineState(recipe, d);
      const title = engineTitle(state, labels[d], versions[d]);
      return el('li', { className: ['eng', state.kind], title, dataDialect: d }, [
        el('span', { className: ['eng-name'] }, [text(labels[d])]),
        el('span', { className: ['eng-ver'] }, [text(versions[d])]),
        el('span', { className: ['mark'], ariaHidden: 'true' }, [text(MARKS[state.kind])]),
        hidden(`, ${title}`),
      ]);
    }),
  );
}

/** The four marks at the end of a ledger row. */
export function buildStrip(recipe, { dialects, labels, versions }) {
  const states = dialects.map((d) => engineState(recipe, d));
  const summary = dialects.map((d, i) => engineTitle(states[i], labels[d], versions[d])).join('; ');
  return el('span', { className: ['strip'], role: 'img', ariaLabel: summary }, [
    ...dialects.map((d, i) =>
      el('i', { className: ['m', states[i].kind], title: `${labels[d]}: ${engineTitle(states[i], labels[d], versions[d])}` }, [text(MARKS[states[i].kind])]),
    ),
  ]);
}

/* ---------- the dialect block ---------- */

/**
 * The hero component: four tabs, the SQL for each dialect, and the result
 * grid with the engine strip above it.
 * @param {object} recipe
 * @param {{ dialects: string[], labels: Record<string,string>, versions: Record<string,string>, id?: string, result?: boolean }} options
 */
export async function buildDialectBlock(recipe, { dialects, labels, versions, id = 'dialect', result = true }) {
  const shared = dialects.filter((d) => recipe.queries[d] && !recipe.queries[d].variant);
  const first = dialects.find((d) => recipe.queries[d]) ?? dialects[0];
  const scopeOf = (d) => {
    const q = recipe.queries[d];
    if (!q) return 'not supported';
    if (q.variant) return `${labels[d]} only · ${q.file}`;
    return `standard SQL · ${shared.length} engine${shared.length === 1 ? '' : 's'}`;
  };

  const tabs = dialects.map((d) => {
    const q = recipe.queries[d];
    const state = engineState(recipe, d);
    const selected = d === first;
    const children = [text(labels[d])];
    if (q?.variant) children.push(el('span', { className: ['dot'], ariaHidden: 'true' }), hidden(' (own variant)'));
    if (!q) children.push(hidden(' (not supported)'));
    return el(
      'button',
      {
        type: 'button',
        role: 'tab',
        id: `${id}-tab-${d}`,
        className: ['tab', ...(q ? (q.variant ? ['variant'] : []) : ['unsupported'])],
        ariaSelected: selected ? 'true' : 'false',
        ariaControls: `${id}-panel-${d}`,
        tabIndex: selected ? 0 : -1,
        dataDialect: d,
        title: state.kind === 'unsupported' ? state.reason : undefined,
      },
      children,
    );
  });

  const panels = await Promise.all(
    dialects.map(async (d) => {
      const q = recipe.queries[d];
      const props = {
        role: 'tabpanel',
        id: `${id}-panel-${d}`,
        ariaLabelledby: `${id}-tab-${d}`,
        dataPanel: d,
        dataScope: scopeOf(d),
        hidden: d === first ? undefined : true,
        tabIndex: -1,
      };
      if (!q) {
        const reason = recipe.unsupported[d] ?? recipe.results[d]?.detail ?? 'No query for this engine.';
        return el('div', { ...props, className: ['panel', 'unsupported'] }, [
          el('p', { className: ['reason'] }, [
            el('span', { className: ['reason-k'] }, [text('ERROR:  ')]),
            text(`${labels[d]} can't run this recipe. `),
            el('span', { className: ['reason-t'] }, [text(reason)]),
          ]),
        ]);
      }
      return el('div', { ...props, className: ['panel'] }, [await sqlPre(q.sql, `${labels[d]} query`)]);
    }),
  );

  const children = [
    el('div', { className: ['console-head', 'tabs-head'], dataPagefindIgnore: '' }, [
      el('div', { className: ['tabs'], role: 'tablist', ariaLabel: 'Dialect' }, tabs),
      el('span', { className: ['spacer'] }),
      el('span', { className: ['scope'], dataScope: '' }, [text(scopeOf(first))]),
      copyButton(),
    ]),
    el('div', { className: ['panels'] }, panels),
  ];
  if (result) {
    children.push(
      el('div', { className: ['result'] }, [
        el('div', { className: ['result-head'] }, [
          el('span', { className: ['result-label'] }, [text(recipe.ordered ? 'Result, in this order' : 'Result, in any order')]),
          buildEngineStrip(recipe, { dialects, labels, versions }),
        ]),
        buildGrid(recipe.expected, { caption: `Rows every engine returns for ${recipe.title}` }),
      ]),
    );
  }
  return el('figure', { className: ['console', 'dialect'], dataDialectBlock: '', dataFirst: first }, children);
}
