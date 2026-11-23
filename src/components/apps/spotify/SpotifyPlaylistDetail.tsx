import {
  ArrowDownCircle,
  Clock,
  MoreHorizontal,
  Play,
  PlusCircle,
  Search,
  Shuffle,
} from "lucide-react";
import { formatTotalDuration, type SpotifyTrack } from "../../../data/spotify";
import { SpotifyArtwork } from "./SpotifyArtwork";
import { SpotifyTrackRow } from "./SpotifyTrackRow";

interface SpotifyPlaylistDetailProps {
  typeLabel: string;
  title: string;
  description: string;
  accentColor: string;
  coverSrc?: string;
  tracks: SpotifyTrack[];
  selectedTrackId: string;
  likedIds: Set<string>;
  onSelectTrack: (track: SpotifyTrack, openEmbed?: boolean) => void;
  onToggleLike: (trackId: string) => void;
}

export function SpotifyPlaylistDetail({
  typeLabel,
  title,
  description,
  accentColor,
  coverSrc,
  tracks,
  selectedTrackId,
  likedIds,
  onSelectTrack,
  onToggleLike,
}: SpotifyPlaylistDetailProps) {
  const totalDuration = formatTotalDuration(tracks);
  const heroArt = coverSrc ?? tracks[0]?.coverSrc;

  return (
    <div>
      <div
        className="spotify-detail-hero"
        style={{
          background: `linear-gradient(180deg, ${accentColor}CC 0%, ${accentColor}44 70%, #121212 100%)`,
        }}
      >
        <SpotifyArtwork
          src={heroArt}
          alt={title}
          fallbackColor={accentColor}
          fallbackText={title}
          className="spotify-detail-cover"
        />
        <div className="spotify-detail-meta">
          <div className="spotify-detail-type">{typeLabel}</div>
          <h1 className="spotify-detail-title">{title}</h1>
          <p className="spotify-detail-desc">{description}</p>
          <div className="spotify-detail-stats">
            Made for <strong>Loc</strong> · {tracks.length}{" "}
            {tracks.length === 1 ? "song" : "songs"}
            {totalDuration ? `, ${totalDuration}` : ""}
          </div>
        </div>
      </div>

      <div
        className="spotify-detail-actions"
        style={{
          background: `linear-gradient(180deg, ${accentColor}22 0%, #121212 100%)`,
        }}
      >
        <div className="spotify-detail-actions-left">
          <button
            type="button"
            className="spotify-play-circle"
            disabled={tracks.length === 0}
            onClick={() => {
              if (tracks[0]) onSelectTrack(tracks[0], true);
            }}
            aria-label={`Play ${title}`}
          >
            <Play size={22} fill="currentColor" aria-hidden="true" />
          </button>
          <button type="button" className="spotify-action-icon" aria-label="Shuffle">
            <Shuffle size={20} aria-hidden="true" />
          </button>
          <button type="button" className="spotify-action-icon" aria-label="Save to library">
            <PlusCircle size={20} aria-hidden="true" />
          </button>
          <button type="button" className="spotify-action-icon" aria-label="Download">
            <ArrowDownCircle size={20} aria-hidden="true" />
          </button>
          <button type="button" className="spotify-action-icon" aria-label="More options">
            <MoreHorizontal size={20} aria-hidden="true" />
          </button>
        </div>

        <div className="flex items-center gap-3 text-xs text-[#b3b3b3]">
          <Search size={15} aria-hidden="true" />
          <span>Custom order</span>
        </div>
      </div>

      {tracks.length === 0 ? (
        <div className="px-6 pb-8">
          <div className="spotify-empty">
            No tracks in this collection yet.
          </div>
        </div>
      ) : (
        <div className="spotify-track-list">
          <div className="spotify-track-header" aria-hidden="true">
            <span className="text-center">#</span>
            <span>Title</span>
            <span className="spotify-track-header-album">Album</span>
            <span />
            <span className="flex justify-end">
              <Clock size={14} />
            </span>
            <span />
          </div>
          {tracks.map((track, idx) => (
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
      )}
    </div>
  );
}
