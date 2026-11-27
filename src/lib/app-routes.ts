import { NETFLIX_GENRES, NETFLIX_MOVIES } from "../data/netflix";
import { ALL_SPOTIFY_COLLECTIONS, SPOTIFY_TRACKS } from "../data/spotify";
import { NIKON_EDITORIAL_TAGS, NIKON_RECIPES } from "../data/nikon-recipes";
import type { SpotifyView } from "../components/apps/spotify/useSpotifyState";

export const NETFLIX_BASE_PATH = "/entertainment/netflix";
export const SPOTIFY_BASE_PATH = "/music/spotify";
export const PHOTOS_BASE_PATH = "/photos";
export const NIKON_BASE_PATH = "/color-lab/nikon-recipes";

export const SPOTIFY_SECTION_KINDS = [
  "search",
  "browse",
  "radio",
  "made-for-you",
  "recently-played",
  "liked-songs",
  "albums",
] as const;

export type SpotifySectionKind = (typeof SPOTIFY_SECTION_KINDS)[number];
export type SpotifyHomeCategory = "All" | "Music" | "Podcasts" | "Audiobooks";

export const SPOTIFY_HOME_CATEGORIES: readonly SpotifyHomeCategory[] = [
  "All",
  "Music",
  "Podcasts",
  "Audiobooks",
];

export function slugifySegment(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .replace(/&/g, " and ")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function splitUrlParts(rawUrl: string): { pathname: string; hash: string } {
  if (!rawUrl) return { pathname: "", hash: "" };
  try {
    const parsed = new URL(rawUrl, "https://loc.digital");
    return {
      pathname: parsed.pathname.replace(/\/+$/, "") || "/",
      hash: parsed.hash.replace(/^#/, ""),
    };
  } catch {
    const [pathPart = "", hashPart = ""] = rawUrl.split("#");
    const cleanPath = pathPart.split("?")[0].replace(/\/+$/, "") || "/";
    return { pathname: cleanPath, hash: hashPart };
  }
}

function decodeSegments(raw: string): string[] {
  return raw
    .split("/")
    .map((segment) => {
      try {
        return decodeURIComponent(segment).trim();
      } catch {
        return segment.trim();
      }
    })
    .filter(Boolean);
}

// ── Netflix ──────────────────────────────────────────────────────────────────

const NETFLIX_GENRE_BY_SLUG = new Map<string, string>(
  NETFLIX_GENRES.filter((g) => g !== "All").map((genre) => [slugifySegment(genre), genre]),
);

const NETFLIX_MOVIE_BY_SLUG = new Map<string, (typeof NETFLIX_MOVIES)[number]>(
  NETFLIX_MOVIES.flatMap((movie) => [
    [movie.slug.toLowerCase(), movie],
    [movie.id.toLowerCase(), movie],
  ]),
);

export function getNetflixGenreSlug(genre: string): string {
  return slugifySegment(genre);
}

export function getNetflixUrl(state: {
  genre?: string;
  movieSlug?: string | null;
}): string {
  if (state.movieSlug) {
    return `${NETFLIX_BASE_PATH}/${encodeURIComponent(state.movieSlug)}`;
  }
  if (state.genre && state.genre !== "All") {
    return `${NETFLIX_BASE_PATH}/genre/${getNetflixGenreSlug(state.genre)}`;
  }
  return NETFLIX_BASE_PATH;
}

export function parseNetflixUrl(rawUrl: string): {
  genre: string;
  movieSlug: string | null;
} {
  const { pathname, hash } = splitUrlParts(rawUrl);

  let segments: string[] = [];
  if (pathname === NETFLIX_BASE_PATH || pathname.startsWith(`${NETFLIX_BASE_PATH}/`)) {
    segments = decodeSegments(pathname.slice(NETFLIX_BASE_PATH.length));
  }
  if (segments.length === 0 && hash) {
    segments = decodeSegments(hash);
  }

  if (segments.length === 0) {
    return { genre: "All", movieSlug: null };
  }

  const first = segments[0].toLowerCase();
  if (first === "genre" && segments[1]) {
    const matchedGenre = NETFLIX_GENRE_BY_SLUG.get(slugifySegment(segments[1]));
    return { genre: matchedGenre ?? "All", movieSlug: null };
  }

  if (first === "title" && segments[1]) {
    const movie = NETFLIX_MOVIE_BY_SLUG.get(segments[1].toLowerCase());
    return { genre: "All", movieSlug: movie?.slug ?? null };
  }

  const matchedMovie = NETFLIX_MOVIE_BY_SLUG.get(first);
  if (matchedMovie) {
    return { genre: "All", movieSlug: matchedMovie.slug };
  }

  const matchedGenre = NETFLIX_GENRE_BY_SLUG.get(slugifySegment(first));
  if (matchedGenre) {
    return { genre: matchedGenre, movieSlug: null };
  }

  return { genre: "All", movieSlug: null };
}

export function getNetflixStaticRouteEntries(): Array<{
  slug: string;
  title: string;
  description: string;
}> {
  const movieEntries = NETFLIX_MOVIES.map((movie) => ({
    slug: movie.slug,
    title: `${movie.title} (${movie.year}) — Netflix`,
    description: movie.synopsis,
  }));
  const genreEntries = NETFLIX_GENRES.filter((genre) => genre !== "All").map((genre) => ({
    slug: `genre/${getNetflixGenreSlug(genre)}`,
    title: `${genre} — Netflix Personal Library`,
    description: `${genre} picks in Phuc Loc Nguyen's personal Netflix library.`,
  }));
  return [...movieEntries, ...genreEntries];
}

// ── Spotify ──────────────────────────────────────────────────────────────────

export function getSpotifyAlbumSlug(albumName: string): string {
  return slugifySegment(albumName);
}

const SPOTIFY_UNIQUE_ALBUMS = Array.from(
  new Map(SPOTIFY_TRACKS.map((track) => [track.album, track])).values(),
);

const SPOTIFY_ALBUM_BY_SLUG = new Map<string, string>(
  SPOTIFY_UNIQUE_ALBUMS.map((track) => [getSpotifyAlbumSlug(track.album), track.album]),
);

const SPOTIFY_COLLECTION_IDS = new Set<string>(
  ALL_SPOTIFY_COLLECTIONS.map((collection) => collection.id),
);

const SPOTIFY_SECTION_SET = new Set<string>(SPOTIFY_SECTION_KINDS);

const SPOTIFY_CATEGORY_BY_SLUG = new Map<string, SpotifyHomeCategory>(
  SPOTIFY_HOME_CATEGORIES.filter((cat) => cat !== "All").map((cat) => [slugifySegment(cat), cat]),
);

export function getSpotifyUrl(
  view: SpotifyView,
  homeCategory: SpotifyHomeCategory = "All",
): string {
  switch (view.kind) {
    case "home":
      return homeCategory !== "All"
        ? `${SPOTIFY_BASE_PATH}#${slugifySegment(homeCategory)}`
        : SPOTIFY_BASE_PATH;
    case "playlist":
      return `${SPOTIFY_BASE_PATH}/playlist/${encodeURIComponent(view.playlistId)}`;
    case "album":
      return `${SPOTIFY_BASE_PATH}/album/${encodeURIComponent(getSpotifyAlbumSlug(view.albumName))}`;
    default:
      return `${SPOTIFY_BASE_PATH}/${view.kind}`;
  }
}

export function parseSpotifyUrl(rawUrl: string): {
  view: SpotifyView;
  homeCategory: SpotifyHomeCategory;
} {
  const { pathname, hash } = splitUrlParts(rawUrl);

  let segments: string[] = [];
  if (pathname === SPOTIFY_BASE_PATH || pathname.startsWith(`${SPOTIFY_BASE_PATH}/`)) {
    segments = decodeSegments(pathname.slice(SPOTIFY_BASE_PATH.length));
  }
  const hashSegments = hash ? decodeSegments(hash) : [];

  if (segments.length === 0 && hashSegments.length > 0) {
    const category = SPOTIFY_CATEGORY_BY_SLUG.get(slugifySegment(hashSegments[0]));
    if (category) {
      return { view: { kind: "home" }, homeCategory: category };
    }
    segments = hashSegments;
  }

  if (segments.length === 0) {
    return { view: { kind: "home" }, homeCategory: "All" };
  }

  const first = segments[0].toLowerCase();
  if (first === "playlist" && segments[1] && SPOTIFY_COLLECTION_IDS.has(segments[1])) {
    return { view: { kind: "playlist", playlistId: segments[1] }, homeCategory: "All" };
  }

  if (first === "album" && segments[1]) {
    const albumName = SPOTIFY_ALBUM_BY_SLUG.get(slugifySegment(segments[1]));
    if (albumName) {
      return { view: { kind: "album", albumName }, homeCategory: "All" };
    }
  }

  if (SPOTIFY_SECTION_SET.has(first)) {
    return { view: { kind: first as SpotifySectionKind }, homeCategory: "All" };
  }

  if (SPOTIFY_COLLECTION_IDS.has(first)) {
    return { view: { kind: "playlist", playlistId: first }, homeCategory: "All" };
  }

  const albumByDirectSlug = SPOTIFY_ALBUM_BY_SLUG.get(slugifySegment(first));
  if (albumByDirectSlug) {
    return { view: { kind: "album", albumName: albumByDirectSlug }, homeCategory: "All" };
  }

  return { view: { kind: "home" }, homeCategory: "All" };
}

export function getSpotifyStaticRouteEntries(): Array<{
  slug: string;
  title: string;
  description: string;
}> {
  const sectionLabels: Record<SpotifySectionKind, string> = {
    search: "Search",
    browse: "Browse Playlists",
    radio: "Radio & Mixes",
    "made-for-you": "Made for You",
    "recently-played": "Recently Played",
    "liked-songs": "Liked Songs",
    albums: "Albums",
  };

  const sectionEntries = SPOTIFY_SECTION_KINDS.map((kind) => ({
    slug: kind,
    title: `${sectionLabels[kind]} — Spotify`,
    description: `${sectionLabels[kind]} in Phuc Loc Nguyen's personal Spotify library.`,
  }));

  const playlistEntries = ALL_SPOTIFY_COLLECTIONS.map((col) => ({
    slug: `playlist/${col.id}`,
    title: `${col.title} — Spotify`,
    description: col.description,
  }));

  const albumEntries = SPOTIFY_UNIQUE_ALBUMS.map((track) => ({
    slug: `album/${getSpotifyAlbumSlug(track.album)}`,
    title: `${track.album} by ${track.artist} — Spotify`,
    description: `Album ${track.album} by ${track.artist} in Phuc Loc Nguyen's personal Spotify rotation.`,
  }));

  return [...sectionEntries, ...playlistEntries, ...albumEntries];
}

// ── Photos Library (#hash sub-views on /photos) ──────────────────────────────

export interface PhotosLibraryRouteState {
  nav: string;
  seg: "all" | "years" | "months";
  timeValue: string;
  filter: string;
}

export function getPhotosLibraryHash(state: PhotosLibraryRouteState): string {
  const { nav, seg, timeValue, filter } = state;

  if (nav === "map") return "#map";

  if (nav === "trips" || nav === "albums") {
    if (filter.startsWith("region:")) {
      return `#${nav}/region/${slugifySegment(filter.slice(7))}`;
    }
    return `#${nav}`;
  }

  if (nav === "featured") {
    if (filter.startsWith("region:")) {
      return `#featured/region/${slugifySegment(filter.slice(7))}`;
    }
    if (filter.startsWith("album:")) {
      return `#featured/album/${encodeURIComponent(filter.slice(6))}`;
    }
    return "#featured";
  }

  if (nav.startsWith("region:")) {
    return `#region/${slugifySegment(nav.slice(7))}`;
  }

  // Library view
  if (filter === "featured") return "#featured";
  if (filter.startsWith("region:")) {
    return `#region/${slugifySegment(filter.slice(7))}`;
  }
  if (filter.startsWith("album:")) {
    return `#album/${encodeURIComponent(filter.slice(6))}`;
  }

  if (seg === "years") {
    return timeValue !== "all" ? `#years/${slugifySegment(timeValue)}` : "#years";
  }
  if (seg === "months") {
    return timeValue !== "all" ? `#months/${slugifySegment(timeValue)}` : "#months";
  }

  return "";
}

export function parsePhotosLibraryHash(
  rawHash: string,
  options: {
    availableRegions: readonly string[];
    availableAlbumSlugs?: readonly string[];
    availableTimeValues?: { years?: readonly string[]; months?: readonly string[] };
  },
): PhotosLibraryRouteState {
  const fallback: PhotosLibraryRouteState = {
    nav: "library",
    seg: "all",
    timeValue: "all",
    filter: "all",
  };

  const clean = rawHash.replace(/^#/, "").trim();
  if (!clean) return fallback;

  const segments = decodeSegments(clean);
  if (segments.length === 0) return fallback;

  const regionBySlug = new Map(
    options.availableRegions.map((region) => [slugifySegment(region), region]),
  );
  const albumSet = options.availableAlbumSlugs ? new Set(options.availableAlbumSlugs) : null;

  const head = segments[0].toLowerCase();

  if (head === "library" || head === "all") return fallback;
  if (head === "map") return { ...fallback, nav: "map" };

  if (head === "trips" || head === "albums") {
    if (segments[1]?.toLowerCase() === "region" && segments[2]) {
      const region = regionBySlug.get(slugifySegment(segments[2]));
      if (region) return { ...fallback, nav: head, filter: `region:${region}` };
    }
    return { ...fallback, nav: head };
  }

  if (head === "featured") {
    if (segments[1]?.toLowerCase() === "region" && segments[2]) {
      const region = regionBySlug.get(slugifySegment(segments[2]));
      if (region) return { ...fallback, nav: "featured", filter: `region:${region}` };
    }
    if (segments[1]?.toLowerCase() === "album" && segments[2]) {
      const albumSlug = segments[2];
      if (!albumSet || albumSet.has(albumSlug)) {
        return { ...fallback, nav: "featured", filter: `album:${albumSlug}` };
      }
    }
    return { ...fallback, nav: "featured" };
  }

  if (head === "region" && segments[1]) {
    const region = regionBySlug.get(slugifySegment(segments[1]));
    if (region) return { ...fallback, nav: `region:${region}` };
  }

  if (head === "album" && segments[1]) {
    const albumSlug = segments[1];
    if (!albumSet || albumSet.has(albumSlug)) {
      return { ...fallback, nav: "library", filter: `album:${albumSlug}` };
    }
  }

  if (head === "years" || head === "months") {
    let timeValue = "all";
    if (segments[1]) {
      const candidates =
        head === "years"
          ? options.availableTimeValues?.years
          : options.availableTimeValues?.months;
      const targetSlug = slugifySegment(segments[1]);
      if (candidates && candidates.length > 0) {
        const matched = candidates.find((candidate) => slugifySegment(candidate) === targetSlug);
        if (matched) timeValue = matched;
      } else {
        timeValue = segments[1];
      }
    }
    return { ...fallback, nav: "library", seg: head, timeValue };
  }

  // Direct region slug fallback (e.g. #northern-vietnam)
  const directRegion = regionBySlug.get(slugifySegment(head));
  if (directRegion) {
    return { ...fallback, nav: `region:${directRegion}` };
  }

  return fallback;
}

// ── Nikon Color Lab ──────────────────────────────────────────────────────────

const NIKON_RECIPE_BY_ID = new Map(NIKON_RECIPES.map((r) => [r.id.toLowerCase(), r]));
const NIKON_TAG_BY_SLUG = new Map<string, string>(
  NIKON_EDITORIAL_TAGS.filter((t) => t !== "All").map((tag) => [slugifySegment(tag), tag]),
);

export function getNikonUrl(state: {
  recipeId?: string;
  tag?: string;
}): string {
  const defaultId = NIKON_RECIPES[0]?.id;
  if (state.tag && state.tag !== "All") {
    const tagSlug = slugifySegment(state.tag);
    if (state.recipeId && state.recipeId !== defaultId) {
      return `${NIKON_BASE_PATH}#tag/${tagSlug}/${encodeURIComponent(state.recipeId)}`;
    }
    return `${NIKON_BASE_PATH}#tag/${tagSlug}`;
  }
  if (state.recipeId && state.recipeId !== defaultId) {
    return `${NIKON_BASE_PATH}#${encodeURIComponent(state.recipeId)}`;
  }
  return NIKON_BASE_PATH;
}

export function parseNikonUrl(rawUrl: string): {
  recipeId: string;
  tag: string;
} {
  const defaultId = NIKON_RECIPES[0]?.id ?? "";
  const { pathname, hash } = splitUrlParts(rawUrl);

  let segments: string[] = [];
  if (pathname.startsWith(`${NIKON_BASE_PATH}/`)) {
    segments = decodeSegments(pathname.slice(NIKON_BASE_PATH.length));
  }
  if (segments.length === 0 && hash) {
    segments = decodeSegments(hash);
  }
  if (segments.length === 0) {
    return { recipeId: defaultId, tag: "All" };
  }

  if (segments[0].toLowerCase() === "tag" && segments[1]) {
    const matchedTag = NIKON_TAG_BY_SLUG.get(slugifySegment(segments[1])) ?? "All";
    const matchedRecipe = segments[2]
      ? NIKON_RECIPE_BY_ID.get(segments[2].toLowerCase())
      : undefined;
    return { recipeId: matchedRecipe?.id ?? defaultId, tag: matchedTag };
  }

  const matchedRecipe = NIKON_RECIPE_BY_ID.get(segments[0].toLowerCase());
  if (matchedRecipe) {
    return { recipeId: matchedRecipe.id, tag: "All" };
  }

  const matchedTag = NIKON_TAG_BY_SLUG.get(slugifySegment(segments[0]));
  if (matchedTag) {
    return { recipeId: defaultId, tag: matchedTag };
  }

  return { recipeId: defaultId, tag: "All" };
}
