import type { Post } from "./posts";
import { generateSlug, normalizeSlug } from "./slug";
import { computeSeoChecklist, computeSeoScore } from "./seo";

export type SeoAutofillField =
  | "seoTitle"
  | "seoDescription"
  | "focusKeyword"
  | "slug"
  | "ogTitle"
  | "ogDescription"
  | "ogImage";

export type SeoAutofillSuggestion = Pick<Post, SeoAutofillField>;

export interface SeoAutofillPreview {
  suggestions: Partial<SeoAutofillSuggestion>;
  missingFields: SeoAutofillField[];
  filledFields: SeoAutofillField[];
  currentScore: number;
  projectedScore: number;
}

const AUTOFILL_FIELDS: SeoAutofillField[] = [
  "seoTitle",
  "seoDescription",
  "focusKeyword",
  "slug",
  "ogTitle",
  "ogDescription",
  "ogImage",
];

const STOP_WORDS = new Set([
  "anh",
  "ban",
  "bang",
  "cac",
  "cach",
  "cho",
  "con",
  "cua",
  "cuoc",
  "dang",
  "day",
  "den",
  "doi",
  "duoc",
  "hay",
  "khi",
  "khong",
  "la",
  "lam",
  "mot",
  "nay",
  "nhu",
  "nhung",
  "sau",
  "toi",
  "trong",
  "tu",
  "va",
  "vao",
  "ve",
  "voi",
  "and",
  "are",
  "for",
  "from",
  "how",
  "that",
  "the",
  "this",
  "what",
  "with",
  "you",
  "your",
]);

function hasValue(value: unknown) {
  return typeof value === "string" ? value.trim().length > 0 : Boolean(value);
}

export function normalizeSeoSourceText(value: string) {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^>\s+/gm, "")
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_~]+/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/\s+([,.!?;:])/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

export function sanitizeSeoText(value: string, maxLength: number) {
  return truncateAtWord(normalizeSeoSourceText(value), maxLength);
}

function normalizeKeywordToken(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s]/g, "")
    .trim();
}

function sentenceParts(text: string) {
  return text
    .split(/(?<=[.!?。])\s+|\n+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function truncateAtWord(value: string, maxLength: number) {
  const text = value.replace(/\s+/g, " ").trim();
  if (text.length <= maxLength) return text;

  const sliced = text.slice(0, maxLength + 1);
  const boundary = sliced.search(/\s+\S*$/);
  const trimmed = (boundary > 0 ? sliced.slice(0, boundary) : text.slice(0, maxLength)).trim();
  return trimmed.replace(/[,:;\-–—]+$/g, "").trim();
}

function appendUntilLimit(base: string, addition: string, maxLength: number) {
  const cleanBase = base.trim();
  const cleanAddition = addition.trim();
  if (!cleanAddition) return truncateAtWord(cleanBase, maxLength);

  const combined = `${cleanBase} - ${cleanAddition}`;
  if (combined.length <= maxLength) return combined;

  const room = maxLength - cleanBase.length - 3;
  if (room <= 8) return truncateAtWord(cleanBase, maxLength);
  return `${cleanBase} - ${truncateAtWord(cleanAddition, room)}`;
}

function deriveKeyword(post: Partial<Post>, plainContent: string) {
  const title = (post.title ?? "").trim();
  if (title && title !== "Untitled" && title.length <= 60) return title;

  const source = normalizeKeywordToken(`${title} ${plainContent}`);
  const tokens = source
    .split(/\s+/)
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
  const scores = new Map<string, number>();

  for (let size = 1; size <= 3; size += 1) {
    for (let index = 0; index <= tokens.length - size; index += 1) {
      const phrase = tokens.slice(index, index + size).join(" ");
      if (phrase.length < 4) continue;
      scores.set(phrase, (scores.get(phrase) ?? 0) + (size === 1 ? 1 : size === 2 ? 4 : 6));
    }
  }

  return (
    Array.from(scores.entries()).sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)[0]?.[0] ??
    title ??
    ""
  );
}

function buildSeoTitle(post: Partial<Post>, keyword: string, plainContent: string) {
  const title = (post.title ?? "").trim();
  const base = title && title !== "Untitled" ? title : keyword;
  const safeBase = truncateAtWord(base || "Untitled", 60);

  if (safeBase.length >= 45 && safeBase.length <= 60) return safeBase;
  if (safeBase.length > 60) return truncateAtWord(safeBase, 60);

  const firstUsefulSentence =
    sentenceParts(plainContent).find((sentence) => !sentence.toLowerCase().includes(safeBase.toLowerCase())) ??
    "";
  return appendUntilLimit(safeBase, firstUsefulSentence, 60);
}

function buildDescription(keyword: string, plainContent: string, title: string) {
  const source = sentenceParts(plainContent).join(" ");
  const keywordPrefix = keyword && !source.toLowerCase().includes(keyword.toLowerCase()) ? `${keyword}: ` : "";
  const fallback = title ? `${title}: ${plainContent}` : plainContent;
  const description = `${keywordPrefix}${source || fallback}`.trim();
  return truncateAtWord(description, 160);
}

function bestSuggestion(post: Partial<Post>, suggestion: SeoAutofillSuggestion) {
  const candidates: SeoAutofillSuggestion[] = [
    suggestion,
    { ...suggestion, ogTitle: suggestion.seoTitle, ogDescription: suggestion.seoDescription },
  ];

  return candidates
    .map((candidate) => ({
      candidate,
      score: computeSeoScore(computeSeoChecklist({ ...post, ...candidate })),
    }))
    .sort((a, b) => b.score - a.score)[0].candidate;
}

export function suggestSeoAutofill(post: Partial<Post>): SeoAutofillPreview {
  const plainContent = normalizeSeoSourceText(`${post.contentMarkdown ?? ""} ${post.contentHtml ?? ""}`);
  const keyword = truncateAtWord((post.focusKeyword ?? "").trim() || deriveKeyword(post, plainContent), 60);
  const seoTitle = buildSeoTitle(post, keyword, plainContent);
  const seoDescription = buildDescription(keyword, plainContent, post.title ?? "");
  const slug = normalizeSlug(post.slug ?? "") || generateSlug(keyword || post.title || "post");
  const ogImage = post.ogImage || post.coverImage || "/og-image.jpg";

  const suggestion = bestSuggestion(post, {
    seoTitle,
    seoDescription,
    focusKeyword: keyword,
    slug,
    ogTitle: seoTitle,
    ogDescription: seoDescription,
    ogImage,
  });

  const missingFields = AUTOFILL_FIELDS.filter((field) => !hasValue(post[field]));
  const filledFields = AUTOFILL_FIELDS.filter((field) => hasValue(post[field]));
  const currentScore = computeSeoScore(computeSeoChecklist(post));
  const projectedPost = { ...post };

  for (const field of missingFields) {
    projectedPost[field] = suggestion[field];
  }

  return {
    suggestions: suggestion,
    missingFields,
    filledFields,
    currentScore,
    projectedScore: computeSeoScore(computeSeoChecklist(projectedPost)),
  };
}

export function applySeoAutofill(
  post: Partial<Post>,
  suggestions: Partial<SeoAutofillSuggestion>,
  options: { overwrite?: boolean } = {}
): Partial<SeoAutofillSuggestion> {
  const updates: Partial<SeoAutofillSuggestion> = {};

  for (const field of AUTOFILL_FIELDS) {
    const suggestion = suggestions[field];
    if (!suggestion) continue;
    if (!options.overwrite && hasValue(post[field])) continue;
    updates[field] = suggestion;
  }

  return updates;
}
