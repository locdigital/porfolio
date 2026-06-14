import { defineCollection, z } from 'astro:content';

const posts = defineCollection({
  type: 'content', // For Markdown files saved by Keystatic
  schema: z.object({
    title: z.string(),
    summary: z.string().optional(),
    coverImage: z.string().optional(),
  }),
});

export const collections = { posts };
