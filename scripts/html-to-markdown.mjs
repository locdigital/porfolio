import { parse } from "parse5";

const omitted = new Set(["script", "style", "svg", "nav", "button", "form", "template", "noscript"]);
const blocks = new Set(["address", "article", "aside", "div", "dl", "dt", "dd", "figure", "figcaption", "footer", "header", "main", "p", "section", "summary"]);
const attr = (node, name) => node.attrs?.find((a) => a.name === name)?.value;
const children = (node) => node.childNodes ?? [];
const escapeText = (text) => text.replace(/[\\`*_[\]<>]/g, "\\$&");

function find(node, predicate) {
  if (predicate(node)) return node;
  for (const child of children(node)) {
    const match = find(child, predicate);
    if (match) return match;
  }
}

export function htmlToMarkdown(html, canonicalUrl) {
  const document = parse(html);
  const content = find(document, (node) => node.tagName === "main") ?? find(document, (node) => node.tagName === "body");
  if (!content) throw new Error(`Missing page content: ${canonicalUrl}`);

  function url(href) {
    try {
      const resolved = new URL(href, canonicalUrl);
      return ["https:", "http:", "mailto:", "tel:"].includes(resolved.protocol) ? resolved.href.replace(/[()]/g, encodeURIComponent) : "";
    } catch { return ""; }
  }

  function render(node) {
    if (node.nodeName === "#text") return escapeText(node.value.replace(/\s+/g, " "));
    const tag = node.tagName;
    if (omitted.has(tag) || attr(node, "hidden") !== undefined || attr(node, "aria-hidden") === "true" || attr(node, "id") === "photos-list") return "";
    const body = children(node).map(render).join("");
    if (/^h[1-6]$/.test(tag)) return `\n\n${"#".repeat(Number(tag[1]))} ${body.trim()}\n\n`;
    if (tag === "a") {
      const href = url(attr(node, "href"));
      return href && body.trim() ? `[${body.trim()}](${href}) ` : body;
    }
    if (tag === "img") {
      const alt = attr(node, "alt");
      const src = url(attr(node, "src"));
      return alt?.trim() && src ? `\n\n![${escapeText(alt)}](${src})\n\n` : "";
    }
    if (tag === "strong" || tag === "b") return body.trim() ? `**${body.trim()}**` : "";
    if (tag === "em" || tag === "i") return body.trim() ? `*${body.trim()}*` : "";
    if (tag === "br") return "\n";
    if (tag === "hr") return "\n\n---\n\n";
    if (tag === "li") return `\n- ${body.trim().replace(/\n{2,}/g, "\n  ")}\n`;
    if (tag === "ul" || tag === "ol") return `\n${body}\n`;
    if (tag === "tr") return `\n${children(node).filter(n => ["td", "th"].includes(n.tagName)).map(n => children(n).map(render).join("").trim()).join(" | ")}\n`;
    if (tag === "code") return `\`${body.trim()}\``;
    return blocks.has(tag) ? `\n\n${body.trim()}\n\n` : body;
  }

  const body = render(content).replace(/[ \t]+\n/g, "\n").replace(/\n[ \t]+/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  return `${body}\n\n---\n\nSource: ${canonicalUrl}\n\n[Site guide](https://loc.digital/llms.txt) · [Contact](https://loc.digital/contact) · [Privacy](https://loc.digital/privacy)\n`;
}
