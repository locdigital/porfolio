import "./media-apps.css";
import { useEffect, useMemo, useRef, useState } from "react";
import { ExternalLink, Film, Sparkles, X } from "lucide-react";
import {
  NETFLIX_CURATED_NOTE,
  NETFLIX_GENRES,
  NETFLIX_MOVIES,
  type NetflixMovie,
} from "../../data/netflix";
import {
  MediaEmptyState,
  MediaFilterBar,
  MediaSearchInput,
} from "./MediaAppControls";

export function NetflixApp() {
  const [query, setQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<string>("All");
  const [selectedMovie, setSelectedMovie] = useState<NetflixMovie | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);

  const featuredMovie = useMemo(
    () => NETFLIX_MOVIES.find((m) => m.featured) ?? NETFLIX_MOVIES[0],
    [],
  );

  const filteredMovies = useMemo(() => {
    const q = query.trim().toLowerCase();
    return NETFLIX_MOVIES.filter((movie) => {
      const matchesGenre =
        selectedGenre === "All" || movie.genres.includes(selectedGenre);
      const matchesQuery =
        !q ||
        movie.title.toLowerCase().includes(q) ||
        movie.synopsis.toLowerCase().includes(q) ||
        String(movie.year).includes(q) ||
        movie.genres.some((g) => g.toLowerCase().includes(q));
      return matchesGenre && matchesQuery;
    }).sort((a, b) => a.sortOrder - b.sortOrder);
  }, [query, selectedGenre]);

  const openMovie = (movie: NetflixMovie) => {
    lastFocusedRef.current = document.activeElement as HTMLElement | null;
    setSelectedMovie(movie);
  };

  const closeMovie = () => {
    setSelectedMovie(null);
    requestAnimationFrame(() => {
      lastFocusedRef.current?.focus();
    });
  };

  useEffect(() => {
    if (!selectedMovie) return;
    closeButtonRef.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        closeMovie();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedMovie]);

  const resetFilters = () => {
    setQuery("");
    setSelectedGenre("All");
  };

  return (
    <div className="media-app media-app--netflix">
      <div className="media-app__content">
        {/* Header */}
        <div className="media-app__header">
          <div>
            <h1 className="media-app__title">
              <Film size={22} aria-hidden="true" />
              My Cinema
            </h1>
            <p className="text-sm text-[#6e6e73] mt-1 mb-0">
              A small collection of stories worth watching.
            </p>
          </div>

          <MediaSearchInput
            value={query}
            onChange={setQuery}
            placeholder={`Search ${NETFLIX_MOVIES.length} titles...`}
            ariaLabel="Search movies"
          />
        </div>

        {/* Genre Filters */}
        <MediaFilterBar
          options={NETFLIX_GENRES}
          selected={selectedGenre}
          onSelect={setSelectedGenre}
          ariaLabel="Filter by genre"
          filteredCount={filteredMovies.length}
          totalCount={NETFLIX_MOVIES.length}
          countLabel="titles"
        />

        {/* Featured Card */}
        {featuredMovie && selectedGenre === "All" && !query.trim() && (
          <div
            className="cinema-feature relative rounded-2xl overflow-hidden mb-5 text-white"
            style={{
              background: `radial-gradient(circle at 85% 20%, rgba(229, 9, 20, 0.28), transparent 55%), linear-gradient(125deg, ${featuredMovie.accentColor} 0%, #18181b 78%)`,
            }}
          >
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-white/80 mb-1.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#E50914]" />
                Featured Pick · {featuredMovie.year}
              </div>
              <h2 className="text-xl sm:text-2xl font-semibold tracking-tight m-0 text-white">
                {featuredMovie.title}
              </h2>
              <p className="text-sm text-white/85 mt-2 leading-relaxed mb-4 line-clamp-3">
                {featuredMovie.synopsis}
              </p>
              <div className="flex flex-wrap items-center gap-2.5">
                <a
                  href={featuredMovie.netflixUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#E50914] hover:bg-[#c80812] text-white text-xs font-semibold no-underline transition"
                >
                  <span>Watch on Netflix</span>
                  <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                </a>
                <button
                  type="button"
                  onClick={() => openMovie(featuredMovie)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-medium cursor-pointer transition"
                >
                  More Details
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Cards follow the app window width, not the desktop viewport. */}
        {filteredMovies.length === 0 ? (
          <MediaEmptyState
            message={
              query.trim()
                ? `No movies match “${query.trim()}”.`
                : "No movies in this genre."
            }
            onReset={resetFilters}
          />
        ) : (
          <div className="cinema-grid">
            {filteredMovies.map((movie) => (
              <button
                key={movie.id}
                type="button"
                onClick={() => openMovie(movie)}
                className="cinema-card group min-w-0 text-left bg-transparent border-0 p-0 cursor-pointer rounded-xl"
              >
                <div
                  className="cinema-poster relative aspect-[2/3] w-full rounded-xl overflow-hidden border border-black/10 shadow-sm flex flex-col justify-between text-white transition-transform duration-200"
                  style={{
                    background: `radial-gradient(circle at 80% 15%, rgba(255,255,255,0.14), transparent 55%), linear-gradient(165deg, ${movie.accentColor} 0%, #111113 100%)`,
                  }}
                >
                  <div className="flex flex-wrap items-center justify-between gap-1 text-[10px] font-semibold uppercase tracking-wider text-white/80">
                    <span className="px-1.5 py-0.5 rounded bg-black/25 backdrop-blur-xs">
                      {movie.genres[0]}
                    </span>
                    <span className="tabular-nums">{movie.year}</span>
                  </div>

                  <div className="my-auto py-2">
                    {movie.featured && (
                      <div className="inline-flex items-center gap-1 text-[10px] font-medium text-white/85 mb-1.5">
                        <Sparkles className="w-3 h-3 text-[#ff6b6b]" aria-hidden="true" />
                        <span>Featured</span>
                      </div>
                    )}
                    <div className="w-6 h-0.5 bg-[#E50914] mb-2" />
                    <div className="text-base font-semibold leading-snug tracking-tight text-white">
                      {movie.title}
                    </div>
                    <p className="text-[11px] leading-relaxed text-white/70 mt-1.5 mb-0 line-clamp-2">
                      {movie.synopsis}
                    </p>
                  </div>

                  <div className="text-[10px] font-medium text-white/60 group-hover:text-white/95 transition-colors">
                    View details →
                  </div>
                </div>
                <div className="mt-2 px-0.5">
                  <div className="text-xs font-medium text-[#1d1d1f] truncate">
                    {movie.title}
                  </div>
                  <div className="text-[11px] text-[#6e6e73] mt-0.5 truncate">
                    {movie.year} · {movie.genres.join(", ")}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Curated Disclaimer */}
        <p className="mt-6 pt-4 border-t border-black/[0.06] text-[11px] text-[#6e6e73]">
          {NETFLIX_CURATED_NOTE}
        </p>

        {/* Movie Detail Modal inside window */}
        {selectedMovie && (
          <div
            className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={closeMovie}
            role="dialog"
            aria-modal="true"
            aria-label={selectedMovie.title}
          >
            <div
              className="w-full max-w-lg max-h-[85vh] overflow-y-auto bg-white rounded-2xl shadow-2xl border border-black/10"
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="p-6 text-white relative"
                style={{
                  background: `linear-gradient(135deg, ${selectedMovie.accentColor} 0%, #111113 100%)`,
                }}
              >
                <button
                  ref={closeButtonRef}
                  type="button"
                  onClick={closeMovie}
                  aria-label="Close movie details"
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center cursor-pointer transition"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="text-xs font-medium text-white/75 mb-1">
                  {selectedMovie.year} · {selectedMovie.genres.join(" / ")}
                </div>
                <h2 className="text-2xl font-semibold tracking-tight m-0 text-white pr-8">
                  {selectedMovie.title}
                </h2>
              </div>

              <div className="p-6">
                <p className="text-sm text-[#424245] leading-relaxed m-0">
                  {selectedMovie.synopsis}
                </p>

                <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                  <a
                    href={selectedMovie.netflixUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#E50914] hover:bg-[#c80812] text-white text-xs font-semibold no-underline transition"
                  >
                    <span>Watch on Netflix</span>
                    <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                  </a>
                  <button
                    type="button"
                    onClick={closeMovie}
                    className="px-3.5 py-2 rounded-lg bg-[#f5f5f7] hover:bg-[#e8e8ed] text-[#1d1d1f] text-xs font-medium cursor-pointer transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
