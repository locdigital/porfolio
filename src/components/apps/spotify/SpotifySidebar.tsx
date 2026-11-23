import { ListFilter, Search } from "lucide-react";
import { ALL_SPOTIFY_COLLECTIONS } from "../../../data/spotify";
import { SpotifyArtwork } from "./SpotifyArtwork";
import type { SpotifyView } from "./useSpotifyState";

interface SpotifySidebarProps {
  currentView: SpotifyView;
  likedCount?: number;
  onNavigate: (view: SpotifyView) => void;
}

export function SpotifySidebar({
  currentView,
  onNavigate,
}: SpotifySidebarProps) {
  const isPlaylistActive = (id: string) =>
    currentView.kind === "playlist" && currentView.playlistId === id;

  return (
    <aside className="spotify-sidebar" aria-label="Library">
      <div className="spotify-lib-subrow">
        <button
          type="button"
          className="spotify-icon-pill"
          onClick={() => onNavigate({ kind: "search" })}
          aria-label="Search library"
        >
          <Search size={14} aria-hidden="true" />
        </button>
        <span className="inline-flex items-center gap-1.5">
          <span>Recents</span>
          <ListFilter size={13} aria-hidden="true" />
        </span>
      </div>

      <div className="spotify-lib-list">
        {ALL_SPOTIFY_COLLECTIONS.map((pl) => (
          <button
            key={pl.id}
            type="button"
            className={`spotify-lib-row${isPlaylistActive(pl.id) ? " active" : ""}`}
            onClick={() => onNavigate({ kind: "playlist", playlistId: pl.id })}
          >
            <SpotifyArtwork
              src={pl.coverSrc}
              alt={pl.title}
              fallbackColor={pl.accentColor}
              fallbackText={pl.title}
              className="spotify-lib-thumb"
            />
            <div className="spotify-lib-meta">
              <div className="spotify-lib-name">{pl.title}</div>
              <div className="spotify-lib-sub">Playlist · Loc</div>
            </div>
          </button>
        ))}
      </div>
    </aside>
  );
}
