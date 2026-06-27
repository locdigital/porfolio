import { useMemo, useState } from "react";
import { CheckCircle, AlertCircle, XCircle, Sparkles, Loader2 } from "lucide-react";
import type { SeoCheckResult } from "../../lib/writing/seo";
import type { Post } from "../../lib/writing/posts";
import { computeSeoChecklist, computeSeoScore } from "../../lib/writing/seo";
import {
  applySeoAutofill,
  suggestSeoAutofill,
  type SeoAutofillField,
  type SeoAutofillPreview,
} from "../../lib/writing/seo-autofill";

interface SeoSidebarProps {
  post: Partial<Post>;
  onUpdate: (fields: Partial<Post>) => void;
}

function StatusIcon({ status }: { status: SeoCheckResult["status"] }) {
  if (status === "good")
    return <CheckCircle size={14} className="text-emerald-500 shrink-0" />;
  if (status === "improvement")
    return <AlertCircle size={14} className="text-amber-500 shrink-0" />;
  return <XCircle size={14} className="text-red-400 shrink-0" />;
}

const fieldLabels: Record<SeoAutofillField, string> = {
  seoTitle: "SEO Title",
  seoDescription: "Meta Description",
  focusKeyword: "Focus Keyword",
  slug: "Slug",
  ogTitle: "OG Title",
  ogDescription: "OG Description",
  ogImage: "OG Image",
};

export default function SeoSidebar({ post, onUpdate }: SeoSidebarProps) {
  const checks = computeSeoChecklist(post);
  const score = computeSeoScore(checks);
  const [showAutofillPreview, setShowAutofillPreview] = useState(false);
  const [aiPreview, setAiPreview] = useState<SeoAutofillPreview | null>(null);
  const [aiSource, setAiSource] = useState<"gemini" | "fallback" | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const localAutofillPreview = useMemo(() => suggestSeoAutofill(post), [post]);
  const autofillPreview = aiPreview ?? localAutofillPreview;

  const scoreColor =
    score >= 80 ? "text-emerald-600" : score >= 50 ? "text-amber-600" : "text-red-500";

  const scoreBarColor =
    score >= 80 ? "bg-emerald-500" : score >= 50 ? "bg-amber-400" : "bg-red-400";

  const loadAiPreview = async () => {
    setIsAiLoading(true);
    setAiError("");

    try {
      const response = await fetch("/api/writing/seo-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post }),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Could not auto-fill SEO.");
      }

      setAiPreview(result.preview);
      setAiSource(result.source === "gemini" ? "gemini" : "fallback");
    } catch (error) {
      setAiPreview(null);
      setAiSource("fallback");
      setAiError(error instanceof Error ? error.message : "Could not auto-fill SEO.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleToggleAutofill = () => {
    setShowAutofillPreview((value) => {
      const nextValue = !value;
      if (nextValue) void loadAiPreview();
      return nextValue;
    });
  };

  const handleApplyAutofill = (overwrite = false) => {
    if (overwrite) {
      const confirmed = window.confirm(
        "Replace existing SEO fields with the auto-fill suggestions?"
      );
      if (!confirmed) return;
    }

    const updates = applySeoAutofill(post, autofillPreview.suggestions, { overwrite });
    if (Object.keys(updates).length === 0) {
      setShowAutofillPreview(false);
      return;
    }

    onUpdate(updates);
    setShowAutofillPreview(false);
  };

  return (
    <aside className="writing-seo-sidebar">
      <div className="seo-sidebar-header">
        <h2 className="seo-sidebar-title">SEO Settings</h2>
        <div className="seo-score-wrap">
          <span className={`seo-score-num ${scoreColor}`}>{score}</span>
          <span className="seo-score-label">/100</span>
        </div>
      </div>
      <div className="seo-score-bar-bg">
        <div className={`seo-score-bar ${scoreBarColor}`} style={{ width: `${score}%` }} />
      </div>

      <div className="seo-autofill">
        <button
          type="button"
          className="seo-autofill-button"
          onClick={handleToggleAutofill}
          disabled={isAiLoading}
        >
          {isAiLoading ? <Loader2 size={14} className="seo-autofill-spin" /> : <Sparkles size={14} />}
          <span>{isAiLoading ? "Auto-filling..." : "Auto-fill SEO"}</span>
        </button>

        {showAutofillPreview && (
          <div className="seo-autofill-preview">
            <div className="seo-autofill-score">
              <span>
                Score
                {aiSource && (
                  <small className="seo-autofill-source">
                    {aiSource === "gemini" ? "Gemini" : "Local fallback"}
                  </small>
                )}
              </span>
              <strong>
                {autofillPreview.currentScore} → {autofillPreview.projectedScore}
              </strong>
            </div>
            {aiError && <p className="seo-autofill-error">{aiError}</p>}

            <div className="seo-autofill-list">
              {Object.entries(autofillPreview.suggestions).map(([field, value]) => {
                const typedField = field as SeoAutofillField;
                const willFill = autofillPreview.missingFields.includes(typedField);
                return (
                  <div key={field} className="seo-autofill-row">
                    <span className="seo-autofill-field">
                      {fieldLabels[typedField]}
                      {!willFill && <small>existing</small>}
                    </span>
                    <span className="seo-autofill-value">{value}</span>
                  </div>
                );
              })}
            </div>

            <div className="seo-autofill-actions">
              <button
                type="button"
                className="seo-autofill-secondary"
                onClick={() => setShowAutofillPreview(false)}
              >
                Cancel
              </button>
              {autofillPreview.filledFields.length > 0 && (
                <button
                  type="button"
                  className="seo-autofill-secondary"
                  onClick={() => handleApplyAutofill(true)}
                >
                  Replace all
                </button>
              )}
              <button
                type="button"
                className="seo-autofill-primary"
                onClick={() => handleApplyAutofill(false)}
              >
                Apply missing
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Fields */}
      <div className="seo-fields">
        <SeoField
          label="SEO Title"
          hint={`${(post.seoTitle ?? "").length}/60`}
          value={post.seoTitle ?? ""}
          placeholder="SEO title (45–60 chars)"
          onChange={(v) => onUpdate({ seoTitle: v })}
        />
        <SeoTextarea
          label="Meta Description"
          hint={`${(post.seoDescription ?? "").length}/160`}
          value={post.seoDescription ?? ""}
          placeholder="Meta description (120–160 chars)"
          onChange={(v) => onUpdate({ seoDescription: v })}
        />
        <SeoField
          label="Focus Keyword"
          value={post.focusKeyword ?? ""}
          placeholder="e.g. web design tips"
          onChange={(v) => onUpdate({ focusKeyword: v })}
        />
        <SeoField
          label="Slug"
          value={post.slug ?? ""}
          placeholder="my-blog-post"
          onChange={(v) => onUpdate({ slug: v })}
          mono
        />
        <SeoField
          label="Canonical URL"
          value={post.canonicalUrl ?? ""}
          placeholder="https://..."
          onChange={(v) => onUpdate({ canonicalUrl: v })}
        />

        <div className="seo-divider" />
        <p className="seo-section-label">Open Graph</p>

        <SeoField
          label="OG Title"
          value={post.ogTitle ?? ""}
          placeholder="OG title for social"
          onChange={(v) => onUpdate({ ogTitle: v })}
        />
        <SeoTextarea
          label="OG Description"
          value={post.ogDescription ?? ""}
          placeholder="OG description"
          onChange={(v) => onUpdate({ ogDescription: v })}
        />
        <SeoField
          label="OG Image URL"
          value={post.ogImage ?? ""}
          placeholder="https://..."
          onChange={(v) => onUpdate({ ogImage: v })}
        />

        <div className="seo-divider" />
        <p className="seo-section-label">Taxonomy</p>

        <SeoField
          label="Category"
          value={post.category ?? ""}
          placeholder="e.g. Design"
          onChange={(v) => onUpdate({ category: v })}
        />
        <SeoField
          label="Tags"
          value={(post.tags ?? []).join(", ")}
          placeholder="tag1, tag2, tag3"
          onChange={(v) =>
            onUpdate({ tags: v.split(",").map((t) => t.trim()).filter(Boolean) })
          }
        />
        <SeoField
          label="Author"
          value={post.author ?? ""}
          placeholder="Your name"
          onChange={(v) => onUpdate({ author: v })}
        />
      </div>

      {/* Checklist */}
      <div className="seo-checklist-section">
        <p className="seo-section-label">SEO Checklist</p>
        <ul className="seo-checklist">
          {checks.map((check) => (
            <li key={check.id} className="seo-check-item">
              <StatusIcon status={check.status} />
              <span className="seo-check-label">
                {check.label}
                {check.detail && (
                  <span className="seo-check-detail"> — {check.detail}</span>
                )}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}

interface SeoFieldProps {
  label: string;
  value: string;
  placeholder?: string;
  hint?: string;
  mono?: boolean;
  onChange: (v: string) => void;
}

function SeoField({ label, value, placeholder, hint, mono, onChange }: SeoFieldProps) {
  return (
    <div className="seo-field">
      <div className="seo-field-header">
        <label className="seo-field-label">{label}</label>
        {hint && <span className="seo-field-hint">{hint}</span>}
      </div>
      <input
        type="text"
        className={`seo-input${mono ? " seo-input-mono" : ""}`}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function SeoTextarea({ label, value, placeholder, hint, onChange }: SeoFieldProps) {
  return (
    <div className="seo-field">
      <div className="seo-field-header">
        <label className="seo-field-label">{label}</label>
        {hint && <span className="seo-field-hint">{hint}</span>}
      </div>
      <textarea
        className="seo-textarea"
        value={value}
        placeholder={placeholder}
        rows={3}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
