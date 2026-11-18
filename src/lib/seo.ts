export const SITE_URL = "https://loc.digital";
export const SITE_NAME = "Loc Digital";
export const PERSON_NAME = "Phuc Loc Nguyen";
export const PERSON_ID = `${SITE_URL}/#person`;
export const WEBSITE_ID = `${SITE_URL}/#website`;
export const DEFAULT_DESCRIPTION =
  "Phuc Loc Nguyen (Loc / Henry) — Performance marketing specialist and travel photographer based in Ho Chi Minh City, Vietnam. Growth frameworks, paid media case studies, and first-hand travel photography.";
export const DEFAULT_OG_IMAGE =
  `${SITE_URL}/assets/photos/singapore/singapore-16.webp`;
export const DEFAULT_OG_IMAGE_ALT =
  "Singapore city photograph by Phuc Loc Nguyen";

export const sameAs = [
  "https://www.instagram.com/henrygoodkid",
  "https://www.linkedin.com/in/phucloc",
  "https://x.com/vuaecom",
  "https://www.pexels.com/@henrygoodkid",
];

export type JsonLd = Record<string, unknown>;

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function canonicalPath(pathname = "/"): string {
  if (!pathname || pathname === "/") return "/";
  const clean = pathname.split("?")[0].split("#")[0].replace(/\/+$/, "");
  return clean.startsWith("/") ? clean || "/" : `/${clean}`;
}

export function canonicalUrl(path = "/"): string {
  const url = new URL(canonicalPath(path), SITE_URL);
  return url.toString();
}

export function absoluteUrl(path = "/"): string {
  if (/^https?:\/\//i.test(path)) return path;
  return new URL(path, SITE_URL).toString();
}

function pruneEmpty<T>(value: T): T {
  if (Array.isArray(value)) {
    const cleaned = value
      .map((item) => pruneEmpty(item))
      .filter((item) => item !== undefined && item !== null && item !== "");
    return cleaned as unknown as T;
  }
  if (value && typeof value === "object") {
    const entries: [string, unknown][] = [];
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v === undefined || v === null || v === "") continue;
      const cleaned = pruneEmpty(v);
      if (Array.isArray(cleaned) && cleaned.length === 0) continue;
      if (
        cleaned &&
        typeof cleaned === "object" &&
        !Array.isArray(cleaned) &&
        Object.keys(cleaned).length === 0
      ) {
        continue;
      }
      entries.push([k, cleaned]);
    }
    return Object.fromEntries(entries) as T;
  }
  return value;
}

export function personSchema(): JsonLd {
  return pruneEmpty({
    "@type": "Person",
    "@id": PERSON_ID,
    name: PERSON_NAME,
    alternateName: ["Loc", "Henry", "Nguyen Phuc Loc", "Loc Nguyen"],
    description: DEFAULT_DESCRIPTION,
    url: SITE_URL,
    image: DEFAULT_OG_IMAGE,
    jobTitle: "Senior Performance Marketing Executive",
    alumniOf: {
      "@type": "CollegeOrUniversity",
      name: "FPT University",
    },
    email: "mailto:hi@loc.digital",
    telephone: "+84888886038",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Ho Chi Minh City",
      addressCountry: "VN",
    },
    knowsAbout: [
      "Performance Marketing",
      "Meta Ads",
      "Google Ads",
      "TikTok Shop Growth",
      "Unit Economics",
      "Attribution Modeling",
      "Conversion Rate Optimization",
      "Technical SEO",
      "Marketing Automation",
      "Travel Photography",
      "Landscape Photography",
      "Vietnam Travel",
    ],
    sameAs,
  });
}

export function websiteSchema(lang = "en"): JsonLd {
  return pruneEmpty({
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: SITE_URL,
    name: SITE_NAME,
    alternateName: "Phuc Loc Nguyen — Workspace",
    description: DEFAULT_DESCRIPTION,
    publisher: { "@id": PERSON_ID },
    inLanguage: lang,
  });
}

export function breadcrumbListSchema(
  breadcrumbs: BreadcrumbItem[],
  currentPageUrl: string,
): JsonLd | null {
  if (!breadcrumbs || breadcrumbs.length === 0) return null;

  const hasHome = breadcrumbs[0]?.href === "/";
  const normalizedItems: { name: string; item: string }[] = [];
  if (!hasHome && canonicalUrl("/") !== currentPageUrl) {
    normalizedItems.push({ name: "Overview", item: canonicalUrl("/") });
  }

  for (let i = 0; i < breadcrumbs.length; i++) {
    const crumb = breadcrumbs[i];
    const isLast = i === breadcrumbs.length - 1;
    const itemUrl = crumb.href
      ? canonicalUrl(crumb.href)
      : isLast
        ? currentPageUrl
        : undefined;
    if (itemUrl) {
      normalizedItems.push({ name: crumb.label, item: itemUrl });
    }
  }

  if (normalizedItems.length === 0) return null;

  return {
    "@type": "BreadcrumbList",
    "@id": `${currentPageUrl}#breadcrumbs`,
    itemListElement: normalizedItems.map((entry, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: entry.name,
      item: entry.item,
    })),
  };
}

export function pageSchema({
  url,
  title,
  description,
  type = "WebPage",
  lang = "en",
  mainEntity,
  about = { "@id": PERSON_ID },
  primaryImageUrl,
  datePublished,
  dateModified,
  breadcrumbId,
}: {
  url: string;
  title: string;
  description: string;
  type?: string;
  lang?: string;
  mainEntity?: JsonLd;
  about?: JsonLd;
  primaryImageUrl?: string;
  datePublished?: string;
  dateModified?: string;
  breadcrumbId?: string;
}): JsonLd {
  return pruneEmpty({
    "@type": type,
    "@id": `${url}#webpage`,
    url,
    name: title,
    description,
    isPartOf: { "@id": WEBSITE_ID },
    about,
    mainEntity,
    primaryImageOfPage: primaryImageUrl
      ? { "@type": "ImageObject", url: absoluteUrl(primaryImageUrl) }
      : undefined,
    breadcrumb: breadcrumbId ? { "@id": breadcrumbId } : undefined,
    datePublished,
    dateModified,
    inLanguage: lang,
  });
}

export function collectionPageSchema({
  url,
  title,
  description,
  items,
  lang = "en",
  breadcrumbId,
}: {
  url: string;
  title: string;
  description: string;
  items: { name: string; url: string; description?: string; image?: string }[];
  lang?: string;
  breadcrumbId?: string;
}): JsonLd {
  return pruneEmpty({
    "@type": "CollectionPage",
    "@id": `${url}#webpage`,
    url,
    name: title,
    description,
    isPartOf: { "@id": WEBSITE_ID },
    author: { "@id": PERSON_ID },
    breadcrumb: breadcrumbId ? { "@id": breadcrumbId } : undefined,
    inLanguage: lang,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: items.length,
      itemListElement: items.map((item, idx) => ({
        "@type": "ListItem",
        position: idx + 1,
        url: canonicalUrl(item.url),
        name: item.name,
        description: item.description,
        image: item.image ? absoluteUrl(item.image) : undefined,
      })),
    },
  });
}

export function articleSchema({
  url,
  title,
  description,
  type = "Article",
  image,
  datePublished,
  dateModified,
  articleSection,
  keywords,
  about,
  lang = "en",
}: {
  url: string;
  title: string;
  description: string;
  type?: "Article" | "BlogPosting" | "TechArticle" | "CreativeWork";
  image?: string;
  datePublished?: string;
  dateModified?: string;
  articleSection?: string;
  keywords?: string[];
  about?: JsonLd | JsonLd[];
  lang?: string;
}): JsonLd {
  return pruneEmpty({
    "@type": type,
    "@id": `${url}#article`,
    url,
    mainEntityOfPage: { "@id": `${url}#webpage` },
    headline: type === "CreativeWork" ? undefined : title,
    name: title,
    description,
    image: image ? absoluteUrl(image) : undefined,
    author: { "@id": PERSON_ID },
    creator: type === "CreativeWork" ? { "@id": PERSON_ID } : undefined,
    publisher: { "@id": PERSON_ID },
    isPartOf: { "@id": WEBSITE_ID },
    datePublished,
    dateModified,
    articleSection,
    keywords: keywords && keywords.length > 0 ? keywords : undefined,
    about,
    inLanguage: lang,
  });
}

export function imageGallerySchema({
  url,
  title,
  description,
  locationName,
  alternateNames,
  country,
  region,
  latitude,
  longitude,
  dateModified,
  images,
  lang = "en",
  breadcrumbId,
}: {
  url: string;
  title: string;
  description: string;
  locationName: string;
  alternateNames?: string[];
  country?: string;
  region?: string;
  latitude?: string | number;
  longitude?: string | number;
  dateModified?: string;
  images: {
    url: string;
    name: string;
    caption?: string;
    width?: number;
    height?: number;
    dateCreated?: string;
    locationName?: string;
  }[];
  lang?: string;
  breadcrumbId?: string;
}): JsonLd[] {
  const latNum = latitude !== undefined && latitude !== "" ? Number(latitude) : NaN;
  const lngNum = longitude !== undefined && longitude !== "" ? Number(longitude) : NaN;
  const hasValidGeo = Number.isFinite(latNum) && Number.isFinite(lngNum);

  const placeNode: JsonLd = pruneEmpty({
    "@type": "Place",
    "@id": `${url}#place`,
    name: locationName,
    alternateName: alternateNames && alternateNames.length > 0 ? alternateNames : undefined,
    address: pruneEmpty({
      "@type": "PostalAddress",
      addressRegion: region,
      addressCountry: country,
    }),
    geo: hasValidGeo
      ? {
          "@type": "GeoCoordinates",
          latitude: latNum,
          longitude: lngNum,
        }
      : undefined,
  });

  const imageObjects = images.map((img) =>
    pruneEmpty({
      "@type": "ImageObject",
      contentUrl: absoluteUrl(img.url),
      url: absoluteUrl(img.url),
      name: img.name,
      caption: img.caption,
      width: img.width,
      height: img.height,
      dateCreated: img.dateCreated,
      creator: { "@id": PERSON_ID },
      copyrightHolder: { "@id": PERSON_ID },
      contentLocation: img.locationName
        ? { "@type": "Place", name: img.locationName }
        : { "@id": `${url}#place` },
    }),
  );

  return [
    placeNode,
    pruneEmpty({
      "@type": ["ImageGallery", "CollectionPage"],
      "@id": `${url}#webpage`,
      url,
      name: title,
      description,
      isPartOf: { "@id": WEBSITE_ID },
      author: { "@id": PERSON_ID },
      creator: { "@id": PERSON_ID },
      about: { "@id": `${url}#place` },
      contentLocation: { "@id": `${url}#place` },
      dateModified,
      breadcrumb: breadcrumbId ? { "@id": breadcrumbId } : undefined,
      primaryImageOfPage: imageObjects[0]
        ? { "@type": "ImageObject", url: imageObjects[0].contentUrl }
        : undefined,
      associatedMedia: imageObjects,
      inLanguage: lang,
    }),
  ];
}

export function serviceItemsSchema(
  services: {
    name: string;
    category: string;
    description: string;
    url: string;
  }[],
): JsonLd[] {
  return services.map((service, index) =>
    pruneEmpty({
      "@type": "Service",
      "@id": `${service.url}#service-${index + 1}`,
      name: service.name,
      serviceType: service.category,
      description: service.description,
      url: service.url,
      provider: { "@id": PERSON_ID },
      areaServed: ["Vietnam", "Thailand", "Singapore", "United States"],
    }),
  );
}

export function graphSchema(
  nodes: JsonLd[] = [],
  options: { lang?: string } = {},
): JsonLd {
  const { lang = "en" } = options;
  return pruneEmpty({
    "@context": "https://schema.org",
    "@graph": [personSchema(), websiteSchema(lang), ...nodes],
  });
}

export function safeJsonLd(schema: JsonLd): string {
  return JSON.stringify(schema).replace(/</g, "\\u003c");
}
