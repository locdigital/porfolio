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

export function useSpotifyState(initialView?: SpotifyView) {
  const [history, setHistory] = useState<SpotifyView[]>(() => [initialView ?? { kind: "home" }]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const [selectedTrack, setSelectedTrack] = useState<SpotifyTrack>(SPOTIFY_TRACKS[0]);
  const [playHistory, setPlayHistory] = useState<string[]>([]);
  const [likedIds, setLikedIds] = useState<Set<string>>(
    () =>
      new Set([
        "coldplay-yellow",
        "arctic-monkeys-505",
        "avicii-waiting-for-love",
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

  const selectTrack = useCallback((track: SpotifyTrack, recordHistory = true) => {
    setSelectedTrack((prev) => {
      if (recordHistory && prev.id !== track.id) {
        setPlayHistory((hist) => [...hist.slice(-24), prev.id]);
      }
      return track;
    });
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
    (direction: -1 | 1, fromAutoEnd = false): boolean => {
      const idx = SPOTIFY_TRACKS.findIndex((t) => t.id === selectedTrack.id);
      if (idx === -1) return false;

      // Going backwards prefers the actual recently-played track history first
      if (direction === -1 && playHistory.length > 0) {
        const lastId = playHistory[playHistory.length - 1];
        const prevTrack = SPOTIFY_TRACKS.find((t) => t.id === lastId);
        setPlayHistory((hist) => hist.slice(0, -1));
        if (prevTrack) {
          selectTrack(prevTrack, false);
          return true;
        }
      }

      if (isShuffle && SPOTIFY_TRACKS.length > 1) {
        const recentSet = new Set(playHistory.slice(-Math.min(5, SPOTIFY_TRACKS.length - 2)));
        const pool = SPOTIFY_TRACKS.filter(
          (t) => t.id !== selectedTrack.id && !recentSet.has(t.id),
        );
        const candidates = pool.length > 0 ? pool : SPOTIFY_TRACKS.filter((t) => t.id !== selectedTrack.id);
        const nextTrack = candidates[Math.floor(Math.random() * candidates.length)];
        if (nextTrack) {
          selectTrack(nextTrack, true);
          return true;
        }
      }

      // When auto-advancing at the end of the playlist with repeat off, stop at the end
      if (fromAutoEnd && direction === 1 && repeatMode === "off" && idx === SPOTIFY_TRACKS.length - 1) {
        return false;
      }

      const nextIdx = (idx + direction + SPOTIFY_TRACKS.length) % SPOTIFY_TRACKS.length;
      selectTrack(SPOTIFY_TRACKS[nextIdx], direction === 1);
      return true;
    },
    [isShuffle, playHistory, repeatMode, selectTrack, selectedTrack.id],
  );

  const cycleRepeat = useCallback(() => {
    setRepeatMode((m) => (m === "one" ? "off" : "one"));
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

