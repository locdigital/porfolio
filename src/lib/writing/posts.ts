import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  deleteSupabaseCmsEntry,
  findSupabaseCmsEntryBySlug,
  isSupabaseCmsConfigured,
  readSupabaseCmsCollection,
  readSupabaseCmsEntry,
  writeSupabaseCmsEntry,
} from "../cms-store";

const rootDir = process.cwd();
const postsDir = path.join(rootDir, "data", "writing-posts");
const SUPABASE_COLLECTION = "writing_posts";

export type PostStatus = "draft" | "published" | "archived";

export interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  contentJson: unknown;
  contentHtml: string;
  contentMarkdown: string;
  coverImage?: string;
  seoTitle?: string;
  seoDescription?: string;
  focusKeyword?: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  category?: string;
  tags: string[];
  author?: string;
  status: PostStatus;
  wordCount: number;
  readingTime: number;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export type CreatePostInput = Partial<Omit<Post, "id" | "createdAt" | "updatedAt">> & {
  title: string;
};

export type UpdatePostInput = Partial<Omit<Post, "id" | "createdAt">>;

function generateId(): string {
  return `post_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function getPostFilePath(id: string): string {
  return path.join(postsDir, `${id}.json`);
}

async function ensureDir() {
  if (!existsSync(postsDir)) {
    await mkdir(postsDir, { recursive: true });
  }
}

async function listFilePosts(): Promise<Post[]> {
  await ensureDir();
  const files = await readdir(postsDir).catch(() => []);
  const posts: Post[] = [];
  for (const file of files) {
    if (!file.endsWith(".json")) continue;
    try {
      const content = await readFile(path.join(postsDir, file), "utf-8");
      posts.push(JSON.parse(content) as Post);
    } catch {
      // skip corrupted files
    }
  }
  return posts.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

async function getFilePost(id: string): Promise<Post | null> {
  const filePath = getPostFilePath(id);
  if (!existsSync(filePath)) return null;
  try {
    const content = await readFile(filePath, "utf-8");
    return JSON.parse(content) as Post;
  } catch {
    return null;
  }
}

async function createFilePost(post: Post): Promise<Post> {
  await ensureDir();
  await writeFile(getPostFilePath(post.id), JSON.stringify(post, null, 2), "utf-8");
  return post;
}

async function updateFilePost(id: string, input: UpdatePostInput): Promise<Post> {
  const existing = await getFilePost(id);
  if (!existing) throw new Error(`Post not found: ${id}`);
  const updated: Post = {
    ...existing,
    ...input,
    id,
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString(),
  };
  await writeFile(getPostFilePath(id), JSON.stringify(updated, null, 2), "utf-8");
  return updated;
}

async function deleteFilePost(id: string): Promise<void> {
  const filePath = getPostFilePath(id);
  if (existsSync(filePath)) {
    await rm(filePath);
  }
}

export async function listPosts(): Promise<Post[]> {
  if (isSupabaseCmsConfigured()) {
    const posts = await readSupabaseCmsCollection<Post>(SUPABASE_COLLECTION);
    return posts.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  return listFilePosts();
}

export async function getPost(id: string): Promise<Post | null> {
  if (isSupabaseCmsConfigured()) {
    return readSupabaseCmsEntry<Post>(SUPABASE_COLLECTION, id);
  }

  return getFilePost(id);
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  if (isSupabaseCmsConfigured()) {
    return findSupabaseCmsEntryBySlug<Post>(SUPABASE_COLLECTION, slug);
  }

  const posts = await listPosts();
  return posts.find((p) => p.slug === slug) ?? null;
}

export async function createPost(input: CreatePostInput): Promise<Post> {
  const now = new Date().toISOString();
  const id = generateId();
  const post: Post = {
    id,
    title: input.title ?? "Untitled",
    slug: input.slug ?? id,
    excerpt: input.excerpt,
    contentJson: input.contentJson ?? null,
    contentHtml: input.contentHtml ?? "",
    contentMarkdown: input.contentMarkdown ?? "",
    coverImage: input.coverImage,
    seoTitle: input.seoTitle,
    seoDescription: input.seoDescription,
    focusKeyword: input.focusKeyword,
    canonicalUrl: input.canonicalUrl,
    ogTitle: input.ogTitle,
    ogDescription: input.ogDescription,
    ogImage: input.ogImage,
    category: input.category,
    tags: input.tags ?? [],
    author: input.author,
    status: input.status ?? "draft",
    wordCount: input.wordCount ?? 0,
    readingTime: input.readingTime ?? 0,
    createdAt: now,
    updatedAt: now,
    publishedAt: input.publishedAt,
  };

  if (isSupabaseCmsConfigured()) {
    await writeSupabaseCmsEntry(SUPABASE_COLLECTION, id, post);
    return post;
  }

  return createFilePost(post);
}

export async function updatePost(id: string, input: UpdatePostInput): Promise<Post> {
  if (isSupabaseCmsConfigured()) {
    const existing = await getPost(id);
    if (!existing) throw new Error(`Post not found: ${id}`);
    const updated: Post = {
      ...existing,
      ...input,
      id,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    };
    await writeSupabaseCmsEntry(SUPABASE_COLLECTION, id, updated);
    return updated;
  }

  return updateFilePost(id, input);
}

export async function deletePost(id: string): Promise<void> {
  if (isSupabaseCmsConfigured()) {
    await deleteSupabaseCmsEntry(SUPABASE_COLLECTION, id);
    return;
  }

  return deleteFilePost(id);
}

export async function publishPost(id: string): Promise<Post> {
  return updatePost(id, {
    status: "published",
    publishedAt: new Date().toISOString(),
  });
}

export async function unpublishPost(id: string): Promise<Post> {
  return updatePost(id, { status: "draft", publishedAt: undefined });
}
