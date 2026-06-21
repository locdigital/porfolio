import { getCollection, type CollectionEntry } from "astro:content";
import { existsSync, readdirSync } from "node:fs";

const writingDir = new URL("../content/writing", import.meta.url);

type LocalWritingPost = CollectionEntry<"writing"> & {
  source: "local";
  slug: string;
};

export type WritingPost = LocalWritingPost;

async function getLocalWritingPosts(): Promise<LocalWritingPost[]> {
  try {
    if (!existsSync(writingDir) || !readdirSync(writingDir).some((file) => /\.(md|mdx)$/i.test(file))) {
      return [];
    }

    const entries = await getCollection("writing", ({ data }) => !data.draft);
    return entries
      .map((entry) => ({ ...entry, source: "local" as const, slug: entry.slug }))
      .sort((a, b) => b.data.publishedAt.getTime() - a.data.publishedAt.getTime());
  } catch (error) {
    console.error("[writing] Failed to fetch local writing posts:", error);
    return [];
  }
}

export async function getWritingPosts(): Promise<WritingPost[]> {
  return getLocalWritingPosts();
}
