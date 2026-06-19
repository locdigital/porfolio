import { getCollection, type CollectionEntry } from "astro:content";
import { existsSync } from "node:fs";

const writingDir = new URL("../content/writing", import.meta.url);

type LocalWritingPost = CollectionEntry<"writing"> & {
  source: "local";
  slug: string;
};

export type WritingPost = LocalWritingPost;

async function getLocalWritingPosts(): Promise<LocalWritingPost[]> {
  if (!existsSync(writingDir)) {
    return [];
  }

  const entries = await getCollection("writing", ({ data }) => !data.draft);
  return entries
    .map((entry) => ({ ...entry, source: "local" as const, slug: entry.slug }))
    .sort((a, b) => b.data.publishedAt.getTime() - a.data.publishedAt.getTime());
}

export async function getWritingPosts(): Promise<WritingPost[]> {
  return getLocalWritingPosts();
}

