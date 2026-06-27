import { X } from "lucide-react";

interface DeleteConfirmDialogProps {
  open: boolean;
  title?: string;
  description?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function DeleteConfirmDialog({
  open,
  title = "Are you sure?",
  description = "Are you sure you want to delete this item? This action cannot be undone.",
  onConfirm,
  onCancel,
  loading = false,
}: DeleteConfirmDialogProps) {
  if (!open) return null;

  return (
    <div
      className="delete-dialog-overlay"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-dialog-title"
    >
      <div
        className="delete-dialog-box"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="delete-dialog-close"
          onClick={onCancel}
          aria-label="Close dialog"
          disabled={loading}
        >
          <X size={16} />
        </button>

        <h3 id="delete-dialog-title" className="delete-dialog-title">
          {title}
        </h3>
        <p className="delete-dialog-desc">
          {description}
        </p>

        <div className="delete-dialog-actions">
          <button
            type="button"
            className="delete-dialog-btn delete-dialog-btn-cancel"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            className="delete-dialog-btn delete-dialog-btn-delete"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
