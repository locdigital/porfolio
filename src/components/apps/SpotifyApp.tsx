import { useMemo, useState } from "react";
import { ExternalLink, Music, Play, Search } from "lucide-react";
import {
  SPOTIFY_CURATED_NOTE,
  SPOTIFY_TRACKS,
  formatDurationMs,
  type SpotifyTrack,
} from "../../data/spotify";

const MOOD_FILTERS = ["All", "Late Night", "Indie", "Warm", "Focus", "Editing", "Synthwave", "Ambient"] as const;

export function SpotifyApp() {
  const [query, setQuery] = useState("");
  const [selectedMood, setSelectedMood] = useState<string>("All");
  const [selectedTrack, setSelectedTrack] = useState<SpotifyTrack>(SPOTIFY_TRACKS[0]);

  const filteredTracks = useMemo(() => {
    const q = query.trim().toLowerCase();
    return SPOTIFY_TRACKS.filter((track) => {
      const matchesMood = selectedMood === "All" || track.moodTags.includes(selectedMood);
      const matchesQuery =
        !q ||
        track.title.toLowerCase().includes(q) ||
        track.artist.toLowerCase().includes(q) ||
        track.album.toLowerCase().includes(q);
      return matchesMood && matchesQuery;
    }).sort((a, b) => a.order - b.order);
  }, [query, selectedMood]);

  return (
    <div className="min-h-full bg-white text-[#1d1d1f] p-6 sm:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-black/[0.07] pb-5">
        <div>
          <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#1DB954] mb-1">
            <Music className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Spotify · Currently in Rotation</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#1d1d1f] m-0">
            On Repeat
          </h1>
          <p className="text-sm text-[#6e6e73] mt-1 mb-0">
            Sounds for editing, working, and getting lost somewhere.
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
            placeholder="Search tracks or artists..."
            aria-label="Search tracks"
            className="w-full pl-9 pr-3 py-2 text-sm bg-[#f5f5f7] border border-black/[0.08] rounded-lg text-[#1d1d1f] placeholder:text-[#86868b] focus:outline-none focus:ring-2 focus:ring-[#1DB954]/30 focus:bg-white transition"
          />
        </label>
      </div>

      {/* Mood Filter Pills */}
      <div className="flex flex-wrap items-center gap-2 py-4" role="group" aria-label="Filter by mood">
        {MOOD_FILTERS.map((mood) => {
          const active = selectedMood === mood;
          return (
            <button
              key={mood}
              type="button"
              onClick={() => setSelectedMood(mood)}
              aria-pressed={active}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition cursor-pointer ${
                active
                  ? "bg-[#1d1d1f] text-white"
                  : "bg-[#f5f5f7] text-[#424245] hover:bg-[#e8e8ed]"
              }`}
            >
              {mood}
            </button>
          );
        })}
      </div>

      {/* Main Split: Official Spotify Embed + Track List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Selected Track Official Embed */}
        <div className="lg:col-span-5 bg-[#f5f5f7] rounded-2xl p-4 border border-black/[0.06]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6e6e73]">
              Selected Track
            </span>
            <a
              href={selectedTrack.spotifyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium text-[#1DB954] hover:underline no-underline"
            >
              <span>Open in Spotify</span>
              <ExternalLink className="w-3 h-3" aria-hidden="true" />
            </a>
          </div>

          <iframe
            key={selectedTrack.spotifyTrackId}
            title={`${selectedTrack.title} by ${selectedTrack.artist} — Spotify Player`}
            src={`https://open.spotify.com/embed/track/${selectedTrack.spotifyTrackId}?utm_source=generator&theme=0`}
            width="100%"
            height="352"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            className="rounded-xl bg-black/5 border-0"
          />

          <div className="mt-3 flex flex-wrap gap-1.5">
            {selectedTrack.moodTags.map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-0.5 rounded-full text-[11px] bg-white text-[#424245] border border-black/[0.06]"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* 10-Track Library List */}
        <div className="lg:col-span-7">
          {filteredTracks.length === 0 ? (
            <div className="py-12 text-center text-sm text-[#6e6e73] bg-[#f5f5f7] rounded-xl">
              No tracks match &ldquo;{query}&rdquo;.
            </div>
          ) : (
            <ul className="list-none m-0 p-0 divide-y divide-black/[0.06] border border-black/[0.07] rounded-2xl overflow-hidden bg-white">
              {filteredTracks.map((track, idx) => {
                const isSelected = selectedTrack.id === track.id;
                return (
                  <li key={track.id}>
                    <div
                      className={`flex items-center gap-3.5 px-4 py-3 transition ${
                        isSelected ? "bg-[#1DB954]/[0.07]" : "hover:bg-[#f5f5f7]"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedTrack(track)}
                        aria-label={`Load ${track.title} by ${track.artist} in Spotify embed`}
                        className="flex items-center gap-3.5 flex-1 min-w-0 text-left bg-transparent border-0 p-0 cursor-pointer"
                      >
                        <span className="w-5 text-xs tabular-nums text-[#86868b] text-right shrink-0">
                          {isSelected ? (
                            <Play className="w-3.5 h-3.5 text-[#1DB954] fill-[#1DB954] inline" />
                          ) : (
                            idx + 1
                          )}
                        </span>
                        <span
                          className="w-10 h-10 rounded-lg shrink-0 flex items-center justify-center text-white text-xs font-semibold shadow-xs"
                          style={{ backgroundColor: track.accentColor }}
                          aria-hidden="true"
                        >
                          {track.artist.slice(0, 2).toUpperCase()}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div
                            className={`text-sm font-medium truncate ${
                              isSelected ? "text-[#1DB954]" : "text-[#1d1d1f]"
                            }`}
                          >
                            {track.title}
                          </div>
                          <div className="text-xs text-[#6e6e73] truncate">
                            {track.artist} · {track.album}
                          </div>
                        </div>
                        <span className="text-xs tabular-nums text-[#86868b] shrink-0 hidden sm:inline">
                          {formatDurationMs(track.durationMs)}
                        </span>
                      </button>

                      <a
                        href={track.spotifyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Open ${track.title} in Spotify`}
                        title="Open in Spotify"
                        className="p-2 rounded-lg text-[#86868b] hover:text-[#1DB954] hover:bg-black/[0.04] transition shrink-0"
                      >
                        <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                      </a>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Curated Note */}
      <p className="mt-8 pt-4 border-t border-black/[0.06] text-[11px] text-[#86868b]">
        {SPOTIFY_CURATED_NOTE}
      </p>
    </div>
  );
}
