import { describe, expect, it } from "vitest";
import {
  getNetflixStaticRouteEntries,
  getNetflixUrl,
  getNikonUrl,
  getPhotosLibraryHash,
  getSpotifyAlbumSlug,
  getSpotifyStaticRouteEntries,
  getSpotifyUrl,
  parseNetflixUrl,
  parseNikonUrl,
  parsePhotosLibraryHash,
  parseSpotifyUrl,
  slugifySegment,
} from "./app-routes";

describe("app-routes helpers", () => {
  it("slugifies Vietnamese and punctuation cleanly", () => {
    expect(slugifySegment("Đà Lạt")).toBe("da-lat");
    expect(slugifySegment("Northern Vietnam")).toBe("northern-vietnam");
    expect(slugifySegment("B&W")).toBe("b-and-w");
    expect(slugifySegment("x (Wembley Edition)")).toBe("x-wembley-edition");
  });

  it("serializes and parses Netflix movie and genre URLs (both /slug and #hash)", () => {
    expect(getNetflixUrl({ genre: "All", movieSlug: null })).toBe("/entertainment/netflix");
    expect(getNetflixUrl({ genre: "Anime", movieSlug: null })).toBe("/entertainment/netflix/genre/anime");
    expect(getNetflixUrl({ genre: "Anime", movieSlug: "naruto" })).toBe("/entertainment/netflix/naruto");

    expect(parseNetflixUrl("/entertainment/netflix")).toEqual({ genre: "All", movieSlug: null });
    expect(parseNetflixUrl("/entertainment/netflix/naruto")).toEqual({ genre: "All", movieSlug: "naruto" });
    expect(parseNetflixUrl("/entertainment/netflix/genre/anime")).toEqual({ genre: "Anime", movieSlug: null });
    expect(parseNetflixUrl("/entertainment/netflix#phi-vu-trieu-do")).toEqual({
      genre: "All",
      movieSlug: "phi-vu-trieu-do",
    });
    expect(parseNetflixUrl("/entertainment/netflix#thriller")).toEqual({
      genre: "Thriller",
      movieSlug: null,
    });

    const entries = getNetflixStaticRouteEntries();
    expect(entries.some((e) => e.slug === "naruto")).toBe(true);
    expect(entries.some((e) => e.slug === "genre/anime")).toBe(true);
    expect(entries).toHaveLength(20); // 14 movies + 6 genres
  });

  it("serializes and parses Spotify sections, playlists, albums, and home categories", () => {
    expect(getSpotifyUrl({ kind: "home" })).toBe("/music/spotify");
    expect(getSpotifyUrl({ kind: "home" }, "Music")).toBe("/music/spotify#music");
    expect(getSpotifyUrl({ kind: "liked-songs" })).toBe("/music/spotify/liked-songs");
    expect(getSpotifyUrl({ kind: "playlist", playlistId: "late-night" })).toBe(
      "/music/spotify/playlist/late-night",
    );
    expect(getSpotifyUrl({ kind: "album", albumName: "Favourite Worst Nightmare" })).toBe(
      `/music/spotify/album/${getSpotifyAlbumSlug("Favourite Worst Nightmare")}`,
    );

    expect(parseSpotifyUrl("/music/spotify")).toEqual({
      view: { kind: "home" },
      homeCategory: "All",
    });
    expect(parseSpotifyUrl("/music/spotify#podcasts")).toEqual({
      view: { kind: "home" },
      homeCategory: "Podcasts",
    });
    expect(parseSpotifyUrl("/music/spotify/liked-songs")).toEqual({
      view: { kind: "liked-songs" },
      homeCategory: "All",
    });
    expect(parseSpotifyUrl("/music/spotify/playlist/late-night")).toEqual({
      view: { kind: "playlist", playlistId: "late-night" },
      homeCategory: "All",
    });
    expect(parseSpotifyUrl("/music/spotify/album/parachutes")).toEqual({
      view: { kind: "album", albumName: "Parachutes" },
      homeCategory: "All",
    });
    expect(parseSpotifyUrl("/music/spotify#playlist/on-repeat")).toEqual({
      view: { kind: "playlist", playlistId: "on-repeat" },
      homeCategory: "All",
    });

    const entries = getSpotifyStaticRouteEntries();
    expect(entries.some((e) => e.slug === "liked-songs")).toBe(true);
    expect(entries.some((e) => e.slug === "playlist/late-night")).toBe(true);
    expect(entries.some((e) => e.slug === "album/parachutes")).toBe(true);
  });

  it("serializes and parses Photos library sub-view hashes", () => {
    const options = {
      availableRegions: ["Northern Vietnam", "Central Vietnam", "Southern Vietnam"],
      availableAlbumSlugs: ["da-lat", "ha-giang"],
      availableTimeValues: { years: ["2026", "2025"], months: ["Nov 2026", "Oct 2025"] },
    };

    expect(getPhotosLibraryHash({ nav: "library", seg: "all", timeValue: "all", filter: "all" })).toBe("");
    expect(getPhotosLibraryHash({ nav: "map", seg: "all", timeValue: "all", filter: "all" })).toBe("#map");
    expect(getPhotosLibraryHash({ nav: "trips", seg: "all", timeValue: "all", filter: "all" })).toBe("#trips");
    expect(getPhotosLibraryHash({ nav: "albums", seg: "all", timeValue: "all", filter: "region:Central Vietnam" })).toBe(
      "#albums/region/central-vietnam",
    );
    expect(getPhotosLibraryHash({ nav: "region:Northern Vietnam", seg: "all", timeValue: "all", filter: "all" })).toBe(
      "#region/northern-vietnam",
    );
    expect(getPhotosLibraryHash({ nav: "library", seg: "years", timeValue: "2026", filter: "all" })).toBe("#years/2026");
    expect(getPhotosLibraryHash({ nav: "library", seg: "months", timeValue: "Nov 2026", filter: "all" })).toBe(
      "#months/nov-2026",
    );

    expect(parsePhotosLibraryHash("#map", options)).toEqual({
      nav: "map",
      seg: "all",
      timeValue: "all",
      filter: "all",
    });
    expect(parsePhotosLibraryHash("#region/central-vietnam", options)).toEqual({
      nav: "region:Central Vietnam",
      seg: "all",
      timeValue: "all",
      filter: "all",
    });
    expect(parsePhotosLibraryHash("#albums/region/southern-vietnam", options)).toEqual({
      nav: "albums",
      seg: "all",
      timeValue: "all",
      filter: "region:Southern Vietnam",
    });
    expect(parsePhotosLibraryHash("#months/nov-2026", options)).toEqual({
      nav: "library",
      seg: "months",
      timeValue: "Nov 2026",
      filter: "all",
    });
    expect(parsePhotosLibraryHash("#album/da-lat", options)).toEqual({
      nav: "library",
      seg: "all",
      timeValue: "all",
      filter: "album:da-lat",
    });
  });

  it("serializes and parses Nikon Color Lab recipe & tag hashes", () => {
    expect(getNikonUrl({ recipeId: "cine-mood-luizclas", tag: "All" })).toBe("/color-lab/nikon-recipes");
    expect(getNikonUrl({ recipeId: "at-dusk-noise-woo", tag: "All" })).toBe(
      "/color-lab/nikon-recipes#at-dusk-noise-woo",
    );
    expect(getNikonUrl({ recipeId: "at-dusk-noise-woo", tag: "Cool" })).toBe(
      "/color-lab/nikon-recipes#tag/cool/at-dusk-noise-woo",
    );

    expect(parseNikonUrl("/color-lab/nikon-recipes#at-dusk-noise-woo")).toEqual({
      recipeId: "at-dusk-noise-woo",
      tag: "All",
    });
    expect(parseNikonUrl("/color-lab/nikon-recipes#tag/cool/at-dusk-noise-woo")).toEqual({
      recipeId: "at-dusk-noise-woo",
      tag: "Cool",
    });
  });
});
