import { ExternalLink, Heart, Play } from "lucide-react";
import { formatDurationMs, type SpotifyTrack } from "../../../data/spotify";
import { SpotifyArtwork } from "./SpotifyArtwork";

interface SpotifyTrackRowProps {
  track: SpotifyTrack;
  index: number;
  isSelected: boolean;
  isLiked: boolean;
  onSelect: (track: SpotifyTrack) => void;
  onToggleLike: (trackId: string) => void;
}

export function SpotifyTrackRow({
  track,
  index,
  isSelected,
  isLiked,
  onSelect,
  onToggleLike,
}: SpotifyTrackRowProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      className={`spotify-track-row${isSelected ? " is-selected" : ""}`}
      onClick={() => onSelect(track)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(track);
        }
      }}
      aria-label={`Select ${track.title} by ${track.artist}`}
      aria-pressed={isSelected}
    >
      <div className="spotify-track-num">
        {isSelected ? (
          <Play
            size={13}
            className="inline text-[#169C46] fill-[#1DB954]"
            aria-hidden="true"
          />
        ) : (
          index + 1
        )}
      </div>

      <div className="spotify-track-main">
        <SpotifyArtwork
          src={track.coverSrc}
          alt={`${track.album} cover`}
          fallbackColor={track.accentColor}
          fallbackText={track.artist}
          className="spotify-track-thumb"
        />
        <div className="spotify-track-info">
          <div className="spotify-track-title">{track.title}</div>
          <div className="spotify-track-artist">{track.artist}</div>
        </div>
      </div>

      <div className="spotify-track-album">{track.album}</div>

      <button
        type="button"
        className={`spotify-like-btn${isLiked ? " is-liked" : ""}`}
        onClick={(e) => {
          e.stopPropagation();
          onToggleLike(track.id);
        }}
        aria-label={isLiked ? `Remove ${track.title} from Liked songs` : `Save ${track.title} to Liked songs`}
        aria-pressed={isLiked}
      >
        <Heart
          size={15}
          fill={isLiked ? "#1ed760" : "none"}
          aria-hidden="true"
        />
      </button>

      <div className="spotify-track-duration">{formatDurationMs(track.durationMs)}</div>

      <a
        href={track.spotifyUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="spotify-ext-link"
        onClick={(e) => e.stopPropagation()}
        aria-label={`Open ${track.title} in Spotify`}
        title="Open in Spotify"
      >
        <ExternalLink size={14} aria-hidden="true" />
      </a>
    </div>
  );
}

