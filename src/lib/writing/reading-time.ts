export function countWords(text: string): number {
  if (!text || text.trim().length === 0) return 0;
  return text
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
}

export function computeReadingTime(wordCount: number): number {
  // Average reading speed: 200 words/minute
  return Math.max(1, Math.ceil(wordCount / 200));
}

export function extractTextFromHtml(html: string): string {
  // Strip HTML tags for word counting
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}
