export interface NetflixMovie {
  id: string;
  slug: string;
  title: string;
  year: number;
  genres: string[];
  synopsis: string;
  posterSrc?: string;
  backdropSrc?: string;
  previewVideoUrl?: string;
  accentColor: string;
  netflixUrl: string;
  featured?: boolean;
  sortOrder: number;
}

export const NETFLIX_CURATED_NOTE =
  "Personal curated collection of 14 favorite movies & anime. Availability varies by region; links open directly on Netflix.";

export const NETFLIX_MOVIES: NetflixMovie[] = [
  {
    id: "spider-man-across-the-spider-verse",
    slug: "spider-man",
    title: "Spider-Man: Across the Spider-Verse",
    year: 2023,
    genres: ["Action", "Anime", "Fantasy"],
    synopsis:
      "Miles Morales catapults across the Multiverse, where he encounters a team of Spider-People charged with protecting its very existence.",
    posterSrc: "/images/netflix/spider-man-poster.webp",
    backdropSrc: "/images/netflix/spider-man-backdrop.webp",
    previewVideoUrl: "https://video-ssl.itunes.apple.com/itunes-assets/Video126/v4/24/ca/41/24ca41ac-d116-30da-b0d4-6c02477b6094/mzvf_3996586131801090583.640x354.h264lc.U.p.m4v",
    accentColor: "#DC2626",
    netflixUrl: "https://www.netflix.com/title/81594921",
    featured: true,
    sortOrder: 1,
  },
  {
    id: "naruto-shippuden",
    slug: "naruto",
    title: "Naruto Shippuden",
    year: 2007,
    genres: ["Anime", "Action"],
    synopsis:
      "Returning to the Hidden Leaf Village after years of intense training, Naruto Uzumaki faces the Akatsuki threat while fighting to bring Sasuke home.",
    posterSrc: "/images/netflix/naruto-poster.webp",
    backdropSrc: "/images/netflix/naruto-backdrop.webp",
    previewVideoUrl: "https://video-ssl.itunes.apple.com/itunes-assets/Video122/v4/0e/f9/c6/0ef9c647-d724-3184-f0cd-0af0b86bca3e/mzvf_2703450307036493216.640x460.h264lc.U.p.m4v",
    accentColor: "#EA580C",
    netflixUrl: "https://www.netflix.com/title/80000603",
    featured: true,
    sortOrder: 2,
  },
  {
    id: "dragon-ball-z",
    slug: "dragon-ball",
    title: "Dragon Ball Z",
    year: 1989,
    genres: ["Anime", "Action"],
    synopsis:
      "Goku and the Z Fighters defend Earth against intergalactic conquerors, androids, and cosmic forces in legendary martial arts battles.",
    posterSrc: "/images/netflix/dragon-ball-poster.webp",
    backdropSrc: "/images/netflix/dragon-ball-backdrop.webp",
    previewVideoUrl: "https://video-ssl.itunes.apple.com/itunes-assets/Video221/v4/75/7b/58/757b5832-b9a1-30fe-e389-464ee46b24f1/mzvf_6982266897239123526.640x480.h264lc.U.p.m4v",
    accentColor: "#D97706",
    netflixUrl: "https://www.netflix.com/title/80090379",
    sortOrder: 3,
  },
  {
    id: "doraemon",
    slug: "doraemon",
    title: "Stand by Me Doraemon",
    year: 2014,
    genres: ["Anime", "Family"],
    synopsis:
      "Sent back from the 22nd century, robotic cat Doraemon uses futuristic gadgets to help clumsy Nobita build a happier future.",
    posterSrc: "/images/netflix/doraemon-poster.webp",
    backdropSrc: "/images/netflix/doraemon-backdrop.webp",
    accentColor: "#0284C7",
    netflixUrl: "https://www.netflix.com/title/80107084",
    sortOrder: 4,
  },
  {
    id: "money-heist",
    slug: "phi-vu-trieu-do",
    title: "Money Heist (Phi Vụ Triệu Đô)",
    year: 2017,
    genres: ["Thriller", "Drama"],
    synopsis:
      "A criminal mastermind known as The Professor recruits eight specialists to carry out the most ambitious heist in history at the Royal Mint of Spain.",
    posterSrc: "/images/netflix/phi-vu-trieu-do-poster.webp",
    backdropSrc: "/images/netflix/phi-vu-trieu-do-backdrop.webp",
    accentColor: "#B91C1C",
    netflixUrl: "https://www.netflix.com/title/80192098",
    featured: true,
    sortOrder: 5,
  },
  {
    id: "lupin",
    slug: "lupin",
    title: "Lupin",
    year: 2021,
    genres: ["Thriller", "Drama"],
    synopsis:
      "Inspired by the adventures of Arsène Lupin, gentleman thief Assane Diop sets out to avenge his father for an injustice inflicted by a wealthy family.",
    posterSrc: "/images/netflix/lupin-poster.webp",
    backdropSrc: "/images/netflix/lupin-backdrop.webp",
    previewVideoUrl: "https://video-ssl.itunes.apple.com/itunes-assets/Video128/v4/9e/d2/b1/9ed2b168-9925-40dd-98ea-aa443eb07e05/mzvf_1740101250844944846.640x478.h264lc.U.p.m4v",
    accentColor: "#1E3A8A",
    netflixUrl: "https://www.netflix.com/title/80994082",
    sortOrder: 6,
  },
  {
    id: "the-godfather",
    slug: "the-godfather",
    title: "The Godfather",
    year: 1972,
    genres: ["Drama", "Thriller"],
    synopsis:
      "The aging patriarch of an organized crime dynasty transfers control of his clandestine empire to his reluctant youngest son, Michael Corleone.",
    posterSrc: "/images/netflix/the-godfather-poster.webp",
    backdropSrc: "/images/netflix/the-godfather-backdrop.webp",
    previewVideoUrl: "https://video-ssl.itunes.apple.com/itunes-assets/Video221/v4/c5/b3/b0/c5b3b08d-f79e-ef0d-bb74-26c5cd91d48e/mzvf_15922986638708453587.640x480.h264lc.U.p.m4v",
    accentColor: "#27272A",
    netflixUrl: "https://www.netflix.com/title/60011152",
    featured: true,
    sortOrder: 7,
  },
  {
    id: "harry-potter",
    slug: "harry-potter",
    title: "Harry Potter and the Sorcerer's Stone",
    year: 2001,
    genres: ["Fantasy", "Family"],
    synopsis:
      "On his eleventh birthday, Harry Potter discovers he is a wizard and enters Hogwarts School of Witchcraft and Wizardry, where his destiny awaits.",
    posterSrc: "/images/netflix/harry-potter-poster.webp",
    backdropSrc: "/images/netflix/harry-potter-backdrop.webp",
    previewVideoUrl: "https://video-ssl.itunes.apple.com/itunes-assets/Video211/v4/55/db/3c/55db3c38-3530-3c17-e00b-43cf471b5749/mzvf_18347197418231943757.640x480.h264lc.U.p.m4v",
    accentColor: "#7C2D12",
    netflixUrl: "https://www.netflix.com/title/60004478",
    sortOrder: 8,
  },
  {
    id: "lord-of-the-rings",
    slug: "the-lord-of-the-rings",
    title: "The Lord of the Rings: The Fellowship of the Ring",
    year: 2001,
    genres: ["Fantasy", "Action"],
    synopsis:
      "A meek Hobbit from the Shire and eight companions set out on a perilous journey to destroy the powerful One Ring and save Middle-earth.",
    posterSrc: "/images/netflix/the-lord-of-the-rings-poster.webp",
    backdropSrc: "/images/netflix/the-lord-of-the-rings-backdrop.webp",
    previewVideoUrl: "https://video-ssl.itunes.apple.com/itunes-assets/Video124/v4/ba/ee/fc/baeefcf8-3d05-402f-ac0e-4cfea258eca1/mzvf_10336969707014459496.640x356.h264lc.U.p.m4v",
    accentColor: "#3F6212",
    netflixUrl: "https://www.netflix.com/title/60004480",
    sortOrder: 9,
  },
  {
    id: "spirited-away",
    slug: "vung-dat-linh-hon",
    title: "Spirited Away (Vùng Đất Linh Hồn)",
    year: 2001,
    genres: ["Anime", "Fantasy", "Family"],
    synopsis:
      "Ten-year-old Chihiro wanders into a world ruled by gods, witches, and spirits, and must find the courage to free herself and her parents.",
    posterSrc: "/images/netflix/vung-dat-linh-hon-poster.webp",
    backdropSrc: "/images/netflix/vung-dat-linh-hon-backdrop.webp",
    previewVideoUrl: "https://video-ssl.itunes.apple.com/itunes-assets/Video126/v4/0c/61/9c/0c619c4f-80ec-07dd-f8df-005e0da4b8d7/mzvf_8594323490076204203.640x478.h264lc.U.p.m4v",
    accentColor: "#0F766E",
    netflixUrl: "https://www.netflix.com/title/60023642",
    featured: true,
    sortOrder: 10,
  },
  {
    id: "toy-story",
    slug: "toy-story",
    title: "Toy Story",
    year: 1995,
    genres: ["Family", "Fantasy"],
    synopsis:
      "A cowboy doll named Woody is profoundly threatened when a new spaceman action figure, Buzz Lightyear, arrives as Andy's favorite toy.",
    posterSrc: "/images/netflix/toy-story-poster.webp",
    backdropSrc: "/images/netflix/toy-story-backdrop.webp",
    previewVideoUrl: "https://video-ssl.itunes.apple.com/itunes-assets/Video116/v4/16/ad/f2/16adf294-cf2e-661a-717c-614ff5fb695e/mzvf_2705353872111740068.640x480.h264lc.U.p.m4v",
    accentColor: "#2563EB",
    netflixUrl: "https://www.netflix.com/title/60036638",
    sortOrder: 11,
  },
  {
    id: "yu-gi-oh",
    slug: "yu-gi-oh",
    title: "Yu-Gi-Oh!",
    year: 2000,
    genres: ["Anime", "Fantasy"],
    synopsis:
      "After solving the ancient Millennium Puzzle, Yugi Muto awakens the spirit of a Pharaoh and competes in high-stakes Duel Monsters tournaments.",
    posterSrc: "/images/netflix/yu-gi-oh-poster.webp",
    backdropSrc: "/images/netflix/yu-gi-oh-backdrop.webp",
    previewVideoUrl: "https://video-ssl.itunes.apple.com/itunes-assets/Video117/v4/29/b7/de/29b7decd-2b25-b7ce-e53a-102ed13a88c5/mzvf_8243464913636640920.640x480.h264lc.U.p.m4v",
    accentColor: "#6D28D9",
    netflixUrl: "https://www.netflix.com/title/70177034",
    sortOrder: 12,
  },
  {
    id: "death-note",
    slug: "death-note",
    title: "Death Note",
    year: 2006,
    genres: ["Anime", "Thriller"],
    synopsis:
      "A brilliant high school student discovers a supernatural notebook that kills anyone whose name is written in it, sparking a cat-and-mouse battle with detective L.",
    posterSrc: "/images/netflix/death-note-poster.webp",
    backdropSrc: "/images/netflix/death-note-backdrop.webp",
    previewVideoUrl: "https://video-ssl.itunes.apple.com/itunes-assets/Video126/v4/7a/3e/ca/7a3eca81-ad1d-cc48-3c84-9a650a6385d2/mzvf_1207436587896775398.640x478.h264lc.U.p.m4v",
    accentColor: "#18181B",
    netflixUrl: "https://www.netflix.com/title/70204970",
    sortOrder: 13,
  },
  {
    id: "fairy-tail",
    slug: "fairy-tail",
    title: "Fairy Tail",
    year: 2009,
    genres: ["Anime", "Fantasy", "Action"],
    synopsis:
      "Celestial wizard Lucy Heartfilia joins the notorious Fairy Tail guild and teams up with fire dragon slayer Natsu Dragneel on magical quests.",
    posterSrc: "/images/netflix/fairy-tail-poster.webp",
    backdropSrc: "/images/netflix/fairy-tail-backdrop.webp",
    accentColor: "#E11D48",
    netflixUrl: "https://www.netflix.com/title/70266998",
    sortOrder: 14,
  },
];

export const NETFLIX_GENRES = ["All", "Anime", "Action", "Fantasy", "Thriller", "Drama", "Family"] as const;
