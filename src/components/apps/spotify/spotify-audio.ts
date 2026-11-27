import { useSyncExternalStore } from "react";
import { SPOTIFY_TRACKS, type SpotifyTrack } from "../../../data/spotify";

export interface SpotifyAudioSnapshot {
  trackId: string;
  isPlaying: boolean;
  isLoading: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isRepeat: boolean;
  source: "youtube" | "preview";
}

type Listener = () => void;

interface YTPlayerInstance {
  loadVideoById: (videoId: string) => void;
  cueVideoById: (videoId: string) => void;
  playVideo: () => void;
  pauseVideo: () => void;
  stopVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead?: boolean) => void;
  setVolume: (volume: number) => void;
  mute: () => void;
  unMute: () => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  getPlayerState: () => number;
  destroy: () => void;
}

interface YTNamespace {
  Player: new (
    element: HTMLElement | string,
    options: {
      width?: number;
      height?: number;
      videoId?: string;
      playerVars?: Record<string, string | number>;
      events?: {
        onReady?: (event: { target: YTPlayerInstance }) => void;
        onStateChange?: (event: { data: number; target: YTPlayerInstance }) => void;
        onError?: (event: { data: number; target: YTPlayerInstance }) => void;
      };
    },
  ) => YTPlayerInstance;
  PlayerState?: {
    UNSTARTED: number;
    ENDED: number;
    PLAYING: number;
    PAUSED: number;
    BUFFERING: number;
    CUED: number;
  };
}

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

const YT_STATE = {
  ENDED: 0,
  PLAYING: 1,
  PAUSED: 2,
  BUFFERING: 3,
  CUED: 5,
} as const;

let ytApiPromise: Promise<YTNamespace> | null = null;

function loadYouTubeIframeAPI(): Promise<YTNamespace> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("YouTube API requires browser environment"));
  }
  if (window.YT?.Player) {
    return Promise.resolve(window.YT);
  }
  if (ytApiPromise) {
    return ytApiPromise;
  }

  ytApiPromise = new Promise<YTNamespace>((resolve, reject) => {
    let settled = false;
    const timeoutId = window.setTimeout(() => {
      if (!settled) {
        settled = true;
        ytApiPromise = null;
        reject(new Error("YouTube IFrame API timed out"));
      }
    }, 10000);

    const finish = () => {
      if (settled) return;
      if (window.YT?.Player) {
        settled = true;
        window.clearTimeout(timeoutId);
        resolve(window.YT);
      }
    };

    const previousReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previousReady?.();
      finish();
    };

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src*="youtube.com/iframe_api"]',
    );
    if (!existingScript) {
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      script.onerror = () => {
        if (!settled) {
          settled = true;
          window.clearTimeout(timeoutId);
          ytApiPromise = null;
          reject(new Error("Failed to load YouTube IFrame API"));
        }
      };
      document.head.appendChild(script);
    }

    if (window.YT?.Player) {
      finish();
    }
  });

  return ytApiPromise;
}

class SharedSpotifyAudio {
  private audio: HTMLAudioElement | null = null;
  private ytHost: HTMLDivElement | null = null;
  private ytPlayer: YTPlayerInstance | null = null;
  private isYtReady = false;
  private isYtInitializing = false;
  private ytApiFailed = false;
  private loadedVideoId: string | null = null;
  private failedYoutubeIds = new Set<string>();
  private activeMode: "youtube" | "preview" = "youtube";
  private currentTrack: SpotifyTrack = SPOTIFY_TRACKS[0];
  private pendingAction: { type: "play" | "cue"; track: SpotifyTrack } | null = null;
  private pollTimer: number | null = null;
  private ytFallbackTimer: number | null = null;
  private seekLockUntil = 0;

  private listeners = new Set<Listener>();
  private onEndedCallback: (() => void) | null = null;
  private snapshot: SpotifyAudioSnapshot = {
    trackId: SPOTIFY_TRACKS[0]?.id ?? "",
    isPlaying: false,
    isLoading: false,
    currentTime: 0,
    duration: (SPOTIFY_TRACKS[0]?.durationMs ?? 0) / 1000,
    volume: 0.8,
    isMuted: false,
    isRepeat: false,
    source: "youtube",
  };

  private update(patch: Partial<SpotifyAudioSnapshot>) {
    this.snapshot = { ...this.snapshot, ...patch };
    for (const listener of this.listeners) {
      listener();
    }
  }

  private ensureAudio(): HTMLAudioElement | null {
    if (typeof window === "undefined") return null;
    if (!this.audio) {
      const el = new Audio();
      el.preload = "metadata";
      el.loop = this.snapshot.isRepeat;
      el.volume = this.snapshot.isMuted ? 0 : this.snapshot.volume;
      el.addEventListener("timeupdate", () => {
        if (this.activeMode !== "preview") return;
        this.update({ currentTime: el.currentTime });
      });
      el.addEventListener("loadedmetadata", () => {
        if (this.activeMode !== "preview") return;
        this.update({ duration: el.duration || 0 });
      });
      el.addEventListener("play", () => {
        if (this.activeMode !== "preview") return;
        this.update({ isPlaying: true, isLoading: false });
      });
      el.addEventListener("pause", () => {
        if (this.activeMode !== "preview") return;
        this.update({ isPlaying: false, isLoading: false });
      });
      el.addEventListener("ended", () => {
        if (this.activeMode !== "preview") return;
        this.handleTrackEnded();
      });
      this.audio = el;
    }
    return this.audio;
  }

  private stopPreviewAudio() {
    if (this.audio && !this.audio.paused) {
      this.audio.pause();
    }
  }

  private stopYouTubeAudio() {
    this.stopProgressPolling();
    this.clearYtFallbackTimer();
    if (this.ytPlayer && this.isYtReady) {
      try {
        this.ytPlayer.pauseVideo();
      } catch {
        // Ignore teardown race from YouTube iframe
      }
    }
  }

  private clearYtFallbackTimer() {
    if (this.ytFallbackTimer !== null && typeof window !== "undefined") {
      window.clearTimeout(this.ytFallbackTimer);
      this.ytFallbackTimer = null;
    }
  }

  private startProgressPolling() {
    if (typeof window === "undefined") return;
    if (this.pollTimer !== null) return;
    this.pollTimer = window.setInterval(() => {
      if (this.activeMode !== "youtube" || !this.ytPlayer || !this.isYtReady) {
        this.stopProgressPolling();
        return;
      }
      try {
        const dur = this.ytPlayer.getDuration();
        const now = Date.now();
        const patch: Partial<SpotifyAudioSnapshot> = {};
        if (dur > 0 && Math.abs(dur - this.snapshot.duration) > 0.5) {
          patch.duration = dur;
        }
        if (now >= this.seekLockUntil) {
          const time = this.ytPlayer.getCurrentTime();
          if (Number.isFinite(time) && time >= 0) {
            patch.currentTime = time;
          }
        }
        if (Object.keys(patch).length > 0) {
          this.update(patch);
        }
      } catch {
        // Ignore transient YouTube postMessage timing errors
      }
    }, 250);
  }

  private stopProgressPolling() {
    if (this.pollTimer !== null && typeof window !== "undefined") {
      window.clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  private handleTrackEnded() {
    this.stopProgressPolling();
    if (this.snapshot.isRepeat) {
      if (this.activeMode === "youtube" && this.ytPlayer && this.isYtReady) {
        try {
          this.ytPlayer.seekTo(0, true);
          this.ytPlayer.playVideo();
          this.update({ currentTime: 0, isPlaying: true, isLoading: false });
          this.startProgressPolling();
          return;
        } catch {
          // Fall through if replay fails
        }
      } else if (this.activeMode === "preview" && this.audio) {
        this.audio.currentTime = 0;
        this.audio.play().catch(() => this.update({ isPlaying: false }));
        return;
      }
    }

    if (this.onEndedCallback) {
      this.onEndedCallback();
    } else {
      this.update({ isPlaying: false, isLoading: false });
    }
  }

  private syncYouTubeVolume() {
    if (!this.ytPlayer || !this.isYtReady) return;
    try {
      this.ytPlayer.setVolume(Math.round(this.snapshot.volume * 100));
      if (this.snapshot.isMuted) {
        this.ytPlayer.mute();
      } else {
        this.ytPlayer.unMute();
      }
    } catch {
      // Ignore if player isn't ready
    }
  }

  private ensureYouTubeHost(): HTMLDivElement | null {
    if (typeof document === "undefined") return null;

    // Mount inside Astro's transition:persist wrapper when present so full-song
    // playback survives page navigations without recreating the iframe.
    const persistContainer =
      document.querySelector<HTMLElement>(".workspace-dock-persist") ?? document.body;

    if (this.ytHost && document.contains(this.ytHost)) {
      return this.ytHost;
    }

    const host = document.createElement("div");
    host.dataset.spotifyYtHost = "true";
    host.setAttribute("aria-hidden", "true");
    host.style.position = "fixed";
    host.style.width = "200px";
    host.style.height = "200px";
    host.style.left = "-9999px";
    host.style.bottom = "0";
    host.style.opacity = "0.001";
    host.style.pointerEvents = "none";
    host.style.overflow = "hidden";
    persistContainer.appendChild(host);
    this.ytHost = host;
    return host;
  }

  private canUseYouTube(track: SpotifyTrack): track is SpotifyTrack & { youtubeVideoId: string } {
    return (
      Boolean(track.youtubeVideoId) &&
      !this.ytApiFailed &&
      !this.failedYoutubeIds.has(track.youtubeVideoId!)
    );
  }

  warmup() {
    if (typeof window === "undefined" || this.ytApiFailed) return;
    if (this.ytPlayer && this.isYtReady && this.ytHost && document.contains(this.ytHost)) {
      return;
    }
    if (this.isYtInitializing) return;

    this.isYtInitializing = true;
    const host = this.ensureYouTubeHost();
    if (!host) {
      this.isYtInitializing = false;
      return;
    }

    // Fresh inner target node for YT.Player (YouTube replaces the target element with an iframe)
    host.innerHTML = "";
    const playerMount = document.createElement("div");
    host.appendChild(playerMount);

    const initialVideoId =
      this.pendingAction?.track.youtubeVideoId ??
      this.currentTrack.youtubeVideoId ??
      SPOTIFY_TRACKS[0]?.youtubeVideoId;

    loadYouTubeIframeAPI()
      .then((YT) => {
        if (!document.contains(host)) {
          this.isYtInitializing = false;
          return;
        }
        this.ytPlayer = new YT.Player(playerMount, {
          width: 200,
          height: 200,
          videoId: initialVideoId,
          playerVars: {
            autoplay: 0,
            controls: 0,
            disablekb: 1,
            fs: 0,
            iv_load_policy: 3,
            modestbranding: 1,
            playsinline: 1,
            rel: 0,
            origin: window.location.origin,
          },
          events: {
            onReady: () => {
              this.isYtReady = true;
              this.isYtInitializing = false;
              this.loadedVideoId = initialVideoId ?? null;
              this.syncYouTubeVolume();

              const pending = this.pendingAction;
              this.pendingAction = null;
              if (pending) {
                if (pending.type === "play") {
                  this.executeYouTubePlay(pending.track);
                } else {
                  this.executeYouTubeCue(pending.track);
                }
              }
            },
            onStateChange: (event) => {
              if (this.activeMode !== "youtube") return;
              const state = event.data;
              if (state === YT_STATE.PLAYING) {
                this.clearYtFallbackTimer();
                let dur = this.snapshot.duration;
                let time = this.snapshot.currentTime;
                try {
                  const ytDur = event.target.getDuration();
                  if (ytDur > 0) dur = ytDur;
                  const ytTime = event.target.getCurrentTime();
                  if (Number.isFinite(ytTime) && ytTime >= 0 && Date.now() >= this.seekLockUntil) {
                    time = ytTime;
                  }
                } catch {
                  // Keep current estimates
                }
                this.syncYouTubeVolume();
                this.update({
                  isPlaying: true,
                  isLoading: false,
                  duration: dur,
                  currentTime: time,
                  source: "youtube",
                });
                this.startProgressPolling();
              } else if (state === YT_STATE.BUFFERING) {
                this.update({ isLoading: true });
              } else if (state === YT_STATE.PAUSED) {
                this.clearYtFallbackTimer();
                this.stopProgressPolling();
                let time = this.snapshot.currentTime;
                try {
                  const ytTime = event.target.getCurrentTime();
                  if (Number.isFinite(ytTime) && ytTime >= 0 && Date.now() >= this.seekLockUntil) {
                    time = ytTime;
                  }
                } catch {
                  // Ignore
                }
                this.update({ isPlaying: false, isLoading: false, currentTime: time });
              } else if (state === YT_STATE.ENDED) {
                this.clearYtFallbackTimer();
                this.handleTrackEnded();
              }
            },
            onError: () => {
              this.clearYtFallbackTimer();
              this.stopProgressPolling();
              if (this.currentTrack.youtubeVideoId) {
                this.failedYoutubeIds.add(this.currentTrack.youtubeVideoId);
              }
              if (this.activeMode === "youtube" && this.currentTrack.previewUrl) {
                this.playFallbackPreview(this.currentTrack);
              } else {
                this.update({ isPlaying: false, isLoading: false });
              }
            },
          },
        });
      })
      .catch(() => {
        this.isYtInitializing = false;
        this.ytApiFailed = true;
        this.clearYtFallbackTimer();
        const pending = this.pendingAction;
        this.pendingAction = null;
        if (pending?.type === "play" && pending.track.previewUrl) {
          this.playFallbackPreview(pending.track);
        } else {
          this.update({ isPlaying: false, isLoading: false });
        }
      });
  }

  private executeYouTubePlay(track: SpotifyTrack) {
    if (!this.ytPlayer || !this.isYtReady || !track.youtubeVideoId) return;
    this.stopPreviewAudio();
    this.activeMode = "youtube";
    this.syncYouTubeVolume();

    try {
      if (this.loadedVideoId === track.youtubeVideoId) {
        const cur = this.ytPlayer.getCurrentTime();
        const dur = this.ytPlayer.getDuration();
        if (dur > 0 && cur >= dur - 0.5) {
          this.ytPlayer.seekTo(0, true);
        }
        this.ytPlayer.playVideo();
      } else {
        this.loadedVideoId = track.youtubeVideoId;
        this.ytPlayer.loadVideoById(track.youtubeVideoId);
      }
    } catch {
      if (track.previewUrl) {
        this.playFallbackPreview(track);
      } else {
        this.update({ isPlaying: false, isLoading: false });
      }
    }
  }

  private executeYouTubeCue(track: SpotifyTrack) {
    if (!this.ytPlayer || !this.isYtReady || !track.youtubeVideoId) return;
    this.stopPreviewAudio();
    this.activeMode = "youtube";
    try {
      this.ytPlayer.pauseVideo();
      if (this.loadedVideoId !== track.youtubeVideoId) {
        this.loadedVideoId = track.youtubeVideoId;
        this.ytPlayer.cueVideoById(track.youtubeVideoId);
      }
    } catch {
      // Ignore cue errors while paused
    }
  }

  private playFallbackPreview(track: SpotifyTrack) {
    this.stopYouTubeAudio();
    this.activeMode = "preview";
    const audio = this.ensureAudio();
    if (!audio || !track.previewUrl) {
      this.update({ isPlaying: false, isLoading: false, source: "preview" });
      return;
    }
    this.update({
      trackId: track.id,
      currentTime: 0,
      duration: 0,
      isLoading: true,
      source: "preview",
    });
    if (audio.src !== track.previewUrl) {
      audio.src = track.previewUrl;
      audio.load();
    } else {
      audio.currentTime = 0;
    }
    audio.volume = this.snapshot.isMuted ? 0 : this.snapshot.volume;
    audio.loop = this.snapshot.isRepeat;
    audio.play().catch(() => this.update({ isPlaying: false, isLoading: false }));
  }

  subscribe = (listener: Listener) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = (): SpotifyAudioSnapshot => this.snapshot;

  setOnEnded(cb: (() => void) | null) {
    this.onEndedCallback = cb;
  }

  playTrack(track: SpotifyTrack) {
    if (typeof window === "undefined") return;

    const isSameTrack = this.snapshot.trackId === track.id;
    this.currentTrack = track;

    if (this.canUseYouTube(track)) {
      // Avoid restarting if already playing, loading, or queued to play the exact same YouTube track
      if (
        isSameTrack &&
        this.activeMode === "youtube" &&
        ((this.loadedVideoId === track.youtubeVideoId && (this.snapshot.isPlaying || this.snapshot.isLoading)) ||
          (this.pendingAction?.type === "play" && this.pendingAction.track.id === track.id))
      ) {
        return;
      }

      this.stopPreviewAudio();
      this.activeMode = "youtube";
      const estimatedDuration = track.durationMs > 0 ? track.durationMs / 1000 : 0;

      if (this.ytPlayer && this.isYtReady && this.ytHost && document.contains(this.ytHost)) {
        this.pendingAction = null;
        this.update({
          trackId: track.id,
          currentTime: isSameTrack ? this.snapshot.currentTime : 0,
          duration: isSameTrack && this.snapshot.duration > 0 ? this.snapshot.duration : estimatedDuration,
          isLoading: true,
          source: "youtube",
        });
        this.executeYouTubePlay(track);
      } else {
        this.pendingAction = { type: "play", track };
        this.update({
          trackId: track.id,
          currentTime: 0,
          duration: estimatedDuration,
          isPlaying: false,
          isLoading: true,
          source: "youtube",
        });
        this.warmup();

        // Safety fallback if YouTube script/iframe is blocked or slow
        this.clearYtFallbackTimer();
        this.ytFallbackTimer = window.setTimeout(() => {
          if (
            this.currentTrack.id === track.id &&
            this.activeMode === "youtube" &&
            !this.snapshot.isPlaying &&
            this.snapshot.isLoading &&
            !this.isYtReady &&
            track.previewUrl
          ) {
            this.pendingAction = null;
            this.playFallbackPreview(track);
          }
        }, 7000);
      }
      return;
    }

    this.playFallbackPreview(track);
  }

  selectTrack(track: SpotifyTrack, autoPlay: boolean) {
    if (autoPlay) {
      this.playTrack(track);
      return;
    }
    if (this.snapshot.trackId === track.id) return;

    this.currentTrack = track;
    this.stopPreviewAudio();
    this.stopYouTubeAudio();

    const estimatedDuration = track.durationMs > 0 ? track.durationMs / 1000 : 0;
    const useYt = this.canUseYouTube(track);
    this.activeMode = useYt ? "youtube" : "preview";

    this.update({
      trackId: track.id,
      currentTime: 0,
      duration: estimatedDuration,
      isPlaying: false,
      isLoading: false,
      source: this.activeMode,
    });

    if (useYt) {
      if (this.ytPlayer && this.isYtReady) {
        this.executeYouTubeCue(track);
      } else {
        this.pendingAction = { type: "cue", track };
        this.warmup();
      }
    } else {
      const audio = this.ensureAudio();
      if (audio) {
        if (track.previewUrl) {
          audio.src = track.previewUrl;
          audio.load();
        } else {
          audio.removeAttribute("src");
        }
      }
    }
  }

  togglePlay(track: SpotifyTrack) {
    if (typeof window === "undefined") return;

    if (this.snapshot.trackId !== track.id) {
      this.playTrack(track);
      return;
    }

    if (this.snapshot.isPlaying) {
      this.pendingAction = null;
      this.clearYtFallbackTimer();
      if (this.activeMode === "youtube" && this.ytPlayer && this.isYtReady) {
        try {
          this.ytPlayer.pauseVideo();
        } catch {
          this.update({ isPlaying: false, isLoading: false });
        }
      } else if (this.audio) {
        this.audio.pause();
      } else {
        this.update({ isPlaying: false, isLoading: false });
      }
      return;
    }

    if (
      this.activeMode === "preview" &&
      this.audio &&
      track.previewUrl &&
      this.audio.src === track.previewUrl
    ) {
      this.audio.play().catch(() => this.update({ isPlaying: false, isLoading: false }));
      return;
    }

    this.playTrack(track);
  }

  seek(time: number) {
    if (!this.snapshot.duration) return;
    const clamped = Math.max(0, Math.min(this.snapshot.duration, time));
    this.seekLockUntil = Date.now() + 350;

    if (this.activeMode === "youtube") {
      if (this.ytPlayer && this.isYtReady) {
        try {
          this.ytPlayer.seekTo(clamped, true);
        } catch {
          return;
        }
      }
      this.update({ currentTime: clamped });
      return;
    }

    const audio = this.ensureAudio();
    if (!audio) return;
    audio.currentTime = clamped;
    this.update({ currentTime: clamped });
  }

  setVolume(vol: number) {
    const clamped = Math.max(0, Math.min(1, vol));
    if (this.audio) this.audio.volume = clamped;
    this.update({ volume: clamped, isMuted: false });
    this.syncYouTubeVolume();
  }

  toggleMute() {
    const nextMuted = !this.snapshot.isMuted;
    if (this.audio) this.audio.volume = nextMuted ? 0 : this.snapshot.volume;
    this.update({ isMuted: nextMuted });
    this.syncYouTubeVolume();
  }

  setRepeat(repeat: boolean) {
    if (this.audio) {
      this.audio.loop = repeat;
    }
    this.update({ isRepeat: repeat });
  }

  /** Fully stop playback and reset track position when the Spotify app is closed/quit. */
  stop() {
    this.pendingAction = null;
    this.clearYtFallbackTimer();
    this.stopProgressPolling();
    if (this.audio) {
      this.audio.pause();
      try {
        this.audio.currentTime = 0;
      } catch {
        // Ignore if audio metadata is not loaded yet
      }
    }
    if (this.ytPlayer && this.isYtReady) {
      try {
        this.ytPlayer.stopVideo();
      } catch {
        try {
          this.ytPlayer.pauseVideo();
        } catch {
          // Ignore teardown race from YouTube iframe
        }
      }
    }
    this.update({
      isPlaying: false,
      isLoading: false,
      currentTime: 0,
    });
  }
}

export const sharedSpotifyAudio = new SharedSpotifyAudio();

export function useSharedSpotifyAudio(): SpotifyAudioSnapshot {
  return useSyncExternalStore(
    sharedSpotifyAudio.subscribe,
    sharedSpotifyAudio.getSnapshot,
    sharedSpotifyAudio.getSnapshot,
  );
}
