import { getWritingPosts } from "@/lib/writing";
import { absoluteUrl, pageSchema, safeJsonLd } from "@/lib/seo";
import BlogView from "./BlogView";
import { Metadata } from "next";
import React from "react";

const blogTitle = "Writing | Lộc Digital";
const blogDescription = "Essays and notes on digital marketing, SEO, code, creative systems, and life.";

export const metadata: Metadata = {
  title: "Writing",
  description: blogDescription,
};

export default async function Page() {
  const posts = await getWritingPosts();

  const jsonLd = safeJsonLd([
    pageSchema({
      url: absoluteUrl("/blog"),
      title: blogTitle,
      description: blogDescription,
      type: "Blog",
    }),
    {
      "@type": "ItemList",
      "@id": `${absoluteUrl("/blog")}#posts`,
      name: "Writing posts",
      itemListElement: posts.map((post, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: absoluteUrl(`/blog/${post.slug}`),
        name: post.data.title,
        description: post.data.summary || post.data.metaDescription,
      })),
    },
  ]);

  // Convert posts structure into simple object structure matching TS types expected in BlogView
  const postsData = posts.map((post) => ({
    slug: post.slug,
    data: {
      title: post.data.title,
      headline: post.data.headline,
      summary: post.data.summary,
      keyword: post.data.keyword,
      metaDescription: post.data.metaDescription,
      coverImage: post.data.coverImage,
      publishedAt: post.data.publishedAt ? post.data.publishedAt.toISOString() : null,
      tags: post.data.tags,
    }
  }));

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd }}
      />
      <BlogView posts={postsData} />
    </>
  );
}
