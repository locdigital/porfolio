/**
 * fontSizeStyle.ts
 * Custom BlockNote style spec for font size.
 * Uses createStyleSpec so BlockNote tracks it in block JSON.
 */

import { createStyleSpec } from "@blocknote/core";

export const fontSizeStyle = createStyleSpec(
  {
    type: "fontSize",
    propSchema: "string", // stored as CSS value e.g. "14px", "20px"
  },
  {
    render: (value: string) => {
      const span = document.createElement("span");
      span.style.fontSize = value;
      return { dom: span, contentDOM: span };
    },
    toExternalHTML: (value: string) => {
      const span = document.createElement("span");
      span.style.fontSize = value;
      return { dom: span, contentDOM: span };
    },
    parse: (element: HTMLElement) => {
      const size = element.style.fontSize;
      return size || undefined;
    },
  }
);

// ---- Font size scale used by the UI buttons ----
export const FONT_SIZES = [12, 13, 14, 16, 18, 20, 24, 28, 32, 36, 42, 48, 56, 64, 72];
export const DEFAULT_FONT_SIZE = 17; // px — matches the editor body font size

export function getNextFontSize(current: number, direction: "up" | "down"): number {
  if (direction === "up") {
    const next = FONT_SIZES.find((s) => s > current);
    return next ?? FONT_SIZES[FONT_SIZES.length - 1];
  } else {
    const prev = [...FONT_SIZES].reverse().find((s) => s < current);
    return prev ?? FONT_SIZES[0];
  }
}

export function parseFontSize(value: string | undefined): number {
  if (!value) return DEFAULT_FONT_SIZE;
  const px = parseFloat(value);
  return isNaN(px) ? DEFAULT_FONT_SIZE : px;
}
