import { getCollection, type CollectionEntry } from "astro:content";
import { existsSync } from "node:fs";

const writingDir = new URL("../content/writing", import.meta.url);

type WritingData = {
  title: string;
  headline: string;
  summary?: string;
  keyword?: string;
  metaDescription?: string;
  coverImage?: string;
  publishedAt: Date;
  tags: string[];
  draft: boolean;
};

type LocalWritingPost = CollectionEntry<"writing"> & {
  source: "local";
  slug: string;
};

type WordPressPost = {
  source: "wordpress";
  slug: string;
  content: string;
  data: WritingData;
};

export type WritingPost = LocalWritingPost | WordPressPost;

type WpTerm = {
  name?: string;
};

type WpMedia = {
  source_url?: string;
};

type WpPost = {
  slug?: string;
  link?: string;
  date?: string;
  modified?: string;
  title?: { rendered?: string };
  excerpt?: { rendered?: string };
  content?: { rendered?: string };
  _embedded?: {
    "wp:featuredmedia"?: WpMedia[];
    "wp:term"?: WpTerm[][];
  };
};

const stripHtml = (value = "") => value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

const decodeHtml = (value = "") =>
  value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(Number.parseInt(code, 16)));

const normalizeText = (value = "") => decodeHtml(stripHtml(value));

async function getLocalWritingPosts(): Promise<LocalWritingPost[]> {
  if (!existsSync(writingDir)) {
    return [];
  }

  const entries = await getCollection("writing", ({ data }) => !data.draft);
  return entries
    .map((entry) => ({ ...entry, source: "local" as const, slug: entry.slug }))
    .sort((a, b) => b.data.publishedAt.getTime() - a.data.publishedAt.getTime());
}

async function getWordPressWritingPosts(): Promise<WordPressPost[]> {
  const rawWpUrl = import.meta.env.PUBLIC_WP_URL;

  if (!rawWpUrl) {
    return [];
  }

  const wpBase = String(rawWpUrl).replace(/\/+$/, "");
  const wpUrl = /^https?:\/\//i.test(wpBase) ? wpBase : `https://${wpBase}`;
  const endpoint = `${wpUrl}/wp-json/wp/v2/posts?_embed=1&status=publish&per_page=100`;

  const response = await fetch(endpoint);

  if (!response.ok) {
    throw new Error(`WordPress posts request failed with ${response.status}`);
  }

  const posts = (await response.json()) as WpPost[];

  return posts
    .filter((post) => post.slug && post.content?.rendered)
    .map((post) => {
      const title = normalizeText(post.title?.rendered);
      const summary = normalizeText(post.excerpt?.rendered);
      const featuredMedia = post._embedded?.["wp:featuredmedia"]?.[0];
      const tagTerms = post._embedded?.["wp:term"]?.[1] ?? [];
      const tags = tagTerms.map((term) => normalizeText(term.name)).filter(Boolean);

      return {
        source: "wordpress" as const,
        slug: post.slug as string,
        content: post.content?.rendered ?? "",
        data: {
          title,
          headline: title,
          summary,
          metaDescription: summary,
          coverImage: featuredMedia?.source_url ?? "",
          publishedAt: new Date(post.date ?? post.modified ?? Date.now()),
          tags,
          draft: false,
        },
      };
    })
    .sort((a, b) => b.data.publishedAt.getTime() - a.data.publishedAt.getTime());
}

export async function getWritingPosts(): Promise<WritingPost[]> {
  try {
    const wordpressPosts = await getWordPressWritingPosts();

    if (wordpressPosts.length > 0) {
      return wordpressPosts;
    }
  } catch (error) {
    console.error("Error fetching WordPress posts:", error);
  }

  return getLocalWritingPosts();
}
