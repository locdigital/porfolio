import { describe, expect, it } from "vitest";
import { DEFAULT_DOCK_APPS, getAppRoute } from "../dock/dock.config";
import {
  clampWindowOffset,
  createInitialWindowState,
  getDefaultAppForPath,
  getDockNavigationPath,
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
  it("resolves dedicated routes to their matching app", () => {
    expect(getDefaultAppForPath("/entertainment/netflix")).toBe("netflix");
    expect(getDefaultAppForPath("/music/spotify")).toBe("spotify");
    expect(getDefaultAppForPath("/color-lab/nikon-recipes")).toBe("photoshop");
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
    expect(state.windows.netflix.isMinimized).toBe(true);
    expect(state.activeApp).toBe("photos");

    state = windowManagerReducer(state, { type: "CLOSE_APP", id: "netflix" });
    expect(state.windows.netflix.isOpen).toBe(false);
  });

  it("restores the current album or workspace page without navigating to its root", () => {
    expect(getDockNavigationPath("photos", "/photos/da-lat")).toBeNull();
    expect(getDockNavigationPath("photos", "/photos/")).toBeNull();
    expect(getDockNavigationPath("workspace", "/writing/example")).toBeNull();
    expect(getDockNavigationPath("workspace", "/photos/da-lat")).toBe("/");
    expect(getDockNavigationPath("photos", "/writing")).toBe("/photos");
    expect(getDefaultAppForPath("/photoshop")).toBe("workspace");
    expect(getDefaultAppForPath("/music/spotify/")).toBe("spotify");
  });

  it("releases the previous host when switching between Photos and Workspace", () => {
    let state = createInitialWindowState("/photos/da-lat");
    state = windowManagerReducer(state, { type: "SYNC_ROUTE", pathname: "/writing" });
    expect(state.activeApp).toBe("workspace");
    expect(state.windows.photos.isOpen).toBe(false);
    expect(state.windows.workspace.isOpen).toBe(true);

    state = windowManagerReducer(state, { type: "SYNC_ROUTE", pathname: "/photos/da-lat" });
    expect(state.activeApp).toBe("photos");
    expect(state.windows.photos.isOpen).toBe(true);
    expect(state.windows.workspace.isOpen).toBe(false);

    state = windowManagerReducer(state, { type: "OPEN_APP", id: "spotify" });
    state = windowManagerReducer(state, { type: "CLOSE_APP", id: "spotify" });
    expect(state.activeApp).toBe("photos");
  });

  it("does not let the replaced Photos host steal focus from a floating app", () => {
    let state = createInitialWindowState("/photos");
    state = windowManagerReducer(state, { type: "SYNC_ROUTE", pathname: "/music/spotify" });
    expect(state.windows.photos.isOpen).toBe(false);
    expect(state.windows.workspace.isOpen).toBe(false);
    state = windowManagerReducer(state, { type: "CLOSE_APP", id: "spotify" });
    expect(state.activeApp).toBeNull();
  });

  it("clamps window drag offsets within viewport bounds", () => {
    const clamped = clampWindowOffset(9999, -9999, 1660, 895, 1160, 760);
    expect(clamped.offsetX).toBeLessThanOrEqual(250);
    expect(clamped.offsetY).toBeGreaterThanOrEqual(-68);
  });
});

describe("Curated mini-app datasets", () => {
  it("seeds 10 Netflix movies with valid Netflix URLs", () => {
    expect(NETFLIX_MOVIES).toHaveLength(10);
    for (const movie of NETFLIX_MOVIES) {
      expect(movie.netflixUrl).toMatch(/^https:\/\/www\.netflix\.com\/title\/\d+$/);
    }
  });

  it("seeds 10 Spotify tracks with valid track IDs and durations", () => {
    expect(SPOTIFY_TRACKS).toHaveLength(10);
    for (const track of SPOTIFY_TRACKS) {
      expect(track.spotifyTrackId).toMatch(/^[A-Za-z0-9]{22}$/);
      expect(track.spotifyUrl).toBe(`https://open.spotify.com/track/${track.spotifyTrackId}`);
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
