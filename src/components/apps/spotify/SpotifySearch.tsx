import { useMemo, useState } from "react";
import { Play, Search, X } from "lucide-react";
import {
  ALL_SPOTIFY_COLLECTIONS,
  SPOTIFY_MOOD_FILTERS,
  SPOTIFY_TRACKS,
  getTracksByIds,
  type SpotifyTrack,
} from "../../../data/spotify";
import { SpotifyArtwork } from "./SpotifyArtwork";
import { SpotifyTrackRow } from "./SpotifyTrackRow";
import type { SpotifyView } from "./useSpotifyState";

interface SpotifySearchProps {
  externalQuery?: string;
  onExternalQueryChange?: (q: string) => void;
  selectedTrackId: string;
  likedIds: Set<string>;
  onSelectTrack: (track: SpotifyTrack, openEmbed?: boolean) => void;
  onToggleLike: (trackId: string) => void;
  onNavigate: (view: SpotifyView) => void;
}

export function SpotifySearch({
  externalQuery,
  onExternalQueryChange,
  selectedTrackId,
  likedIds,
  onSelectTrack,
  onToggleLike,
  onNavigate,
}: SpotifySearchProps) {
  const [localQuery, setLocalQuery] = useState("");
  const query = externalQuery ?? localQuery;
  const setQuery = (val: string) => {
    setLocalQuery(val);
    onExternalQueryChange?.(val);
  };
  const [selectedMood, setSelectedMood] = useState<string>("All");

  const filteredTracks = useMemo(() => {
    const q = query.trim().toLowerCase();
    return SPOTIFY_TRACKS.filter((track) => {
      const matchesMood = selectedMood === "All" || track.moodTags.includes(selectedMood);
      const matchesQuery =
        !q ||
        track.title.toLowerCase().includes(q) ||
        track.artist.toLowerCase().includes(q) ||
        track.album.toLowerCase().includes(q) ||
        track.moodTags.some((m) => m.toLowerCase().includes(q));
      return matchesMood && matchesQuery;
    });
  }, [query, selectedMood]);

  const filteredCollections = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ALL_SPOTIFY_COLLECTIONS.filter((col) => {
      const matchesMood = selectedMood === "All" || col.mood === selectedMood;
      const matchesQuery =
        !q ||
        col.title.toLowerCase().includes(q) ||
        col.description.toLowerCase().includes(q);
      return matchesMood && matchesQuery;
    });
  }, [query, selectedMood]);

  const reset = () => {
    setQuery("");
    setSelectedMood("All");
  };

  return (
    <div className="spotify-content">
      <div className="flex flex-col gap-4">
        <h1 className="spotify-h1">Search</h1>

        <div className="spotify-search-bar">
          <Search size={16} className="spotify-search-icon" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Songs, artists, albums, or playlists..."
            aria-label="Search songs, artists, albums, or playlists"
            className="spotify-search-input"
          />
          {query && (
            <button
              type="button"
              className="spotify-search-clear"
              onClick={() => setQuery("")}
              aria-label="Clear search"
            >
              <X size={14} aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="spotify-filter-pills" role="group" aria-label="Filter by genre or mood">
          {SPOTIFY_MOOD_FILTERS.map((mood) => {
            const active = selectedMood === mood;
            return (
              <button
                key={mood}
                type="button"
                onClick={() => setSelectedMood(mood)}
                aria-pressed={active}
                className={`spotify-filter-pill${active ? " is-active" : ""}`}
              >
                {mood}
              </button>
            );
          })}
        </div>
      </div>

      {filteredTracks.length === 0 && filteredCollections.length === 0 ? (
        <div className="spotify-empty">
          <p className="m-0 mb-3">
            No results found{query.trim() ? ` for “${query.trim()}”` : ""}.
          </p>
          <button type="button" className="spotify-btn-primary" onClick={reset}>
            Clear filters
          </button>
        </div>
      ) : (
        <>
          {filteredTracks.length > 0 && (
            <section aria-labelledby="search-tracks-heading">
              <div className="spotify-section-header">
                <h2 id="search-tracks-heading" className="spotify-h2">
                  Tracks ({filteredTracks.length})
                </h2>
              </div>
              <div className="flex flex-col">
                {filteredTracks.map((track, idx) => (
                  <SpotifyTrackRow
                    key={track.id}
                    track={track}
                    index={idx}
                    isSelected={track.id === selectedTrackId}
                    isLiked={likedIds.has(track.id)}
                    onSelect={(t) => onSelectTrack(t, true)}
                    onToggleLike={onToggleLike}
                  />
                ))}
              </div>
            </section>
          )}

          {filteredCollections.length > 0 && (
            <section aria-labelledby="search-playlists-heading">
              <div className="spotify-section-header">
                <h2 id="search-playlists-heading" className="spotify-h2">
                  Playlists & Mixes
                </h2>
              </div>
              <div className="spotify-card-grid">
                {filteredCollections.slice(0, 5).map((col) => (
                  <div
                    key={col.id}
                    role="button"
                    tabIndex={0}
                    className="spotify-card"
                    onClick={() => onNavigate({ kind: "playlist", playlistId: col.id })}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onNavigate({ kind: "playlist", playlistId: col.id });
                      }
                    }}
                  >
                    <div className="spotify-card-art-wrap">
                      <SpotifyArtwork
                        src={col.coverSrc}
                        alt={col.title}
                        fallbackColor={col.accentColor}
                        fallbackText={col.title}
                        className="spotify-card-art"
                      />
                      <button
                        type="button"
                        className="spotify-card-play"
                        onClick={(e) => {
                          e.stopPropagation();
                          const first = getTracksByIds(col.trackIds)[0];
                          if (first) onSelectTrack(first, true);
                        }}
                        aria-label={`Play ${col.title}`}
                      >
                        <Play size={18} fill="currentColor" aria-hidden="true" />
                      </button>
                    </div>
                    <div className="spotify-card-title">{col.title}</div>
                    <p className="spotify-card-desc">{col.description}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

