import { useState } from "react";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import {
  ALL_SPOTIFY_COLLECTIONS,
  SPOTIFY_TRACKS,
  getTracksByIds,
  type SpotifyPlaylist,
  type SpotifyTrack,
} from "../../../data/spotify";
import { SpotifyArtwork } from "./SpotifyArtwork";
import type { SpotifyView } from "./useSpotifyState";

interface SpotifyHomeProps {
  selectedTrack: SpotifyTrack;
  recentTracks: SpotifyTrack[];
  onNavigate: (view: SpotifyView) => void;
  onSelectTrack: (track: SpotifyTrack, openEmbed?: boolean) => void;
}

const RADIO_PALETTES = [
  "linear-gradient(155deg, #c4b5fd 0%, #8b5cf6 100%)",
  "linear-gradient(155deg, #e9d5ff 0%, #a855f7 100%)",
  "linear-gradient(155deg, #6ee7b7 0%, #14b8a6 100%)",
  "linear-gradient(155deg, #fdba74 0%, #ea580c 100%)",
  "linear-gradient(155deg, #fbcfe8 0%, #db2777 100%)",
];

const TIPS = [
  {
    title: "1. Start playing",
    desc: "Search, browse, and play your favorite artists and creators.",
    cta: "Search",
    action: "search" as const,
  },
  {
    title: "2. Explore playlists",
    desc: "Dive into curated rotations built for late-night focus and indie moods.",
    cta: "Browse",
    action: "browse" as const,
  },
  {
    title: "3. Curated rotation",
    desc: "Switch between tracks seamlessly or open any song directly in Spotify.",
    cta: "Open Mix",
    action: "playlist" as const,
  },
];

export function SpotifyHome({
  recentTracks,
  onNavigate,
  onSelectTrack,
}: SpotifyHomeProps) {
  const [catFilter, setCatFilter] = useState<"All" | "Music" | "Podcasts" | "Audiobooks">("All");
  const [tipIndex, setTipIndex] = useState(0);

  const handlePlayCollection = (e: React.MouseEvent, collection: SpotifyPlaylist) => {
    e.stopPropagation();
    const tracks = getTracksByIds(collection.trackIds);
    if (tracks[0]) {
      onSelectTrack(tracks[0], true);
    }
  };

  const activeTip = TIPS[tipIndex];
  const popularTracks = SPOTIFY_TRACKS.slice(0, 6);
  const radioCollections = ALL_SPOTIFY_COLLECTIONS.slice(0, 6);
  const recentsList = (recentTracks.length > 0 ? recentTracks : SPOTIFY_TRACKS).slice(0, 6);

  return (
    <div className="spotify-home-ambient">
      <div className="spotify-content">
        {/* Category Pills */}
        <div className="spotify-cat-pills" role="group" aria-label="Home categories">
          {(["All", "Music", "Podcasts", "Audiobooks"] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              className={`spotify-cat-pill${catFilter === cat ? " is-active" : ""}`}
              onClick={() => setCatFilter(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Row 1: Getting started + Popular albums and singles */}
        <div className="spotify-hero-split">
          <section aria-labelledby="spotify-getting-started">
            <div className="spotify-section-header">
              <h2 id="spotify-getting-started" className="spotify-h2">
                Getting started
              </h2>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  className="spotify-nav-btn"
                  style={{ width: 24, height: 24 }}
                  onClick={() => setTipIndex((i) => (i - 1 + TIPS.length) % TIPS.length)}
                  aria-label="Previous tip"
                >
                  <ChevronLeft size={15} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="spotify-nav-btn"
                  style={{ width: 24, height: 24 }}
                  onClick={() => setTipIndex((i) => (i + 1) % TIPS.length)}
                  aria-label="Next tip"
                >
                  <ChevronRight size={15} aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="spotify-getting-started">
              <div className="relative z-10">
                <h3 className="spotify-gs-title">{activeTip.title}</h3>
                <p className="spotify-gs-desc">{activeTip.desc}</p>
              </div>

              <div className="spotify-gs-actions">
                <button
                  type="button"
                  className="spotify-gs-btn"
                  onClick={() => {
                    if (activeTip.action === "search") onNavigate({ kind: "search" });
                    else if (activeTip.action === "browse") onNavigate({ kind: "browse" });
                    else onNavigate({ kind: "playlist", playlistId: "from-a-to-a" });
                  }}
                >
                  {activeTip.cta}
                </button>
                <button
                  type="button"
                  className="spotify-gs-link"
                  onClick={() => setTipIndex((i) => (i + 1) % TIPS.length)}
                >
                  Show more tips
                </button>
              </div>

              {/* Overlapping artwork stack on the right */}
              <div className="spotify-gs-stack" aria-hidden="true">
                {SPOTIFY_TRACKS[1]?.coverSrc && (
                  <img
                    src={SPOTIFY_TRACKS[1].coverSrc}
                    alt=""
                    className="spotify-gs-art-top"
                  />
                )}
                {SPOTIFY_TRACKS[0]?.coverSrc && (
                  <img
                    src={SPOTIFY_TRACKS[0].coverSrc}
                    alt=""
                    className="spotify-gs-art-bottom"
                  />
                )}
              </div>
            </div>
          </section>

          <section aria-labelledby="spotify-popular-singles" className="min-w-0">
            <div className="spotify-section-header">
              <h2 id="spotify-popular-singles" className="spotify-h2">
                Popular albums and singles
              </h2>
              <button
                type="button"
                className="spotify-section-link"
                onClick={() => onNavigate({ kind: "albums" })}
              >
                Show all
              </button>
            </div>

            <div className="spotify-hscroll-row spotify-hscroll-row--3">
              {popularTracks.map((track) => (
                <div
                  key={track.id}
                  role="button"
                  tabIndex={0}
                  className="spotify-card"
                  onClick={() => onSelectTrack(track, true)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelectTrack(track, true);
                    }
                  }}
                >
                  <div className="spotify-card-art-wrap">
                    <SpotifyArtwork
                      src={track.coverSrc}
                      alt={track.title}
                      fallbackColor={track.accentColor}
                      fallbackText={track.title}
                      className="spotify-card-art"
                    />
                    <button
                      type="button"
                      className="spotify-card-play"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectTrack(track, true);
                      }}
                      aria-label={`Play ${track.title}`}
                    >
                      <Play size={18} fill="currentColor" aria-hidden="true" />
                    </button>
                  </div>
                  <div className="spotify-card-title">{track.title}</div>
                  <p className="spotify-card-desc">{track.artist}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Row 2: Popular radio */}
        <section aria-labelledby="spotify-popular-radio">
          <div className="spotify-section-header">
            <h2 id="spotify-popular-radio" className="spotify-h2">
              Popular radio
            </h2>
            <button
              type="button"
              className="spotify-section-link"
              onClick={() => onNavigate({ kind: "radio" })}
            >
              Show all
            </button>
          </div>

          <div className="spotify-hscroll-row spotify-hscroll-row--5">
            {radioCollections.map((col, idx) => {
              const bg = RADIO_PALETTES[idx % RADIO_PALETTES.length];
              const colTracks = getTracksByIds(col.trackIds);
              const centerCover = col.coverSrc ?? colTracks[0]?.coverSrc;
              const leftCover = colTracks[1]?.coverSrc ?? centerCover;
              const rightCover = colTracks[2]?.coverSrc ?? centerCover;

              return (
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
                    <div className="spotify-radio-art" style={{ background: bg }}>
                      <div className="spotify-radio-badge">
                        <span>●</span>
                        <span>RADIO</span>
                      </div>
                      <div className="spotify-radio-collage">
                        <div className="spotify-radio-side spotify-radio-side--left">
                          <SpotifyArtwork src={leftCover} alt="" fallbackColor={col.accentColor} fallbackText={col.title} />
                        </div>
                        <div className="spotify-radio-center">
                          <SpotifyArtwork
                            src={centerCover}
                            alt={col.title}
                            fallbackColor={col.accentColor}
                            fallbackText={col.title}
                          />
                        </div>
                        <div className="spotify-radio-side spotify-radio-side--right">
                          <SpotifyArtwork src={rightCover} alt="" fallbackColor={col.accentColor} fallbackText={col.title} />
                        </div>
                      </div>
                      <div className="spotify-radio-name">{col.title}</div>
                    </div>
                    <button
                      type="button"
                      className="spotify-card-play"
                      onClick={(e) => handlePlayCollection(e, col)}
                      aria-label={`Play ${col.title}`}
                    >
                      <Play size={18} fill="currentColor" aria-hidden="true" />
                    </button>
                  </div>
                  <p className="spotify-card-desc">{col.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Row 3: Recents */}
        <section aria-labelledby="spotify-recents">
          <div className="spotify-section-header">
            <h2 id="spotify-recents" className="spotify-h2">
              Recents
            </h2>
            <button
              type="button"
              className="spotify-section-link"
              onClick={() => onNavigate({ kind: "recently-played" })}
            >
              Show all
            </button>
          </div>

          <div className="spotify-hscroll-row spotify-hscroll-row--5">
            {recentsList.map((track) => (
              <div
                key={track.id}
                role="button"
                tabIndex={0}
                className="spotify-card"
                onClick={() => onSelectTrack(track, true)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelectTrack(track, true);
                  }
                }}
              >
                <div className="spotify-card-art-wrap">
                  <SpotifyArtwork
                    src={track.coverSrc}
                    alt={track.title}
                    fallbackColor={track.accentColor}
                    fallbackText={track.title}
                    className="spotify-card-art"
                  />
                  <button
                    type="button"
                    className="spotify-card-play"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectTrack(track, true);
                    }}
                    aria-label={`Play ${track.title}`}
                  >
                    <Play size={18} fill="currentColor" aria-hidden="true" />
                  </button>
                </div>
                <div className="spotify-card-title">{track.title}</div>
                <p className="spotify-card-desc">{track.artist}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
