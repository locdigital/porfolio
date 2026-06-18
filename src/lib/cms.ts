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
  const wpUrl = import.meta.env.PUBLIC_WP_URL;
  if (!wpUrl) {
    console.error("PUBLIC_WP_URL is not configured in .env file.");
    return [];
  }
  try {
    const res = await fetch(`${wpUrl}/wp-json/wp/v2/posts?_embed&status=publish`);
    if (!res.ok) throw new Error("Failed to fetch posts from WordPress");
    const posts = await res.json();
    
    return posts.map((post: any) => {
      // Extract featured image from embed data if it exists
      const coverImage = post._embedded?.['wp:featuredmedia']?.[0]?.source_url || '';
      
      // Extract tags from term data
      const tags = post._embedded?.['wp:term']?.[1]?.map((t: any) => t.name) || [];

      return {
        slug: post.slug,
        content: post.content.rendered,
        data: {
          title: post.title.rendered,
          headline: post.title.rendered,
          summary: post.excerpt.rendered.replace(/<[^>]*>/g, '').trim(),
          publishedAt: new Date(post.date),
          coverImage: coverImage,
          tags: tags,
          draft: false,
        },
      };
    });
  } catch (e) {
    console.error("Error fetching WordPress posts:", e);
    return [];
  }
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
