export type SearchIntent = "informational" | "commercial" | "transactional" | "navigational";

export type SchemaType = "Article" | "BlogPosting" | "FAQPage" | "Product" | "Service";

export type SeoArticleForm = {
  focusKeyword: string;
  secondaryKeywords: string;
  topic: string;
  targetAudience: string;
  searchIntent: SearchIntent;
  tone: string;
  desiredWordCount: number;
  internalLinks: string;
  externalLinks: string;
  brandInfo: string;
  language: string;
};

export type SeoFaq = {
  question: string;
  answer: string;
};

export type LinkPlacement = {
  anchor: string;
  url: string;
  placement: string;
  type: "internal" | "external";
};

export type SeoArticle = {
  seoTitle: string;
  metaDescription: string;
  slug: string;
  h1: string;
  outline: string[];
  body: string;
  introduction: string;
  conclusion: string;
  faq: SeoFaq[];
  imageAltTexts: string[];
  linkPlacements: LinkPlacement[];
  schemaType: SchemaType;
  cta: string;
};

export type ChecklistStatus = "pass" | "warning" | "fail";

export type ChecklistItem = {
  id: string;
  label: string;
  points: number;
  status: ChecklistStatus;
  detail: string;
};

export type SeoScoreResult = {
  score: number;
  items: ChecklistItem[];
  stats: {
    wordCount: number;
    keywordDensity: number;
    paragraphCount: number;
    shortParagraphRatio: number;
  };
};

const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

export const slugify = (value: string) =>
  normalize(value)
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);

const includesKeyword = (value: string, keyword: string) => {
  const normalizedKeyword = normalize(keyword);
  if (!normalizedKeyword) return false;
  return normalize(value).includes(normalizedKeyword);
};

const countWords = (value: string) =>
  value
    .replace(/[#>*_`~\[\]()]/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;

const countKeyword = (value: string, keyword: string) => {
  const normalizedKeyword = normalize(keyword);
  if (!normalizedKeyword) return 0;
  return normalize(value).split(normalizedKeyword).length - 1;
};

const paragraphStats = (body: string) => {
  const paragraphs = body
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph && !paragraph.startsWith("#") && !paragraph.startsWith("-"));
  const shortParagraphs = paragraphs.filter((paragraph) => countWords(paragraph) <= 90).length;
  return {
    paragraphCount: paragraphs.length,
    shortParagraphRatio: paragraphs.length ? shortParagraphs / paragraphs.length : 0,
  };
};

const item = (
  id: string,
  label: string,
  points: number,
  status: ChecklistStatus,
  detail: string,
): ChecklistItem => ({ id, label, points, status, detail });

export function calculateSeoScore(article: SeoArticle, form: SeoArticleForm): SeoScoreResult {
  const keyword = form.focusKeyword.trim();
  const fullText = [
    article.seoTitle,
    article.metaDescription,
    article.slug,
    article.h1,
    article.outline.join(" "),
    article.introduction,
    article.body,
    article.conclusion,
    article.faq.map((entry) => `${entry.question} ${entry.answer}`).join(" "),
  ].join(" ");
  const wordCount = countWords(`${article.introduction}\n\n${article.body}\n\n${article.conclusion}`);
  const keywordCount = countKeyword(fullText, keyword);
  const keywordDensity = wordCount ? (keywordCount / wordCount) * 100 : 0;
  const paragraphs = paragraphStats(article.body);
  const target = Number(form.desiredWordCount) || 1200;
  const items: ChecklistItem[] = [];

  items.push(item(
    "title-keyword",
    "Focus keyword in SEO title",
    8,
    includesKeyword(article.seoTitle, keyword) ? "pass" : "fail",
    includesKeyword(article.seoTitle, keyword) ? "Keyword appears in the title." : "Add the focus keyword to the SEO title.",
  ));
  items.push(item(
    "meta-keyword",
    "Focus keyword in meta description",
    7,
    includesKeyword(article.metaDescription, keyword) ? "pass" : "fail",
    includesKeyword(article.metaDescription, keyword) ? "Keyword appears in the meta description." : "Mention the focus keyword naturally in the meta description.",
  ));
  items.push(item(
    "slug-keyword",
    "Focus keyword in slug",
    6,
    includesKeyword(article.slug.replace(/-/g, " "), keyword) ? "pass" : "warning",
    includesKeyword(article.slug.replace(/-/g, " "), keyword) ? "Slug includes the keyword." : "Consider including the keyword in the URL slug.",
  ));
  items.push(item(
    "h1-keyword",
    "Focus keyword in H1",
    7,
    includesKeyword(article.h1, keyword) ? "pass" : "fail",
    includesKeyword(article.h1, keyword) ? "H1 is aligned with the keyword." : "Use the focus keyword in the H1.",
  ));
  items.push(item(
    "first-paragraph",
    "Focus keyword in first paragraph",
    7,
    includesKeyword(article.introduction.split(/\n\n/)[0] ?? "", keyword) ? "pass" : "fail",
    includesKeyword(article.introduction.split(/\n\n/)[0] ?? "", keyword) ? "Keyword appears early." : "Add the keyword to the opening paragraph.",
  ));
  items.push(item(
    "h2-keyword",
    "Focus keyword in at least one H2",
    6,
    article.outline.some((heading) => /^h2/i.test(heading) && includesKeyword(heading, keyword)) || /##\s+.*\b/i.test(article.body) && includesKeyword(article.body.match(/##[^\n]+/g)?.join(" ") ?? "", keyword)
      ? "pass"
      : "warning",
    "At least one section heading should reinforce the main topic.",
  ));
  items.push(item(
    "content-length",
    "Content length meets target",
    8,
    wordCount >= target * 0.85 ? "pass" : wordCount >= target * 0.65 ? "warning" : "fail",
    `${wordCount} words against a target of ${target}.`,
  ));
  items.push(item(
    "keyword-density",
    "Keyword density is natural",
    8,
    keywordDensity >= 0.2 && keywordDensity <= 2.5 ? "pass" : keywordDensity > 2.5 && keywordDensity <= 3.5 ? "warning" : "fail",
    `${keywordDensity.toFixed(2)}% keyword density. Aim for natural usage, not repetition.`,
  ));
  items.push(item(
    "internal-links",
    "Has internal links",
    5,
    article.linkPlacements.some((link) => link.type === "internal") || Boolean(form.internalLinks.trim()) ? "pass" : "warning",
    "Add internal links to related pages where useful.",
  ));
  items.push(item(
    "external-links",
    "Has external links",
    5,
    article.linkPlacements.some((link) => link.type === "external") || Boolean(form.externalLinks.trim()) ? "pass" : "warning",
    "Add external links to credible supporting resources.",
  ));
  items.push(item(
    "image-alt",
    "Has image alt text suggestions",
    5,
    article.imageAltTexts.length >= 3 ? "pass" : article.imageAltTexts.length ? "warning" : "fail",
    `${article.imageAltTexts.length} alt text suggestions generated.`,
  ));
  items.push(item(
    "short-paragraphs",
    "Has short paragraphs",
    5,
    paragraphs.shortParagraphRatio >= 0.75 ? "pass" : paragraphs.shortParagraphRatio >= 0.5 ? "warning" : "fail",
    `${Math.round(paragraphs.shortParagraphRatio * 100)}% of paragraphs are scan-friendly.`,
  ));
  items.push(item(
    "headings-readable",
    "Has readable headings",
    5,
    article.outline.length >= 5 ? "pass" : article.outline.length >= 3 ? "warning" : "fail",
    `${article.outline.length} outline items found.`,
  ));
  items.push(item(
    "faq",
    "Has FAQ",
    4,
    article.faq.length >= 3 ? "pass" : article.faq.length ? "warning" : "fail",
    `${article.faq.length} FAQ entries generated.`,
  ));
  items.push(item(
    "cta",
    "Has CTA",
    4,
    article.cta.trim() || /liên hệ|đăng ký|tải|mua|nhận tư vấn|contact|subscribe|buy|download/i.test(article.body) ? "pass" : "warning",
    "A clear next step helps convert readers.",
  ));
  items.push(item(
    "title-length",
    "Meta title length is valid",
    5,
    article.seoTitle.length >= 35 && article.seoTitle.length <= 65 ? "pass" : "warning",
    `${article.seoTitle.length} characters. Aim around 50 to 60.`,
  ));
  items.push(item(
    "meta-length",
    "Meta description length is valid",
    5,
    article.metaDescription.length >= 140 && article.metaDescription.length <= 160 ? "pass" : "warning",
    `${article.metaDescription.length} characters. Aim for 140 to 160.`,
  ));

  const score = items.reduce((total, checklistItem) => {
    if (checklistItem.status === "pass") return total + checklistItem.points;
    if (checklistItem.status === "warning") return total + Math.round(checklistItem.points * 0.45);
    return total;
  }, 0);

  return {
    score: Math.min(100, score),
    items,
    stats: {
      wordCount,
      keywordDensity,
      paragraphCount: paragraphs.paragraphCount,
      shortParagraphRatio: paragraphs.shortParagraphRatio,
    },
  };
}

export function toMarkdown(article: SeoArticle) {
  const outline = article.outline.map((heading) => `- ${heading}`).join("\n");
  const faq = article.faq.map((entry) => `### ${entry.question}\n\n${entry.answer}`).join("\n\n");
  const altTexts = article.imageAltTexts.map((alt) => `- ${alt}`).join("\n");
  const links = article.linkPlacements
    .map((link) => `- ${link.type}: [${link.anchor}](${link.url}) in ${link.placement}`)
    .join("\n");

  return `# ${article.h1}

SEO title: ${article.seoTitle}
Meta description: ${article.metaDescription}
Slug: ${article.slug}
Schema: ${article.schemaType}

## Outline

${outline}

## Introduction

${article.introduction}

${article.body}

## Conclusion

${article.conclusion}

## FAQ

${faq}

## Suggested Image Alt Texts

${altTexts}

## Suggested Link Placement

${links}

## CTA

${article.cta}
`;
}

export function toHtml(article: SeoArticle) {
  const htmlBody = toMarkdown(article)
    .replace(/^# (.*)$/gm, "<h1>$1</h1>")
    .replace(/^## (.*)$/gm, "<h2>$1</h2>")
    .replace(/^### (.*)$/gm, "<h3>$1</h3>")
    .replace(/^- (.*)$/gm, "<li>$1</li>")
    .split(/\n{2,}/)
    .map((block) => {
      if (/^<h[1-3]>/.test(block) || /^<li>/.test(block)) return block;
      return `<p>${block.replace(/\n/g, "<br>")}</p>`;
    })
    .join("\n");
  return `<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <title>${article.seoTitle}</title>
  <meta name="description" content="${article.metaDescription}">
</head>
<body>
${htmlBody}
</body>
</html>`;
}

export function toFaqSchema(article: SeoArticle) {
  return JSON.stringify(
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: article.faq.map((entry) => ({
        "@type": "Question",
        name: entry.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: entry.answer,
        },
      })),
    },
    null,
    2,
  );
}
