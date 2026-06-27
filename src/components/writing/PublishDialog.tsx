import { X, Globe } from "lucide-react";

interface PublishDialogProps {
  open: boolean;
  postTitle: string;
  postSlug: string;
  isUpdate?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function PublishDialog({
  open,
  postTitle,
  postSlug,
  isUpdate = false,
  onConfirm,
  onCancel,
  loading = false,
}: PublishDialogProps) {
  if (!open) return null;

  return (
    <div className="dialog-overlay" role="dialog" aria-modal="true" aria-label="Publish confirmation">
      <div className={`dialog-box${isUpdate ? " dialog-box-compact" : ""}`}>
        <button
          className="dialog-close"
          onClick={onCancel}
          aria-label="Close dialog"
        >
          <X size={18} />
        </button>

        {!isUpdate && (
          <div className="dialog-icon-wrap">
            <Globe size={28} className="dialog-icon" />
          </div>
        )}

        <h2 className="dialog-title">
          {isUpdate ? "Update published post?" : "Publish this post?"}
        </h2>

        {!isUpdate && (
          <p className="dialog-desc">
            Your post will be publicly accessible at:
          </p>
        )}

        {!isUpdate && (
          <div className="dialog-slug-preview">
            <span className="dialog-slug-text">/blog/{postSlug}</span>
          </div>
        )}

        {!isUpdate && (
          <div className="dialog-meta">
            <span className="dialog-meta-label">Title:</span>
            <span className="dialog-meta-value">{postTitle || "Untitled"}</span>
          </div>
        )}

        <div className="dialog-actions">
          <button
            className="topbar-btn topbar-btn-secondary"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="topbar-btn topbar-btn-primary"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Publishing..." : isUpdate ? "Update" : "Publish"}
          </button>
        </div>
      </div>
    </div>
  );
}
