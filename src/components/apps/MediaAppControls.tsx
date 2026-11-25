import type { ReactNode } from "react";

interface MediaEmptyStateProps {
  message: ReactNode;
  onReset: () => void;
}

/** Empty state shown when search or filter yields no items. */
export function MediaEmptyState({ message, onReset }: MediaEmptyStateProps) {
  return (
    <div className="media-app__empty" role="status">
      <p>{message}</p>
      <button type="button" onClick={onReset}>
        Clear filters
      </button>
    </div>
  );
}
