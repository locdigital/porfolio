import { describe, expect, it } from "vitest";
import { DEFAULT_DOCK_APPS } from "../dock/dock.config";
import {
  clampWindowOffset,
  createInitialWindowState,
  getDefaultAppForPath,
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
});

describe("WindowManager state transitions", () => {
  it("defaults to photos on /photos routes and workspace elsewhere", () => {
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
