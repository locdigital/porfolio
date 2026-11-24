import { useEffect } from "react";
import {
  Heart,
  ListMusic,
  Monitor,
  Pause,
  Play,
  PlusCircle,
  Repeat,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from "lucide-react";
import { SPOTIFY_TRACKS, formatDurationMs } from "../../data/spotify";
import { useSpotifyState } from "../apps/spotify/useSpotifyState";
import {
  sharedSpotifyAudio,
  useSharedSpotifyAudio,
} from "../apps/spotify/spotify-audio";

export function SpotifyDesktopPlayer() {
  const player = useSpotifyState();
  const audio = useSharedSpotifyAudio();

  // Keep track in sync with whatever is currently playing in the shared audio engine
  const track =
    SPOTIFY_TRACKS.find((t) => t.id === audio.trackId) ?? player.selectedTrack;
  const liked = player.likedIds.has(track.id);
  const toggleQueue = () => player.setIsQueueOpen((open) => !open);

  useEffect(() => {
    sharedSpotifyAudio.setOnEnded(() => {
      const idx = SPOTIFY_TRACKS.findIndex((t) => t.id === track.id);
      const next = SPOTIFY_TRACKS[(idx + 1) % SPOTIFY_TRACKS.length];
      if (next) {
        player.selectTrack(next);
        sharedSpotifyAudio.playTrack(next);
      }
    });
    return () => sharedSpotifyAudio.setOnEnded(null);
  }, [player, track.id]);

  const handleStep = (delta: -1 | 1) => {
    const idx = SPOTIFY_TRACKS.findIndex((t) => t.id === track.id);
    const nextIdx = player.isShuffle
      ? Math.floor(Math.random() * SPOTIFY_TRACKS.length)
      : (idx + delta + SPOTIFY_TRACKS.length) % SPOTIFY_TRACKS.length;
    const next = SPOTIFY_TRACKS[nextIdx];
    if (!next) return;
    player.selectTrack(next);
    sharedSpotifyAudio.selectTrack(next, audio.isPlaying);
  };

  const updateSeekFromClientX = (el: HTMLElement, clientX: number) => {
    if (!audio.duration) return;
    const rect = el.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    sharedSpotifyAudio.seek(ratio * audio.duration);
  };

  const handleSeekPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    updateSeekFromClientX(e.currentTarget, e.clientX);
  };

  const handleSeekPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.buttons !== 1) return;
    e.stopPropagation();
    updateSeekFromClientX(e.currentTarget, e.clientX);
  };

  const updateVolumeFromClientX = (el: HTMLElement, clientX: number) => {
    const rect = el.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    sharedSpotifyAudio.setVolume(ratio);
  };

  const handleVolumePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    updateVolumeFromClientX(e.currentTarget, e.clientX);
  };

  const handleVolumePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.buttons !== 1) return;
    e.stopPropagation();
    updateVolumeFromClientX(e.currentTarget, e.clientX);
  };

  const progressPct =
    audio.duration > 0 ? Math.min(100, (audio.currentTime / audio.duration) * 100) : 0;
  const totalMs = audio.duration > 0 ? audio.duration * 1000 : track.durationMs;

  return (
    <div className="dw-card dw-spotify-player">
      <div className="dw-sp-track">
        <img className="dw-sp-cover" src={track.coverSrc} alt={`${track.album} cover`} draggable={false} />
        <div className="dw-sp-meta">
          <div className="dw-sp-title" title={track.title}>{track.title}</div>
          <div className="dw-sp-artist">{track.artist}</div>
        </div>
        <div className="dw-sp-actions">
          <button className="dw-sp-button" aria-label={liked ? "Unlike track" : "Like track"} aria-pressed={liked} onClick={() => player.toggleLike(track.id)}>
            <Heart size={19} fill={liked ? "currentColor" : "none"} />
          </button>
          <a className="dw-sp-button" href={track.spotifyUrl} target="_blank" rel="noopener noreferrer" aria-label="Save track on Spotify" title="Save on Spotify"><PlusCircle size={18} /></a>
          <button className="dw-sp-button" aria-label="Show queue" aria-expanded={player.isQueueOpen} onClick={toggleQueue}><ListMusic size={19} /></button>
        </div>
      </div>
      <div className="dw-sp-transport">
        <button className="dw-sp-button" aria-label="Shuffle track selection" aria-pressed={player.isShuffle} onClick={() => player.setIsShuffle(!player.isShuffle)}><Shuffle size={18} /></button>
        <button className="dw-sp-button" aria-label="Previous track" onClick={() => handleStep(-1)}><SkipBack size={19} fill="currentColor" /></button>
        <button
          type="button"
          className="dw-sp-play"
          onClick={() => sharedSpotifyAudio.togglePlay(track)}
          aria-label={audio.isPlaying ? `Pause ${track.title}` : `Play ${track.title}`}
          title={audio.isPlaying ? "Pause" : "Play preview"}
        >
          {audio.isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={22} fill="currentColor" />}
        </button>
        <button className="dw-sp-button" aria-label="Next track" onClick={() => handleStep(1)}><SkipForward size={19} fill="currentColor" /></button>
        <button
          type="button"
          className="dw-sp-button"
          aria-label="Toggle repeat"
          aria-pressed={audio.isRepeat}
          title={audio.isRepeat ? "Repeat on" : "Repeat off"}
          onClick={() => sharedSpotifyAudio.setRepeat(!audio.isRepeat)}
        >
          <Repeat size={18} />
        </button>
      </div>
      <div className="dw-sp-progress" aria-label={`Playback position ${formatDurationMs(audio.currentTime * 1000)} of ${formatDurationMs(totalMs)}`}>
        <span>{formatDurationMs(audio.currentTime * 1000)}</span>
        <div
          className="dw-sp-timeline"
          data-widget-scroll
          role="slider"
          aria-label="Seek"
          aria-valuemin={0}
          aria-valuemax={Math.round(audio.duration)}
          aria-valuenow={Math.round(audio.currentTime)}
          tabIndex={0}
          style={{ cursor: "pointer", touchAction: "none" }}
          onPointerDown={handleSeekPointerDown}
          onPointerMove={handleSeekPointerMove}
        >
          <span style={{ width: `${progressPct}%` }} />
        </div>
        <span>{formatDurationMs(totalMs)}</span>
      </div>
      <div className="dw-sp-footer">
        <button className="dw-sp-button" aria-label="Show queue" aria-expanded={player.isQueueOpen} onClick={toggleQueue}><ListMusic size={18} /></button>
        <div className="dw-sp-output">
          <Monitor size={15} aria-hidden="true" />
          <button
            type="button"
            className="dw-sp-button"
            style={{ width: 22, height: 22 }}
            aria-label={audio.isMuted ? "Unmute" : "Mute"}
            onClick={() => sharedSpotifyAudio.toggleMute()}
          >
            {audio.isMuted || audio.volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          <div
            className="dw-sp-volume"
            data-widget-scroll
            role="slider"
            aria-label="Volume"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round((audio.isMuted ? 0 : audio.volume) * 100)}
            tabIndex={0}
            style={{ touchAction: "none" }}
            onPointerDown={handleVolumePointerDown}
            onPointerMove={handleVolumePointerMove}
            title={`Volume ${Math.round((audio.isMuted ? 0 : audio.volume) * 100)}%`}
          >
            <span
              className="dw-sp-volume-fill"
              style={{ width: `${(audio.isMuted ? 0 : audio.volume) * 100}%` }}
            />
          </div>
        </div>
      </div>
      {player.isQueueOpen && (
        <div className="dw-sp-queue" aria-label="Track queue">
          <div className="dw-sp-queue-header"><span>My rotation</span><button className="dw-sp-button" onClick={toggleQueue} aria-label="Hide queue"><ListMusic size={18} /></button></div>
          <div className="dw-sp-queue-list">
            {SPOTIFY_TRACKS.map((item) => (
              <button
                key={item.id}
                className="dw-sp-queue-track"
                aria-current={item.id === track.id ? "true" : undefined}
                onClick={() => {
                  player.selectTrack(item);
                  sharedSpotifyAudio.playTrack(item);
                  player.setIsQueueOpen(false);
                }}
              >
                <span>{item.title}</span>
                <small>{item.artist}</small>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
