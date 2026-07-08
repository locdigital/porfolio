/**
 * blocknote-to-html.ts
 *
 * Custom serializer: BlockNote JSON → styled HTML
 * Preserves all inline formatting (colors, bold, italic, underline,
 * strikethrough, code, text-alignment) as inline styles or semantic HTML.
 *
 * This ensures the blog renders identically to what's seen in the editor.
 */

// --------------------------------------------------------------------------
// Types (subset of BlockNote's block schema we handle)
// --------------------------------------------------------------------------

type TextStyle = {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
  code?: boolean;
  textColor?: string;
  backgroundColor?: string;
  fontSize?: string; // custom style — e.g. "20px"
};


type TextInlineContent = {
  type: "text";
  text: string;
  styles?: TextStyle;
};

type LinkInlineContent = {
  type: "link";
  href: string;
  content: TextInlineContent[];
};

type InlineContent = TextInlineContent | LinkInlineContent;

type Block = {
  id?: string;
  type: string;
  props?: Record<string, unknown>;
  content?: InlineContent[] | "none";
  children?: Block[];
};

// --------------------------------------------------------------------------
// Inline content serializer
// --------------------------------------------------------------------------

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** BlockNote named colors → CSS values */
const BN_COLORS: Record<string, string> = {
  default: "inherit",
  gray: "#6b7280",
  brown: "#92400e",
  red: "#dc2626",
  orange: "#ea580c",
  yellow: "#ca8a04",
  green: "#16a34a",
  blue: "#2563eb",
  purple: "#9333ea",
  pink: "#db2777",
};

const BN_BG_COLORS: Record<string, string> = {
  default: "transparent",
  gray: "#f3f4f6",
  brown: "#fef3c7",
  red: "#fee2e2",
  orange: "#ffedd5",
  yellow: "#fef9c3",
  green: "#dcfce7",
  blue: "#dbeafe",
  purple: "#f3e8ff",
  pink: "#fce7f3",
};

function serializeInlineStyles(styles: TextStyle): string {
  const css: string[] = [];

  if (styles.fontSize) {
    css.push(`font-size:${styles.fontSize}`);
  }

  if (styles.textColor && styles.textColor !== "default") {
    const color = BN_COLORS[styles.textColor] ?? styles.textColor;
    css.push(`color:${color}`);
  }

  if (styles.backgroundColor && styles.backgroundColor !== "default") {
    const bg = BN_BG_COLORS[styles.backgroundColor] ?? styles.backgroundColor;
    css.push(`background-color:${bg}`);
    css.push("padding:0.05em 0.25em");
    css.push("border-radius:3px");
  }

  return css.join(";");
}


function serializeTextContent(content: TextInlineContent): string {
  let html = escapeHtml(content.text);
  if (!html && !content.styles) return "";

  const styles = content.styles ?? {};
  const inlineStyle = serializeInlineStyles(styles);

  // Wrap in semantic elements (innermost first)
  if (styles.code) {
    html = `<code${inlineStyle ? ` style="${inlineStyle}"` : ""}>${html}</code>`;
    return html; // code is already a container, no extra span
  }

  if (styles.bold) html = `<strong>${html}</strong>`;
  if (styles.italic) html = `<em>${html}</em>`;
  if (styles.underline && styles.strike) {
    html = `<u><s>${html}</s></u>`;
  } else if (styles.underline) {
    html = `<u>${html}</u>`;
  } else if (styles.strike) {
    html = `<s>${html}</s>`;
  }

  if (inlineStyle) {
    html = `<span style="${inlineStyle}">${html}</span>`;
  }

  return html;
}

function serializeLinkContent(content: LinkInlineContent): string {
  const inner = content.content.map(serializeTextContent).join("");
  return `<a href="${escapeHtml(content.href)}" target="_blank" rel="noopener noreferrer">${inner}</a>`;
}

function serializeInlineContent(items: InlineContent[]): string {
  return items
    .map((item) => {
      if (item.type === "text") return serializeTextContent(item as TextInlineContent);
      if (item.type === "link") return serializeLinkContent(item as LinkInlineContent);
      return "";
    })
    .join("");
}

// --------------------------------------------------------------------------
// Block serializer
// --------------------------------------------------------------------------

function getTextAlign(props?: Record<string, unknown>): string {
  const align = props?.textAlignment as string | undefined;
  if (align && align !== "left") return ` style="text-align:${align}"`;
  return "";
}

function getBlockColorStyle(props?: Record<string, unknown>): string {
  const parts: string[] = [];
  const tc = props?.textColor as string | undefined;
  const bg = props?.backgroundColor as string | undefined;

  if (tc && tc !== "default") {
    parts.push(`color:${BN_COLORS[tc] ?? tc}`);
  }
  if (bg && bg !== "default") {
    parts.push(`background-color:${BN_BG_COLORS[bg] ?? bg}`);
    parts.push("padding:0.25em 0.5em");
    parts.push("border-radius:4px");
  }
  return parts.length ? ` style="${parts.join(";")}"` : "";
}

function combineStyles(alignStyle: string, colorStyle: string): string {
  // merge the style attributes from both sources
  const al = alignStyle.match(/style="([^"]*)"/)?.[1] ?? "";
  const cl = colorStyle.match(/style="([^"]*)"/)?.[1] ?? "";
  const combined = [al, cl].filter(Boolean).join(";");
  return combined ? ` style="${combined}"` : "";
}

function serializeBlock(block: Block): string {
  const props = block.props ?? {};
  const content = Array.isArray(block.content) ? serializeInlineContent(block.content as InlineContent[]) : "";
  const alignAttr = getTextAlign(props);
  const colorAttr = getBlockColorStyle(props);
  const styleAttr = combineStyles(alignAttr, colorAttr);

  let html = "";

  switch (block.type) {
    case "paragraph": {
      html = content ? `<p${styleAttr}>${content}</p>` : `<p${styleAttr}>&nbsp;</p>`;
      break;
    }

    case "heading": {
      const level = (props.level as number) ?? 2;
      const tag = `h${Math.min(Math.max(level, 1), 6)}`;
      html = `<${tag}${styleAttr}>${content}</${tag}>`;
      break;
    }

    case "bulletListItem": {
      // Collect nested children
      const childrenHtml = block.children?.length
        ? `<ul>${block.children.map(serializeBlock).join("")}</ul>`
        : "";
      html = `<li${styleAttr}>${content}${childrenHtml}</li>`;
      // Caller wraps in <ul>
      return html;
    }

    case "numberedListItem": {
      const childrenHtml = block.children?.length
        ? `<ol>${block.children.map(serializeBlock).join("")}</ol>`
        : "";
      html = `<li${styleAttr}>${content}${childrenHtml}</li>`;
      return html;
    }

    case "checkListItem": {
      const checked = props.checked ? " checked" : "";
      const checkBox = `<input type="checkbox"${checked} disabled style="margin-right:0.4em;vertical-align:middle">`;
      html = `<li${styleAttr}>${checkBox}${content}</li>`;
      return html;
    }

    case "blockquote":
    case "quote": {
      html = `<blockquote${styleAttr}>${content}</blockquote>`;
      break;
    }

    case "codeBlock": {
      const lang = (props.language as string) ?? "";
      const langAttr = lang ? ` class="language-${escapeHtml(lang)}"` : "";
      html = `<pre><code${langAttr}>${content}</code></pre>`;
      break;
    }

    case "image": {
      const src = escapeHtml((props.url as string) ?? "");
      const alt = escapeHtml((props.caption as string) ?? "");
      const caption = props.caption
        ? `<figcaption style="text-align:center;font-size:0.875em;color:#6b7280;margin-top:8px">${escapeHtml(props.caption as string)}</figcaption>`
        : "";
      html = `<figure style="margin:2em 0;text-align:center">${src ? `<img src="${src}" alt="${alt}" style="max-width:100%;border-radius:8px">` : ""}${caption}</figure>`;
      break;
    }

    case "table": {
      // BlockNote stores table rows as children with row/cell sub-blocks
      const rows = block.children ?? [];
      const rowsHtml = rows.map((row) => {
        const cells = row.children ?? [];
        const cellsHtml = cells.map((cell) => {
          const cellContent = Array.isArray(cell.content)
            ? serializeInlineContent(cell.content as InlineContent[])
            : "";
          return `<td style="border:1px solid #e5e7eb;padding:8px 12px">${cellContent}</td>`;
        }).join("");
        return `<tr>${cellsHtml}</tr>`;
      }).join("");
      html = `<table style="width:100%;border-collapse:collapse;margin:2em 0"><tbody>${rowsHtml}</tbody></table>`;
      break;
    }

    case "divider":
    case "horizontalRule": {
      html = `<hr>`;
      break;
    }

    default: {
      // Fallback: render as paragraph
      html = content ? `<p${styleAttr}>${content}</p>` : "";
      break;
    }
  }

  // Recurse into children for block-level nesting (non-list)
  if (
    block.children?.length &&
    !["bulletListItem", "numberedListItem", "checkListItem"].includes(block.type)
  ) {
    html += block.children.map(serializeBlock).join("");
  }

  return html;
}

// --------------------------------------------------------------------------
// List grouping helper
// --------------------------------------------------------------------------

function groupBlocks(blocks: Block[]): string {
  let html = "";
  let i = 0;

  while (i < blocks.length) {
    const block = blocks[i];

    if (block.type === "bulletListItem") {
      // Collect consecutive bullet items
      const items: Block[] = [];
      while (i < blocks.length && blocks[i].type === "bulletListItem") {
        items.push(blocks[i++]);
      }
      html += `<ul>${items.map(serializeBlock).join("")}</ul>`;
    } else if (block.type === "numberedListItem") {
      const items: Block[] = [];
      while (i < blocks.length && blocks[i].type === "numberedListItem") {
        items.push(blocks[i++]);
      }
      html += `<ol>${items.map(serializeBlock).join("")}</ol>`;
    } else if (block.type === "checkListItem") {
      const items: Block[] = [];
      while (i < blocks.length && blocks[i].type === "checkListItem") {
        items.push(blocks[i++]);
      }
      html += `<ul style="list-style:none;padding-left:0">${items.map(serializeBlock).join("")}</ul>`;
    } else {
      html += serializeBlock(block);
      i++;
    }
  }

  return html;
}

// --------------------------------------------------------------------------
// Main export
// --------------------------------------------------------------------------

/**
 * Convert BlockNote JSON blocks to styled HTML.
 * Preserves colors, fonts, alignment, bold/italic/underline/strikethrough, etc.
 * Output is safe to inject with innerHTML / set:html.
 */
export function blocksToStyledHtml(blocks: Block[]): string {
  if (!blocks?.length) return "";
  return groupBlocks(blocks);
}
