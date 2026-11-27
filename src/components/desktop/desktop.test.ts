import { describe, expect, it } from "vitest";
import { DEFAULT_DOCK_APPS, getAppRoute } from "../dock/dock.config";
import {
  clampWindowOffset,
  createInitialWindowState,
  getDefaultAppForPath,
  getDockNavigationPath,
  getSyncedUrlForActiveApp,
  getWindowZIndex,
  windowManagerReducer,
} from "./window-manager";
import { NETFLIX_MOVIES } from "../../data/netflix";
import { SPOTIFY_TRACKS, formatDurationMs } from "../../data/spotify";
import { NIKON_RECIPES } from "../../data/nikon-recipes";

describe("Five-App Dock configuration", () => {
  it("contains strictly 5 apps in the exact required order", () => {
    expect(DEFAULT_DOCK_APPS).toHaveLength(5);
    expect(DEFAULT_DOCK_APPS.map((a) => a.id)).toEqual([
      "netflix",
      "spotify",
      "photos",
      "workspace",
      "photoshop",
    ]);
  });

  it("uses the exact repository favicon for Workspace and official local assets for all apps", () => {
    const workspace = DEFAULT_DOCK_APPS.find((a) => a.id === "workspace");
    expect(workspace?.icon).toBe("/apple-touch-icon.png");
    expect(workspace?.iconFit).toBe("contain");

    const photoshop = DEFAULT_DOCK_APPS.find((a) => a.id === "photoshop");
    expect(photoshop?.icon).toBe("/assets/dock/photoshop.png");
    expect(photoshop?.name).toBe("Photoshop");
  });

  it("gives every app a stable, dedicated route", () => {
    expect(getAppRoute("netflix")).toBe("/entertainment/netflix");
    expect(getAppRoute("spotify")).toBe("/music/spotify");
    expect(getAppRoute("photos")).toBe("/photos");
    expect(getAppRoute("workspace")).toBe("/");
    expect(getAppRoute("photoshop")).toBe("/color-lab/nikon-recipes");
  });
});

describe("WindowManager state transitions", () => {
  it("keeps the Dock reachable after repeated app selections without changing stack order", () => {
    let state = createInitialWindowState("/growth");
    state = windowManagerReducer(state, { type: "OPEN_APP", id: "spotify" });
    state = windowManagerReducer(state, { type: "TOGGLE_PIN_APP", id: "spotify" });
    for (let i = 0; i < 100; i++) {
      const id = i % 2 === 0 ? "netflix" : "workspace";
      state = windowManagerReducer(state, { type: "OPEN_APP", id });
      const selectedZ = getWindowZIndex(state.windows[id]);
      expect(selectedZ).toBeLessThan(60);
      for (const win of Object.values(state.windows)) {
        if (win.id !== id && win.isOpen) expect(selectedZ).toBeGreaterThan(getWindowZIndex(win));
      }
    }
    expect(state.windows.spotify.isPinned).toBe(true);
    state = windowManagerReducer(state, { type: "CLOSE_APP", id: "workspace" });
    expect(state.activeApp).toBe("netflix");
  });

  it("focuses without resizing, then maximizes and restores the same window position", () => {
    let state = createInitialWindowState("/growth");
    state = windowManagerReducer(state, { type: "OPEN_APP", id: "netflix" });
    state = windowManagerReducer(state, { type: "MOVE_WINDOW", id: "netflix", offsetX: 80, offsetY: 40 });
    state = windowManagerReducer(state, { type: "OPEN_APP", id: "spotify" });

    state = windowManagerReducer(state, { type: "FOCUS_APP", id: "netflix" });
    expect(state.windows.netflix.isMaximized).toBe(false);
    expect(getWindowZIndex(state.windows.netflix)).toBeGreaterThan(getWindowZIndex(state.windows.spotify));

    state = windowManagerReducer(state, { type: "TOGGLE_MAXIMIZE_APP", id: "netflix" });
    expect(state.windows.netflix.isMaximized).toBe(true);
    state = windowManagerReducer(state, { type: "TOGGLE_MAXIMIZE_APP", id: "netflix" });
    expect(state.windows.netflix).toMatchObject({ isMaximized: false, offsetX: 80, offsetY: 40 });
    expect(state.activeApp).toBe("netflix");
  });

  it("raises the selected app above widgets and restores their order when refocused", () => {
    let state = createInitialWindowState("/growth");
    state = windowManagerReducer(state, { type: "OPEN_APP", id: "spotify" });
    state = windowManagerReducer(state, { type: "TOGGLE_PIN_APP", id: "spotify" });
    state = windowManagerReducer(state, { type: "OPEN_APP", id: "netflix" });
    state = windowManagerReducer(state, { type: "TOGGLE_PIN_APP", id: "netflix" });

    state = windowManagerReducer(state, { type: "FOCUS_APP", id: "workspace" });
    expect(getWindowZIndex(state.windows.workspace)).toBeGreaterThan(getWindowZIndex(state.windows.spotify));
    expect(getWindowZIndex(state.windows.workspace)).toBeGreaterThan(getWindowZIndex(state.windows.netflix));
    expect(state.windows.spotify.isPinned).toBe(true);

    state = windowManagerReducer(state, { type: "OPEN_APP", id: "spotify" });
    expect(state.windows.spotify.isPinned).toBe(false);
    expect(getWindowZIndex(state.windows.spotify)).toBeGreaterThan(getWindowZIndex(state.windows.workspace));

    state = windowManagerReducer(state, { type: "SYNC_ROUTE", pathname: "/photos/da-lat" });
    expect(getWindowZIndex(state.windows.photos)).toBeGreaterThan(getWindowZIndex(state.windows.spotify));
    expect(getWindowZIndex(state.windows.photos)).toBeGreaterThan(getWindowZIndex(state.windows.netflix));

    state = windowManagerReducer(state, { type: "FOCUS_APP", id: "netflix" });
    expect(getWindowZIndex(state.windows.netflix)).toBeGreaterThan(getWindowZIndex(state.windows.photos));
    state = windowManagerReducer(state, { type: "MINIMIZE_APP", id: "netflix" });
    expect(state.activeApp).toBe("photos");
    expect(getWindowZIndex(state.windows.netflix)).toBe(-1);
  });

  it("compacts high persisted zIndex values on RESTORE_STATE so windows never cover the Dock", () => {
    const initial = createInitialWindowState("/");
    const highZState = {
      ...initial,
      topZ: 80,
      windows: {
        ...initial.windows,
        workspace: { ...initial.windows.workspace, isOpen: true, zIndex: 70 },
        netflix: { ...initial.windows.netflix, isOpen: true, zIndex: 80 },
      },
      activeApp: "netflix" as const,
    };

    const restored = windowManagerReducer(initial, { type: "RESTORE_STATE", state: highZState });
    expect(getWindowZIndex(restored.windows.netflix)).toBeLessThan(60);
    expect(getWindowZIndex(restored.windows.workspace)).toBeLessThan(60);
    expect(getWindowZIndex(restored.windows.netflix)).toBeGreaterThan(
      getWindowZIndex(restored.windows.workspace),
    );
  });

  it("resolves dedicated routes and subpaths to their matching app", () => {
    expect(getDefaultAppForPath("/entertainment/netflix")).toBe("netflix");
    expect(getDefaultAppForPath("/entertainment/netflix/naruto")).toBe("netflix");
    expect(getDefaultAppForPath("/entertainment/netflix/genre/anime")).toBe("netflix");
    expect(getDefaultAppForPath("/music/spotify")).toBe("spotify");
    expect(getDefaultAppForPath("/music/spotify/playlist/late-night")).toBe("spotify");
    expect(getDefaultAppForPath("/music/spotify/liked-songs")).toBe("spotify");
    expect(getDefaultAppForPath("/color-lab/nikon-recipes")).toBe("photoshop");
    expect(getDefaultAppForPath("/color-lab/nikon-recipes/at-dusk-noise-woo")).toBe("photoshop");
    expect(getDefaultAppForPath("/photos")).toBe("photos");
    expect(getDefaultAppForPath("/photos/da-lat")).toBe("photos");
    expect(getDefaultAppForPath("/")).toBe("workspace");
    expect(getDefaultAppForPath("/work")).toBe("workspace");
  });

  it("opens, focuses, minimizes, maximizes, and closes windows cleanly", () => {
    let state = createInitialWindowState("/photos");
    expect(state.activeApp).toBe("photos");

    state = windowManagerReducer(state, { type: "OPEN_APP", id: "netflix" });
    expect(state.activeApp).toBe("netflix");
    expect(state.windows.netflix.isOpen).toBe(true);
    expect(state.windows.netflix.isMinimized).toBe(false);

    state = windowManagerReducer(state, { type: "TOGGLE_MAXIMIZE_APP", id: "netflix" });
    expect(state.windows.netflix.isMaximized).toBe(true);

    state = windowManagerReducer(state, { type: "MINIMIZE_APP", id: "netflix" });
    expect(state.windows.netflix.isOpen).toBe(true);
    expect(state.windows.netflix.isMinimized).toBe(true);
    // Hiding only hides the window while preserving its maximized state for restore.
    expect(state.windows.netflix.isMaximized).toBe(true);
    expect(state.activeApp).toBe("photos");

    state = windowManagerReducer(state, { type: "OPEN_APP", id: "netflix" });
    expect(state.windows.netflix.isMinimized).toBe(false);
    expect(state.windows.netflix.isMaximized).toBe(true);

    // Closing quits the app completely and resets window layout/position.
    state = windowManagerReducer(state, { type: "CLOSE_APP", id: "netflix" });
    expect(state.windows.netflix.isOpen).toBe(false);
    expect(state.windows.netflix.isMinimized).toBe(false);
    expect(state.windows.netflix.isMaximized).toBe(false);
    expect(state.windows.netflix.tile).toBeNull();
    expect(state.activeApp).toBe("photos");
  });

  it("closes every open, pinned, and tiled window via CLOSE_ALL_APPS", () => {
    let state = createInitialWindowState("/");
    state = windowManagerReducer(state, { type: "TOGGLE_PIN_MODE" });
    state = windowManagerReducer(state, { type: "OPEN_APP", id: "spotify" });
    state = windowManagerReducer(state, { type: "TILE_WINDOW", id: "spotify", preset: "right" });

    state = windowManagerReducer(state, { type: "CLOSE_ALL_APPS" });
    expect(state.activeApp).toBeNull();
    for (const win of Object.values(state.windows)) {
      expect(win.isOpen).toBe(false);
      expect(win.isMinimized).toBe(false);
      expect(win.isMaximized).toBe(false);
      expect(win.isPinned).toBe(false);
      expect(win.tile).toBeNull();
    }
  });

  it("syncs explicit maximize/restore state via SET_MAXIMIZED_APP", () => {
    let state = createInitialWindowState("/");
    state = windowManagerReducer(state, { type: "TILE_WINDOW", id: "workspace", preset: "left" });
    expect(state.windows.workspace.tile).not.toBeNull();

    state = windowManagerReducer(state, { type: "SET_MAXIMIZED_APP", id: "workspace", isMaximized: true });
    expect(state.windows.workspace.isMaximized).toBe(true);
    expect(state.windows.workspace.tile).toBeNull();
    expect(state.windows.workspace.isMinimized).toBe(false);

    state = windowManagerReducer(state, { type: "SET_MAXIMIZED_APP", id: "workspace", isMaximized: false });
    expect(state.windows.workspace.isMaximized).toBe(false);
  });

  it("opens floating apps alongside Workspace without navigating away and raises Workspace on focus", () => {
    expect(getDockNavigationPath("photos", "/photos/da-lat")).toBeNull();
    expect(getDockNavigationPath("photos", "/photos/")).toBeNull();
    expect(getDockNavigationPath("photos", "/writing")).toBeNull();
    expect(getDockNavigationPath("netflix", "/")).toBeNull();
    expect(getDockNavigationPath("spotify", "/")).toBeNull();
    expect(getDockNavigationPath("workspace", "/writing/example")).toBeNull();
    expect(getDockNavigationPath("workspace", "/photos/da-lat")).toBe("/");
    expect(getDefaultAppForPath("/photoshop")).toBe("workspace");
    expect(getDefaultAppForPath("/music/spotify/")).toBe("spotify");

    let state = createInitialWindowState("/");
    state = windowManagerReducer(state, { type: "OPEN_APP", id: "netflix" });
    state = windowManagerReducer(state, { type: "OPEN_APP", id: "spotify" });
    state = windowManagerReducer(state, { type: "OPEN_APP", id: "photos" });
    state = windowManagerReducer(state, { type: "FOCUS_APP", id: "workspace" });
    expect(state.activeApp).toBe("workspace");
    expect(getWindowZIndex(state.windows.workspace)).toBeGreaterThan(getWindowZIndex(state.windows.photos));
    expect(getWindowZIndex(state.windows.workspace)).toBeGreaterThan(getWindowZIndex(state.windows.spotify));
    expect(getWindowZIndex(state.windows.workspace)).toBeGreaterThan(getWindowZIndex(state.windows.netflix));
  });

  it("allows Photos and Workspace to stay open simultaneously", () => {
    let state = createInitialWindowState("/writing");
    state = windowManagerReducer(state, { type: "OPEN_APP", id: "photos" });
    expect(state.activeApp).toBe("photos");
    expect(state.windows.photos.isOpen).toBe(true);
    expect(state.windows.workspace.isOpen).toBe(true);

    // Navigating within Workspace keeps the floating Photos window open
    state = windowManagerReducer(state, { type: "SYNC_ROUTE", pathname: "/work" });
    expect(state.activeApp).toBe("workspace");
    expect(state.windows.workspace.isOpen).toBe(true);
    expect(state.windows.photos.isOpen).toBe(true);

    // Navigating to a dedicated /photos route closes the replaced Workspace host
    state = windowManagerReducer(state, { type: "SYNC_ROUTE", pathname: "/photos/da-lat" });
    expect(state.activeApp).toBe("photos");
    expect(state.windows.photos.isOpen).toBe(true);
    expect(state.windows.workspace.isOpen).toBe(false);

    state = windowManagerReducer(state, { type: "OPEN_APP", id: "spotify" });
    state = windowManagerReducer(state, { type: "CLOSE_APP", id: "spotify" });
    expect(state.activeApp).toBe("photos");
  });

  it("keeps Photos available when switching from /photos to another floating app", () => {
    let state = createInitialWindowState("/photos");
    state = windowManagerReducer(state, { type: "SYNC_ROUTE", pathname: "/music/spotify" });
    expect(state.windows.photos.isOpen).toBe(true);
    expect(state.windows.workspace.isOpen).toBe(false);
    state = windowManagerReducer(state, { type: "CLOSE_APP", id: "spotify" });
    expect(state.activeApp).toBe("photos");
  });

  it("tiles single and multiple windows with Move & Resize and Fill & Arrange presets", () => {
    let state = createInitialWindowState("/writing");
    state = windowManagerReducer(state, { type: "OPEN_APP", id: "photos" });
    state = windowManagerReducer(state, { type: "OPEN_APP", id: "spotify" });

    // Move & Resize: Left half
    state = windowManagerReducer(state, { type: "TILE_WINDOW", id: "photos", preset: "left" });
    expect(state.activeApp).toBe("photos");
    expect(state.windows.photos.tile).toEqual({ x: 0, y: 0, w: 0.5, h: 1 });

    // Fill & Arrange: Left & Right arranges top 2 open windows
    state = windowManagerReducer(state, { type: "TILE_WINDOW", id: "workspace", preset: "left-right" });
    expect(state.windows.workspace.tile).toEqual({ x: 0, y: 0, w: 0.5, h: 1 });
    expect(state.windows.photos.tile).toEqual({ x: 0.5, y: 0, w: 0.5, h: 1 });

    // Fill & Arrange: Left & 2 Right arranges 3 open windows
    state = windowManagerReducer(state, { type: "TILE_WINDOW", id: "workspace", preset: "left-two-right" });
    expect(state.windows.workspace.tile).toEqual({ x: 0, y: 0, w: 0.5, h: 1 });
    expect(state.windows.photos.tile).toEqual({ x: 0.5, y: 0, w: 0.5, h: 0.5 });
    expect(state.windows.spotify.tile).toEqual({ x: 0.5, y: 0.5, w: 0.5, h: 0.5 });
  });

  it("clamps window drag offsets within viewport bounds", () => {
    const clamped = clampWindowOffset(9999, -9999, 1660, 895, 1160, 760);
    expect(clamped.offsetX).toBeLessThanOrEqual(250);
    expect(clamped.offsetY).toBeGreaterThanOrEqual(-68);
  });

  it("syncs address bar URL to the active app while preserving workspace, photo, and app subpaths", () => {
    expect(getSyncedUrlForActiveApp("spotify", "/writing/essay-1", "/writing/essay-1")).toBe("/music/spotify");
    expect(getSyncedUrlForActiveApp("netflix", "/writing/essay-1", "/writing/essay-1")).toBe("/entertainment/netflix");
    expect(getSyncedUrlForActiveApp("photos", "/writing/essay-1", "/writing/essay-1")).toBe("/photos");
    expect(getSyncedUrlForActiveApp("workspace", "/writing/essay-1", "/writing/essay-1")).toBe("/writing/essay-1");
    expect(getSyncedUrlForActiveApp(null, "/writing/essay-1", "/writing/essay-1")).toBe("/writing/essay-1");
    expect(getSyncedUrlForActiveApp("photos", "/photos/da-lat", "/")).toBe("/photos/da-lat");
    expect(getSyncedUrlForActiveApp(null, "/photos/da-lat", "/")).toBe("/photos/da-lat");
    expect(
      getSyncedUrlForActiveApp("spotify", "/writing/essay-1", "/writing/essay-1", {
        spotify: "/music/spotify/playlist/late-night",
      }),
    ).toBe("/music/spotify/playlist/late-night");
    expect(
      getSyncedUrlForActiveApp("netflix", "/writing/essay-1", "/writing/essay-1", {
        netflix: "/entertainment/netflix/naruto",
      }),
    ).toBe("/entertainment/netflix/naruto");
    expect(
      getSyncedUrlForActiveApp("photos", "/writing/essay-1", "/writing/essay-1", {
        photos: "/photos#map",
      }),
    ).toBe("/photos#map");
  });
});

describe("Curated mini-app datasets", () => {
  it("seeds 14 Netflix movies with valid Netflix URLs", () => {
    expect(NETFLIX_MOVIES).toHaveLength(14);
    for (const movie of NETFLIX_MOVIES) {
      expect(movie.netflixUrl).toMatch(/^https:\/\/www\.netflix\.com\/title\/\d+$/);
    }
  });

  it("seeds 17 Spotify tracks with valid track IDs, full-length YouTube IDs, and durations", () => {
    expect(SPOTIFY_TRACKS).toHaveLength(17);
    for (const track of SPOTIFY_TRACKS) {
      expect(track.spotifyTrackId).toMatch(/^[A-Za-z0-9]{22}$/);
      expect(track.spotifyUrl).toBe(`https://open.spotify.com/track/${track.spotifyTrackId}`);
      expect(track.youtubeVideoId).toMatch(/^[A-Za-z0-9_-]{11}$/);
      expect(track.durationMs).toBeGreaterThan(120000);
    }
    expect(formatDurationMs(200040)).toBe("3:20");
  });

  it("seeds 8 Nikon Imaging Recipes linked to Nikon Imaging Cloud", () => {
    expect(NIKON_RECIPES).toHaveLength(8);
    for (const recipe of NIKON_RECIPES) {
      expect(recipe.officialUrl).toContain("imagingcloud.nikon.com");
    }
  });
});
