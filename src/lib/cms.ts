import { getCollection } from "./content";
import { getCmsCollection, stripMongoId } from "./cms-db";

type ProjectData = {
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
};

type PhotoLocationData = {
  slug: string;
  order: number;
  location: string;
  headline: string;
  subheadline?: string;
  description?: string;
  images: {
    src: string;
    alt: string;
    width?: number;
    height?: number;
  }[];
};

type GearData = {
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
  const collection = await getCmsCollection<ProjectData>("cms_projects");
  if (collection) {
    const projects = await collection.find({}).sort({ order: 1 }).toArray();
    if (projects.length > 0) {
      return projects.map((project) => {
        const data = stripMongoId(project);
        return {
          ...data,
          tags: [...data.tools, ...data.skills],
        };
      });
    }
  }

  const entries = await getCollection("projects");
  return entries
    .map((entry) => ({
      ...entry.data,
      tags: [...entry.data.tools, ...entry.data.skills],
    }))
    .sort((a, b) => a.order - b.order);
}

export async function getPhotoLocations() {
  const collection = await getCmsCollection<PhotoLocationData>("cms_photos");
  if (collection) {
    const locations = await collection.find({}).sort({ order: 1 }).toArray();
    if (locations.length > 0) {
      return locations.map((location) => {
        const data = stripMongoId(location);
        return {
          id: data.slug,
          slug: data.slug,
          name: data.location,
          headline: data.headline,
          subheadline: data.subheadline,
          description: data.description ?? "",
          photos: data.images.map((image) => ({
            src: image.src,
            alt: image.alt,
            w: image.width ?? 1600,
            h: image.height ?? 1200,
          })),
        };
      });
    }
  }

  const entries = await getCollection("photos");
  return entries
    .map((entry) => ({
      id: entry.data.slug,
      slug: entry.data.slug,
      name: entry.data.location,
      headline: entry.data.headline,
      subheadline: entry.data.subheadline,
      description: entry.data.description ?? "",
      photos: entry.data.images.map((image: any) => ({
        src: image.src,
        alt: image.alt,
        w: image.width ?? 1600,
        h: image.height ?? 1200,
      })),
    }))
    .sort((a, b) => {
      const aOrder = entries.find((entry) => entry.data.slug === a.slug)?.data.order ?? 0;
      const bOrder = entries.find((entry) => entry.data.slug === b.slug)?.data.order ?? 0;
      return aOrder - bOrder;
    });
}

export async function getGear() {
  const collection = await getCmsCollection<GearData>("cms_gear");
  if (collection) {
    const gear = await collection.findOne({ _id: "setup" });
    if (gear) return stripMongoId(gear);
  }

  const entries = await getCollection("gear");
  return entries[0]?.data;
}
