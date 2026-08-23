import { getCollection } from "astro:content";

export type ProjectData = {
  slug: string;
  order: number;
  number: string;
  title: string;
  client: string;
  year: string;
  role: string;
  summary: string;
  description: string;
  tools: string[];
  skills: string[];
  coverImage?: string;
  images: string[];
  link?: string;
  linkLabel?: string;
  caseStudyLink?: string;
  password?: string;
};

export type PhotoLocationData = {
  slug: string;
  order: number;
  type?: "hotel" | "restaurant" | "cafe" | "check-in";
  location: string;
  name?: string;
  city?: string;
  district?: string;
  country?: string;
  province?: string;
  region?: string;
  headline: string;
  subheadline?: string;
  introduction?: string;
  shortDescription?: string;
  description?: string;
  longDescription?: string;
  travelFrom?: string;
  travelTime?: string;
  recommendedStay?: string;
  bestMonths?: string;
  budgetMin?: number;
  budgetMax?: number;
  budgetNote?: string;
  transportation?: string[];
  suitableFor?: string[];
  overview?: string;
  favoriteThings?: string;
  whatIWouldDoAgain?: string;
  editorialReview?: string;
  personalRating?: number;
  wouldReturn?: "definitely" | "maybe" | "unsure" | "no";
  scores?: {
    scenery?: number;
    food?: number;
    cafe?: number;
    relaxation?: number;
    value?: number;
    accessibility?: number;
  };
  bestTimeOfDay?: string[];
  localTransport?: string[];
  weatherNote?: string;
  crowdLevel?: "quiet" | "moderate" | "busy_weekends" | "very_busy";
  travelDifficulty?: "very_easy" | "easy" | "moderate" | "requires_preparation";
  travelTips?: string[];
  notFor?: string[];
  heroImage?: {
    id?: string;
    src: string;
    alt: string;
    width?: number;
    height?: number;
    caption?: string;
    order?: number;
    isCover?: boolean;
  };
  images: {
    id?: string;
    src: string;
    alt: string;
    width?: number;
    height?: number;
    caption?: string;
    order?: number;
    isCover?: boolean;
  }[];
  googleMapsUrl?: string;
  latitude?: string;
  longitude?: string;
  openingHours?: string;
  priceRange?: string;
  website?: string;
  phone?: string;
  bookingUrl?: string;
  instagram?: string;
  tags?: string[];
  featured?: boolean;
  published?: boolean;
  seoTitle?: string;
  seoDescription?: string;
  seoImage?: string;
  relatedLocations?: { slug: string; distance?: string; category?: string }[];
  relatedArticles?: { slug: string; title?: string }[];
  amenities?: string[];
  roomTypes?: string[];
  checkInTime?: string;
  checkOutTime?: string;
  breakfastIncluded?: boolean;
  parking?: boolean;
  petFriendly?: boolean;
  pricePerNight?: string;
  bookingLinks?: string[];
  cuisine?: string;
  menuImages?: {
    src: string;
    alt: string;
    width?: number;
    height?: number;
    caption?: string;
  }[];
  mustTryDishes?: string[];
  averagePrice?: string;
  reservationRequired?: boolean;
  delivery?: boolean;
  outdoorSeating?: boolean;
  coffeeType?: string;
  workingFriendly?: boolean;
  powerOutlets?: boolean;
  wifi?: boolean;
  viewRating?: string;
  indoor?: boolean;
  outdoor?: boolean;
  openingStyle?: string;
  entranceFee?: string;
  bestTime?: string;
  sunrise?: boolean;
  sunset?: boolean;
  walkingTime?: string;
  difficulty?: string;
  droneAllowed?: boolean;
  thingsToKnow?: string;
  blocks?: {
    id: string;
    type: string;
    enabled: boolean;
    title: string;
    content?: string;
  }[];
};

export type GearData = {
  title: string;
  headline: string;
  description: string;
  sections: {
    title: string;
    slug: string;
    headline?: string;
    description: string;
    image?: string;
    items: {
      name: string;
      slug: string;
      headline: string;
      description: string;
      image?: string;
      url?: string;
      tag?: string;
    }[];
  }[];
};

export async function getProjects() {
  const entries = await getCollection("projects");
  return entries
    .map((entry) => ({
      ...entry.data,
      tags: [...entry.data.tools, ...entry.data.skills],
    }))
    .sort((a, b) => a.order - b.order);
}

export async function getPhotoLocations() {
  const mapPhotoLocation = (data: PhotoLocationData) => {
    const sortedImages = [...(data.images ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const heroImage = data.heroImage ?? sortedImages.find((image) => image.isCover) ?? sortedImages[0];
    const name = data.name || data.location;
    const introduction = data.description ?? data.introduction ?? data.shortDescription ?? "";

    return {
      ...data,
      id: data.slug,
      slug: data.slug,
      name,
      location: data.location || name,
      headline: data.headline,
      subheadline: data.subheadline,
      introduction,
      description: introduction,
      longDescription: data.longDescription ?? data.editorialReview ?? data.description ?? "",
      heroImage,
      photos: sortedImages.map((image) => ({
        src: image.src,
        alt: image.alt,
        w: image.width ?? 1600,
        h: image.height ?? 1200,
        caption: image.caption,
      })),
    };
  };

  const entries = await getCollection("photos");
  return entries
    .map((entry) => mapPhotoLocation(entry.data))
    .sort((a, b) => {
      const aOrder = entries.find((entry) => entry.data.slug === a.slug)?.data.order ?? 0;
      const bOrder = entries.find((entry) => entry.data.slug === b.slug)?.data.order ?? 0;
      return aOrder - bOrder;
    });
}

export async function getGear() {
  const entries = await getCollection("gear");
  return entries[0]?.data;
}
