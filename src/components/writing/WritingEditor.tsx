"use client";
import "@blocknote/mantine/style.css";
import "../../styles/writing-editor.css";
import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import type { Block, PartialBlock } from "@blocknote/core";
import { defaultStyleSpecs } from "@blocknote/core";
import { useEffect, useRef, memo } from "react";
import { blocksToStyledHtml } from "../../lib/writing/blocknote-to-html";
import { fontSizeStyle } from "../../lib/writing/fontSizeStyle";

// Extend default style schema with our custom fontSize style
const customStyleSpecs = {
  ...defaultStyleSpecs,
  fontSize: fontSizeStyle,
};

interface WritingEditorProps {
  initialContent?: PartialBlock[];
  onChange?: (blocks: Block[], html: string) => void;
  editable?: boolean;
}

const WritingEditor = memo(function WritingEditor({
  initialContent,
  onChange,
  editable = true,
}: WritingEditorProps) {
  const editor = useCreateBlockNote({
    styleSchema: customStyleSpecs,
    initialContent:
      initialContent && initialContent.length > 0
        ? initialContent
        : undefined,
    uploadFile: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/writing/uploads/image", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error ?? "Upload failed");
      return data.url as string;
    },
  });

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!onChange) return;

    const handleChange = () => {
      const blocks = editor.document as Block[];
      // Custom serializer preserves colors, fontSize, font, alignment as inline styles
      const html = blocksToStyledHtml(blocks as never);
      onChangeRef.current?.(blocks, html);
    };

    const unsubscribe = editor.onChange(handleChange);
    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, [editor]);

  return (
    <BlockNoteView
      editor={editor}
      editable={editable}
      theme="light"
      style={{
        fontFamily: "var(--sans)",
        fontSize: "17px",
        lineHeight: "1.75",
      }}
    />
  );
})

export default WritingEditor;
