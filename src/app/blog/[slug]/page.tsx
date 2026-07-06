import { getCollection } from "@/lib/content";
import { getPostBySlug, listPosts } from "@/lib/writing/posts";
import { computeReadingTime, countWords, extractTextFromHtml } from "@/lib/writing/reading-time";
import { absoluteUrl, pageSchema, safeJsonLd } from "@/lib/seo";
import BlogPostView from "./BlogPostView";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import React from "react";
import "./post-detail.css";

interface PageProps {
  params: Promise<{ slug: string }>;
}

type TocItem = {
  depth: number;
  id: string;
  text: string;
};

function slugifyHeading(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72) || "section";
}

function stripTags(value: string) {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function uniqueId(base: string, used: Map<string, number>) {
  const count = used.get(base) ?? 0;
  used.set(base, count + 1);
  return count === 0 ? base : `${base}-${count + 1}`;
}

function extractMarkdownToc(markdown: string): TocItem[] {
  const used = new Map<string, number>();
  return markdown
    .split("\n")
    .map((line) => {
      const match = /^(#{2,3})\s+(.+?)\s*$/.exec(line);
      if (!match) return null;
      const text = match[2].replace(/\s+#+$/, "").trim();
      return {
        depth: match[1].length,
        id: uniqueId(slugifyHeading(text), used),
        text,
      };
    })
    .filter(Boolean) as TocItem[];
}

function enhanceHtmlHeadings(html: string) {
  const toc: TocItem[] = [];
  const used = new Map<string, number>();
  const htmlWithIds = html.replace(/<h([2-3])([^>]*)>([\s\S]*?)<\/h\1>/gi, (full, level, attrs, inner) => {
    const text = stripTags(inner);
    if (!text) return full;
    const existingId = /id=(["'])(.*?)\1/i.exec(attrs)?.[2];
    const id = existingId || uniqueId(slugifyHeading(text), used);
    toc.push({ depth: Number(level), id, text });
    return existingId ? full : `<h${level}${attrs} id="${id}">${inner}</h${level}>`;
  });

  return { html: htmlWithIds, toc };
}

// Generate metadata dynamically
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const allPosts = await getCollection("writing");
  const mdPost = allPosts.find((p) => p.slug === slug);
  const jsonPost = !mdPost ? await getPostBySlug(slug) : null;

  if (!mdPost && (!jsonPost || jsonPost.status !== "published")) {
    return {};
  }

  const title = mdPost ? mdPost.data.title : (jsonPost?.seoTitle || jsonPost?.title || '');
  const description = mdPost 
    ? (mdPost.data.metaDescription || mdPost.data.summary || mdPost.data.headline) 
    : (jsonPost?.seoDescription || jsonPost?.excerpt || '');
  
  const coverImage = mdPost ? mdPost.data.coverImage : (jsonPost?.coverImage || jsonPost?.ogImage);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      images: coverImage ? [{ url: absoluteUrl(coverImage) }] : undefined,
    },
  };
}

export async function generateStaticParams() {
  const mdPosts = await getCollection("writing");
  const jsonPosts = await listPosts();
  
  const mdSlugs = mdPosts.map((p) => ({ slug: p.slug }));
  const jsonSlugs = jsonPosts.filter((p) => p.status === "published").map((p) => ({ slug: p.slug }));
  
  return [...mdSlugs, ...jsonSlugs];
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  const allPosts = await getCollection("writing");
  const mdPost = allPosts.find((p) => p.slug === slug);
  const jsonPost = !mdPost ? await getPostBySlug(slug) : null;

  if (!mdPost && (!jsonPost || jsonPost.status !== "published")) {
    notFound();
  }

  const authorName = jsonPost?.author || "Phuc Loc Nguyen";
  const authorAvatar = "/author-cat.webp";

  let postTitle = "";
  let postDescription = "";
  let featuredImage: string | undefined;
  let publishDate = "";
  let tags: string[] = [];
  let postUrl = "";
  let readingMinutes = 1;
  let articleHtml = "";
  let tocItems: TocItem[] = [];

  if (mdPost) {
    featuredImage = mdPost.data.coverImage;
    publishDate = mdPost.data.publishedAt.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    tags = mdPost.data.tags ?? [];
    postUrl = absoluteUrl(`/blog/${mdPost.slug}`);
    postTitle = mdPost.data.title;
    postDescription = mdPost.data.metaDescription || mdPost.data.summary || mdPost.data.headline;
    readingMinutes = computeReadingTime(countWords(mdPost.body || postDescription));
    tocItems = extractMarkdownToc(mdPost.body ?? "");
    articleHtml = mdPost.body ?? ""; // Or compile markdown to HTML if markdown is ever used
  } else if (jsonPost) {
    postTitle = jsonPost.seoTitle || jsonPost.title;
    postDescription = jsonPost.seoDescription || jsonPost.excerpt || "";
    featuredImage = jsonPost.coverImage || jsonPost.ogImage;
    publishDate = jsonPost.publishedAt
      ? new Date(jsonPost.publishedAt).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "";
    tags = jsonPost.tags ?? [];
    postUrl = absoluteUrl(`/blog/${jsonPost.slug}`);
    readingMinutes = jsonPost.readingTime || computeReadingTime(countWords(extractTextFromHtml(jsonPost.contentHtml)));
    const enhanced = enhanceHtmlHeadings(jsonPost.contentHtml || "<p>No content.</p>");
    articleHtml = enhanced.html;
    tocItems = enhanced.toc;
  }

  const displayTitle = mdPost ? mdPost.data.headline : postTitle;
  const primaryCategory = tags[0] || "Writing";

  const jsonLd = safeJsonLd([
    pageSchema({
      url: postUrl,
      title: `${postTitle} | Lộc Digital`,
      description: postDescription,
      type: "WebPage",
    }),
    {
      "@type": "BlogPosting",
      "@id": `${postUrl}#article`,
      headline: mdPost?.data?.headline || postTitle,
      name: postTitle,
      description: postDescription,
      image: featuredImage ? absoluteUrl(featuredImage) : absoluteUrl("/og-image.jpg"),
      url: postUrl,
      datePublished: mdPost?.data?.publishedAt?.toISOString() || jsonPost?.publishedAt || "",
      dateModified: mdPost?.data?.publishedAt?.toISOString() || jsonPost?.updatedAt || "",
      author: { "@id": `${absoluteUrl("/")}#person` },
      publisher: { "@id": `${absoluteUrl("/")}#person` },
      keywords: tags,
      mainEntityOfPage: { "@id": `${postUrl}#webpage` },
    },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd }}
      />
      <BlogPostView
        postTitle={postTitle}
        postDescription={postDescription}
        displayTitle={displayTitle}
        publishDate={publishDate}
        tags={tags}
        readingMinutes={readingMinutes}
        primaryCategory={primaryCategory}
        featuredImage={featuredImage}
        articleHtml={articleHtml}
        tocItems={tocItems}
        authorName={authorName}
        authorAvatar={authorAvatar}
      />
    </>
  );
}
