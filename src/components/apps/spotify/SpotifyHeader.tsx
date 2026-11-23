import {
  Bell,
  ChevronLeft,
  ChevronRight,
  Compass,
  Home,
  Search,
  Users,
} from "lucide-react";
import type { SpotifyView } from "./useSpotifyState";

interface SpotifyHeaderProps {
  currentView: SpotifyView;
  canGoBack: boolean;
  canGoForward: boolean;
  onBack: () => void;
  onForward: () => void;
  onNavigate: (view: SpotifyView) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  isActivityOpen: boolean;
  onToggleActivity: () => void;
}

export function SpotifyHeader({
  currentView,
  canGoBack,
  canGoForward,
  onBack,
  onForward,
  onNavigate,
  searchQuery,
  onSearchChange,
  isActivityOpen,
  onToggleActivity,
}: SpotifyHeaderProps) {
  return (
    <header className="spotify-topbar" aria-label="Spotify top bar">
      <div className="spotify-topbar-left">
        <button
          type="button"
          className="spotify-nav-btn"
          onClick={onBack}
          disabled={!canGoBack}
          aria-label="Go back"
          title="Back"
        >
          <ChevronLeft size={18} aria-hidden="true" />
        </button>
        <button
          type="button"
          className="spotify-nav-btn"
          onClick={onForward}
          disabled={!canGoForward}
          aria-label="Go forward"
          title="Forward"
        >
          <ChevronRight size={18} aria-hidden="true" />
        </button>
      </div>

      <div className="spotify-topbar-center">
        <button
          type="button"
          className={`spotify-home-btn${currentView.kind === "home" ? " is-active" : ""}`}
          onClick={() => onNavigate({ kind: "home" })}
          aria-label="Home"
          title="Home"
        >
          <Home size={18} aria-hidden="true" />
        </button>

        <div className="spotify-global-search">
          <Search size={16} aria-hidden="true" />
          <input
            type="search"
            value={searchQuery}
            onFocus={() => {
              if (currentView.kind !== "search") {
                onNavigate({ kind: "search" });
              }
            }}
            onChange={(e) => {
              onSearchChange(e.target.value);
              if (currentView.kind !== "search") {
                onNavigate({ kind: "search" });
              }
            }}
            placeholder="What do you want to play?"
            aria-label="What do you want to play?"
          />
          <span className="spotify-search-divider" aria-hidden="true" />
          <button
            type="button"
            className="spotify-browse-btn"
            onClick={() => onNavigate({ kind: "browse" })}
            aria-label="Browse"
            title="Browse"
          >
            <Compass size={16} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="spotify-topbar-right">
        <button
          type="button"
          className={`spotify-icon-pill${isActivityOpen ? " is-active" : ""}`}
          onClick={onToggleActivity}
          aria-label="Activity"
          aria-expanded={isActivityOpen}
          title="Activity"
        >
          <Bell size={16} aria-hidden="true" />
        </button>
        <button
          type="button"
          className="spotify-icon-pill"
          onClick={() => onNavigate({ kind: "made-for-you" })}
          aria-label="Made for you"
          title="Made for you"
        >
          <Users size={16} aria-hidden="true" />
        </button>
        <button
          type="button"
          className="spotify-avatar-badge"
          onClick={() => onNavigate({ kind: "home" })}
          aria-label="Phuc Loc"
          title="Phuc Loc"
        >
          L
        </button>
      </div>
    </header>
  );
}
