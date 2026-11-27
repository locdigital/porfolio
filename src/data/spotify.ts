export interface SpotifyTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  coverSrc?: string;
  youtubeVideoId?: string;
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
  "Curated rotation of 17 full-length tracks with integrated playback and direct Spotify links.";

export const SPOTIFY_TRACKS: SpotifyTrack[] = [
  {
    id: "coldplay-yellow",
    title: "Yellow",
    artist: "Coldplay",
    album: "Parachutes",
    coverSrc: "https://image-cdn-fa.spotifycdn.com/image/ab67616d00001e029164bafe9aaa168d93f4816a",
    youtubeVideoId: "yKNxeF4KMsY",
    previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/66/f3/1a/66f31a76-a6ed-cb4c-f353-23310a7ae9a8/mzaf_10593596652344378873.plus.aac.p.m4a",
    accentColor: "#CA8A04",
    spotifyTrackId: "3AJwUDP919kvQ9QcozQPxg",
    spotifyUrl: "https://open.spotify.com/track/3AJwUDP919kvQ9QcozQPxg",
    durationMs: 266773,
    moodTags: ["Warm", "Indie"],
    order: 1,
  },
  {
    id: "ed-sheeran-photograph",
    title: "Photograph",
    artist: "Ed Sheeran",
    album: "x (Wembley Edition)",
    coverSrc: "https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e02036cb2ddc525efe3420f3791",
    youtubeVideoId: "KKQl-pIRQMY",
    previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/11/4f/6a/114f6ad0-165c-1e3c-8fbd-df4707d7ae26/mzaf_12480083080052535279.plus.aac.p.m4a",
    accentColor: "#15803D",
    spotifyTrackId: "3FSPaBp49Clqq2p4zc9dbA",
    spotifyUrl: "https://open.spotify.com/track/3FSPaBp49Clqq2p4zc9dbA",
    durationMs: 258987,
    moodTags: ["Warm", "Late Night"],
    order: 2,
  },
  {
    id: "imagine-dragons-demons",
    title: "Demons",
    artist: "Imagine Dragons",
    album: "Night Visions",
    coverSrc: "https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e02407bd04707c463bbb3410737",
    youtubeVideoId: "pvrkfb1C4tE",
    previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/fc/d4/e8/fcd4e814-39f4-19e8-f421-c2d269698025/mzaf_1039703479531920971.plus.aac.p.m4a",
    accentColor: "#334155",
    spotifyTrackId: "5qaEfEh1AtSdrdrByCP7qR",
    spotifyUrl: "https://open.spotify.com/track/5qaEfEh1AtSdrdrByCP7qR",
    durationMs: 177507,
    moodTags: ["Late Night", "Indie"],
    order: 3,
  },
  {
    id: "maroon-5-payphone",
    title: "Payphone (feat. Wiz Khalifa)",
    artist: "Maroon 5",
    album: "Overexposed",
    coverSrc: "https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e02ce7d499847da02a9cbd1c084",
    youtubeVideoId: "5FlQSQuv_mg",
    previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/ec/64/ef/ec64efe0-aa33-f8da-cf08-cff5a34f169f/mzaf_10418581457151079363.plus.aac.p.m4a",
    accentColor: "#DB2777",
    spotifyTrackId: "4P0osvTXoSYZZC2n8IFH3c",
    spotifyUrl: "https://open.spotify.com/track/4P0osvTXoSYZZC2n8IFH3c",
    durationMs: 231385,
    moodTags: ["Warm", "Editing"],
    order: 4,
  },
  {
    id: "bad-meets-evil-lighters",
    title: "Lighters (feat. Bruno Mars)",
    artist: "Bad Meets Evil",
    album: "Hell: The Sequel",
    coverSrc: "https://image-cdn-fa.spotifycdn.com/image/ab67616d00001e0259a1132f3cab22f80b2d2777",
    youtubeVideoId: "YWt4wmZ_EMI",
    previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/5c/01/cd/5c01cdd4-2fd2-5883-3ced-4d8006b8a1e7/mzaf_14780352889227219491.plus.aac.p.m4a",
    accentColor: "#991B1B",
    spotifyTrackId: "5zpDHEU12zATwLGvozxPw2",
    spotifyUrl: "https://open.spotify.com/track/5zpDHEU12zATwLGvozxPw2",
    durationMs: 303813,
    moodTags: ["Focus", "Late Night"],
    order: 5,
  },
  {
    id: "pachelbel-canon-in-d",
    title: "Canon in D (Piano)",
    artist: "Johann Pachelbel · Kassia",
    album: "Canon in D",
    coverSrc: "https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e02049e386a757dc5f36e0d0683",
    youtubeVideoId: "6jSLH9CDPPQ",
    previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/48/7b/ae/487bae34-ac75-b0fd-5eb9-ba2c85813a16/mzaf_4873999172939252977.plus.aac.p.m4a",
    accentColor: "#1E3A8A",
    spotifyTrackId: "4z975AdWUSskIhqKoVxdrq",
    spotifyUrl: "https://open.spotify.com/track/4z975AdWUSskIhqKoVxdrq",
    durationMs: 171000,
    moodTags: ["Focus", "Ambient"],
    order: 6,
  },
  {
    id: "arctic-monkeys-505",
    title: "505",
    artist: "Arctic Monkeys",
    album: "Favourite Worst Nightmare",
    coverSrc: "https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e02b1f8da74f225fa1225cdface",
    youtubeVideoId: "qU9mHegkTc4",
    previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/d1/0d/ab/d10dabc8-cceb-e718-401f-01516b009460/mzaf_13845311225859403599.plus.aac.p.m4a",
    accentColor: "#3F6212",
    spotifyTrackId: "0BxE4FqsDD1Ot4YuBXwAPp",
    spotifyUrl: "https://open.spotify.com/track/0BxE4FqsDD1Ot4YuBXwAPp",
    durationMs: 253587,
    moodTags: ["Indie", "Late Night"],
    order: 7,
  },
  {
    id: "arctic-monkeys-i-wanna-be-yours",
    title: "I Wanna Be Yours",
    artist: "Arctic Monkeys",
    album: "AM",
    coverSrc: "https://image-cdn-fa.spotifycdn.com/image/ab67616d00001e024ae1c4c5c45aabe565499163",
    youtubeVideoId: "nyuo9-OjNNg",
    previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/8b/0c/df/8b0cdfe6-f619-1ab0-366a-73be84c04dec/mzaf_14055369509528206797.plus.aac.p.m4a",
    accentColor: "#27272A",
    spotifyTrackId: "5XeFesFbtLpXzIVDNQP22n",
    spotifyUrl: "https://open.spotify.com/track/5XeFesFbtLpXzIVDNQP22n",
    durationMs: 183956,
    moodTags: ["Late Night", "Indie"],
    order: 8,
  },
  {
    id: "nelly-just-a-dream",
    title: "Just A Dream",
    artist: "Nelly",
    album: "5.0",
    coverSrc: "https://image-cdn-fa.spotifycdn.com/image/ab67616d00001e02ad198c2dfdaf6b7fdc460df7",
    youtubeVideoId: "N6O2ncUKvlg",
    previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/ad/ef/f3/adeff3b1-8ca7-fe69-4404-d4574be0ed5d/mzaf_4818658649735952743.plus.aac.p.m4a",
    accentColor: "#44403C",
    spotifyTrackId: "3ZdJffjzJWFimSQyxgGIxN",
    spotifyUrl: "https://open.spotify.com/track/3ZdJffjzJWFimSQyxgGIxN",
    durationMs: 237987,
    moodTags: ["Late Night", "Editing"],
    order: 9,
  },
  {
    id: "nelly-dilemma",
    title: "Dilemma (feat. Kelly Rowland)",
    artist: "Nelly",
    album: "Nellyville",
    coverSrc: "https://image-cdn-fa.spotifycdn.com/image/ab67616d00001e02a8b9f97b9ea065b9a857e93f",
    youtubeVideoId: "WwJm5hnWv6E",
    previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/09/fb/c9/09fbc90d-0900-3164-bd6b-dcb3aff01238/mzaf_1722221375269571338.plus.aac.p.m4a",
    accentColor: "#92400E",
    spotifyTrackId: "0ARK753YaiJbpLUk7z5yIM",
    spotifyUrl: "https://open.spotify.com/track/0ARK753YaiJbpLUk7z5yIM",
    durationMs: 289067,
    moodTags: ["Warm", "Late Night"],
    order: 10,
  },
  {
    id: "pink-just-give-me-a-reason",
    title: "Just Give Me a Reason (feat. Nate Ruess)",
    artist: "P!nk",
    album: "The Truth About Love",
    coverSrc: "https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e0224a1ac503b55e6eef9a7bb8c",
    youtubeVideoId: "OpQFFLBMEPI",
    previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/6b/98/87/6b98879c-5091-bcaa-24c9-07c69252db8c/mzaf_12123656044443906655.plus.aac.p.m4a",
    accentColor: "#BE123C",
    spotifyTrackId: "1mKXFLRA179hdOWQBwUk9e",
    spotifyUrl: "https://open.spotify.com/track/1mKXFLRA179hdOWQBwUk9e",
    durationMs: 242721,
    moodTags: ["Warm", "Ambient"],
    order: 11,
  },
  {
    id: "avicii-waiting-for-love",
    title: "Waiting For Love",
    artist: "Avicii",
    album: "Stories",
    coverSrc: "https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e025393c5d3cac806092a9bc468",
    youtubeVideoId: "-ncIVUXZla8",
    previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/c0/69/ab/c069ab0f-1f89-8636-8579-2e5df6e62a68/mzaf_16059040705385155103.plus.aac.p.m4a",
    accentColor: "#0284C7",
    spotifyTrackId: "2P4OICZRVAQcYAV2JReRfj",
    spotifyUrl: "https://open.spotify.com/track/2P4OICZRVAQcYAV2JReRfj",
    durationMs: 230614,
    moodTags: ["Synthwave", "Editing"],
    order: 12,
  },
  {
    id: "lukas-graham-7-years",
    title: "7 Years",
    artist: "Lukas Graham",
    album: "Lukas Graham",
    coverSrc: "https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e022d94d0f04e9a58d1654b760b",
    youtubeVideoId: "LHCob76kigA",
    previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/15/71/af/1571af0b-19e7-00a2-452d-8c146b88bab3/mzaf_1010696746274902629.plus.aac.p.m4a",
    accentColor: "#52525B",
    spotifyTrackId: "5kqIPrATaCc2LqxVWzQGbk",
    spotifyUrl: "https://open.spotify.com/track/5kqIPrATaCc2LqxVWzQGbk",
    durationMs: 237300,
    moodTags: ["Warm", "Focus"],
    order: 13,
  },
  {
    id: "eminem-not-afraid",
    title: "Not Afraid",
    artist: "Eminem",
    album: "Recovery",
    coverSrc: "https://image-cdn-fa.spotifycdn.com/image/ab67616d00001e02c08d5fa5c0f1a834acef5100",
    youtubeVideoId: "j5-yKhDd64s",
    previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/b6/21/78/b621784d-2e8c-66a7-faa0-82ab4c710cf8/mzaf_14978944816671452874.plus.aac.p.m4a",
    accentColor: "#18181B",
    spotifyTrackId: "7Ie9W94M7OjPoZVV216Xus",
    spotifyUrl: "https://open.spotify.com/track/7Ie9W94M7OjPoZVV216Xus",
    durationMs: 248133,
    moodTags: ["Focus", "Editing"],
    order: 14,
  },
  {
    id: "gym-class-heroes-stereo-hearts",
    title: "Stereo Hearts (feat. Adam Levine)",
    artist: "Gym Class Heroes",
    album: "The Papercut Chronicles II",
    coverSrc: "https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e0218b8088fe0c3dbf78398b55a",
    youtubeVideoId: "T3E9Wjbq44E",
    previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/8c/71/37/8c7137c7-c4d6-45e6-367a-312a7c69783c/mzaf_13157621948290062056.plus.aac.p.m4a",
    accentColor: "#C2410C",
    spotifyTrackId: "0qOnSQQF0yzuPWsXrQ9paz",
    spotifyUrl: "https://open.spotify.com/track/0qOnSQQF0yzuPWsXrQ9paz",
    durationMs: 210960,
    moodTags: ["Editing", "Warm"],
    order: 15,
  },
  {
    id: "one-direction-what-makes-you-beautiful",
    title: "What Makes You Beautiful",
    artist: "One Direction",
    album: "Up All Night",
    coverSrc: "https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e024a5584795dc73860653a9a3e",
    youtubeVideoId: "VpnuubCJjCU",
    previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/c4/a6/fa/c4a6fa2b-710c-4eee-c32d-583ae013d99d/mzaf_9620667473679053888.plus.aac.p.m4a",
    accentColor: "#1D4ED8",
    spotifyTrackId: "4cluDES4hQEUhmXj6TXkSo",
    spotifyUrl: "https://open.spotify.com/track/4cluDES4hQEUhmXj6TXkSo",
    durationMs: 199133,
    moodTags: ["Warm", "Synthwave"],
    order: 16,
  },
  {
    id: "coldplay-hymn-for-the-weekend",
    title: "Hymn for the Weekend",
    artist: "Coldplay",
    album: "A Head Full of Dreams",
    coverSrc: "https://image-cdn-fa.spotifycdn.com/image/ab67616d00001e028ff7c3580d429c8212b9a3b6",
    youtubeVideoId: "YykjpeuMNEk",
    previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/88/ea/e5/88eae5a0-e6b7-f7bf-c764-3264fa64041f/mzaf_7367784822013036863.plus.aac.p.m4a",
    accentColor: "#7E22CE",
    spotifyTrackId: "3RiPr603aXAoi4GHyXx0uy",
    spotifyUrl: "https://open.spotify.com/track/3RiPr603aXAoi4GHyXx0uy",
    durationMs: 258827,
    moodTags: ["Synthwave", "Ambient"],
    order: 17,
  },
];

export const SPOTIFY_RECOMMENDATIONS: SpotifyPlaylist[] = [
  {
    id: "release-radar",
    title: "Release Radar",
    description: "Anthems and high-energy picks for creative momentum.",
    category: "made-for-you",
    accentColor: "#1DB954",
    coverSrc: SPOTIFY_TRACKS[11].coverSrc,
    trackIds: [
      "avicii-waiting-for-love",
      "coldplay-hymn-for-the-weekend",
      "gym-class-heroes-stereo-hearts",
      "one-direction-what-makes-you-beautiful",
    ],
  },
  {
    id: "time-capsule",
    title: "Time Capsule",
    description: "We made you a personalized playlist with timeless classics to take you back in time.",
    category: "made-for-you",
    accentColor: "#CA8A04",
    coverSrc: SPOTIFY_TRACKS[0].coverSrc,
    trackIds: [
      "coldplay-yellow",
      "ed-sheeran-photograph",
      "nelly-dilemma",
      "lukas-graham-7-years",
      "pink-just-give-me-a-reason",
    ],
  },
  {
    id: "on-repeat",
    title: "On Repeat",
    description: "Songs you love right now — sounds for editing, working, and getting lost somewhere.",
    category: "made-for-you",
    accentColor: "#3B0764",
    coverSrc: SPOTIFY_TRACKS[6].coverSrc,
    trackIds: SPOTIFY_TRACKS.map((t) => t.id),
  },
  {
    id: "discover-weekly",
    title: "Discover Weekly",
    description: "Late-night indie guitars, piano acoustics, and nostalgic throwbacks.",
    category: "made-for-you",
    accentColor: "#1D4ED8",
    coverSrc: SPOTIFY_TRACKS[7].coverSrc,
    trackIds: [
      "arctic-monkeys-505",
      "arctic-monkeys-i-wanna-be-yours",
      "imagine-dragons-demons",
      "pachelbel-canon-in-d",
    ],
  },
  {
    id: "daily-mix-1",
    title: "Daily Mix 1",
    description: "Coldplay, Ed Sheeran, Arctic Monkeys, Avicii, Eminem and more.",
    category: "made-for-you",
    accentColor: "#047857",
    coverSrc: SPOTIFY_TRACKS[1].coverSrc,
    trackIds: [
      "coldplay-yellow",
      "ed-sheeran-photograph",
      "maroon-5-payphone",
      "bad-meets-evil-lighters",
      "eminem-not-afraid",
      "nelly-just-a-dream",
    ],
  },
];

export const SPOTIFY_PLAYLISTS: SpotifyPlaylist[] = [
  {
    id: "from-a-to-a",
    title: "From A to A",
    description: "The complete 17-track personal rotation from start to finish.",
    category: "playlist",
    accentColor: "#18181B",
    coverSrc: SPOTIFY_TRACKS[0].coverSrc,
    trackIds: SPOTIFY_TRACKS.map((t) => t.id),
  },
  {
    id: "late-night",
    title: "Late Night",
    description: "Slow, atmospheric tracks for quiet midnight drives and late editing sessions.",
    category: "playlist",
    mood: "Late Night",
    accentColor: "#3B0764",
    coverSrc: SPOTIFY_TRACKS[7].coverSrc,
    trackIds: SPOTIFY_TRACKS.filter((t) => t.moodTags.includes("Late Night")).map((t) => t.id),
  },
  {
    id: "indie",
    title: "Indie",
    description: "Guitar-driven and melancholic indie favorites.",
    category: "playlist",
    mood: "Indie",
    accentColor: "#27272A",
    coverSrc: SPOTIFY_TRACKS[6].coverSrc,
    trackIds: SPOTIFY_TRACKS.filter((t) => t.moodTags.includes("Indie")).map((t) => t.id),
  },
  {
    id: "warm",
    title: "Warm",
    description: "Golden-hour melodies and timeless pop ballads.",
    category: "playlist",
    mood: "Warm",
    accentColor: "#C2410C",
    coverSrc: SPOTIFY_TRACKS[1].coverSrc,
    trackIds: SPOTIFY_TRACKS.filter((t) => t.moodTags.includes("Warm")).map((t) => t.id),
  },
  {
    id: "focus",
    title: "Focus",
    description: "Steady rhythms, piano classics, and driving beats for deep work.",
    category: "playlist",
    mood: "Focus",
    accentColor: "#1D4ED8",
    coverSrc: SPOTIFY_TRACKS[5].coverSrc,
    trackIds: SPOTIFY_TRACKS.filter((t) => t.moodTags.includes("Focus")).map((t) => t.id),
  },
  {
    id: "editing",
    title: "Editing",
    description: "Crisp grooves and warm pacing for photo and video color grading.",
    category: "playlist",
    mood: "Editing",
    accentColor: "#1E3A8A",
    coverSrc: SPOTIFY_TRACKS[14].coverSrc,
    trackIds: SPOTIFY_TRACKS.filter((t) => t.moodTags.includes("Editing")).map((t) => t.id),
  },
  {
    id: "synthwave",
    title: "Synthwave",
    description: "Festival euphoria and luminous nocturnal momentum.",
    category: "playlist",
    mood: "Synthwave",
    accentColor: "#991B1B",
    coverSrc: SPOTIFY_TRACKS[11].coverSrc,
    trackIds: SPOTIFY_TRACKS.filter((t) => t.moodTags.includes("Synthwave")).map((t) => t.id),
  },
  {
    id: "ambient",
    title: "Ambient",
    description: "Spacious, melodic soundscapes to drift into.",
    category: "playlist",
    mood: "Ambient",
    accentColor: "#44403C",
    coverSrc: SPOTIFY_TRACKS[16].coverSrc,
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
