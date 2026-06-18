import { getCollection } from "astro:content";

export async function getProjects() {
  const entries = await getCollection("projects");
  return entries
    .map((entry) => ({
      ...entry.data,
      tags: [...entry.data.tools, ...entry.data.skills],
    }))
    .sort((a, b) => a.order - b.order);
}

export async function getWritingPosts() {
  const entries = await getCollection("writing", ({ data }) => !data.draft);
  return entries
    .map((entry) => ({ ...entry, slug: entry.slug }))
    .sort((a, b) => b.data.publishedAt.getTime() - a.data.publishedAt.getTime());
}

export async function getPhotoLocations() {
  const entries = await getCollection("photos");
  return entries
    .map((entry) => ({
      id: entry.data.slug,
      slug: entry.data.slug,
      name: entry.data.location,
      headline: entry.data.headline,
      subheadline: entry.data.subheadline,
      description: entry.data.description ?? "",
      photos: entry.data.images.map((image) => ({
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
  const entries = await getCollection("gear");
  return entries[0]?.data;
}
