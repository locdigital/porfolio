export const SITE_URL = "https://loc.digital";
export const SITE_NAME = "Lộc Digital";
export const PERSON_NAME = "Phuc Loc Nguyen";
export const DEFAULT_DESCRIPTION =
  "Senior Performance Marketing Executive based in Ho Chi Minh City. Helping brands scale paid media, TikTok Shop GMV, SEO growth, automation, and full-funnel campaigns.";
export const DEFAULT_OG_IMAGE = "https://65wv0vnolo.ufs.sh/f/0DwDtVjMS59hz9GQ9ONrQN89V1S2GcyZlRdnh3U0J4kfWYAX";

export const sameAs = [
  "https://www.instagram.com/henrygoodkid",
  "https://www.linkedin.com/in/phucloc",
  "https://x.com/vuaecom",
  "https://www.pexels.com/@henrygoodkid",
];

export type JsonLd = Record<string, unknown>;

export function absoluteUrl(path = "/") {
  return new URL(path, SITE_URL).toString();
}

export function personSchema(): JsonLd {
  return {
    "@type": "Person",
    "@id": `${SITE_URL}/#person`,
    name: PERSON_NAME,
    url: SITE_URL,
    image: DEFAULT_OG_IMAGE,
    jobTitle: "Senior Performance Marketing Executive",
    email: "mailto:hi@loc.digital",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Ho Chi Minh City",
      addressCountry: "VN",
    },
    knowsAbout: [
      "Performance Marketing",
      "TikTok Shop Growth",
      "SEO",
      "Paid Media",
      "Google Ads",
      "Meta Ads",
      "Marketing Automation",
      "ROAS Optimization",
    ],
    sameAs,
  };
}

export function websiteSchema(): JsonLd {
  return {
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: SITE_URL,
    name: SITE_NAME,
    description: DEFAULT_DESCRIPTION,
    publisher: { "@id": `${SITE_URL}/#person` },
    inLanguage: "en",
  };
}

export function professionalServiceSchema(): JsonLd {
  return {
    "@type": "ProfessionalService",
    "@id": `${SITE_URL}/#service`,
    name: SITE_NAME,
    url: SITE_URL,
    image: DEFAULT_OG_IMAGE,
    description: DEFAULT_DESCRIPTION,
    email: "hi@loc.digital",
    founder: { "@id": `${SITE_URL}/#person` },
    areaServed: ["Vietnam", "Thailand", "Singapore", "United States"],
    serviceType: [
      "Performance Marketing",
      "SEO Consulting",
      "Paid Social Advertising",
      "TikTok Shop Growth",
      "Marketing Automation",
      "Conversion Funnel Optimization",
    ],
  };
}

export function pageSchema({
  url,
  title,
  description,
  type = "WebPage",
}: {
  url: string;
  title: string;
  description: string;
  type?: string;
}): JsonLd {
  return {
    "@type": type,
    "@id": `${url}#webpage`,
    url,
    name: title,
    description,
    isPartOf: { "@id": `${SITE_URL}/#website` },
    about: { "@id": `${SITE_URL}/#person` },
    inLanguage: "en",
  };
}

export function graphSchema(nodes: JsonLd[] = []): JsonLd {
  return {
    "@context": "https://schema.org",
    "@graph": [personSchema(), websiteSchema(), professionalServiceSchema(), ...nodes],
  };
}

export function safeJsonLd(schema: JsonLd) {
  return JSON.stringify(schema).replace(/</g, "\\u003c");
}
