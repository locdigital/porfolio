export interface SpotifyTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  coverSrc?: string;
  previewUrl?: string;
  accentColor: string;
  spotifyUrl: string;
  spotifyTrackId: string;
  durationMs: number;
  moodTags: string[];
  order: number;
}

export interface SpotifyPlaylist {
  id: string;
  title: string;
  description: string;
  category: "made-for-you" | "playlist";
  mood?: string;
  accentColor: string;
  coverSrc?: string;
  trackIds: string[];
}

export const SPOTIFY_MOOD_FILTERS = [
  "All",
  "Late Night",
  "Indie",
  "Warm",
  "Focus",
  "Editing",
  "Synthwave",
  "Ambient",
] as const;

export const SPOTIFY_CURATED_NOTE =
  "Curated rotation of 10 tracks. Playback uses the official Spotify Embed player when opened, or launches directly in Spotify.";

export const SPOTIFY_TRACKS: SpotifyTrack[] = [
  {
    id: "joji-slow-dancing-in-the-dark",
    title: "SLOW DANCING IN THE DARK",
    artist: "Joji",
    album: "BALLADS 1",
    coverSrc: "https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e0260ba1d6104d0475c7555a6b2",
    previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/e3/73/81/e37381e3-23f4-caaa-42cc-44a54c83962f/mzaf_11759626948546127311.plus.aac.p.m4a",
    accentColor: "#3B0764",
    spotifyTrackId: "0rKtyWc8bvkriBthvHKY8d",
    spotifyUrl: "https://open.spotify.com/track/0rKtyWc8bvkriBthvHKY8d",
    durationMs: 209274,
    moodTags: ["Late Night", "Indie"],
    order: 1,
  },
  {
    id: "the-weeknd-blinding-lights",
    title: "Blinding Lights",
    artist: "The Weeknd",
    album: "After Hours",
    coverSrc: "https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e028863bc11d2aa12b54f5aeb36",
    previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/1d/44/0d/1d440dbc-9832-08e6-080d-aa1e1bacf40c/mzaf_3600642016947675074.plus.aac.p.m4a",
    accentColor: "#991B1B",
    spotifyTrackId: "0VjIjW4GlUZAMYd2vXMi3b",
    spotifyUrl: "https://open.spotify.com/track/0VjIjW4GlUZAMYd2vXMi3b",
    durationMs: 200040,
    moodTags: ["Synthwave", "Focus"],
    order: 2,
  },
  {
    id: "coldplay-yellow",
    title: "Yellow",
    artist: "Coldplay",
    album: "Parachutes",
    coverSrc: "https://image-cdn-fa.spotifycdn.com/image/ab67616d00001e029164bafe9aaa168d93f4816a",
    previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/66/f3/1a/66f31a76-a6ed-cb4c-f353-23310a7ae9a8/mzaf_10593596652344378873.plus.aac.p.m4a",
    accentColor: "#CA8A04",
    spotifyTrackId: "3AJwUDP919kvQ9QcozQPxg",
    spotifyUrl: "https://open.spotify.com/track/3AJwUDP919kvQ9QcozQPxg",
    durationMs: 266773,
    moodTags: ["Warm", "Indie"],
    order: 3,
  },
  {
    id: "cigarettes-after-sex-apocalypse",
    title: "Apocalypse",
    artist: "Cigarettes After Sex",
    album: "Cigarettes After Sex",
    coverSrc: "https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e0212b69bf576f5e80291f75161",
    previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/b1/43/b0/b143b0ee-863a-8f7c-3c56-a67110ef1591/mzaf_10438092015459317290.plus.aac.p.m4a",
    accentColor: "#18181B",
    spotifyTrackId: "0yc6Gst2xkRu0eMLeRMGCX",
    spotifyUrl: "https://open.spotify.com/track/0yc6Gst2xkRu0eMLeRMGCX",
    durationMs: 290616,
    moodTags: ["Late Night", "Ambient"],
    order: 4,
  },
  {
    id: "arctic-monkeys-i-wanna-be-yours",
    title: "I Wanna Be Yours",
    artist: "Arctic Monkeys",
    album: "AM",
    coverSrc: "https://image-cdn-fa.spotifycdn.com/image/ab67616d00001e024ae1c4c5c45aabe565499163",
    previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/8b/0c/df/8b0cdfe6-f619-1ab0-366a-73be84c04dec/mzaf_14055369509528206797.plus.aac.p.m4a",
    accentColor: "#27272A",
    spotifyTrackId: "5XeFesFbtLpXzIVDNQP22n",
    spotifyUrl: "https://open.spotify.com/track/5XeFesFbtLpXzIVDNQP22n",
    durationMs: 183956,
    moodTags: ["Late Night", "Indie"],
    order: 5,
  },
  {
    id: "frank-ocean-pink-white",
    title: "Pink + White",
    artist: "Frank Ocean",
    album: "Blonde",
    coverSrc: "https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e02c5649add07ed3720be9d5526",
    previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/ba/11/dc/ba11dccd-16d2-9cd8-13f0-85b73acc0a09/mzaf_1304250511099243436.plus.aac.p.m4a",
    accentColor: "#047857",
    spotifyTrackId: "3xKsf9qdS1CyvXSMEid6g8",
    spotifyUrl: "https://open.spotify.com/track/3xKsf9qdS1CyvXSMEid6g8",
    durationMs: 184516,
    moodTags: ["Warm", "Editing"],
    order: 6,
  },
  {
    id: "keshi-beside-you",
    title: "beside you",
    artist: "keshi",
    album: "beside you",
    coverSrc: "https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e02da53f97b4b0f1e14d854f777",
    previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/7d/c2/aa/7dc2aa11-613f-d872-eef9-4b86ff5afee6/mzaf_14026216661466764612.plus.aac.p.m4a",
    accentColor: "#1E3A8A",
    spotifyTrackId: "1Fhb9iJPufNMZSwupsXiRe",
    spotifyUrl: "https://open.spotify.com/track/1Fhb9iJPufNMZSwupsXiRe",
    durationMs: 166080,
    moodTags: ["Editing", "Warm"],
    order: 7,
  },
  {
    id: "niki-every-summertime",
    title: "Every Summertime",
    artist: "NIKI",
    album: "Shang-Chi and The Legend of The Ten Rings: The Album",
    coverSrc: "https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e02e81fd3b9a7230db447f38182",
    previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/76/dc/1d/76dc1d95-bfd7-86aa-0ac3-6cc045277504/mzaf_17212807274712817128.plus.aac.p.m4a",
    accentColor: "#C2410C",
    spotifyTrackId: "68HocO7fx9z0MgDU0ZPHro",
    spotifyUrl: "https://open.spotify.com/track/68HocO7fx9z0MgDU0ZPHro",
    durationMs: 215760,
    moodTags: ["Warm", "Focus"],
    order: 8,
  },
  {
    id: "odesza-a-moment-apart",
    title: "A Moment Apart",
    artist: "ODESZA",
    album: "A Moment Apart",
    coverSrc: "https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e0245951a69fe39a6e163122eab",
    previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/48/25/7e/48257e72-20ce-3f63-85d0-055088030122/mzaf_6975599439612238138.plus.aac.p.m4a",
    accentColor: "#1D4ED8",
    spotifyTrackId: "59wlTaYOL5tDUgXnbBQ3my",
    spotifyUrl: "https://open.spotify.com/track/59wlTaYOL5tDUgXnbBQ3my",
    durationMs: 234389,
    moodTags: ["Focus", "Ambient"],
    order: 9,
  },
  {
    id: "daft-punk-instant-crush",
    title: "Instant Crush",
    artist: "Daft Punk (feat. Julian Casablancas)",
    album: "Random Access Memories",
    coverSrc: "https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e029b9b36b0e22870b9f542d937",
    previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/dc/1e/c2/dc1ec21b-96a0-470c-ee89-2b09346fa847/mzaf_7827098614541126525.plus.aac.p.m4a",
    accentColor: "#44403C",
    spotifyTrackId: "2cGxRwrMyEAp8dEbuZaVv6",
    spotifyUrl: "https://open.spotify.com/track/2cGxRwrMyEAp8dEbuZaVv6",
    durationMs: 337560,
    moodTags: ["Synthwave", "Editing"],
    order: 10,
  },
];

export const SPOTIFY_RECOMMENDATIONS: SpotifyPlaylist[] = [
  {
    id: "release-radar",
    title: "Release Radar",
    description: "Catch all the latest music from artists you follow, plus new singles picked for you.",
    category: "made-for-you",
    accentColor: "#1DB954",
    coverSrc: SPOTIFY_TRACKS[1].coverSrc,
    trackIds: [
      "the-weeknd-blinding-lights",
      "keshi-beside-you",
      "niki-every-summertime",
      "odesza-a-moment-apart",
    ],
  },
  {
    id: "time-capsule",
    title: "Time Capsule",
    description: "We made you a personalized playlist with songs to take you back in time.",
    category: "made-for-you",
    accentColor: "#CA8A04",
    coverSrc: SPOTIFY_TRACKS[2].coverSrc,
    trackIds: [
      "coldplay-yellow",
      "daft-punk-instant-crush",
      "arctic-monkeys-i-wanna-be-yours",
      "frank-ocean-pink-white",
    ],
  },
  {
    id: "on-repeat",
    title: "On Repeat",
    description: "Songs you love right now — sounds for editing, working, and getting lost somewhere.",
    category: "made-for-you",
    accentColor: "#3B0764",
    coverSrc: SPOTIFY_TRACKS[0].coverSrc,
    trackIds: SPOTIFY_TRACKS.map((t) => t.id),
  },
  {
    id: "discover-weekly",
    title: "Discover Weekly",
    description: "Your weekly mixtape of fresh music. Enjoy new music and deep cuts picked for you.",
    category: "made-for-you",
    accentColor: "#1D4ED8",
    coverSrc: SPOTIFY_TRACKS[8].coverSrc,
    trackIds: [
      "odesza-a-moment-apart",
      "cigarettes-after-sex-apocalypse",
      "joji-slow-dancing-in-the-dark",
      "daft-punk-instant-crush",
    ],
  },
  {
    id: "daily-mix-1",
    title: "Daily Mix 1",
    description: "Joji, Frank Ocean, keshi, Cigarettes After Sex and more.",
    category: "made-for-you",
    accentColor: "#047857",
    coverSrc: SPOTIFY_TRACKS[5].coverSrc,
    trackIds: [
      "joji-slow-dancing-in-the-dark",
      "frank-ocean-pink-white",
      "keshi-beside-you",
      "cigarettes-after-sex-apocalypse",
      "niki-every-summertime",
    ],
  },
];

export const SPOTIFY_PLAYLISTS: SpotifyPlaylist[] = [
  {
    id: "from-a-to-a",
    title: "From A to A",
    description: "The complete 10-track personal rotation from start to finish.",
    category: "playlist",
    accentColor: "#18181B",
    coverSrc: SPOTIFY_TRACKS[3].coverSrc,
    trackIds: SPOTIFY_TRACKS.map((t) => t.id),
  },
  {
    id: "late-night",
    title: "Late Night",
    description: "Slow, atmospheric tracks for quiet midnight drives and late editing sessions.",
    category: "playlist",
    mood: "Late Night",
    accentColor: "#3B0764",
    coverSrc: SPOTIFY_TRACKS[0].coverSrc,
    trackIds: SPOTIFY_TRACKS.filter((t) => t.moodTags.includes("Late Night")).map((t) => t.id),
  },
  {
    id: "indie",
    title: "Indie",
    description: "Guitar-driven and melancholic indie favorites.",
    category: "playlist",
    mood: "Indie",
    accentColor: "#27272A",
    coverSrc: SPOTIFY_TRACKS[4].coverSrc,
    trackIds: SPOTIFY_TRACKS.filter((t) => t.moodTags.includes("Indie")).map((t) => t.id),
  },
  {
    id: "warm",
    title: "Warm",
    description: "Golden-hour melodies and sunlit R&B textures.",
    category: "playlist",
    mood: "Warm",
    accentColor: "#C2410C",
    coverSrc: SPOTIFY_TRACKS[7].coverSrc,
    trackIds: SPOTIFY_TRACKS.filter((t) => t.moodTags.includes("Warm")).map((t) => t.id),
  },
  {
    id: "focus",
    title: "Focus",
    description: "Steady rhythms and expansive instrumentals for deep work.",
    category: "playlist",
    mood: "Focus",
    accentColor: "#1D4ED8",
    coverSrc: SPOTIFY_TRACKS[8].coverSrc,
    trackIds: SPOTIFY_TRACKS.filter((t) => t.moodTags.includes("Focus")).map((t) => t.id),
  },
  {
    id: "editing",
    title: "Editing",
    description: "Crisp grooves and warm pacing for photo and video color grading.",
    category: "playlist",
    mood: "Editing",
    accentColor: "#1E3A8A",
    coverSrc: SPOTIFY_TRACKS[6].coverSrc,
    trackIds: SPOTIFY_TRACKS.filter((t) => t.moodTags.includes("Editing")).map((t) => t.id),
  },
  {
    id: "synthwave",
    title: "Synthwave",
    description: "Neon analog synths and nocturnal momentum.",
    category: "playlist",
    mood: "Synthwave",
    accentColor: "#991B1B",
    coverSrc: SPOTIFY_TRACKS[1].coverSrc,
    trackIds: SPOTIFY_TRACKS.filter((t) => t.moodTags.includes("Synthwave")).map((t) => t.id),
  },
  {
    id: "ambient",
    title: "Ambient",
    description: "Spacious, immersive soundscapes to drift into.",
    category: "playlist",
    mood: "Ambient",
    accentColor: "#44403C",
    coverSrc: SPOTIFY_TRACKS[9].coverSrc,
    trackIds: SPOTIFY_TRACKS.filter((t) => t.moodTags.includes("Ambient")).map((t) => t.id),
  },
];

export const ALL_SPOTIFY_COLLECTIONS: SpotifyPlaylist[] = [
  ...SPOTIFY_RECOMMENDATIONS,
  ...SPOTIFY_PLAYLISTS,
];

export function getTracksByIds(ids: string[]): SpotifyTrack[] {
  const byId = new Map(SPOTIFY_TRACKS.map((t) => [t.id, t]));
  return ids.map((id) => byId.get(id)).filter((t): t is SpotifyTrack => Boolean(t));
}

export function formatDurationMs(ms?: number): string {
  if (!ms || ms <= 0) return "--:--";
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function formatTotalDuration(tracks: SpotifyTrack[]): string {
  const totalMs = tracks.reduce((acc, t) => acc + (t.durationMs || 0), 0);
  if (totalMs <= 0) return "";
  const totalMinutes = Math.round(totalMs / 60000);
  if (totalMinutes < 60) return `${totalMinutes} min`;
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return mins > 0 ? `${hours} hr ${mins} min` : `${hours} hr`;
}
