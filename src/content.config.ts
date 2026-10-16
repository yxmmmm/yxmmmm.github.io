import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(), date: z.string(), updated: z.string(),
    permalink: z.string(), category: z.string(), description: z.string(),
    source: z.string(),
  }),
});
export const collections = { posts };
