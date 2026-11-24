import { useEffect, useRef, useState } from "react";
import {
  ArrowDownCircle,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  Link2,
  MoreHorizontal,
  Pause,
  Play,
  PlusCircle,
  Search,
  Shuffle,
} from "lucide-react";
import { formatTotalDuration, type SpotifyTrack } from "../../../data/spotify";
import { SpotifyArtwork } from "./SpotifyArtwork";
import { SpotifyTrackRow } from "./SpotifyTrackRow";
import { sharedSpotifyAudio, useSharedSpotifyAudio } from "./spotify-audio";

interface SpotifyPlaylistDetailProps {
  typeLabel: string;
  title: string;
  description: string;
  accentColor: string;
  coverSrc?: string;
  tracks: SpotifyTrack[];
  selectedTrackId: string;
  likedIds: Set<string>;
  isShuffle: boolean;
  onToggleShuffle: () => void;
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
  isShuffle,
  onToggleShuffle,
  onSelectTrack,
  onToggleLike,
}: SpotifyPlaylistDetailProps) {
  const audio = useSharedSpotifyAudio();
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const moreRef = useRef<HTMLDivElement | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToastMsg(null), 2200);
  };

  useEffect(() => {
    if (!isMoreOpen) return;
    const handleOutside = (e: PointerEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setIsMoreOpen(false);
      }
    };
    window.addEventListener("pointerdown", handleOutside);
    return () => window.removeEventListener("pointerdown", handleOutside);
  }, [isMoreOpen]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    };
  }, []);

  const totalDuration = formatTotalDuration(tracks);
  const heroArt = coverSrc ?? tracks[0]?.coverSrc;

  const isPlaylistTrackActive = tracks.some((t) => t.id === audio.trackId);
  const isPlaylistPlaying = isPlaylistTrackActive && audio.isPlaying;
  const allLiked = tracks.length > 0 && tracks.every((t) => likedIds.has(t.id));

  const handlePlayToggle = () => {
    if (tracks.length === 0) return;
    if (isPlaylistTrackActive) {
      const current = tracks.find((t) => t.id === audio.trackId) ?? tracks[0];
      sharedSpotifyAudio.togglePlay(current);
      return;
    }
    const target = isShuffle
      ? tracks[Math.floor(Math.random() * tracks.length)]
      : tracks[0];
    if (target) {
      onSelectTrack(target, true);
      sharedSpotifyAudio.playTrack(target);
    }
  };

  const handleShuffleClick = () => {
    onToggleShuffle();
    showToast(isShuffle ? "Shuffle off" : "Shuffle on");
  };

  const handleSaveAll = () => {
    if (tracks.length === 0) return;
    if (allLiked) {
      tracks.forEach((t) => {
        if (likedIds.has(t.id)) onToggleLike(t.id);
      });
      showToast("Removed from Liked Songs");
    } else {
      tracks.forEach((t) => {
        if (!likedIds.has(t.id)) onToggleLike(t.id);
      });
      showToast("Saved to Liked Songs");
    }
  };

  const handleDownloadClick = () => {
    if (tracks.length === 0) return;
    setIsDownloaded((prev) => {
      const next = !prev;
      showToast(next ? `Downloaded "${title}"` : "Removed from downloads");
      return next;
    });
  };

  const handleCopyLink = () => {
    setIsMoreOpen(false);
    const url = tracks[0]?.spotifyUrl ?? (typeof window !== "undefined" ? window.location.href : "");
    if (url && navigator.clipboard) {
      navigator.clipboard.writeText(url).catch(() => {});
    }
    showToast("Link copied to clipboard");
  };

  return (
    <div className="relative">
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
            onClick={handlePlayToggle}
            aria-label={isPlaylistPlaying ? `Pause ${title}` : `Play ${title}`}
            title={isPlaylistPlaying ? "Pause" : "Play"}
          >
            {isPlaylistPlaying ? (
              <Pause size={22} fill="currentColor" aria-hidden="true" />
            ) : (
              <Play size={22} fill="currentColor" style={{ marginLeft: "2px" }} aria-hidden="true" />
            )}
          </button>
          <button
            type="button"
            className={`spotify-action-icon${isShuffle ? " is-active" : ""}`}
            style={isShuffle ? { color: "#1ed760" } : undefined}
            onClick={handleShuffleClick}
            aria-label="Shuffle"
            aria-pressed={isShuffle}
            title={isShuffle ? "Disable shuffle" : "Enable shuffle"}
          >
            <Shuffle size={20} aria-hidden="true" />
          </button>
          <button
            type="button"
            className={`spotify-action-icon${allLiked ? " is-active" : ""}`}
            style={allLiked ? { color: "#1ed760" } : undefined}
            disabled={tracks.length === 0}
            onClick={handleSaveAll}
            aria-label={allLiked ? "Remove from library" : "Save to library"}
            aria-pressed={allLiked}
            title={allLiked ? "Saved to Liked Songs" : "Save all to Liked Songs"}
          >
            {allLiked ? (
              <CheckCircle2 size={20} aria-hidden="true" />
            ) : (
              <PlusCircle size={20} aria-hidden="true" />
            )}
          </button>
          <button
            type="button"
            className={`spotify-action-icon${isDownloaded ? " is-active" : ""}`}
            style={isDownloaded ? { color: "#1ed760" } : undefined}
            disabled={tracks.length === 0}
            onClick={handleDownloadClick}
            aria-label={isDownloaded ? "Remove download" : "Download"}
            aria-pressed={isDownloaded}
            title={isDownloaded ? "Downloaded" : "Download"}
          >
            <ArrowDownCircle size={20} aria-hidden="true" />
          </button>
          <div className="relative" ref={moreRef}>
            <button
              type="button"
              className="spotify-action-icon"
              onClick={() => setIsMoreOpen((o) => !o)}
              aria-label="More options"
              aria-expanded={isMoreOpen}
              title="More options"
            >
              <MoreHorizontal size={20} aria-hidden="true" />
            </button>
            {isMoreOpen && (
              <div
                role="menu"
                style={{
                  position: "absolute",
                  top: "calc(100% + 6px)",
                  left: 0,
                  zIndex: 40,
                  minWidth: 196,
                  padding: 4,
                  borderRadius: 6,
                  background: "#282828",
                  boxShadow: "0 16px 32px rgba(0, 0, 0, 0.55)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                }}
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setIsMoreOpen(false);
                    if (!isShuffle) onToggleShuffle();
                    const pick = tracks[Math.floor(Math.random() * tracks.length)];
                    if (pick) {
                      onSelectTrack(pick, true);
                      sharedSpotifyAudio.playTrack(pick);
                    }
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: 4,
                    background: "transparent",
                    color: "#e5e5e5",
                    fontSize: 13,
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <Shuffle size={14} aria-hidden="true" />
                  <span>Shuffle play</span>
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setIsMoreOpen(false);
                    handleSaveAll();
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: 4,
                    background: "transparent",
                    color: "#e5e5e5",
                    fontSize: 13,
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  {allLiked ? <Check size={14} aria-hidden="true" /> : <PlusCircle size={14} aria-hidden="true" />}
                  <span>{allLiked ? "Remove from Liked Songs" : "Save all to Liked Songs"}</span>
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleCopyLink}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: 4,
                    background: "transparent",
                    color: "#e5e5e5",
                    fontSize: 13,
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <Link2 size={14} aria-hidden="true" />
                  <span>Copy link</span>
                </button>
                {tracks[0]?.spotifyUrl && (
                  <a
                    role="menuitem"
                    href={tracks[0].spotifyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setIsMoreOpen(false)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: 4,
                      background: "transparent",
                      color: "#e5e5e5",
                      fontSize: 13,
                      cursor: "pointer",
                      textDecoration: "none",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <ExternalLink size={14} aria-hidden="true" />
                    <span>Open in Spotify</span>
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-[#b3b3b3]">
          <Search size={15} aria-hidden="true" />
          <span>Custom order</span>
        </div>
      </div>

      {toastMsg && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: "sticky",
            bottom: 16,
            marginLeft: "auto",
            marginRight: "auto",
            width: "fit-content",
            zIndex: 50,
            padding: "8px 16px",
            borderRadius: 8,
            background: "#2e77d0",
            color: "#ffffff",
            fontSize: 13,
            fontWeight: 600,
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.45)",
          }}
        >
          {toastMsg}
        </div>
      )}

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
