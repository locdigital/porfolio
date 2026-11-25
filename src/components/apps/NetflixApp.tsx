import "./media-apps.css";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Info,
  Play,
  Plus,
  Search,
  X,
} from "lucide-react";
import {
  NETFLIX_CURATED_NOTE,
  NETFLIX_GENRES,
  NETFLIX_MOVIES,
  type NetflixMovie,
} from "../../data/netflix";
import { MediaEmptyState } from "./MediaAppControls";

const GENRE_THEMES: Record<string, { gradient: string; subtitle: string; coverSlug?: string }> = {
  Anime: {
    gradient: "linear-gradient(160deg, #ea580c 0%, #9a3412 55%, #18181b 100%)",
    subtitle: "Iconic series & worlds",
    coverSlug: "naruto",
  },
  Action: {
    gradient: "linear-gradient(160deg, #dc2626 0%, #7f1d1d 55%, #18181b 100%)",
    subtitle: "High-octane & relentless",
    coverSlug: "spider-man",
  },
  Fantasy: {
    gradient: "linear-gradient(160deg, #15803d 0%, #14532d 55%, #0f172a 100%)",
    subtitle: "Epic realms & magic",
    coverSlug: "the-lord-of-the-rings",
  },
  Thriller: {
    gradient: "linear-gradient(160deg, #475569 0%, #1e293b 55%, #09090b 100%)",
    subtitle: "Edge-of-your-seat tension",
    coverSlug: "phi-vu-trieu-do",
  },
  Drama: {
    gradient: "linear-gradient(160deg, #9333ea 0%, #581c87 55%, #18181b 100%)",
    subtitle: "Character-driven stories",
    coverSlug: "the-godfather",
  },
  Family: {
    gradient: "linear-gradient(160deg, #0284c7 0%, #1e3a8a 55%, #0f172a 100%)",
    subtitle: "Timeless & heartwarming",
    coverSlug: "doraemon",
  },
};

function ApplePaddleChevron({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 9 31"
      className={`tv-paddle__icon${direction === "right" ? " tv-paddle__icon--right" : ""}`}
      aria-hidden="true"
    >
      <path
        fill="currentColor"
        d="M5.275 29.46a1.61 1.61 0 0 0 1.456 1.077c1.018 0 1.772-.737 1.772-1.737 0-.526-.277-1.186-.449-1.62l-4.68-11.912L8.05 3.363c.172-.442.45-1.116.45-1.625A1.7 1.7 0 0 0 6.728.002a1.6 1.6 0 0 0-1.456 1.09L.675 12.774c-.301.775-.677 1.744-.677 2.495 0 .754.376 1.705.677 2.498L5.272 29.46Z"
      />
    </svg>
  );
}

function ShelfSection({
  id,
  title,
  showChevron = false,
  children,
}: {
  id: string;
  title: string;
  showChevron?: boolean;
  children: ReactNode;
}) {
  const rowRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const syncScrollButtons = useCallback(() => {
    const el = rowRef.current;
    if (!el) return;
    const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth);
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(maxScroll - el.scrollLeft > 4);
  }, []);

  useEffect(() => {
    const el = rowRef.current;
    if (!el) return;
    syncScrollButtons();
    const ro = new ResizeObserver(syncScrollButtons);
    ro.observe(el);
    return () => ro.disconnect();
  }, [syncScrollButtons]);

  const scrollShelf = (direction: -1 | 1) => {
    const el = rowRef.current;
    if (!el) return;
    const distance = Math.max(240, Math.round(el.clientWidth * 0.78));
    el.scrollBy({ left: direction * distance, behavior: "smooth" });
  };

  return (
    <section className="tv-shelf" aria-labelledby={id}>
      <div className="tv-shelf__header">
        <h2 id={id} className="tv-shelf__heading">
          <span>{title}</span>
          {showChevron && (
            <ChevronRight
              size={18}
              className="tv-shelf__chevron"
              aria-hidden="true"
            />
          )}
        </h2>
      </div>
      <div className="tv-shelf__viewport">
        <button
          type="button"
          className="tv-paddle tv-paddle--shelf tv-paddle--left"
          onClick={() => scrollShelf(-1)}
          disabled={!canScrollLeft}
          aria-label={`Previous ${title}`}
        >
          <ApplePaddleChevron direction="left" />
        </button>

        <div
          ref={rowRef}
          className="tv-shelf__row"
          onScroll={syncScrollButtons}
        >
          {children}
        </div>

        <button
          type="button"
          className="tv-paddle tv-paddle--shelf tv-paddle--right"
          onClick={() => scrollShelf(1)}
          disabled={!canScrollRight}
          aria-label={`Next ${title}`}
        >
          <ApplePaddleChevron direction="right" />
        </button>
      </div>
    </section>
  );
}

function PosterCard({
  movie,
  rank,
  showBadge = false,
  onSelect,
}: {
  movie: NetflixMovie;
  rank?: number;
  showBadge?: boolean;
  onSelect: (movie: NetflixMovie) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(movie)}
      className="tv-poster-card group"
      aria-label={`${movie.title} (${movie.year})`}
      title={`${movie.title} (${movie.year})`}
    >
      <div
        className="tv-poster-art"
        style={{
          background: movie.posterSrc
            ? `url(${movie.posterSrc}) center / cover no-repeat`
            : `radial-gradient(circle at 78% 18%, rgba(255,255,255,0.22), transparent 52%), radial-gradient(circle at 20% 85%, rgba(0,0,0,0.45), transparent 60%), linear-gradient(165deg, ${movie.accentColor} 0%, #141417 100%)`,
        }}
      >
        {typeof rank === "number" && (
          <span className="tv-poster-rank" aria-hidden="true">
            {rank}
          </span>
        )}
      </div>
    </button>
  );
}

export function NetflixApp() {
  const [query, setQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<string>("All");
  const [selectedMovie, setSelectedMovie] = useState<NetflixMovie | null>(null);
  const [heroIndex, setHeroIndex] = useState(0);
  const [myList, setMyList] = useState<string[]>([]);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);

  const heroMovies = useMemo(() => {
    const sorted = [...NETFLIX_MOVIES].sort((a, b) => a.sortOrder - b.sortOrder);
    return sorted.slice(0, 6);
  }, []);

  const activeHero = heroMovies[heroIndex] ?? heroMovies[0];

  const topTenMovies = useMemo(
    () => [...NETFLIX_MOVIES].sort((a, b) => a.sortOrder - b.sortOrder),
    [],
  );

  const newReleases = useMemo(
    () =>
      [...NETFLIX_MOVIES].sort(
        (a, b) => b.year - a.year || a.sortOrder - b.sortOrder,
      ),
    [],
  );

  const mustWatchMovies = useMemo(
    () =>
      [...NETFLIX_MOVIES].filter((m) =>
        [
          "glass-onion-2022",
          "the-killer-2023",
          "extraction-2020",
          "the-adam-project-2022",
          "dont-look-up-2021",
          "enola-holmes-2020",
          "bird-box-2018",
          "the-gray-man-2022",
        ].includes(m.id),
      ),
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

  const isFiltered = selectedGenre !== "All" || query.trim().length > 0;

  const toggleMyList = (id: string) => {
    setMyList((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

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

  const prevHero = () =>
    setHeroIndex((i) => (i - 1 + heroMovies.length) % heroMovies.length);
  const nextHero = () => setHeroIndex((i) => (i + 1) % heroMovies.length);

  return (
    <div className="media-app media-app--netflix tv-app">
      {/* Persistent Apple TV style Top Navigation Header */}
      <header className="tv-header" aria-label="My Cinema navigation">
        <div className="tv-header__contents">
          <div className="tv-header__left" aria-hidden="true" />

          <nav className="tv-header__tabs" aria-label="Browse genres">
            <ul>
              {NETFLIX_GENRES.map((genre) => {
                const isCurrent = selectedGenre === genre && !query.trim();
                return (
                  <li key={genre} className={isCurrent ? "is-current" : undefined}>
                    <button
                      type="button"
                      aria-current={isCurrent ? "page" : undefined}
                      onClick={() => {
                        setQuery("");
                        setSelectedGenre(genre);
                      }}
                    >
                      {genre === "All" ? "Home" : genre}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="tv-header__controls">
            <label className="tv-search-pill">
              <Search size={14} aria-hidden="true" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search"
                aria-label="Search movies"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="tv-search-clear"
                  aria-label="Clear search"
                >
                  <X size={12} aria-hidden="true" />
                </button>
              )}
            </label>
          </div>
        </div>
      </header>

      {/* Full-bleed Apple TV Epic Stage Hero Carousel */}
      {!isFiltered && activeHero && (
        <section
          className="tv-hero"
          aria-label="Featured title"
          style={{
            background: activeHero.backdropSrc
              ? `url(${activeHero.backdropSrc}) center 22% / cover no-repeat`
              : `radial-gradient(circle at 75% 24%, rgba(255,255,255,0.16), transparent 46%), radial-gradient(circle at 85% 75%, rgba(229,9,20,0.28), transparent 52%), linear-gradient(125deg, ${activeHero.accentColor} 0%, #18181b 68%, #09090b 100%)`,
          }}
        >
          <div className="tv-hero__scrim" aria-hidden="true" />

          {/* Apple TV edge chevron paddles */}
          <button
            type="button"
            className="tv-paddle tv-paddle--hero tv-paddle--left"
            onClick={prevHero}
            aria-label="Previous featured title"
          >
            <ApplePaddleChevron direction="left" />
          </button>
          <button
            type="button"
            className="tv-paddle tv-paddle--hero tv-paddle--right"
            onClick={nextHero}
            aria-label="Next featured title"
          >
            <ApplePaddleChevron direction="right" />
          </button>

          {/* Bottom-left metadata stack */}
          <div className="tv-hero__content">
            <span className="tv-hero__badge">
              {activeHero.featured ? "Featured" : "Popular"}
            </span>
            <h1 className="tv-hero__title">{activeHero.title}</h1>
            <div className="tv-hero__meta">
              <span>
                {activeHero.genres.join(" · ")} · {activeHero.year}
              </span>
            </div>
            <p className="tv-hero__synopsis">{activeHero.synopsis}</p>
            <div className="tv-hero__rank-note">
              #{activeHero.sortOrder} on My Cinema
            </div>

            <div className="tv-hero__actions">
              <a
                href={activeHero.netflixUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="tv-btn-primary"
              >
                <Play size={14} fill="currentColor" aria-hidden="true" />
                <span>Watch on Netflix</span>
              </a>
              <button
                type="button"
                onClick={() => toggleMyList(activeHero.id)}
                className="tv-btn-circle"
                aria-label={
                  myList.includes(activeHero.id)
                    ? "Remove from My List"
                    : "Add to My List"
                }
                title={
                  myList.includes(activeHero.id)
                    ? "In My List"
                    : "Add to My List"
                }
              >
                {myList.includes(activeHero.id) ? (
                  <Check size={16} />
                ) : (
                  <Plus size={16} />
                )}
              </button>
              <button
                type="button"
                onClick={() => openMovie(activeHero)}
                className="tv-btn-circle"
                aria-label="More details"
                title="More details"
              >
                <Info size={16} />
              </button>
            </div>
          </div>

          {/* Bottom-center Apple TV glass pagination platter */}
          <div className="tv-hero__pagination">
            <nav
              className="tv-hero__platter"
              aria-label="Featured slides"
            >
              <div className="tv-hero__dots" role="tablist">
                {heroMovies.map((movie, idx) => (
                  <button
                    key={movie.id}
                    type="button"
                    role="tab"
                    aria-selected={idx === heroIndex}
                    aria-label={`Show ${movie.title}`}
                    onClick={() => setHeroIndex(idx)}
                    className={`tv-hero__dot${idx === heroIndex ? " is-active" : ""}`}
                  />
                ))}
              </div>
            </nav>
          </div>
        </section>
      )}

      {/* Main Shelves / Filtered View */}
      <div className="tv-body">
        {isFiltered ? (
          <section className="tv-filtered">
            <div className="tv-filtered__bar">
              <div className="tv-filtered__left">
                <h2 className="tv-shelf__heading">
                  {selectedGenre !== "All" ? selectedGenre : "Search Results"}
                </h2>
                <span className="tv-filtered__count">
                  {filteredMovies.length}{" "}
                  {filteredMovies.length === 1 ? "title" : "titles"}
                </span>
              </div>
            </div>

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
              <div className="tv-grid">
                {filteredMovies.map((movie) => (
                  <PosterCard
                    key={movie.id}
                    movie={movie}
                    showBadge
                    onSelect={openMovie}
                  />
                ))}
              </div>
            )}
          </section>
        ) : (
          <>
            <ShelfSection id="shelf-top10" title="Top 10 Movies" showChevron>
              {topTenMovies.map((movie, idx) => (
                <PosterCard
                  key={movie.id}
                  movie={movie}
                  rank={idx + 1}
                  onSelect={openMovie}
                />
              ))}
            </ShelfSection>

            <ShelfSection id="shelf-new" title="New Releases" showChevron>
              {newReleases.map((movie) => (
                <PosterCard
                  key={movie.id}
                  movie={movie}
                  showBadge
                  onSelect={openMovie}
                />
              ))}
            </ShelfSection>

            <ShelfSection id="shelf-genres" title="Browse by Genre">
              {(() => {
                const usedPosters = new Set<string>();
                return NETFLIX_GENRES.filter((g) => g !== "All").map((genre) => {
                  const theme = GENRE_THEMES[genre] ?? {
                    gradient: "linear-gradient(160deg, #3f3f46 0%, #18181b 100%)",
                    subtitle: "Curated picks",
                  };
                  const matching = NETFLIX_MOVIES.filter((m) =>
                    m.genres.includes(genre),
                  );
                  const count = matching.length;
                  const preferred = theme.coverSlug
                    ? matching.find((m) => m.slug === theme.coverSlug)
                    : undefined;
                  const fallbackUnique = matching.find(
                    (m) => m.posterSrc && !usedPosters.has(m.posterSrc),
                  );
                  const coverPoster =
                    preferred?.posterSrc ?? fallbackUnique?.posterSrc ?? matching[0]?.posterSrc;
                  if (coverPoster) usedPosters.add(coverPoster);
                  return (
                    <button
                      key={genre}
                      type="button"
                      onClick={() => setSelectedGenre(genre)}
                      className="tv-genre-card"
                      style={{
                        background: coverPoster
                          ? `linear-gradient(180deg, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.78) 100%), url(${coverPoster}) center / cover no-repeat`
                          : theme.gradient,
                      }}
                    >
                      <span className="tv-genre-card__count">
                        {count} {count === 1 ? "title" : "titles"}
                      </span>
                      <div className="tv-genre-card__bottom">
                        <div className="tv-genre-card__title">{genre}</div>
                        <div className="tv-genre-card__sub">{theme.subtitle}</div>
                      </div>
                    </button>
                  );
                });
              })()}
            </ShelfSection>

            <ShelfSection id="shelf-must-watch" title="Must Watch" showChevron>
              {mustWatchMovies.map((movie) => (
                <PosterCard
                  key={movie.id}
                  movie={movie}
                  showBadge
                  onSelect={openMovie}
                />
              ))}
            </ShelfSection>
          </>
        )}

        {/* Curated Footer */}
        <footer className="tv-footer">
          <p>{NETFLIX_CURATED_NOTE}</p>
        </footer>
      </div>

      {/* Movie Detail Modal */}
      {selectedMovie && (
        <div
          className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] lg:pb-4"
          onClick={closeMovie}
          role="dialog"
          aria-modal="true"
          aria-label={selectedMovie.title}
        >
          <div
            className="w-full max-w-2xl max-h-[calc(100dvh-7.5rem-env(safe-area-inset-bottom,0px))] lg:max-h-[88vh] overflow-y-auto bg-white rounded-2xl shadow-2xl border border-black/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="relative overflow-hidden bg-black text-white"
              style={
                !selectedMovie.backdropSrc
                  ? {
                      background: `linear-gradient(135deg, ${selectedMovie.accentColor} 0%, #111113 100%)`,
                    }
                  : undefined
              }
            >
              {selectedMovie.backdropSrc && (
                <img
                  src={selectedMovie.backdropSrc}
                  alt={selectedMovie.title}
                  className="block w-full h-auto max-h-[46vh] sm:max-h-[60vh] object-contain bg-black"
                />
              )}
              <div
                className={
                  selectedMovie.backdropSrc
                    ? "absolute inset-x-0 bottom-0 p-5 sm:p-6 pt-16 bg-gradient-to-t from-black/85 via-black/45 to-transparent"
                    : "p-5 sm:p-6 pt-24"
                }
              >
                <div className="text-xs font-medium text-white/80 mb-1">
                  {selectedMovie.year} · {selectedMovie.genres.join(" · ")}
                </div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight m-0 text-white pr-8">
                  {selectedMovie.title}
                </h2>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={closeMovie}
                aria-label="Close movie details"
                className="absolute top-3.5 right-3.5 w-9 h-9 rounded-full bg-black/55 hover:bg-black/75 text-white flex items-center justify-center cursor-pointer transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 sm:p-6 flex flex-col gap-4">
              <p className="text-sm text-[#424245] leading-relaxed m-0">
                {selectedMovie.synopsis}
              </p>
              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <a
                  href={selectedMovie.netflixUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-full bg-[#1d1d1f] hover:bg-[#333336] text-white text-xs font-semibold no-underline transition"
                >
                  <Play size={13} fill="currentColor" aria-hidden="true" />
                  <span>Watch on Netflix</span>
                  <ExternalLink size={12} aria-hidden="true" />
                </a>
                <button
                  type="button"
                  onClick={() => toggleMyList(selectedMovie.id)}
                  className="inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-full bg-[#f5f5f7] hover:bg-[#e8e8ed] text-[#1d1d1f] text-xs font-semibold cursor-pointer transition"
                >
                  {myList.includes(selectedMovie.id) ? (
                    <>
                      <Check size={14} aria-hidden="true" />
                      <span>In My List</span>
                    </>
                  ) : (
                    <>
                      <Plus size={14} aria-hidden="true" />
                      <span>Add to My List</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
