import { useEffect, useMemo, useState } from "react";
import { ExternalLink, Film, Search, X } from "lucide-react";
import {
  NETFLIX_CURATED_NOTE,
  NETFLIX_GENRES,
  NETFLIX_MOVIES,
  type NetflixMovie,
} from "../../data/netflix";

export function NetflixApp() {
  const [query, setQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<string>("All");
  const [selectedMovie, setSelectedMovie] = useState<NetflixMovie | null>(null);

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

  useEffect(() => {
    if (!selectedMovie) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setSelectedMovie(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedMovie]);

  return (
    <div className="min-h-full bg-white text-[#1d1d1f] p-6 sm:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-black/[0.07] pb-5">
        <div>
          <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#E50914] mb-1">
            <Film className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Netflix · Curated Collection</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#1d1d1f] m-0">
            My Cinema
          </h1>
          <p className="text-sm text-[#6e6e73] mt-1 mb-0">
            A small collection of stories worth watching.
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
            placeholder="Search 10 titles..."
            aria-label="Search movies"
            className="w-full pl-9 pr-3 py-2 text-sm bg-[#f5f5f7] border border-black/[0.08] rounded-lg text-[#1d1d1f] placeholder:text-[#86868b] focus:outline-none focus:ring-2 focus:ring-[#E50914]/30 focus:bg-white transition"
          />
        </label>
      </div>

      {/* Genre Filters */}
      <div className="flex flex-wrap items-center gap-2 py-4" role="group" aria-label="Filter by genre">
        {NETFLIX_GENRES.map((genre) => {
          const active = selectedGenre === genre;
          return (
            <button
              key={genre}
              type="button"
              onClick={() => setSelectedGenre(genre)}
              aria-pressed={active}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition cursor-pointer ${
                active
                  ? "bg-[#1d1d1f] text-white"
                  : "bg-[#f5f5f7] text-[#424245] hover:bg-[#e8e8ed]"
              }`}
            >
              {genre}
            </button>
          );
        })}
        <span className="ml-auto text-xs text-[#86868b]">
          {filteredMovies.length} of {NETFLIX_MOVIES.length} titles
        </span>
      </div>

      {/* Featured Card */}
      {featuredMovie && selectedGenre === "All" && !query.trim() && (
        <div
          className="relative rounded-2xl overflow-hidden mb-7 p-6 sm:p-7 text-white border border-black/10"
          style={{
            background: `linear-gradient(125deg, ${featuredMovie.accentColor} 0%, #18181b 78%)`,
          }}
        >
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-white/80 mb-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#E50914]" />
              Featured Pick · {featuredMovie.year}
            </div>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight m-0 text-white">
              {featuredMovie.title}
            </h2>
            <p className="text-sm text-white/85 mt-2.5 leading-relaxed mb-4">
              {featuredMovie.synopsis}
            </p>
            <div className="flex flex-wrap items-center gap-3">
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
                onClick={() => setSelectedMovie(featuredMovie)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-medium cursor-pointer transition"
              >
                More Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5-col Desktop / 3-col Tablet / 2-col Mobile Grid */}
      {filteredMovies.length === 0 ? (
        <div className="py-16 text-center text-sm text-[#6e6e73] bg-[#f5f5f7] rounded-xl">
          No movies match &ldquo;{query}&rdquo;. Try another title or genre.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-5">
          {filteredMovies.map((movie) => (
            <button
              key={movie.id}
              type="button"
              onClick={() => setSelectedMovie(movie)}
              className="group text-left bg-transparent border-0 p-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E50914] rounded-xl"
            >
              <div
                className="relative aspect-[2/3] w-full rounded-xl overflow-hidden border border-black/10 shadow-sm transition-transform duration-200 group-hover:scale-[1.03] flex flex-col justify-between p-4 text-white"
                style={{
                  background: `linear-gradient(160deg, ${movie.accentColor} 0%, #111113 100%)`,
                }}
              >
                <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-white/75">
                  <span>{movie.genres[0]}</span>
                  <span>{movie.year}</span>
                </div>
                <div>
                  <div className="w-6 h-0.5 bg-[#E50914] mb-2" />
                  <div className="text-base font-semibold leading-snug tracking-tight text-white">
                    {movie.title}
                  </div>
                </div>
              </div>
              <div className="mt-2 px-0.5">
                <div className="text-xs font-medium text-[#1d1d1f] truncate">
                  {movie.title}
                </div>
                <div className="text-[11px] text-[#86868b] mt-0.5">
                  {movie.year} · {movie.genres.join(", ")}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Curated Disclaimer */}
      <p className="mt-8 pt-4 border-t border-black/[0.06] text-[11px] text-[#86868b]">
        {NETFLIX_CURATED_NOTE}
      </p>

      {/* Movie Detail Modal inside window */}
      {selectedMovie && (
        <div
          className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setSelectedMovie(null)}
          role="dialog"
          aria-modal="true"
          aria-label={selectedMovie.title}
        >
          <div
            className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-black/10 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="p-6 text-white relative"
              style={{
                background: `linear-gradient(135deg, ${selectedMovie.accentColor} 0%, #111113 100%)`,
              }}
            >
              <button
                type="button"
                onClick={() => setSelectedMovie(null)}
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
                  onClick={() => setSelectedMovie(null)}
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
  );
}
