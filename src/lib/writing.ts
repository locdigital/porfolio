import { getCollection, type CollectionEntry } from "./content";
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { listPosts, type Post } from "./writing/posts";

const writingDir = path.join(process.cwd(), "src", "content", "writing");

type WritingPostData = {
  title: string;
  headline: string;
  summary?: string;
  keyword?: string;
  metaDescription?: string;
  coverImage?: string;
  publishedAt: Date;
  tags: string[];
};

type LocalWritingPost = CollectionEntry<WritingPostData> & {
  source: "local";
  slug: string;
};

type EditorWritingPost = {
  source: "editor";
  id: string;
  slug: string;
  data: WritingPostData;
  post: Post;
};

export type WritingPost = LocalWritingPost | EditorWritingPost;

function validDate(value?: string): Date {
  const date = value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function textFromHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function truncateText(text: string, maxLength = 180): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= maxLength) return clean;
  return `${clean.slice(0, maxLength).trimEnd()}...`;
}

function editorPostSummary(post: Post): string | undefined {
  const summary =
    post.excerpt ||
    post.seoDescription ||
    post.ogDescription ||
    post.contentMarkdown ||
    textFromHtml(post.contentHtml);

  return summary ? truncateText(summary) : undefined;
}

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

async function getEditorWritingPosts(): Promise<EditorWritingPost[]> {
  try {
    const posts = await listPosts();

    return posts
      .filter((post) => post.status === "published")
      .map((post) => {
        const summary = editorPostSummary(post);
        const publishedAt = validDate(post.publishedAt ?? post.updatedAt ?? post.createdAt);

        return {
          source: "editor" as const,
          id: post.id,
          slug: post.slug,
          post,
          data: {
            title: post.title,
            headline: post.title,
            summary,
            metaDescription: post.seoDescription || summary,
            coverImage: post.coverImage || post.ogImage,
            publishedAt,
            tags: post.tags ?? [],
          },
        };
      });
  } catch (error) {
    console.error("[writing] Failed to fetch editor writing posts:", error);
    return [];
  }
}

export async function getWritingPosts(): Promise<WritingPost[]> {
  const [localPosts, editorPosts] = await Promise.all([
    getLocalWritingPosts(),
    getEditorWritingPosts(),
  ]);

  return [...localPosts, ...editorPosts].sort(
    (a, b) => b.data.publishedAt.getTime() - a.data.publishedAt.getTime()
  );
}
