import { useEffect, useRef } from "react";
import {
  Heart,
  ListMusic,
  Pause,
  Play,
  Repeat,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import {
  SPOTIFY_TRACKS,
  formatDurationMs,
  type SpotifyTrack,
} from "../../../data/spotify";
import { SpotifyArtwork } from "./SpotifyArtwork";
import type { RepeatMode } from "./useSpotifyState";
import { sharedSpotifyAudio, useSharedSpotifyAudio } from "./spotify-audio";

interface SpotifyPlayerProps {
  selectedTrack: SpotifyTrack;
  isLiked: boolean;
  onToggleLike: (trackId: string) => void;
  isShuffle: boolean;
  onToggleShuffle: () => void;
  repeatMode: RepeatMode;
  onCycleRepeat: () => void;
  onPrev: () => void;
  onNext: (fromAutoEnd?: boolean) => void;
  isQueueOpen: boolean;
  onToggleQueue: () => void;
  onSelectTrack: (track: SpotifyTrack) => void;
  onSyncTrack?: (track: SpotifyTrack) => void;
}

function formatCurrentTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0:00";
  return formatDurationMs(seconds * 1000);
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
  onSyncTrack,
}: SpotifyPlayerProps) {
  const audio = useSharedSpotifyAudio();
  const prevTrackIdRef = useRef(selectedTrack.id);

  // Pre-warm YouTube full-song engine & sync to any track already active in the shared engine
  useEffect(() => {
    sharedSpotifyAudio.warmup();
    const active = SPOTIFY_TRACKS.find((t) => t.id === sharedSpotifyAudio.getSnapshot().trackId);
    if (active && active.id !== selectedTrack.id) {
      prevTrackIdRef.current = active.id;
      (onSyncTrack ?? onSelectTrack)(active);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When user steps Prev/Next or picks a new track inside SpotifyApp, play it on the shared engine
  useEffect(() => {
    if (prevTrackIdRef.current !== selectedTrack.id) {
      prevTrackIdRef.current = selectedTrack.id;
      sharedSpotifyAudio.playTrack(selectedTrack);
    }
  }, [selectedTrack]);

  // Sync repeat mode & ended callback
  useEffect(() => {
    sharedSpotifyAudio.setRepeat(repeatMode === "one");
  }, [repeatMode]);

  useEffect(() => {
    sharedSpotifyAudio.setOnEnded(() => {
      onNext(true);
    });
    return () => sharedSpotifyAudio.setOnEnded(null);
  }, [onNext]);

  const handlePrevClick = () => {
    // Match Spotify: if more than 3s into the track, restart from 0:00; otherwise go to previous track
    if (sharedSpotifyAudio.getSnapshot().currentTime > 3) {
      sharedSpotifyAudio.seek(0);
      return;
    }
    onPrev();
  };

  const activeTrack =
    SPOTIFY_TRACKS.find((t) => t.id === audio.trackId) ?? selectedTrack;

  const updateSeekFromClientX = (el: HTMLElement, clientX: number) => {
    if (!audio.duration) return;
    const rect = el.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    sharedSpotifyAudio.seek(ratio * audio.duration);
  };

  const handleSeekPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    updateSeekFromClientX(e.currentTarget, e.clientX);
  };

  const handleSeekPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.buttons !== 1) return;
    updateSeekFromClientX(e.currentTarget, e.clientX);
  };

  const handleSeekKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!audio.duration) return;
    if (e.key === "ArrowRight") {
      e.preventDefault();
      sharedSpotifyAudio.seek(audio.currentTime + 5);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      sharedSpotifyAudio.seek(audio.currentTime - 5);
    }
  };

  const updateVolumeFromClientX = (el: HTMLElement, clientX: number) => {
    const rect = el.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    sharedSpotifyAudio.setVolume(ratio);
  };

  const handleVolumePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    updateVolumeFromClientX(e.currentTarget, e.clientX);
  };

  const handleVolumePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.buttons !== 1) return;
    updateVolumeFromClientX(e.currentTarget, e.clientX);
  };

  const progressPct =
    audio.duration > 0 ? Math.min(100, (audio.currentTime / audio.duration) * 100) : 0;
  const totalMs = audio.duration > 0 ? audio.duration * 1000 : activeTrack.durationMs;

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
              src={activeTrack.coverSrc}
              alt={activeTrack.title}
              fallbackColor={activeTrack.accentColor}
              fallbackText={activeTrack.artist}
              className="spotify-activity-thumb"
            />
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-semibold text-[#1ed760] truncate">
                {activeTrack.title}
              </div>
              <div className="text-[11px] text-[#b3b3b3] truncate">
                {activeTrack.artist}
              </div>
            </div>
          </div>

          <div className="spotify-popover-section">Next in rotation</div>
          {SPOTIFY_TRACKS.filter((t) => t.id !== activeTrack.id)
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
            src={activeTrack.coverSrc}
            alt={`${activeTrack.album} cover`}
            fallbackColor={activeTrack.accentColor}
            fallbackText={activeTrack.artist}
            className="spotify-player-art"
          />
          <div className="min-w-0">
            <div className="spotify-player-title">{activeTrack.title}</div>
            <div className="spotify-player-artist">{activeTrack.artist}</div>
          </div>
          <button
            type="button"
            className={`spotify-like-btn${isLiked ? " is-liked" : ""}`}
            onClick={() => onToggleLike(activeTrack.id)}
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

        {/* Center: Playback controls + live progress bar */}
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
              onClick={handlePrevClick}
              aria-label="Previous track"
              title="Previous"
            >
              <SkipBack size={16} fill="currentColor" aria-hidden="true" />
            </button>
            <button
              type="button"
              className="spotify-play-main"
              onClick={() => sharedSpotifyAudio.togglePlay(activeTrack)}
              aria-label={audio.isPlaying ? `Pause ${activeTrack.title}` : `Play ${activeTrack.title}`}
              title={audio.isPlaying ? "Pause" : "Play"}
            >
              {audio.isPlaying ? (
                <Pause size={15} fill="currentColor" aria-hidden="true" />
              ) : (
                <Play size={15} fill="currentColor" style={{ marginLeft: "1px" }} aria-hidden="true" />
              )}
            </button>
            <button
              type="button"
              className="spotify-ctrl-btn"
              onClick={() => onNext(false)}
              aria-label="Next track"
              title="Next"
            >
              <SkipForward size={16} fill="currentColor" aria-hidden="true" />
            </button>
            <button
              type="button"
              className={`spotify-ctrl-btn${repeatMode === "one" ? " is-active" : ""}`}
              onClick={onCycleRepeat}
              aria-label={repeatMode === "one" ? "Disable repeat" : "Enable repeat"}
              aria-pressed={repeatMode === "one"}
              title={repeatMode === "one" ? "Repeat: On" : "Repeat: Off"}
            >
              <Repeat size={15} aria-hidden="true" />
            </button>
          </div>

          <div className="spotify-player-progress">
            <span>{formatCurrentTime(audio.currentTime)}</span>
            <div
              className="spotify-progress-bar"
              role="slider"
              aria-label="Seek"
              aria-valuemin={0}
              aria-valuemax={Math.round(audio.duration)}
              aria-valuenow={Math.round(audio.currentTime)}
              tabIndex={0}
              style={{ cursor: "pointer", touchAction: "none" }}
              onPointerDown={handleSeekPointerDown}
              onPointerMove={handleSeekPointerMove}
              onKeyDown={handleSeekKeyDown}
            >
              <div
                className="spotify-progress-fill"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <span>{formatDurationMs(totalMs)}</span>
          </div>
        </div>

        {/* Right: Queue & Volume */}
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

          <div className="inline-flex items-center gap-2">
            <button
              type="button"
              className="spotify-ctrl-btn"
              onClick={() => sharedSpotifyAudio.toggleMute()}
              aria-label={audio.isMuted ? "Unmute" : "Mute"}
              title={audio.isMuted ? "Unmute" : "Mute"}
            >
              {audio.isMuted || audio.volume === 0 ? (
                <VolumeX size={15} className="text-[#b3b3b3]" aria-hidden="true" />
              ) : (
                <Volume2 size={15} className="text-[#b3b3b3]" aria-hidden="true" />
              )}
            </button>
            <div
              className="spotify-volume-bar"
              style={{ cursor: "pointer", touchAction: "none" }}
              onPointerDown={handleVolumePointerDown}
              onPointerMove={handleVolumePointerMove}
              title={`Volume ${Math.round((audio.isMuted ? 0 : audio.volume) * 100)}%`}
            >
              <div
                className="spotify-volume-fill"
                style={{ width: `${(audio.isMuted ? 0 : audio.volume) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
