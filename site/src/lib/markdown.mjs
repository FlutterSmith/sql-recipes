// Remark/rehype plugins that turn a recipe's GitHub-friendly Markdown into
// the site's markup.
import { visit } from 'unist-util-visit';

import { buildSql } from './console.mjs';

const SYNC_START = '<!-- cook:sync -->';
const SYNC_END = '<!-- /cook:sync -->';

/** True when any text inside the node holds the marker. */
function holds(node, marker) {
  if (typeof node.value === 'string' && node.value.includes(marker)) return true;
  return (node.children ?? []).some((c) => holds(c, marker));
}

/**
 * - drops the generated `<!-- cook:sync -->` block (queries and the result
 *   table for GitHub readers): the site draws both from meta.json
 * - drops other HTML comments
 * - links recipes the prose mentions by slug (`top-n-per-group`) to their pages
 * - rewrites relative links to the repository
 * @param {{ base: string, slugs: string[] }} options
 */
export function remarkRecipes({ base, slugs }) {
  const root = base.endsWith('/') ? base : `${base}/`;
  const slugSet = new Set(slugs);
  const slugRe = /(?<![\w/-])([a-z0-9]+(?:-[a-z0-9]+)+)(?![\w/-])/g;
  return (tree) => {
    const children = tree.children;
    const start = children.findIndex((n) => n.type === 'html' && n.value.includes(SYNC_START));
    if (start !== -1) {
      let end = children.findIndex((n, i) => i >= start && holds(n, SYNC_END));
      if (end === -1) end = children.length - 1;
      children.splice(start, end - start + 1);
    }
    for (let i = children.length - 1; i >= 0; i--) {
      const node = children[i];
      if (node.type === 'html' && node.value.trimStart().startsWith('<!--')) children.splice(i, 1);
    }

    visit(tree, ['link', 'definition'], (node) => {
      const url = node.url;
      if (!url || /^[a-z]+:/i.test(url) || url.startsWith('#')) return;
      const other = url.match(/^\.\.\/(?:\.\.\/)?(?:[a-z]+\/)?([a-z0-9-]+)\/(?:recipe\.md)?(#.*)?$/);
      if (other && slugSet.has(other[1])) {
        node.url = `${root}r/${other[1]}/${other[2] ?? ''}`;
        return;
      }
      node.url = `https://github.com/FlutterSmith/sql-recipes/blob/main/recipes/${url.replace(/^(\.\.\/)+/, '')}`;
    });

    // A slug in plain text becomes a link. Inside `code` or an existing link it stays as it is.
    visit(tree, 'text', (node, index, parent) => {
      if (!parent || parent.type === 'link' || parent.type === 'inlineCode' || index === null) return;
      const parts = [];
      let last = 0;
      for (const m of node.value.matchAll(slugRe)) {
        if (!slugSet.has(m[1])) continue;
        if (m.index > last) parts.push({ type: 'text', value: node.value.slice(last, m.index) });
        parts.push({ type: 'link', url: `${root}r/${m[1]}/`, children: [{ type: 'text', value: m[1] }] });
        last = m.index + m[1].length;
      }
      if (!parts.length) return;
      if (last < node.value.length) parts.push({ type: 'text', value: node.value.slice(last) });
      parent.children.splice(index, 1, ...parts);
      return index + parts.length;
    });
  };
}

/** Replaces every `pre > code` with a console block, highlighted as SQL. */
export function rehypeConsole() {
  return async (tree) => {
    const jobs = [];
    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName !== 'pre' || !parent || index === null) return;
      const code = node.children.find((c) => c.type === 'element' && c.tagName === 'code');
      if (!code) return;
      const source = code.children.map((c) => (c.type === 'text' ? c.value : '')).join('');
      jobs.push(
        buildSql({ code: source, label: 'sql' }).then((block) => {
          parent.children[index] = block;
        }),
      );
      return 'skip';
    });
    await Promise.all(jobs);
  };
}
