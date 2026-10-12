// @ts-check
import { readdirSync, readFileSync } from 'node:fs';

import { unified } from '@astrojs/markdown-remark';
import { defineConfig } from 'astro/config';

import { rehypeConsole, remarkRecipes } from './src/lib/markdown.mjs';

const base = process.env.SITE_BASE ?? '/sql-recipes';
// Written by `npm run generate` (the Python CLI, after running every recipe on
// every engine). The Markdown pipeline needs the slugs to link recipes that
// the prose mentions by name.
const meta = JSON.parse(readFileSync(new URL('./src/generated/meta.json', import.meta.url), 'utf8'));
const slugs = meta.recipes.map((r) => r.slug);

/** Fails the build when a recipe page is missing its dialect block or its result grid. */
function guardRecipePages() {
  return {
    name: 'sql-recipes:guard',
    hooks: {
      'astro:build:done': ({ dir, logger }) => {
        const root = new URL('r/', dir);
        let pages = 0;
        const bad = [];
        for (const slug of readdirSync(root)) {
          const html = readFileSync(new URL(`${slug}/index.html`, root), 'utf8');
          pages++;
          if (!/role="tablist"/.test(html)) bad.push(`${slug}: no dialect block`);
          if (!/<table class="grid"/.test(html)) bad.push(`${slug}: no result grid`);
          if (!/id="how-it-works"/.test(html) || !/id="differences"/.test(html)) bad.push(`${slug}: missing a prose section`);
        }
        if (pages !== slugs.length) bad.push(`expected ${slugs.length} recipe pages, built ${pages}`);
        if (bad.length) throw new Error(`Recipe pages are incomplete:\n  ${bad.join('\n  ')}`);
        logger.info(`${pages} recipe pages have their dialect block, result grid and prose.`);
      },
    },
  };
}

export default defineConfig({
  site: process.env.SITE_URL ?? 'https://fluttersmith.github.io',
  base,
  trailingSlash: 'always',
  integrations: [guardRecipePages()],
  markdown: {
    // SQL fences become console blocks through rehypeConsole; Astro's own
    // highlighter stays out of the way.
    syntaxHighlight: false,
    processor: unified({
      remarkPlugins: [[remarkRecipes, { base, slugs }]],
      rehypePlugins: [rehypeConsole],
    }),
  },
  build: { format: 'directory' },
  devToolbar: { enabled: false },
});
