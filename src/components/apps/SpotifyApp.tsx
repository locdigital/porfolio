import { useEffect, useMemo, useRef, useState } from "react";
import { Play } from "lucide-react";
import {
  ALL_SPOTIFY_COLLECTIONS,
  SPOTIFY_PLAYLISTS,
  SPOTIFY_RECOMMENDATIONS,
  SPOTIFY_TRACKS,
  getTracksByIds,
  type SpotifyPlaylist,
} from "../../data/spotify";
import {
  getSpotifyUrl,
  parseSpotifyUrl,
  type SpotifyHomeCategory,
} from "../../lib/app-routes";
import { SpotifyActivity } from "./spotify/SpotifyActivity";
import { SpotifyArtwork } from "./spotify/SpotifyArtwork";
import { SpotifyHeader } from "./spotify/SpotifyHeader";
import { SpotifyHome } from "./spotify/SpotifyHome";
import { SpotifyPlayer } from "./spotify/SpotifyPlayer";
import { SpotifyPlaylistDetail } from "./spotify/SpotifyPlaylistDetail";
import { SpotifySearch } from "./spotify/SpotifySearch";
import { SpotifySidebar } from "./spotify/SpotifySidebar";
import { sharedSpotifyAudio } from "./spotify/spotify-audio";
import { useSpotifyState } from "./spotify/useSpotifyState";
import type { SpotifyTrack } from "../../data/spotify";

interface SpotifyAppProps {
  initialUrl?: string;
  onUrlChange?: (url: string) => void;
}

export function SpotifyApp({ initialUrl, onUrlChange }: SpotifyAppProps = {}) {
  const initialRoute = useMemo(() => {
    const raw =
      initialUrl ??
      (typeof window !== "undefined"
        ? `${window.location.pathname}${window.location.search}${window.location.hash}`
        : "");
    return parseSpotifyUrl(raw);
  }, [initialUrl]);

  const [searchQuery, setSearchQuery] = useState("");
  const [homeCategory, setHomeCategory] = useState<SpotifyHomeCategory>(
    initialRoute.homeCategory,
  );
  const mainRef = useRef<HTMLElement | null>(null);
  const onUrlChangeRef = useRef(onUrlChange);
  onUrlChangeRef.current = onUrlChange;

  const {
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
  } = useSpotifyState(initialRoute.view);

  useEffect(() => {
    const nextUrl = getSpotifyUrl(currentView, homeCategory);
    onUrlChangeRef.current?.(nextUrl);
  }, [currentView, homeCategory]);

  const playSelectedTrack = (track: SpotifyTrack) => {
    selectTrack(track);
    sharedSpotifyAudio.playTrack(track);
  };

  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
  }, [currentView]);

  const renderCollectionGrid = (
    heading: string,
    collections: SpotifyPlaylist[],
  ) => (
    <div className="spotify-content">
      <div className="spotify-section-header">
        <h1 className="spotify-h1">{heading}</h1>
      </div>
      <div className="spotify-card-grid">
        {collections.map((col) => (
          <div
            key={col.id}
            role="button"
            tabIndex={0}
            className="spotify-card"
            onClick={() => navigateTo({ kind: "playlist", playlistId: col.id })}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                navigateTo({ kind: "playlist", playlistId: col.id });
              }
            }}
          >
            <div className="spotify-card-art-wrap">
              <SpotifyArtwork
                src={col.coverSrc}
                alt={col.title}
                fallbackColor={col.accentColor}
                fallbackText={col.title}
                className="spotify-card-art"
              />
              <button
                type="button"
                className="spotify-card-play"
                onClick={(e) => {
                  e.stopPropagation();
                  const first = getTracksByIds(col.trackIds)[0];
                  if (first) playSelectedTrack(first);
                }}
                aria-label={`Play ${col.title}`}
              >
                <Play size={18} fill="currentColor" aria-hidden="true" />
              </button>
            </div>
            <div className="spotify-card-title">{col.title}</div>
            <p className="spotify-card-desc">{col.description}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const renderMainView = () => {
    switch (currentView.kind) {
      case "home":
        return (
          <SpotifyHome
            selectedTrack={selectedTrack}
            recentTracks={recentTracks}
            catFilter={homeCategory}
            onCatFilterChange={setHomeCategory}
            onNavigate={navigateTo}
            onSelectTrack={playSelectedTrack}
          />
        );

      case "search":
        return (
          <SpotifySearch
            externalQuery={searchQuery}
            onExternalQueryChange={setSearchQuery}
            selectedTrackId={selectedTrack.id}
            likedIds={likedIds}
            onSelectTrack={playSelectedTrack}
            onToggleLike={toggleLike}
            onNavigate={navigateTo}
          />
        );

      case "browse":
        return renderCollectionGrid("Browse moods & playlists", SPOTIFY_PLAYLISTS);

      case "radio":
        return renderCollectionGrid("Radio & curated mixes", SPOTIFY_RECOMMENDATIONS);

      case "made-for-you":
        return renderCollectionGrid("Made for you", SPOTIFY_RECOMMENDATIONS);

      case "recently-played":
        return (
          <SpotifyPlaylistDetail
            typeLabel="History"
            title="Recently played"
            description="Tracks you recently selected in this session."
            accentColor="#1DB954"
            coverSrc={recentTracks[0]?.coverSrc}
            tracks={recentTracks}
            selectedTrackId={selectedTrack.id}
            likedIds={likedIds}
            isShuffle={isShuffle}
            onToggleShuffle={() => setIsShuffle((s) => !s)}
            onSelectTrack={playSelectedTrack}
            onToggleLike={toggleLike}
          />
        );

      case "liked-songs":
        return (
          <SpotifyPlaylistDetail
            typeLabel="Playlist"
            title="Liked songs"
            description="Tracks you saved with the heart button."
            accentColor="#1DB954"
            coverSrc={likedTracks[0]?.coverSrc}
            tracks={likedTracks}
            selectedTrackId={selectedTrack.id}
            likedIds={likedIds}
            isShuffle={isShuffle}
            onToggleShuffle={() => setIsShuffle((s) => !s)}
            onSelectTrack={playSelectedTrack}
            onToggleLike={toggleLike}
          />
        );

      case "albums": {
        const albums = Array.from(
          new Map(SPOTIFY_TRACKS.map((t) => [t.album, t])).values(),
        );
        return (
          <div className="spotify-content">
            <div className="spotify-section-header">
              <h1 className="spotify-h1">Albums</h1>
            </div>
            <div className="spotify-card-grid">
              {albums.map((track) => (
                <div
                  key={track.album}
                  role="button"
                  tabIndex={0}
                  className="spotify-card"
                  onClick={() => navigateTo({ kind: "album", albumName: track.album })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      navigateTo({ kind: "album", albumName: track.album });
                    }
                  }}
                >
                  <div className="spotify-card-art-wrap">
                    <SpotifyArtwork
                      src={track.coverSrc}
                      alt={track.album}
                      fallbackColor={track.accentColor}
                      fallbackText={track.album}
                      className="spotify-card-art"
                    />
                    <button
                      type="button"
                      className="spotify-card-play"
                      onClick={(e) => {
                        e.stopPropagation();
                        playSelectedTrack(track);
                      }}
                      aria-label={`Play ${track.album}`}
                    >
                      <Play size={18} fill="currentColor" aria-hidden="true" />
                    </button>
                  </div>
                  <div className="spotify-card-title">{track.album}</div>
                  <p className="spotify-card-desc">{track.artist}</p>
                </div>
              ))}
            </div>
          </div>
        );
      }

      case "album": {
        const albumTracks = SPOTIFY_TRACKS.filter(
          (t) => t.album === currentView.albumName,
        );
        const lead = albumTracks[0] ?? SPOTIFY_TRACKS[0];
        return (
          <SpotifyPlaylistDetail
            typeLabel="Album"
            title={currentView.albumName}
            description={lead.artist}
            accentColor={lead.accentColor}
            coverSrc={lead.coverSrc}
            tracks={albumTracks}
            selectedTrackId={selectedTrack.id}
            likedIds={likedIds}
            isShuffle={isShuffle}
            onToggleShuffle={() => setIsShuffle((s) => !s)}
            onSelectTrack={playSelectedTrack}
            onToggleLike={toggleLike}
          />
        );
      }

      case "playlist": {
        const collection =
          ALL_SPOTIFY_COLLECTIONS.find((c) => c.id === currentView.playlistId) ??
          SPOTIFY_PLAYLISTS[0];
        const tracks = getTracksByIds(collection.trackIds);
        return (
          <SpotifyPlaylistDetail
            typeLabel={collection.category === "made-for-you" ? "Made for you" : "Playlist"}
            title={collection.title}
            description={collection.description}
            accentColor={collection.accentColor}
            coverSrc={collection.coverSrc}
            tracks={tracks}
            selectedTrackId={selectedTrack.id}
            likedIds={likedIds}
            isShuffle={isShuffle}
            onToggleShuffle={() => setIsShuffle((s) => !s)}
            onSelectTrack={playSelectedTrack}
            onToggleLike={toggleLike}
          />
        );
      }
    }
  };

  return (
    <div className="spotify-app">
      <SpotifyHeader
        currentView={currentView}
        canGoBack={canGoBack}
        canGoForward={canGoForward}
        onBack={goBack}
        onForward={goForward}
        onNavigate={navigateTo}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isActivityOpen={isActivityOpen}
        onToggleActivity={() => {
          setIsQueueOpen(false);
          setIsActivityOpen((o) => !o);
        }}
      />

      <SpotifySidebar
        currentView={currentView}
        likedCount={likedIds.size}
        onNavigate={navigateTo}
      />

      <main ref={mainRef} className="spotify-main">
        <nav className="spotify-mobile-nav" aria-label="Library sections">
          <button
            type="button"
            className={`spotify-mobile-nav-pill${currentView.kind === "home" ? " is-active" : ""}`}
            onClick={() => navigateTo({ kind: "home" })}
          >
            Home
          </button>
          <button
            type="button"
            className={`spotify-mobile-nav-pill${currentView.kind === "browse" || currentView.kind === "playlist" ? " is-active" : ""}`}
            onClick={() => navigateTo({ kind: "browse" })}
          >
            Playlists
          </button>
          <button
            type="button"
            className={`spotify-mobile-nav-pill${currentView.kind === "liked-songs" ? " is-active" : ""}`}
            onClick={() => navigateTo({ kind: "liked-songs" })}
          >
            Liked{likedIds.size > 0 ? ` (${likedIds.size})` : ""}
          </button>
          <button
            type="button"
            className={`spotify-mobile-nav-pill${currentView.kind === "albums" || currentView.kind === "album" ? " is-active" : ""}`}
            onClick={() => navigateTo({ kind: "albums" })}
          >
            Albums
          </button>
          <button
            type="button"
            className={`spotify-mobile-nav-pill${currentView.kind === "recently-played" ? " is-active" : ""}`}
            onClick={() => navigateTo({ kind: "recently-played" })}
          >
            Recent
          </button>
          <button
            type="button"
            className={`spotify-mobile-nav-pill${currentView.kind === "made-for-you" ? " is-active" : ""}`}
            onClick={() => navigateTo({ kind: "made-for-you" })}
          >
            Made for you
          </button>
        </nav>
        {renderMainView()}
      </main>

      <SpotifyActivity
        isOpen={isActivityOpen}
        onClose={() => setIsActivityOpen(false)}
        recentTracks={recentTracks}
        recentCollections={recentCollections}
        selectedTrackId={selectedTrack.id}
        onSelectTrack={(t) => playSelectedTrack(t)}
        onOpenCollection={(playlistId) =>
          navigateTo({ kind: "playlist", playlistId })
        }
      />

      <SpotifyPlayer
        selectedTrack={selectedTrack}
        isLiked={likedIds.has(selectedTrack.id)}
        onToggleLike={toggleLike}
        isShuffle={isShuffle}
        onToggleShuffle={() => setIsShuffle((s) => !s)}
        repeatMode={repeatMode}
        onCycleRepeat={cycleRepeat}
        onPrev={() => stepTrack(-1)}
        onNext={(fromAutoEnd) => stepTrack(1, fromAutoEnd)}
        isQueueOpen={isQueueOpen}
        onToggleQueue={() => {
          setIsActivityOpen(false);
          setIsQueueOpen((o) => !o);
        }}
        onSelectTrack={(t) => playSelectedTrack(t)}
        onSyncTrack={(t) => selectTrack(t, false)}
      />
    </div>
  );
}
