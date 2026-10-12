import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// `cook validate` is the real gatekeeper for frontmatter; this schema only
// types the fields the pages read. Entry ids are `category/slug`.
const recipes = defineCollection({
  loader: glob({
    pattern: '*/*/recipe.md',
    base: '../recipes',
    generateId: ({ entry }) => entry.split('/').slice(0, 2).join('/'),
  }),
  schema: z.looseObject({
    title: z.string(),
    summary: z.string(),
  }),
});

export const collections = { recipes };
