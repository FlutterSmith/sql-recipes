import rss from '@astrojs/rss';
import type { APIContext } from 'astro';

import { plain, recipes, recipeUrl, site } from '../lib/site';

export function GET(context: APIContext) {
  return rss({
    title: site.name,
    description: 'SQL recipes that run on four databases.',
    site: context.site!,
    items: recipes.map((r) => ({
      title: r.title,
      description: plain(r.summary),
      link: recipeUrl(r.slug),
      pubDate: new Date(`${r.published.slice(0, 10)}T00:00:00Z`),
      categories: [r.category, ...r.tags],
    })),
  });
}
