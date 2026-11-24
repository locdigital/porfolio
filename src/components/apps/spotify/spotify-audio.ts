import { useSyncExternalStore } from "react";
import { SPOTIFY_TRACKS, type SpotifyTrack } from "../../../data/spotify";

export interface SpotifyAudioSnapshot {
  trackId: string;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isRepeat: boolean;
}

type Listener = () => void;

class SharedSpotifyAudio {
  private audio: HTMLAudioElement | null = null;
  private listeners = new Set<Listener>();
  private onEndedCallback: (() => void) | null = null;
  private snapshot: SpotifyAudioSnapshot = {
    trackId: SPOTIFY_TRACKS[0]?.id ?? "",
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 0.8,
    isMuted: false,
    isRepeat: false,
  };

  private ensureAudio(): HTMLAudioElement | null {
    if (typeof window === "undefined") return null;
    if (!this.audio) {
      const el = new Audio();
      el.preload = "metadata";
      el.volume = this.snapshot.isMuted ? 0 : this.snapshot.volume;
      el.addEventListener("timeupdate", () => {
        this.update({ currentTime: el.currentTime });
      });
      el.addEventListener("loadedmetadata", () => {
        this.update({ duration: el.duration || 0 });
      });
      el.addEventListener("play", () => {
        this.update({ isPlaying: true });
      });
      el.addEventListener("pause", () => {
        this.update({ isPlaying: false });
      });
      el.addEventListener("ended", () => {
        if (this.snapshot.isRepeat) {
          el.currentTime = 0;
          el.play().catch(() => this.update({ isPlaying: false }));
        } else if (this.onEndedCallback) {
          this.onEndedCallback();
        } else {
          this.update({ isPlaying: false });
        }
      });
      this.audio = el;
    }
    return this.audio;
  }

  private update(patch: Partial<SpotifyAudioSnapshot>) {
    this.snapshot = { ...this.snapshot, ...patch };
    for (const listener of this.listeners) {
      listener();
    }
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
    const audio = this.ensureAudio();
    if (!audio) return;
    if (this.snapshot.trackId === track.id && audio.src === track.previewUrl) {
      if (audio.paused) {
        audio.play().catch(() => this.update({ isPlaying: false }));
      }
      return;
    }
    this.update({ trackId: track.id, currentTime: 0, duration: 0 });
    if (track.previewUrl) {
      audio.src = track.previewUrl;
      audio.load();
      audio.play().catch(() => this.update({ isPlaying: false }));
    } else {
      audio.pause();
      audio.removeAttribute("src");
      this.update({ isPlaying: false });
    }
  }

  selectTrack(track: SpotifyTrack, autoPlay: boolean) {
    if (autoPlay) {
      this.playTrack(track);
      return;
    }
    if (this.snapshot.trackId === track.id) return;
    const audio = this.ensureAudio();
    this.update({ trackId: track.id, currentTime: 0, duration: 0, isPlaying: false });
    if (audio) {
      audio.pause();
      if (track.previewUrl) {
        audio.src = track.previewUrl;
        audio.load();
      } else {
        audio.removeAttribute("src");
      }
    }
  }

  togglePlay(track: SpotifyTrack) {
    const audio = this.ensureAudio();
    if (!audio || !track.previewUrl) return;
    if (this.snapshot.trackId !== track.id || audio.src !== track.previewUrl) {
      this.playTrack(track);
      return;
    }
    if (audio.paused) {
      audio.play().catch(() => this.update({ isPlaying: false }));
    } else {
      audio.pause();
    }
  }

  seek(time: number) {
    const audio = this.ensureAudio();
    if (!audio || !this.snapshot.duration) return;
    const clamped = Math.max(0, Math.min(this.snapshot.duration, time));
    audio.currentTime = clamped;
    this.update({ currentTime: clamped });
  }

  setVolume(vol: number) {
    const clamped = Math.max(0, Math.min(1, vol));
    const audio = this.ensureAudio();
    if (audio) audio.volume = clamped;
    this.update({ volume: clamped, isMuted: false });
  }

  toggleMute() {
    const nextMuted = !this.snapshot.isMuted;
    const audio = this.ensureAudio();
    if (audio) audio.volume = nextMuted ? 0 : this.snapshot.volume;
    this.update({ isMuted: nextMuted });
  }

  setRepeat(repeat: boolean) {
    this.update({ isRepeat: repeat });
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
