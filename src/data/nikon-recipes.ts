export interface NikonRecipe {
  id: string;
  name: string;
  creator: string;
  summary: string;
  editorialTags: ("Film" | "Cinematic" | "Vintage" | "Warm" | "Cool" | "B&W")[];
  officialUrl: string;
  sourceUrl: string;
  cameraModels: string[];
  notes: string;
  instructions: string[];
  accentGradient: string;
}

export const NIKON_IMAGING_CLOUD_GALLERY_URL = "https://imagingcloud.nikon.com/recipe/release";

export const NIKON_ZF_SYNC_STEPS = [
  "Open Nikon Imaging Cloud in your browser and sign in with your Nikon ID.",
  "Find the recipe in the Imaging Recipes gallery and select Save to your recipe list.",
  "Connect your Nikon Zf to Nikon Imaging Cloud via Wi-Fi (Network menu → Nikon Imaging Cloud).",
  "Sync Cloud Picture Controls to the camera, then select the recipe under Photo Shooting Menu → Set Picture Control.",
];

export const NIKON_RECIPES: NikonRecipe[] = [
  {
    id: "cine-mood-luizclas",
    name: "Cine Mood",
    creator: "LUIZCLAS",
    summary:
      "A moody, cinema-inspired color profile balancing subdued shadows with expressive skin tones for street and portrait work.",
    editorialTags: ["Cinematic", "Film"],
    officialUrl: NIKON_IMAGING_CLOUD_GALLERY_URL,
    sourceUrl: NIKON_IMAGING_CLOUD_GALLERY_URL,
    cameraModels: ["Nikon Zf (via Nikon Imaging Cloud)", "Nikon Z6III"],
    notes: "Settings available on Nikon Imaging Cloud. Works best in overcast or late-afternoon directional light.",
    instructions: NIKON_ZF_SYNC_STEPS,
    accentGradient: "linear-gradient(135deg, #1E293B 0%, #334155 52%, #7C2D12 100%)",
  },
  {
    id: "sunkissed-cool-julia-nimke",
    name: "Sunkissed Cool",
    creator: "Julia Nimke",
    summary:
      "Pairs sunlit warm highlights with crisp, cool-toned shadows for coastal landscapes and travel storytelling.",
    editorialTags: ["Cool", "Warm", "Film"],
    officialUrl: NIKON_IMAGING_CLOUD_GALLERY_URL,
    sourceUrl: NIKON_IMAGING_CLOUD_GALLERY_URL,
    cameraModels: ["Nikon Zf (via Nikon Imaging Cloud)", "Nikon Z6III"],
    notes: "Settings available on Nikon Imaging Cloud. Ideal for open landscapes and golden-hour coastlines.",
    instructions: NIKON_ZF_SYNC_STEPS,
    accentGradient: "linear-gradient(135deg, #0F4C81 0%, #38BDF8 55%, #F59E0B 100%)",
  },
  {
    id: "at-dusk-noise-woo",
    name: "At Dusk",
    creator: "Noise Woo",
    summary:
      "Designed for blue hour and twilight scenes, emphasizing atmospheric blues and gentle highlight roll-off.",
    editorialTags: ["Cool", "Cinematic"],
    officialUrl: NIKON_IMAGING_CLOUD_GALLERY_URL,
    sourceUrl: NIKON_IMAGING_CLOUD_GALLERY_URL,
    cameraModels: ["Nikon Zf (via Nikon Imaging Cloud)", "Nikon Z6III"],
    notes: "Settings available on Nikon Imaging Cloud. Best used during twilight, city dusk, and neon-lit streets.",
    instructions: NIKON_ZF_SYNC_STEPS,
    accentGradient: "linear-gradient(135deg, #0F172A 0%, #1E3A8A 55%, #6366F1 100%)",
  },
  {
    id: "shades-of-fall-brittany-eliza-kunkel",
    name: "Shades of Fall",
    creator: "Brittany Eliza Kunkel",
    summary:
      "Rich autumnal warmth with earthy browns, amber foliage, and soft vintage contrast.",
    editorialTags: ["Warm", "Vintage"],
    officialUrl: NIKON_IMAGING_CLOUD_GALLERY_URL,
    sourceUrl: NIKON_IMAGING_CLOUD_GALLERY_URL,
    cameraModels: ["Nikon Zf (via Nikon Imaging Cloud)", "Nikon Z6III"],
    notes: "Settings available on Nikon Imaging Cloud. Brings out warm foliage, wood textures, and café interiors.",
    instructions: NIKON_ZF_SYNC_STEPS,
    accentGradient: "linear-gradient(135deg, #78350F 0%, #B45309 55%, #D97706 100%)",
  },
  {
    id: "teal-and-orange-brandon-woelfel",
    name: "Teal and Orange",
    creator: "Brandon Woelfel",
    summary:
      "Classic complementary color separation pushing cool shadows toward teal while keeping highlights and skin tones warm.",
    editorialTags: ["Cinematic", "Cool", "Warm"],
    officialUrl: NIKON_IMAGING_CLOUD_GALLERY_URL,
    sourceUrl: NIKON_IMAGING_CLOUD_GALLERY_URL,
    cameraModels: ["Nikon Zf (via Nikon Imaging Cloud)", "Nikon Z6III"],
    notes: "Settings available on Nikon Imaging Cloud. Great for night portraits and backlit urban scenes.",
    instructions: NIKON_ZF_SYNC_STEPS,
    accentGradient: "linear-gradient(135deg, #0F766E 0%, #14B8A6 48%, #EA580C 100%)",
  },
  {
    id: "bleach-blue-aparupa-dey",
    name: "Bleach Blue",
    creator: "Aparupa Dey",
    summary:
      "Desaturated, bleach-bypass-inspired cool palette with punchy micro-contrast and restrained color saturation.",
    editorialTags: ["Cool", "Film"],
    officialUrl: NIKON_IMAGING_CLOUD_GALLERY_URL,
    sourceUrl: NIKON_IMAGING_CLOUD_GALLERY_URL,
    cameraModels: ["Nikon Zf (via Nikon Imaging Cloud)", "Nikon Z6III"],
    notes: "Settings available on Nikon Imaging Cloud. Strong choice for architecture, rain, and minimalist frames.",
    instructions: NIKON_ZF_SYNC_STEPS,
    accentGradient: "linear-gradient(135deg, #1E293B 0%, #475569 55%, #94A3B8 100%)",
  },
  {
    id: "cinematic-blue-brandon-woelfel",
    name: "Cinematic Blue",
    creator: "Brandon Woelfel",
    summary:
      "Cool, filmic blue cast crafted for atmospheric evening photography and dramatic ambient lighting.",
    editorialTags: ["Cinematic", "Cool"],
    officialUrl: NIKON_IMAGING_CLOUD_GALLERY_URL,
    sourceUrl: NIKON_IMAGING_CLOUD_GALLERY_URL,
    cameraModels: ["Nikon Zf (via Nikon Imaging Cloud)", "Nikon Z6III"],
    notes: "Settings available on Nikon Imaging Cloud. Pairs well with fast prime lenses after sunset.",
    instructions: NIKON_ZF_SYNC_STEPS,
    accentGradient: "linear-gradient(135deg, #172554 0%, #1D4ED8 55%, #38BDF8 100%)",
  },
  {
    id: "painterly-light-dann-boal",
    name: "Painterly Light",
    creator: "D’Ann Boal",
    summary:
      "Soft, luminous tonal curve with gentle warmth and delicate contrast reminiscent of fine-art portraiture.",
    editorialTags: ["Vintage", "Warm", "Film"],
    officialUrl: NIKON_IMAGING_CLOUD_GALLERY_URL,
    sourceUrl: NIKON_IMAGING_CLOUD_GALLERY_URL,
    cameraModels: ["Nikon Zf (via Nikon Imaging Cloud)", "Nikon Z6III"],
    notes: "Settings available on Nikon Imaging Cloud. Shines in soft window light and diffused daylight.",
    instructions: NIKON_ZF_SYNC_STEPS,
    accentGradient: "linear-gradient(135deg, #57534E 0%, #A8A29E 55%, #FDE68A 100%)",
  },
];

export const NIKON_EDITORIAL_TAGS = ["All", "Film", "Cinematic", "Vintage", "Warm", "Cool", "B&W"] as const;
