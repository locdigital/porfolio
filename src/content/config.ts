import { defineCollection, z } from 'astro:content';

const pages = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    headline: z.string().optional(),
    subheadline: z.string().optional(),
    description: z.string().optional(),
    metaDescription: z.string().optional(),
    coverImage: z.string().optional(),
    draft: z.boolean().optional().default(false),
  }),
});

const writing = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    headline: z.string(),
    summary: z.string().optional(),
    keyword: z.string().optional(),
    metaDescription: z.string().optional(),
    coverImage: z.string().optional(),
    publishedAt: z.coerce.date(),
    tags: z.array(z.string()).optional().default([]),
    draft: z.boolean().optional().default(false),
  }),
});

const projects = defineCollection({
  type: 'data',
  schema: z.object({
    slug: z.string(),
    order: z.number(),
    number: z.string(),
    title: z.string(),
    client: z.string(),
    year: z.string(),
    role: z.string(),
    summary: z.string(),
    description: z.string(),
    tools: z.array(z.string()).default([]),
    skills: z.array(z.string()).default([]),
    coverImage: z.string(),
    images: z.array(z.string()).default([]),
    link: z.string().optional(),
    linkLabel: z.string().optional(),
    caseStudyLink: z.string().optional(),
  }),
});

const photos = defineCollection({
  type: 'data',
  schema: z.object({
    slug: z.string(),
    order: z.number(),
    location: z.string(),
    headline: z.string(),
    subheadline: z.string().optional(),
    description: z.string().optional(),
    images: z.array(z.object({
      src: z.string(),
      alt: z.string(),
      width: z.number().optional(),
      height: z.number().optional(),
    })).default([]),
  }),
});

const gear = defineCollection({
  type: 'data',
  schema: z.object({
    title: z.string(),
    headline: z.string(),
    description: z.string(),
    sections: z.array(z.object({
      title: z.string(),
      slug: z.string(),
      headline: z.string().optional(),
      description: z.string(),
      image: z.string().optional(),
      items: z.array(z.object({
        name: z.string(),
        slug: z.string(),
        headline: z.string(),
        description: z.string(),
        image: z.string().optional(),
        url: z.string().optional(),
        tag: z.string().optional(),
      })).default([]),
    })).default([]),
  }),
});

export const collections = { pages, writing, projects, photos, gear };
