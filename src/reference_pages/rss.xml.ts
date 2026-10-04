import type { APIRoute } from "astro";
import { getWritingPosts } from "../lib/writing";

const SITE_TITLE = "Phuc Loc Nguyen | Lộc Digital";
const SITE_DESCRIPTION = "Writing on marketing, code, and life.";

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export const GET: APIRoute = async ({ site }) => {
  const baseUrl = site ?? new URL("https://loc.digital");
  const posts = await getWritingPosts();

  const items = posts.map((post) => {
    const url = new URL(`/blog/${post.slug}`, baseUrl).toString();
    const description = post.data.summary || post.data.metaDescription || "";

    return [
      "<item>",
      `<title>${escapeXml(post.data.title)}</title>`,
      `<link>${escapeXml(url)}</link>`,
      `<guid>${escapeXml(url)}</guid>`,
      `<description>${escapeXml(description)}</description>`,
      `<pubDate>${post.data.publishedAt.toUTCString()}</pubDate>`,
      "</item>",
    ].join("");
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(SITE_TITLE)}</title>
    <link>${escapeXml(baseUrl.toString())}</link>
    <description>${escapeXml(SITE_DESCRIPTION)}</description>
    ${items.join("\n    ")}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
    },
  });
};
