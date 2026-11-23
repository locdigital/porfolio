export interface NetflixMovie {
  id: string;
  slug: string;
  title: string;
  year: number;
  genres: string[];
  synopsis: string;
  posterSrc?: string;
  backdropSrc?: string;
  accentColor: string;
  netflixUrl: string;
  featured?: boolean;
  sortOrder: number;
}

export const NETFLIX_CURATED_NOTE =
  "Curated demo collection of 10 Netflix films. Availability varies by region; links open directly on Netflix.";

export const NETFLIX_MOVIES: NetflixMovie[] = [
  {
    id: "extraction-2020",
    slug: "extraction",
    title: "Extraction",
    year: 2020,
    genres: ["Action", "Thriller"],
    synopsis:
      "A hardened mercenary's mission to rescue the kidnapped son of an imprisoned international crime lord turns into a relentless race for survival across Dhaka.",
    posterSrc: "/images/netflix/extraction-poster.webp",
    backdropSrc: "/images/netflix/extraction-backdrop.webp",
    accentColor: "#B45309",
    netflixUrl: "https://www.netflix.com/title/80230399",
    featured: true,
    sortOrder: 1,
  },
  {
    id: "extraction-2-2023",
    slug: "extraction-2",
    title: "Extraction 2",
    year: 2023,
    genres: ["Action", "Thriller"],
    synopsis:
      "Back from the brink of death, commando Tyler Rake embarks on a dangerous mission to extract a ruthless Georgian gangster's battered family from prison.",
    posterSrc: "/images/netflix/extraction-2-poster.webp",
    backdropSrc: "/images/netflix/extraction-2-backdrop.webp",
    accentColor: "#9A3412",
    netflixUrl: "https://www.netflix.com/title/81098494",
    sortOrder: 2,
  },
  {
    id: "the-adam-project-2022",
    slug: "the-adam-project",
    title: "The Adam Project",
    year: 2022,
    genres: ["Sci-Fi", "Action"],
    synopsis:
      "After accidentally crash-landing in 2022, time-traveling fighter pilot Adam Reed teams up with his 12-year-old self to save the future.",
    posterSrc: "/images/netflix/the-adam-project-poster.webp",
    backdropSrc: "/images/netflix/the-adam-project-backdrop.webp",
    accentColor: "#1D4ED8",
    netflixUrl: "https://www.netflix.com/title/81309354",
    sortOrder: 3,
  },
  {
    id: "glass-onion-2022",
    slug: "glass-onion",
    title: "Glass Onion: A Knives Out Mystery",
    year: 2022,
    genres: ["Mystery", "Drama"],
    synopsis:
      "World-famous detective Benoit Blanc heads to a private Greek island to peel back the layers of a murder mystery surrounding a tech billionaire and his eclectic guests.",
    posterSrc: "/images/netflix/glass-onion-poster.webp",
    backdropSrc: "/images/netflix/glass-onion-backdrop.webp",
    accentColor: "#0369A1",
    netflixUrl: "https://www.netflix.com/title/81458416",
    sortOrder: 4,
  },
  {
    id: "the-gray-man-2022",
    slug: "the-gray-man",
    title: "The Gray Man",
    year: 2022,
    genres: ["Action", "Thriller"],
    synopsis:
      "When a shadowy CIA agent uncovers damning agency secrets, he is hunted across the globe by a sociopathic rogue operative who puts a bounty on his head.",
    posterSrc: "/images/netflix/the-gray-man-poster.webp",
    backdropSrc: "/images/netflix/the-gray-man-backdrop.webp",
    accentColor: "#334155",
    netflixUrl: "https://www.netflix.com/title/81160697",
    sortOrder: 5,
  },
  {
    id: "the-killer-2023",
    slug: "the-killer",
    title: "The Killer",
    year: 2023,
    genres: ["Thriller", "Drama"],
    synopsis:
      "After a fateful near-miss in Paris, a methodical assassin battles his employers — and himself — on an international manhunt he insists isn't personal.",
    posterSrc: "/images/netflix/the-killer-poster.webp",
    backdropSrc: "/images/netflix/the-killer-backdrop.webp",
    accentColor: "#18181B",
    netflixUrl: "https://www.netflix.com/title/80234448",
    sortOrder: 6,
  },
  {
    id: "bird-box-2018",
    slug: "bird-box",
    title: "Bird Box",
    year: 2018,
    genres: ["Sci-Fi", "Thriller"],
    synopsis:
      "Five years after an ominous unseen presence drives most of society to despair, a survivor and her two children make a desperate bid to reach safety blindfolded.",
    posterSrc: "/images/netflix/bird-box-poster.webp",
    backdropSrc: "/images/netflix/bird-box-backdrop.webp",
    accentColor: "#3F6212",
    netflixUrl: "https://www.netflix.com/title/80196789",
    sortOrder: 7,
  },
  {
    id: "dont-look-up-2021",
    slug: "dont-look-up",
    title: "Don't Look Up",
    year: 2021,
    genres: ["Sci-Fi", "Drama"],
    synopsis:
      "Two low-level astronomers go on a giant media tour to warn an indifferent world about an approaching comet that will destroy planet Earth.",
    posterSrc: "/images/netflix/dont-look-up-poster.webp",
    backdropSrc: "/images/netflix/dont-look-up-backdrop.webp",
    accentColor: "#7C2D12",
    netflixUrl: "https://www.netflix.com/title/81252357",
    sortOrder: 8,
  },
  {
    id: "enola-holmes-2020",
    slug: "enola-holmes",
    title: "Enola Holmes",
    year: 2020,
    genres: ["Mystery", "Drama"],
    synopsis:
      "While searching for her missing mother, intrepid teen Enola Holmes uses her sleuthing skills to outsmart big brother Sherlock and help a runaway lord.",
    posterSrc: "/images/netflix/enola-holmes-poster.webp",
    backdropSrc: "/images/netflix/enola-holmes-backdrop.webp",
    accentColor: "#9F1239",
    netflixUrl: "https://www.netflix.com/title/81277950",
    sortOrder: 9,
  },
  {
    id: "6-underground-2019",
    slug: "6-underground",
    title: "6 Underground",
    year: 2019,
    genres: ["Action", "Thriller"],
    synopsis:
      "After faking his death, a tech billionaire recruits a team of international operatives for a bold and bloody mission to take down a brutal dictator.",
    posterSrc: "/images/netflix/6-underground-poster.webp",
    backdropSrc: "/images/netflix/6-underground-backdrop.webp",
    accentColor: "#0F766E",
    netflixUrl: "https://www.netflix.com/title/81001887",
    sortOrder: 10,
  },
];

export const NETFLIX_GENRES = ["All", "Action", "Sci-Fi", "Thriller", "Drama", "Mystery"] as const;
