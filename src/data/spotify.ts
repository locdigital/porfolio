export interface SpotifyTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  coverSrc?: string;
  accentColor: string;
  spotifyUrl: string;
  spotifyTrackId: string;
  durationMs: number;
  moodTags: string[];
  order: number;
}

export const SPOTIFY_CURATED_NOTE =
  "Curated demo rotation of 10 tracks. Playback uses the official Spotify Embed player when available, or opens directly in Spotify.";

export const SPOTIFY_TRACKS: SpotifyTrack[] = [
  {
    id: "joji-slow-dancing-in-the-dark",
    title: "SLOW DANCING IN THE DARK",
    artist: "Joji",
    album: "BALLADS 1",
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
    accentColor: "#44403C",
    spotifyTrackId: "2cGxRwrMyEAp8dEbuZaVv6",
    spotifyUrl: "https://open.spotify.com/track/2cGxRwrMyEAp8dEbuZaVv6",
    durationMs: 337560,
    moodTags: ["Synthwave", "Editing"],
    order: 10,
  },
];

export function formatDurationMs(ms?: number): string {
  if (!ms || ms <= 0) return "--:--";
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
