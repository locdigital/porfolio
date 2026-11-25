import { useEffect, useMemo, useState } from "react";
import { Bookmark, Check, Copy, ExternalLink, Search, Sliders } from "lucide-react";
import {
  NIKON_EDITORIAL_TAGS,
  NIKON_IMAGING_CLOUD_GALLERY_URL,
  NIKON_RECIPES,
  type NikonRecipe,
} from "../../data/nikon-recipes";

const FAVORITES_KEY = "nikon-recipes-favorites-v1";

export function NikonRecipesApp() {
  const [query, setQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string>("All");
  const [selectedRecipe, setSelectedRecipe] = useState<NikonRecipe>(NIKON_RECIPES[0]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]");
      if (Array.isArray(saved)) setFavorites(saved);
    } catch {}
  }, []);

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      try {
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const handleCopyNotes = async (recipe: NikonRecipe) => {
    const text = `${recipe.name} by ${recipe.creator}\n${recipe.summary}\n${recipe.notes}\nOfficial Gallery: ${recipe.officialUrl}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(recipe.id);
      window.setTimeout(() => setCopiedId(null), 1800);
    } catch {}
  };

  const filteredRecipes = useMemo(() => {
    const q = query.trim().toLowerCase();
    return NIKON_RECIPES.filter((recipe) => {
      const matchesTag =
        selectedTag === "All" ||
        recipe.editorialTags.includes(selectedTag as NikonRecipe["editorialTags"][number]);
      const matchesQuery =
        !q ||
        recipe.name.toLowerCase().includes(q) ||
        recipe.creator.toLowerCase().includes(q) ||
        recipe.summary.toLowerCase().includes(q);
      return matchesTag && matchesQuery;
    });
  }, [query, selectedTag]);

  return (
    <div className="min-h-full bg-white text-[#1d1d1f] p-4 sm:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-black/[0.07] pb-5">
        <div>
          <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#0071e3] mb-1">
            <Sliders className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Nikon Imaging Cloud / Imaging Recipes</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#1d1d1f] m-0">
            Nikon Color Lab
          </h1>
          <p className="text-sm text-[#6e6e73] mt-1 mb-0">
            Curated Nikon Imaging Recipes for Nikon Zf. Not affiliated with Adobe or Nikon, and not a Photoshop preset editor.
          </p>
        </div>

        <label className="relative w-full sm:w-64">
          <Search
            className="w-4 h-4 text-[#86868b] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search recipes or creators..."
            aria-label="Search Nikon recipes"
            className="w-full pl-9 pr-3 py-2 text-base sm:text-sm bg-[#f5f5f7] border border-black/[0.08] rounded-lg text-[#1d1d1f] placeholder:text-[#86868b] focus:outline-none focus:ring-2 focus:ring-black/15 focus:bg-white transition"
          />
        </label>
      </div>

      {/* Editorial Mood Filters */}
      <div className="flex flex-wrap items-center gap-2 py-4" role="group" aria-label="Editorial mood tags">
        <span className="text-[11px] font-medium text-[#86868b] mr-1">Editorial tags:</span>
        {NIKON_EDITORIAL_TAGS.map((tag) => {
          const active = selectedTag === tag;
          return (
            <button
              key={tag}
              type="button"
              onClick={() => setSelectedTag(tag)}
              aria-pressed={active}
              className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition ${
                active
                  ? "bg-[#1d1d1f] text-white"
                  : "bg-[#f5f5f7] text-[#424245] hover:bg-[#e8e8ed]"
              }`}
            >
              {tag}
            </button>
          );
        })}
      </div>

      {/* Gallery + Detail Pane */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Recipe Cards Grid */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredRecipes.length === 0 ? (
            <div className="sm:col-span-2 py-12 text-center text-sm text-[#6e6e73] bg-[#f5f5f7] rounded-xl">
              No recipes match your current filter.
            </div>
          ) : (
            filteredRecipes.map((recipe) => {
              const isSelected = selectedRecipe.id === recipe.id;
              const isFav = favorites.includes(recipe.id);
              return (
                <div
                  key={recipe.id}
                  className={`rounded-2xl border overflow-hidden transition ${
                    isSelected
                      ? "border-[#1d1d1f] ring-1 ring-[#1d1d1f]/15 shadow-sm"
                      : "border-black/[0.08] hover:border-black/20"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedRecipe(recipe)}
                    className="w-full text-left bg-transparent border-0 p-0 cursor-pointer block"
                  >
                    <div
                      className="h-28 w-full p-4 flex flex-col justify-between text-white"
                      style={{ background: recipe.accentGradient }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold uppercase tracking-wider bg-black/25 backdrop-blur-xs px-2 py-0.5 rounded-full">
                          Cloud Picture Control
                        </span>
                      </div>
                      <div className="text-base font-semibold tracking-tight">
                        {recipe.name}
                      </div>
                    </div>
                  </button>

                  <div className="p-3.5 bg-white flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-[#1d1d1f] truncate">
                        by {recipe.creator}
                      </div>
                      <div className="text-[11px] text-[#86868b] truncate">
                        {recipe.editorialTags.join(" · ")}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleFavorite(recipe.id)}
                      aria-label={isFav ? `Remove ${recipe.name} from saved` : `Save ${recipe.name}`}
                      aria-pressed={isFav}
                      className={`p-1.5 rounded-lg border-0 bg-transparent cursor-pointer transition ${
                        isFav ? "text-[#1d1d1f]" : "text-[#86868b] hover:text-[#1d1d1f]"
                      }`}
                    >
                      <Bookmark className={`w-4 h-4 ${isFav ? "fill-current" : ""}`} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Detail Pane */}
        <aside className="lg:col-span-5 bg-[#f5f5f7] rounded-2xl p-5 border border-black/[0.07]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6e6e73]">
                Recipe Details
              </span>
              <h2 className="text-xl font-semibold tracking-tight text-[#1d1d1f] mt-1 mb-0">
                {selectedRecipe.name}
              </h2>
              <p className="text-xs text-[#6e6e73] mt-0.5 mb-0">
                Creator: <strong className="text-[#1d1d1f]">{selectedRecipe.creator}</strong>
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleCopyNotes(selectedRecipe)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white border border-black/[0.08] text-xs font-medium text-[#1d1d1f] hover:bg-black/[0.03] cursor-pointer transition shrink-0"
            >
              {copiedId === selectedRecipe.id ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy notes</span>
                </>
              )}
            </button>
          </div>

          <p className="text-sm text-[#424245] leading-relaxed mt-4 mb-0">
            {selectedRecipe.summary}
          </p>

          <div className="mt-4 p-3.5 rounded-xl bg-white border border-black/[0.06] text-xs text-[#424245]">
            <div className="font-semibold text-[#1d1d1f] mb-1">Parameters & Notes</div>
            <p className="m-0 leading-relaxed">{selectedRecipe.notes}</p>
            <div className="mt-2 text-[11px] text-[#86868b]">
              Compatible cameras: {selectedRecipe.cameraModels.join(", ")}
            </div>
          </div>

          <div className="mt-4 p-3.5 rounded-xl bg-white border border-black/[0.06]">
            <div className="text-xs font-semibold text-[#1d1d1f] mb-2">
              How to sync to Nikon Zf
            </div>
            <ol className="m-0 pl-4 space-y-1.5 text-xs text-[#424245] leading-relaxed">
              {selectedRecipe.instructions.map((step, idx) => (
                <li key={idx}>{step}</li>
              ))}
            </ol>
            <p className="text-[11px] text-[#86868b] mt-2.5 mb-0">
              Requires supported Nikon Zf firmware and an active Nikon Imaging Cloud connection.
            </p>
          </div>

          <div className="mt-5">
            <a
              href={selectedRecipe.officialUrl || NIKON_IMAGING_CLOUD_GALLERY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#1d1d1f] hover:bg-[#333336] text-white text-xs font-semibold no-underline transition"
            >
              <span>View on Nikon Imaging Cloud</span>
              <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
            </a>
          </div>
        </aside>
      </div>
    </div>
  );
}
