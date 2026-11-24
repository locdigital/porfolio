import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import type { SpotifyPlaylist, SpotifyTrack } from "../../../data/spotify";
import { SpotifyArtwork } from "./SpotifyArtwork";

interface SpotifyActivityProps {
  isOpen: boolean;
  onClose: () => void;
  recentTracks: SpotifyTrack[];
  recentCollections: SpotifyPlaylist[];
  selectedTrackId: string;
  onSelectTrack: (track: SpotifyTrack) => void;
  onOpenCollection: (playlistId: string) => void;
}

export function SpotifyActivity({
  isOpen,
  onClose,
  recentTracks,
  recentCollections,
  selectedTrackId,
  onSelectTrack,
  onOpenCollection,
}: SpotifyActivityProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (panelRef.current?.contains(target)) return;
      if (target.closest('[aria-label="Toggle Activity panel"]')) return;
      onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("pointerdown", handlePointerDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={panelRef}
      className="spotify-popover"
      role="dialog"
      aria-label="Listening activity and history"
    >
      <div className="spotify-popover-header">
        <h3 className="spotify-popover-title">Activity</h3>
        <button
          type="button"
          className="spotify-icon-btn"
          onClick={onClose}
          aria-label="Close activity panel"
        >
          <X size={15} aria-hidden="true" />
        </button>
      </div>

      <div className="spotify-popover-section">Recently selected</div>
      {recentTracks.map((track) => {
        const isCurrent = track.id === selectedTrackId;
        return (
          <button
            key={track.id}
            type="button"
            className="spotify-activity-row"
            onClick={() => onSelectTrack(track)}
          >
            <SpotifyArtwork
              src={track.coverSrc}
              alt={`${track.title} cover`}
              fallbackColor={track.accentColor}
              fallbackText={track.artist}
              className="spotify-activity-thumb"
            />
            <div className="min-w-0 flex-1">
              <div
                className="text-[13px] font-semibold truncate"
                style={{ color: isCurrent ? "var(--spotify-green-hover)" : "var(--spotify-text-primary)" }}
              >
                {track.title}
              </div>
              <div className="text-[11px] text-[#b3b3b3] truncate">
                {track.artist} · {track.album}
              </div>
            </div>
          </button>
        );
      })}

      <div className="spotify-popover-section">History</div>
      {recentCollections.map((col) => (
        <button
          key={col.id}
          type="button"
          className="spotify-activity-row"
          onClick={() => {
            onOpenCollection(col.id);
            onClose();
          }}
        >
          <SpotifyArtwork
            src={col.coverSrc}
            alt={`${col.title} cover`}
            fallbackColor={col.accentColor}
            fallbackText={col.title}
            className="spotify-activity-thumb"
          />
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-semibold text-white truncate">
              {col.title}
            </div>
            <div className="text-[11px] text-[#b3b3b3] truncate">
              {col.trackIds.length} tracks
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

