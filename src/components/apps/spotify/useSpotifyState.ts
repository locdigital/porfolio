import { useCallback, useMemo, useState } from "react";
import {
  ALL_SPOTIFY_COLLECTIONS,
  SPOTIFY_TRACKS,
  type SpotifyPlaylist,
  type SpotifyTrack,
} from "../../../data/spotify";

export type SpotifyView =
  | { kind: "home" }
  | { kind: "search" }
  | { kind: "browse" }
  | { kind: "radio" }
  | { kind: "made-for-you" }
  | { kind: "recently-played" }
  | { kind: "liked-songs" }
  | { kind: "albums" }
  | { kind: "playlist"; playlistId: string }
  | { kind: "album"; albumName: string };

export type RepeatMode = "off" | "all" | "one";

export function useSpotifyState() {
  const [history, setHistory] = useState<SpotifyView[]>([{ kind: "home" }]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const [selectedTrack, setSelectedTrack] = useState<SpotifyTrack>(SPOTIFY_TRACKS[0]);
  const [likedIds, setLikedIds] = useState<Set<string>>(
    () =>
      new Set([
        "joji-slow-dancing-in-the-dark",
        "frank-ocean-pink-white",
        "keshi-beside-you",
      ]),
  );
  const [recentTrackIds, setRecentTrackIds] = useState<string[]>([
    SPOTIFY_TRACKS[0].id,
    SPOTIFY_TRACKS[5].id,
    SPOTIFY_TRACKS[6].id,
  ]);
  const [recentCollectionIds, setRecentCollectionIds] = useState<string[]>([
    "on-repeat",
    "late-night",
  ]);

  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>("off");
  const [isActivityOpen, setIsActivityOpen] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);

  const currentView = history[historyIndex] ?? { kind: "home" };
  const canGoBack = historyIndex > 0;
  const canGoForward = historyIndex < history.length - 1;

  const navigateTo = useCallback(
    (view: SpotifyView) => {
      setHistory((prev) => {
        const sliced = prev.slice(0, historyIndex + 1);
        const last = sliced[sliced.length - 1];
        if (JSON.stringify(last) === JSON.stringify(view)) return prev;
        const next = [...sliced, view];
        setHistoryIndex(next.length - 1);
        return next;
      });
      if (view.kind === "playlist") {
        setRecentCollectionIds((prev) =>
          [view.playlistId, ...prev.filter((id) => id !== view.playlistId)].slice(0, 6),
        );
      }
    },
    [historyIndex],
  );

  const goBack = useCallback(() => {
    setHistoryIndex((i) => Math.max(0, i - 1));
  }, []);

  const goForward = useCallback(() => {
    setHistoryIndex((i) => Math.min(history.length - 1, i + 1));
  }, [history.length]);

  const selectTrack = useCallback((track: SpotifyTrack) => {
    setSelectedTrack(track);
    setRecentTrackIds((prev) =>
      [track.id, ...prev.filter((id) => id !== track.id)].slice(0, 8),
    );
  }, []);

  const toggleLike = useCallback((trackId: string) => {
    setLikedIds((prev) => {
      const next = new Set(prev);
      if (next.has(trackId)) next.delete(trackId);
      else next.add(trackId);
      return next;
    });
  }, []);

  const stepTrack = useCallback(
    (direction: -1 | 1) => {
      const idx = SPOTIFY_TRACKS.findIndex((t) => t.id === selectedTrack.id);
      if (idx === -1) return;
      let nextIdx: number;
      if (isShuffle && SPOTIFY_TRACKS.length > 1) {
        do {
          nextIdx = Math.floor(Math.random() * SPOTIFY_TRACKS.length);
        } while (nextIdx === idx);
      } else {
        nextIdx = (idx + direction + SPOTIFY_TRACKS.length) % SPOTIFY_TRACKS.length;
      }
      selectTrack(SPOTIFY_TRACKS[nextIdx]);
    },
    [isShuffle, selectTrack, selectedTrack.id],
  );

  const cycleRepeat = useCallback(() => {
    setRepeatMode((m) => (m === "off" ? "all" : m === "all" ? "one" : "off"));
  }, []);

  const recentTracks = useMemo(() => {
    const byId = new Map(SPOTIFY_TRACKS.map((t) => [t.id, t]));
    return recentTrackIds
      .map((id) => byId.get(id))
      .filter((t): t is SpotifyTrack => Boolean(t));
  }, [recentTrackIds]);

  const recentCollections = useMemo(() => {
    const byId = new Map(ALL_SPOTIFY_COLLECTIONS.map((c) => [c.id, c]));
    return recentCollectionIds
      .map((id) => byId.get(id))
      .filter((c): c is SpotifyPlaylist => Boolean(c));
  }, [recentCollectionIds]);

  const likedTracks = useMemo(
    () => SPOTIFY_TRACKS.filter((t) => likedIds.has(t.id)),
    [likedIds],
  );

  return {
    currentView,
    canGoBack,
    canGoForward,
    navigateTo,
    goBack,
    goForward,
    selectedTrack,
    selectTrack,
    likedIds,
    likedTracks,
    toggleLike,
    recentTracks,
    recentCollections,
    isShuffle,
    setIsShuffle,
    repeatMode,
    cycleRepeat,
    stepTrack,
    isActivityOpen,
    setIsActivityOpen,
    isQueueOpen,
    setIsQueueOpen,
  };
}

