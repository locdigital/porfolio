import type { Post } from "./posts";

export interface SeoCheckResult {
  id: string;
  label: string;
  status: "good" | "improvement" | "missing";
  detail?: string;
}

export function computeSeoChecklist(post: Partial<Post>): SeoCheckResult[] {
  const title = post.seoTitle ?? post.title ?? "";
  const description = post.seoDescription ?? "";
  const slug = post.slug ?? "";
  const focusKeyword = post.focusKeyword ?? "";
  const wordCount = post.wordCount ?? 0;
  const checks: SeoCheckResult[] = [];

  // SEO title length
  const titleLen = title.length;
  checks.push({
    id: "seo-title-length",
    label: "SEO title length (45–60 chars)",
    status: titleLen === 0 ? "missing" : titleLen >= 45 && titleLen <= 60 ? "good" : "improvement",
    detail: titleLen > 0 ? `${titleLen} characters` : undefined,
  });

  // Meta description length
  const descLen = description.length;
  checks.push({
    id: "meta-desc-length",
    label: "Meta description length (120–160 chars)",
    status: descLen === 0 ? "missing" : descLen >= 120 && descLen <= 160 ? "good" : "improvement",
    detail: descLen > 0 ? `${descLen} characters` : undefined,
  });

  // Slug valid
  const slugValid = slug.length > 0 && /^[a-z0-9-]+$/.test(slug);
  checks.push({
    id: "slug-valid",
    label: "Slug is URL-friendly (no spaces, no accents)",
    status: slug.length === 0 ? "missing" : slugValid ? "good" : "improvement",
  });

  // Focus keyword present
  checks.push({
    id: "focus-keyword",
    label: "Focus keyword set",
    status: focusKeyword.length > 0 ? "good" : "missing",
  });

  // Focus keyword in title
  if (focusKeyword) {
    const inTitle = title.toLowerCase().includes(focusKeyword.toLowerCase());
    checks.push({
      id: "keyword-in-title",
      label: "Focus keyword in title",
      status: inTitle ? "good" : "improvement",
    });
  }

  // Focus keyword in description
  if (focusKeyword) {
    const inDesc = description.toLowerCase().includes(focusKeyword.toLowerCase());
    checks.push({
      id: "keyword-in-desc",
      label: "Focus keyword in meta description",
      status: inDesc ? "good" : "improvement",
    });
  }

  // Has H2 (check contentHtml)
  const hasH2 = (post.contentHtml ?? "").includes("<h2");
  checks.push({
    id: "has-h2",
    label: "Has at least one H2 heading",
    status: hasH2 ? "good" : "improvement",
  });

  // Has cover image
  checks.push({
    id: "has-image",
    label: "Has cover/OG image",
    status: post.coverImage || post.ogImage ? "good" : "missing",
  });

  // Word count >= 600
  checks.push({
    id: "word-count",
    label: "Content length (min 600 words)",
    status:
      wordCount === 0
        ? "missing"
        : wordCount >= 600
          ? "good"
          : "improvement",
    detail: wordCount > 0 ? `${wordCount} words` : undefined,
  });

  // Internal link
  const hasInternalLink = (post.contentHtml ?? "").match(/href="\/[^"]+"/);
  checks.push({
    id: "internal-link",
    label: "Has internal link",
    status: hasInternalLink ? "good" : "improvement",
  });

  // External link
  const hasExternalLink = (post.contentHtml ?? "").match(/href="https?:\/\//);
  checks.push({
    id: "external-link",
    label: "Has external link",
    status: hasExternalLink ? "good" : "improvement",
  });

  return checks;
}

export function computeSeoScore(checks: SeoCheckResult[]): number {
  if (checks.length === 0) return 0;
  const score = checks.filter((c) => c.status === "good").length;
  return Math.round((score / checks.length) * 100);
}
