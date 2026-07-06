import { AlertCircle, ArrowLeft, CheckCircle, Clock, ExternalLink, FileText, Loader2, Save } from "lucide-react";
import type { Post } from "../../lib/writing/posts";

export type SaveStatus = "saved" | "saving" | "unsaved" | "error";

interface EditorTopBarProps {
  post: Partial<Post>;
  saveStatus: SaveStatus;
  publishStatus?: "idle" | "loading" | "success";
  onSaveDraft: () => void;
  onPublish: () => void;
}

const statusConfig: Record<
  SaveStatus,
  { icon: React.ReactNode; text: string; className: string }
> = {
  saved: {
    icon: <CheckCircle size={13} />,
    text: "Saved",
    className: "topbar-status-saved",
  },
  saving: {
    icon: <Loader2 size={13} className="animate-spin" />,
    text: "Saving...",
    className: "topbar-status-saving",
  },
  unsaved: {
    icon: <AlertCircle size={13} />,
    text: "Unsaved changes",
    className: "topbar-status-unsaved",
  },
  error: {
    icon: <AlertCircle size={13} />,
    text: "Could not save",
    className: "topbar-status-error",
  },
};

export default function EditorTopBar({
  post,
  saveStatus,
  publishStatus = "idle",
  onSaveDraft,
  onPublish,
}: EditorTopBarProps) {
  const { icon, text, className } = statusConfig[saveStatus];
  const isPublished = post.status === "published";
  const publicHref = post.slug ? `/blog/${post.slug}` : undefined;

  return (
    <header className="editor-topbar">
      <div className="topbar-left">
        <a href="/cms/writing" className="topbar-back" aria-label="Back to Writing">
          <ArrowLeft size={16} />
          <span>Writing</span>
        </a>
        <div className={`topbar-save-status ${className}`}>
          {icon}
          <span>{text}</span>
        </div>
        {(post.wordCount ?? 0) > 0 && (
          <div className="topbar-meta">
            <FileText size={13} />
            <span>{post.wordCount?.toLocaleString()} words</span>
            <span className="topbar-meta-dot">·</span>
            <Clock size={13} />
            <span>{post.readingTime} min read</span>
          </div>
        )}
      </div>

      <div className="topbar-right">
        <a
          className={`topbar-btn topbar-btn-secondary${publicHref ? "" : " topbar-btn-disabled"}`}
          href={publicHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="View public post page"
          title={publicHref ? "View public page" : "Add a slug before opening the public page"}
        >
          <ExternalLink size={15} />
          <span>View page</span>
        </a>
        <button
          className="topbar-btn topbar-btn-secondary"
          onClick={onSaveDraft}
          aria-label="Save draft"
          disabled={saveStatus === "saving"}
        >
          <Save size={15} />
          <span>Save Draft</span>
        </button>
        <button
          className={`topbar-btn topbar-btn-primary${publishStatus === "success" ? " topbar-btn-success" : ""}`}
          onClick={onPublish}
          aria-label={isPublished ? "Update post" : "Publish post"}
          disabled={publishStatus === "loading"}
        >
          <span>{isPublished ? "Update" : "Publish"}</span>
        </button>
      </div>
    </header>
  );
}
