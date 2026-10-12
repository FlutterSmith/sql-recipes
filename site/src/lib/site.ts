import meta from '../generated/meta.json';

export type Dialect = 'sqlite' | 'postgres' | 'mysql' | 'duckdb';
export type Cell = null | number | string | boolean | Cell[] | { [key: string]: Cell };
export type Row = Record<string, Cell>;

export interface Query {
  sql: string;
  variant: boolean;
  file: string;
}

export interface Outcome {
  status: 'pass' | 'fail' | 'error' | 'unsupported' | string;
  detail: string;
}

export interface Recipe {
  slug: string;
  title: string;
  summary: string;
  category: string;
  tags: string[];
  fixture: string | null;
  ordered: boolean;
  published: string;
  setup: Record<Dialect, string>;
  queries: Partial<Record<Dialect, Query>>;
  unsupported: Partial<Record<Dialect, string>>;
  expected: Row[];
  results: Partial<Record<Dialect, Outcome>>;
  related: string[];
  previous: string | null;
  next: string | null;
}

export interface Category {
  id: string;
  label: string;
  blurb: string;
  count: number;
}

export const site = {
  name: 'fluttersmith/sql-recipes',
  repo: 'https://github.com/FlutterSmith/sql-recipes',
  matrixMd: 'https://github.com/FlutterSmith/sql-recipes/blob/main/MATRIX.md',
  author: 'Ahmed Hamdy',
  version: meta.version as string,
  verifiedAt: meta.verifiedAt as string,
};

export const dialects = meta.dialects as Dialect[];
export const labels = meta.labels as Record<Dialect, string>;
export const versions = meta.versions as Record<Dialect, string>;
export const fixtures = meta.fixtures as Record<string, string>;
export const tags = meta.tags as Record<string, string>;
// YAML reads the tag `null` as a real null; the tag's name is "null".
export const recipes = (meta.recipes as Recipe[]).map((r) => ({ ...r, tags: r.tags.map((t) => (t === null ? 'null' : String(t))) }));
export const categories = (meta.categories as Category[]).filter((c) => c.count > 0);

const bySlug = new Map(recipes.map((r) => [r.slug, r]));
export const recipe = (slug: string) => bySlug.get(slug);
export const category = (id: string) => categories.find((c) => c.id === id);
export const categoryLabel = (id: string) => category(id)?.label ?? id;
export const inCategory = (id: string) => recipes.filter((r) => r.category === id);

/** "SQLite 3.45.1" */
export const engine = (d: Dialect) => `${labels[d]} ${versions[d]}`;
/** "3.45" for the short strips. */
export const shortVersion = (d: Dialect) => versions[d].split('.').slice(0, 2).join('.');

/** Which browser engine, if any, can run a dialect. */
export const browserEngines: Record<Dialect, { lib: string; size: string } | null> = {
  sqlite: { lib: 'sql.js', size: '1 MB' },
  postgres: { lib: 'PGlite', size: '17 MB' },
  mysql: null,
  duckdb: { lib: 'duckdb-wasm', size: '35 MB' },
};

/** Dialects a recipe has a query for, in catalog order. */
export const supported = (r: Recipe) => dialects.filter((d) => r.queries[d]);
/** The dialects that share the standard query (not a variant, not unsupported). */
export const sharedOn = (r: Recipe) => dialects.filter((d) => r.queries[d] && !r.queries[d]!.variant);

/** Joins a path onto the configured base, keeping the trailing slash style. */
export function url(path = ''): string {
  const base = import.meta.env.BASE_URL.replace(/\/?$/, '/');
  return base + path.replace(/^\//, '');
}

export const recipeUrl = (slug: string) => url(`r/${slug}/`);

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Renders the inline Markdown used in meta strings: `code` and *emphasis*. */
export function md(source: string | null | undefined): string {
  if (!source) return '';
  return source
    .split(/(`[^`]+`)/)
    .map((part) => {
      if (part.startsWith('`') && part.endsWith('`') && part.length > 1) return `<code>${esc(part.slice(1, -1))}</code>`;
      return esc(part).replace(/(^|[^*\w])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>');
    })
    .join('');
}

/** Plain text, for meta descriptions and RSS. */
export const plain = (source: string) => source.replace(/[`*]/g, '');

export function formatDate(iso: string): string {
  if (!iso) return '';
  return new Date(`${iso.slice(0, 10)}T00:00:00Z`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/** The fixture's first comment line, e.g. "A small web shop: four customers, six products, eight orders." */
export function fixtureBlurb(name: string): string {
  const sql = fixtures[name] ?? '';
  const lines = sql.split('\n').filter((l) => l.startsWith('--'));
  return lines
    .map((l) => l.replace(/^--\s?/, ''))
    .join(' ')
    .replace(/\s+Every recipe that says.*$/, '')
    .trim();
}
