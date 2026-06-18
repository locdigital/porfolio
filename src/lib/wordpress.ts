export const getWPUrl = () => {
  const url = import.meta.env.PUBLIC_WP_URL || 'https://cms.loc.digital';
  // Remove trailing slash if exists
  return url.replace(/\/$/, '');
};

export async function fetchAPI(endpoint: string, query = '') {
  const url = `${getWPUrl()}/wp-json/wp/v2/${endpoint}${query ? `?${query}` : ''}`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`Failed to fetch API from ${url}`);
      return null;
    }
    return await res.json();
  } catch (error) {
    console.error(`Error fetching WP API:`, error);
    return null;
  }
}

export async function getPosts(perPage = 10) {
  const data = await fetchAPI('posts', `_embed=1&per_page=${perPage}`);
  return data || [];
}

export async function getPostBySlug(slug: string) {
  const data = await fetchAPI('posts', `_embed=1&slug=${slug}`);
  return data && data.length > 0 ? data[0] : null;
}

export function extractSEOData(post: any) {
  if (!post) return null;

  // 1. Try to extract Yoast SEO data from REST API if available
  if (post.yoast_head_json) {
    return {
      title: post.yoast_head_json.title,
      description: post.yoast_head_json.description,
      ogImage: post.yoast_head_json.og_image?.[0]?.url || '',
    };
  }
  
  // 2. Try RankMath SEO if Yoast is not available
  if (post.rank_math_title) {
    return {
      title: post.rank_math_title,
      description: post.rank_math_description,
      ogImage: post.rank_math_facebook_image || '',
    };
  }

  // 3. Fallback to basic WordPress fields
  return {
    title: post.title?.rendered || '',
    // Strip HTML tags from excerpt for the description fallback
    description: post.excerpt?.rendered?.replace(/<[^>]+>/g, '').trim() || '',
    ogImage: post._embedded?.['wp:featuredmedia']?.[0]?.source_url || '',
  };
}
