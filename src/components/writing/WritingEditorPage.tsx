"use client";
import { useState, useCallback, useRef, useEffect, lazy, Suspense } from "react";
import { useDebouncedCallback } from "use-debounce";
import type { Block } from "@blocknote/core";
import type { Post } from "../../lib/writing/posts";
import type { SaveStatus } from "./EditorTopBar";
import EditorTopBar from "./EditorTopBar";
import SeoSidebar from "./SeoSidebar";
import PublishDialog from "./PublishDialog";
import { generateSlug } from "../../lib/writing/slug";

const WritingEditor = lazy(() => import("./WritingEditor"));

interface WritingEditorPageProps {
  initialPost: Post;
}

const LOCAL_DRAFT_PREFIX = "writing-editor-draft-";

export default function WritingEditorPage({ initialPost }: WritingEditorPageProps) {
  const [post, setPost] = useState<Post>(initialPost);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [publishLoading, setPublishLoading] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);
  const titleRef = useRef<HTMLTextAreaElement>(null);

  const localKey = `${LOCAL_DRAFT_PREFIX}${initialPost.id}`;

  // Auto-resize textarea
  const autoResizeTitle = useCallback(() => {
    const el = titleRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    }
  }, []);

  useEffect(() => {
    autoResizeTitle();
  }, [post.title]);

  // Patch API call
  const patchPost = useCallback(async (updates: Partial<Post>): Promise<boolean> => {
    try {
      const res = await fetch(`/api/writing/posts/${initialPost.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (data.success) {
        setPost((prev) => ({
          ...prev,
          wordCount: data.data.wordCount ?? prev.wordCount,
          readingTime: data.data.readingTime ?? prev.readingTime,
          updatedAt: data.data.updatedAt ?? prev.updatedAt,
          publishedAt: data.data.publishedAt ?? prev.publishedAt,
          status: data.data.status ?? prev.status,
        }));
        localStorage.removeItem(localKey);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [initialPost.id, localKey]);

  // Autosave debounced
  const autoSave = useDebouncedCallback(async (updates: Partial<Post>) => {
    setSaveStatus("saving");
    const ok = await patchPost(updates);
    setSaveStatus(ok ? "saved" : "error");
  }, 1200);

  const updatePost = useCallback(
    (updates: Partial<Post>) => {
      setPost((prev) => {
        const next = { ...prev, ...updates };
        // Save local backup
        localStorage.setItem(localKey, JSON.stringify({ ...next, _localAt: Date.now() }));
        setSaveStatus("unsaved");
        autoSave(updates);
        return next;
      });
    },
    [autoSave, localKey]
  );

  // Editor content change
  const handleEditorChange = useCallback(
    (blocks: Block[], html: string) => {
      updatePost({ contentJson: blocks, contentHtml: html });
    },
    [updatePost]
  );

  // Title change
  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const title = e.target.value;
      const slug = post.slug === generateSlug(post.title) || !post.slug
        ? generateSlug(title)
        : post.slug;
      updatePost({ title, slug });
      autoResizeTitle();
    },
    [post.slug, post.title, updatePost, autoResizeTitle]
  );

  // Keyboard shortcut Cmd+S
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        handleSaveDraft();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [post]);

  const handleSaveDraft = useCallback(async () => {
    setSaveStatus("saving");
    const ok = await patchPost(post);
    setSaveStatus(ok ? "saved" : "error");
  }, [patchPost, post]);

  const handleConfirmPublish = useCallback(async () => {
    setPublishLoading(true);
    setPublishSuccess(false);
    try {
      // Save current state first
      await patchPost(post);
      // Publish
      const res = await fetch(`/api/writing/posts/${initialPost.id}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "publish" }),
      });
      const data = await res.json();
      if (data.success) {
        setPost(data.data as Post);
        setShowPublishDialog(false);
        setSaveStatus("saved");
        setPublishSuccess(true);
        window.setTimeout(() => setPublishSuccess(false), 1400);
      }
    } finally {
      setPublishLoading(false);
    }
  }, [initialPost.id, patchPost, post]);

  const handlePublish = useCallback(() => {
    if (publishLoading) return;
    if (!post.title?.trim()) {
      alert("Please add a title before publishing.");
      return;
    }
    if (!post.slug?.trim()) {
      alert("Please add a slug before publishing.");
      return;
    }
    if (post.status === "published") {
      void handleConfirmPublish();
      return;
    }
    setShowPublishDialog(true);
  }, [handleConfirmPublish, post.slug, post.status, post.title, publishLoading]);

  // Initial content for BlockNote — stable reference from initialPost
  const initialContent =
    Array.isArray(initialPost.contentJson) && initialPost.contentJson.length > 0
      ? (initialPost.contentJson as Block[])
      : undefined;

  return (
    <div className="writing-page">
      <EditorTopBar
        post={post}
        saveStatus={saveStatus}
        publishStatus={publishLoading ? "loading" : publishSuccess ? "success" : "idle"}
        onSaveDraft={handleSaveDraft}
        onPublish={handlePublish}
      />

      <div className="writing-body">
        {/* Main editor area */}
        <main className="writing-main">
          <div className="writing-editor-container">
            {/* Status badge */}
            {post.status === "published" && (
              <div className="post-status-badge post-status-published">Published</div>
            )}
            {post.status === "draft" && (
              <div className="post-status-badge post-status-draft">Draft</div>
            )}

            {/* Title */}
            <textarea
              ref={titleRef}
              className="writing-title-input"
              placeholder="Untitled"
              value={post.title === "Untitled" ? "" : post.title}
              onChange={handleTitleChange}
              rows={1}
              aria-label="Post title"
            />

            {/* Slug input */}
            <div className="writing-slug-row">
              <span className="writing-slug-prefix">/blog/</span>
              <input
                type="text"
                className="writing-slug-input"
                value={post.slug ?? ""}
                placeholder="post-slug"
                onChange={(e) => updatePost({ slug: e.target.value })}
                aria-label="Post slug"
              />
            </div>

            {/* BlockNote Editor */}
            <div className="blocknote-wrapper">
              <Suspense
                fallback={
                  <div className="editor-loading">
                    <div className="editor-loading-dot" />
                    <div className="editor-loading-dot" />
                    <div className="editor-loading-dot" />
                  </div>
                }
              >
                <WritingEditor
                  key={initialPost.id}
                  initialContent={initialContent}
                  onChange={handleEditorChange}
                />
              </Suspense>
            </div>
          </div>
        </main>

        {/* SEO Sidebar */}
        <SeoSidebar post={post} onUpdate={updatePost} />
      </div>

      <PublishDialog
        open={showPublishDialog}
        postTitle={post.title ?? ""}
        postSlug={post.slug ?? ""}
        isUpdate={post.status === "published"}
        onConfirm={handleConfirmPublish}
        onCancel={() => setShowPublishDialog(false)}
        loading={publishLoading}
      />
    </div>
  );
}
