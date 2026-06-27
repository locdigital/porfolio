"use client";
import "@blocknote/mantine/style.css";
import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import type { Block, PartialBlock } from "@blocknote/core";
import { useEffect, useRef, memo } from "react";

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

    const handleChange = async () => {
      const blocks = editor.document as Block[];
      const html = await editor.blocksToFullHTML(blocks);
      onChangeRef.current?.(blocks, html);
    };

    // Subscribe to editor changes
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
        fontFamily: "'Inter', sans-serif",
        fontSize: "17px",
        lineHeight: "1.75",
      }}
    />
  );
})

export default WritingEditor;
