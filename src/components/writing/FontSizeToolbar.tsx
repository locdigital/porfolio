"use client";
/**
 * FontSizeToolbar.tsx
 *
 * Custom BlockNote FormattingToolbar that includes all default buttons PLUS
 * font-size increase / decrease controls.
 *
 * Rendered via <FormattingToolbarController formattingToolbar={FontSizeToolbar} />
 * inside WritingEditor.
 */
import {
  FormattingToolbar,
  BasicTextStyleButton,
  TextAlignButton,
  ColorStyleButton,
  NestBlockButton,
  UnnestBlockButton,
  CreateLinkButton,
  BlockTypeSelect,
} from "@blocknote/react";
import { useBlockNoteEditor, useActiveStyles } from "@blocknote/react";
import { parseFontSize, getNextFontSize } from "../../lib/writing/fontSizeStyle";

// Native button styled to match BlockNote toolbar
function TbButton({
  onClick,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        // Prevent editor losing selection when clicking toolbar button
        e.preventDefault();
        e.stopPropagation();
      }}
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: "28px",
        height: "28px",
        padding: "0 6px",
        border: "none",
        borderRadius: "4px",
        background: "transparent",
        color: disabled ? "#ccc" : "#374151",
        fontSize: "13px",
        fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "background 0.1s",
        fontFamily: "inherit",
        lineHeight: 1,
      }}
      onMouseEnter={(e) => {
        if (!disabled) (e.currentTarget as HTMLButtonElement).style.background = "#f3f4f6";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = "transparent";
      }}
    >
      {children}
    </button>
  );
}

// Decrease button
function FontDecreaseButton() {
  const editor = useBlockNoteEditor() as ReturnType<typeof useBlockNoteEditor> & {
    addStyles: (styles: Record<string, string>) => void;
    removeStyles: (styles: string[]) => void;
  };
  const activeStyles = useActiveStyles(editor) as Record<string, string | boolean | undefined>;
  const currentSize = parseFontSize(activeStyles["fontSize"] as string | undefined);
  const nextSize = getNextFontSize(currentSize, "down");
  const isAtMin = currentSize <= 12;

  const handleClick = () => {
    if (isAtMin) return;
    editor.addStyles({ fontSize: `${nextSize}px` });
  };

  return (
    <TbButton
      onClick={handleClick}
      disabled={isAtMin}
      title={`Decrease font size (${currentSize}px → ${nextSize}px)`}
    >
      {/* Small A */}
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <text x="1" y="11" fontSize="8" fontWeight="700" fill="currentColor">A</text>
        <text x="8" y="14" fontSize="11" fontWeight="700" fill="currentColor">A</text>
        <line x1="12" y1="4" x2="16" y2="4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    </TbButton>
  );
}

// Increase button
function FontIncreaseButton() {
  const editor = useBlockNoteEditor() as ReturnType<typeof useBlockNoteEditor> & {
    addStyles: (styles: Record<string, string>) => void;
    removeStyles: (styles: string[]) => void;
  };
  const activeStyles = useActiveStyles(editor) as Record<string, string | boolean | undefined>;
  const currentSize = parseFontSize(activeStyles["fontSize"] as string | undefined);
  const nextSize = getNextFontSize(currentSize, "up");
  const isAtMax = currentSize >= 72;

  const handleClick = () => {
    if (isAtMax) return;
    editor.addStyles({ fontSize: `${nextSize}px` });
  };

  return (
    <TbButton
      onClick={handleClick}
      disabled={isAtMax}
      title={`Increase font size (${currentSize}px → ${nextSize}px)`}
    >
      {/* Big A with + */}
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <text x="1" y="11" fontSize="8" fontWeight="700" fill="currentColor">A</text>
        <text x="8" y="14" fontSize="11" fontWeight="700" fill="currentColor">A</text>
        <line x1="14" y1="1" x2="14" y2="7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="11" y1="4" x2="17" y2="4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    </TbButton>
  );
}

// Font size display chip
function FontSizeChip() {
  const editor = useBlockNoteEditor();
  const activeStyles = useActiveStyles(editor) as Record<string, string | boolean | undefined>;
  const currentSize = parseFontSize(activeStyles["fontSize"] as string | undefined);

  return (
    <span
      title={`Current font size: ${currentSize}px`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: "38px",
        height: "28px",
        padding: "0 5px",
        fontSize: "11px",
        fontWeight: 600,
        color: "#555",
        background: "#f5f5f5",
        borderRadius: "4px",
        border: "1px solid #e0e0e0",
        fontFamily: "var(--sans)",
        cursor: "default",
        userSelect: "none",
        lineHeight: 1,
      }}
    >
      {currentSize}
    </span>
  );
}

export function FontSizeToolbar() {
  return (
    <FormattingToolbar>
      {/* Block type selector */}
      <BlockTypeSelect key="blockTypeSelect" />

      {/* Font size controls */}
      <FontDecreaseButton key="fontSizeDown" />
      <FontSizeChip key="fontSizeDisplay" />
      <FontIncreaseButton key="fontSizeUp" />

      {/* Default text style buttons */}
      <BasicTextStyleButton basicTextStyle="bold" key="bold" />
      <BasicTextStyleButton basicTextStyle="italic" key="italic" />
      <BasicTextStyleButton basicTextStyle="underline" key="underline" />
      <BasicTextStyleButton basicTextStyle="strike" key="strike" />
      <BasicTextStyleButton basicTextStyle="code" key="code" />

      {/* Text alignment */}
      <TextAlignButton textAlignment="left" key="alignLeft" />
      <TextAlignButton textAlignment="center" key="alignCenter" />
      <TextAlignButton textAlignment="right" key="alignRight" />

      {/* Color */}
      <ColorStyleButton key="colors" />

      {/* Nesting */}
      <NestBlockButton key="nestBlock" />
      <UnnestBlockButton key="unnestBlock" />

      {/* Link */}
      <CreateLinkButton key="createLink" />
    </FormattingToolbar>
  );
}
