import type { ReactNode } from "react";
import { Search, X } from "lucide-react";

interface MediaSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  ariaLabel: string;
}

/** Search input with a clear button and Escape-to-clear behavior. */
export function MediaSearchInput({
  value,
  onChange,
  placeholder,
  ariaLabel,
}: MediaSearchInputProps) {
  return (
    <label className="media-app__search">
      <Search
        className="w-4 h-4 text-[#6e6e73] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
        aria-hidden="true"
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape" && value) {
            e.stopPropagation();
            onChange("");
          }
        }}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className="media-app__search-input w-full pl-9 pr-9 py-2 text-sm bg-[#f5f5f7] border border-black/[0.08] rounded-lg text-[#1d1d1f] placeholder:text-[#6e6e73] focus:bg-white transition"
      />
      {value.length > 0 && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="media-app__search-clear"
        >
          <X className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      )}
    </label>
  );
}

interface MediaFilterBarProps {
  options: readonly string[];
  selected: string;
  onSelect: (option: string) => void;
  ariaLabel: string;
  filteredCount: number;
  totalCount: number;
  countLabel: string;
}

/** Pill filter bar with live result count. */
export function MediaFilterBar({
  options,
  selected,
  onSelect,
  ariaLabel,
  filteredCount,
  totalCount,
  countLabel,
}: MediaFilterBarProps) {
  return (
    <div className="media-app__filters" role="group" aria-label={ariaLabel}>
      <div className="media-app__filter-pills">
        {options.map((option) => {
          const active = selected === option;
          return (
            <button
              key={option}
              type="button"
              onClick={() => onSelect(option)}
              aria-pressed={active}
              className={`media-app__filter px-3 py-1 rounded-full text-xs font-medium transition cursor-pointer ${
                active
                  ? "bg-[#1d1d1f] text-white"
                  : "bg-[#f5f5f7] text-[#424245] hover:bg-[#e8e8ed]"
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
      <span className="media-app__count" role="status">
        {filteredCount} of {totalCount} {countLabel}
      </span>
    </div>
  );
}

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

