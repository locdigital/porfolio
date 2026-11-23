import {
  Heart,
  ListMusic,
  Play,
  Repeat,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume2,
  X,
} from "lucide-react";
import {
  SPOTIFY_TRACKS,
  formatDurationMs,
  type SpotifyTrack,
} from "../../../data/spotify";
import { SpotifyArtwork } from "./SpotifyArtwork";
import type { RepeatMode } from "./useSpotifyState";

interface SpotifyPlayerProps {
  selectedTrack: SpotifyTrack;
  isLiked: boolean;
  onToggleLike: (trackId: string) => void;
  isShuffle: boolean;
  onToggleShuffle: () => void;
  repeatMode: RepeatMode;
  onCycleRepeat: () => void;
  onPrev: () => void;
  onNext: () => void;
  isQueueOpen: boolean;
  onToggleQueue: () => void;
  onSelectTrack: (track: SpotifyTrack) => void;
}

export function SpotifyPlayer({
  selectedTrack,
  isLiked,
  onToggleLike,
  isShuffle,
  onToggleShuffle,
  repeatMode,
  onCycleRepeat,
  onPrev,
  onNext,
  isQueueOpen,
  onToggleQueue,
  onSelectTrack,
}: SpotifyPlayerProps) {
  return (
    <>
      {isQueueOpen && (
        <div
          className="spotify-popover"
          style={{ top: "auto", bottom: "92px", right: "20px" }}
          role="dialog"
          aria-label="Up next queue"
        >
          <div className="spotify-popover-header">
            <h3 className="spotify-popover-title">Queue</h3>
            <button
              type="button"
              className="spotify-icon-btn"
              onClick={onToggleQueue}
              aria-label="Close queue"
            >
              <X size={15} aria-hidden="true" />
            </button>
          </div>
          <div className="spotify-popover-section">Now selected</div>
          <div className="spotify-activity-row" style={{ cursor: "default" }}>
            <SpotifyArtwork
              src={selectedTrack.coverSrc}
              alt={selectedTrack.title}
              fallbackColor={selectedTrack.accentColor}
              fallbackText={selectedTrack.artist}
              className="spotify-activity-thumb"
            />
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-semibold text-[#1ed760] truncate">
                {selectedTrack.title}
              </div>
              <div className="text-[11px] text-[#b3b3b3] truncate">
                {selectedTrack.artist}
              </div>
            </div>
          </div>

          <div className="spotify-popover-section">Next in rotation</div>
          {SPOTIFY_TRACKS.filter((t) => t.id !== selectedTrack.id)
            .slice(0, 5)
            .map((track) => (
              <button
                key={track.id}
                type="button"
                className="spotify-activity-row"
                onClick={() => onSelectTrack(track)}
              >
                <SpotifyArtwork
                  src={track.coverSrc}
                  alt={track.title}
                  fallbackColor={track.accentColor}
                  fallbackText={track.artist}
                  className="spotify-activity-thumb"
                />
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-semibold text-white truncate">
                    {track.title}
                  </div>
                  <div className="text-[11px] text-[#b3b3b3] truncate">
                    {track.artist}
                  </div>
                </div>
              </button>
            ))}
        </div>
      )}

      <footer className="spotify-player" aria-label="Spotify playback bar">
        {/* Left: Track info */}
        <div className="spotify-player-track">
          <SpotifyArtwork
            src={selectedTrack.coverSrc}
            alt={`${selectedTrack.album} cover`}
            fallbackColor={selectedTrack.accentColor}
            fallbackText={selectedTrack.artist}
            className="spotify-player-art"
          />
          <div className="min-w-0">
            <div className="spotify-player-title">{selectedTrack.title}</div>
            <div className="spotify-player-artist">{selectedTrack.artist}</div>
          </div>
          <button
            type="button"
            className={`spotify-like-btn${isLiked ? " is-liked" : ""}`}
            onClick={() => onToggleLike(selectedTrack.id)}
            aria-label={isLiked ? "Remove from Liked songs" : "Save to Liked songs"}
            aria-pressed={isLiked}
          >
            <Heart
              size={15}
              fill={isLiked ? "#1ed760" : "none"}
              aria-hidden="true"
            />
          </button>
        </div>

        {/* Center: Playback controls + honest progress bar */}
        <div className="spotify-player-center">
          <div className="spotify-player-controls">
            <button
              type="button"
              className={`spotify-ctrl-btn${isShuffle ? " is-active" : ""}`}
              onClick={onToggleShuffle}
              aria-label="Toggle shuffle"
              aria-pressed={isShuffle}
              title="Shuffle"
            >
              <Shuffle size={15} aria-hidden="true" />
            </button>
            <button
              type="button"
              className="spotify-ctrl-btn"
              onClick={onPrev}
              aria-label="Previous track"
              title="Previous"
            >
              <SkipBack size={16} fill="currentColor" aria-hidden="true" />
            </button>
            <a
              href={selectedTrack.spotifyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="spotify-play-main"
              aria-label={`Play ${selectedTrack.title} on Spotify`}
              title="Play on Spotify"
            >
              <Play size={15} fill="currentColor" style={{ marginLeft: "1px" }} aria-hidden="true" />
            </a>
            <button
              type="button"
              className="spotify-ctrl-btn"
              onClick={onNext}
              aria-label="Next track"
              title="Next"
            >
              <SkipForward size={16} fill="currentColor" aria-hidden="true" />
            </button>
            <button
              type="button"
              className={`spotify-ctrl-btn${repeatMode !== "off" ? " is-active" : ""}`}
              onClick={onCycleRepeat}
              aria-label={`Repeat mode: ${repeatMode}`}
              title={`Repeat: ${repeatMode}`}
            >
              <Repeat size={15} aria-hidden="true" />
            </button>
          </div>

          <div
            className="spotify-player-progress"
            title="Playback position is controlled inside the official Spotify Embed"
          >
            <span>0:00</span>
            <div className="spotify-progress-bar" aria-hidden="true">
              <div className="spotify-progress-fill" />
            </div>
            <span>
              {formatDurationMs(selectedTrack.durationMs)}
            </span>
          </div>
        </div>

        {/* Right: Queue & Volume indicator */}
        <div className="spotify-player-right">
          <button
            type="button"
            className={`spotify-ctrl-btn${isQueueOpen ? " is-active" : ""}`}
            onClick={onToggleQueue}
            aria-label="Toggle queue"
            aria-expanded={isQueueOpen}
            title="Queue"
          >
            <ListMusic size={16} aria-hidden="true" />
          </button>

          <div
            className="inline-flex items-center gap-2"
            title="Volume is managed by the official Spotify Embed or your system"
          >
            <Volume2 size={15} className="text-[#b3b3b3]" aria-hidden="true" />
            <div className="spotify-volume-bar" aria-hidden="true">
              <div className="spotify-volume-fill" />
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}

