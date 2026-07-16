import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import type { Filter } from "mongodb";
import { createMongoDocument, getCmsCollection } from "./cms-db";
import { canUploadToUploadThing, uploadToUploadThing } from "./uploadthing-server";

const rootDir = process.cwd();
const contentDir = path.join(rootDir, "src", "content");
const writingDir = path.join(contentDir, "writing");
const gearPath = path.join(contentDir, "gear", "setup.json");
const projectsDir = path.join(contentDir, "projects");
const photosDir = path.join(contentDir, "photos");
const cmsDataDir = path.join(rootDir, "data", "cms");
const photoAssetsDir = path.join(rootDir, "src", "assets", "photos");
const publicUploadsDir = path.join(rootDir, "public", "uploads");
const uploadImageSettings = {
  photos: { maxEdge: 1600, quality: 75 },
  writing: { maxEdge: 1400, quality: 75 },
} as const;
const MONGO_GEAR_ID = "setup";

// --- GitHub API Configuration ---
const githubConfig = {
  token: process.env.GITHUB_TOKEN,
  owner: process.env.GITHUB_OWNER || process.env.VERCEL_GIT_REPO_OWNER,
  repo: process.env.GITHUB_REPO || process.env.VERCEL_GIT_REPO_SLUG,
  branch: process.env.GITHUB_BRANCH || process.env.VERCEL_GIT_COMMIT_REF || "main",
};

const isGithubEnabled = !!(githubConfig.token && githubConfig.owner && githubConfig.repo);
const useGithub = (process.env.NODE_ENV === "production" || process.env.VERCEL === "1") && isGithubEnabled;

// Converts an absolute path to a path relative to the workspace root for GitHub API calls
function toGitPath(fullPath: string): string {
  return path.relative(rootDir, fullPath).replace(/\\/g, "/");
}

function checkWriteAccess() {
  if (process.env.NODE_ENV === "production" || process.env.VERCEL === "1") {
    if (!isGithubEnabled && !process.env.MONGODB_URI) {
      throw new Error(
        "CMS is read-only in production. Add MONGODB_URI for database writes or GITHUB_TOKEN for file writes."
      );
    }
  }
}

// --- GitHub REST API client helpers ---
async function fetchGithub<T>(urlPath: string, options: RequestInit = {}): Promise<T> {
  const url = `https://api.github.com/repos/${githubConfig.owner}/${githubConfig.repo}/${urlPath}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `token ${githubConfig.token}`,
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "Astro-CMS-Agent",
      "Cache-Control": "no-cache",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`GitHub API error (${response.status}): ${errorText}`);
  }

  return response.json() as Promise<T>;
}

interface GithubContentItem {
  name: string;
  path: string;
  sha: string;
  type: "file" | "dir";
  content?: string;
}

async function getGithubFileSha(filePath: string): Promise<string | undefined> {
  try {
    const gitPath = toGitPath(filePath);
    const res = await fetchGithub<GithubContentItem>(`contents/${gitPath}?ref=${githubConfig.branch}`);
    return res.sha;
  } catch (err) {
    if (err instanceof Error && err.message.includes("404")) {
      return undefined;
    }
    throw err;
  }
}

async function readGithubFile(filePath: string): Promise<string> {
  const gitPath = toGitPath(filePath);
  const res = await fetchGithub<GithubContentItem>(`contents/${gitPath}?ref=${githubConfig.branch}`);
  if (res.content) {
    return Buffer.from(res.content.replace(/\n/g, ""), "base64").toString("utf8");
  }
  throw new Error(`File ${gitPath} has no content from GitHub API.`);
}

async function readGithubDir(dirPath: string): Promise<string[]> {
  try {
    const gitPath = toGitPath(dirPath);
    const items = await fetchGithub<GithubContentItem[]>(`contents/${gitPath}?ref=${githubConfig.branch}`);
    return items
      .filter((item) => item.type === "file")
      .map((item) => item.name);
  } catch (err) {
    if (err instanceof Error && err.message.includes("404")) {
      return [];
    }
    throw err;
  }
}

async function writeGithubFile(filePath: string, content: string | Buffer) {
  const gitPath = toGitPath(filePath);
  const sha = await getGithubFileSha(filePath);
  const base64Content = typeof content === "string"
    ? Buffer.from(content).toString("base64")
    : content.toString("base64");

  const body = {
    message: `cms: update ${gitPath}`,
    content: base64Content,
    branch: githubConfig.branch,
    ...(sha ? { sha } : {}),
  };

  await fetchGithub(`contents/${gitPath}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

async function deleteGithubFile(filePath: string) {
  const gitPath = toGitPath(filePath);
  const sha = await getGithubFileSha(filePath);
  if (!sha) return;

  const body = {
    message: `cms: delete ${gitPath}`,
    sha,
    branch: githubConfig.branch,
  };

  await fetchGithub(`contents/${gitPath}`, {
    method: "DELETE",
    body: JSON.stringify(body),
  });
}

// --- End of GitHub Helpers ---

const textFields = [
  "title",
  "headline",
  "summary",
  "keyword",
  "metaDescription",
  "coverImage",
  "publishedAt",
];

export type CmsWritingPost = {
  slug: string;
  title: string;
  headline: string;
  summary: string;
  keyword: string;
  metaDescription: string;
  coverImage: string;
  publishedAt: string;
  tags: string[];
  draft: boolean;
  body: string;
  updatedAt?: string;
};

export type CmsGearItem = {
  name: string;
  slug: string;
  headline: string;
  description: string;
  image: string;
  tag: string;
};

export type CmsGearSection = {
  title: string;
  slug: string;
  headline: string;
  description: string;
  image: string;
  items: CmsGearItem[];
};

export type CmsGear = {
  title: string;
  headline: string;
  description: string;
  sections: CmsGearSection[];
};

export type CmsProject = {
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
  coverImage: string;
  images: string[];
  link: string;
  linkLabel: string;
  caseStudyLink: string;
};

export type CmsPhotoImage = {
  id?: string;
  src: string;
  alt: string;
  width: number;
  height: number;
  caption?: string;
  order?: number;
  isCover?: boolean;
};

export type CmsLocationType = "hotel" | "restaurant" | "cafe" | "check-in";

export type CmsLocationBlock = {
  id: string;
  type: string;
  enabled: boolean;
  title: string;
  content: string;
};

export type CmsRelatedLocation = {
  slug: string;
  distance: string;
  category: string;
};

export type CmsRelatedArticle = {
  slug: string;
  title: string;
};

export type CmsPhotoLocation = {
  slug: string;
  order: number;
  type?: CmsLocationType;
  location: string;
  name?: string;
  city?: string;
  district?: string;
  country?: string;
  province?: string;
  region?: string;
  headline: string;
  subheadline: string;
  introduction?: string;
  shortDescription?: string;
  description: string;
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
  heroImage?: CmsPhotoImage;
  images: CmsPhotoImage[];
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
  relatedLocations?: CmsRelatedLocation[];
  relatedArticles?: CmsRelatedArticle[];
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
  menuImages?: CmsPhotoImage[];
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
  blocks?: CmsLocationBlock[];
};

export type CmsCollectionEntry = {
  slug: string;
  order: number;
  name: string;
  description: string;
};

export type CmsCollections = {
  categories: CmsCollectionEntry[];
  amenities: CmsCollectionEntry[];
  cities: CmsCollectionEntry[];
  districts: CmsCollectionEntry[];
  tags: CmsCollectionEntry[];
  articles: CmsCollectionEntry[];
};

export type CmsPayload = {
  writing: CmsWritingPost[];
  gear: CmsGear;
  projects: CmsProject[];
  photos: CmsPhotoLocation[];
  collections: CmsCollections;
};

export type UploadedAsset = {
  src: string;
  alt: string;
  width?: number;
  height?: number;
};

function stripDiacritics(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\u0111/g, "d")
    .replace(/\u0110/g, "d");
}

export function slugify(value: string) {
  const slug = stripDiacritics(value)
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || `entry-${Date.now()}`;
}

export function safeSlug(value: unknown) {
  const slug = slugify(String(value ?? ""));

  if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
    throw new Error("Invalid slug.");
  }

  return slug;
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asStringArray(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function asNumber(value: unknown, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function asOptionalNumber(value: unknown) {
  if (value === "" || value === null || typeof value === "undefined") return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

function asScore(value: unknown, label: string) {
  const score = asOptionalNumber(value);
  if (typeof score === "undefined") return undefined;
  if (score < 1 || score > 10) {
    throw new Error(`${label} must be between 1 and 10.`);
  }
  return score;
}

function asBoolean(value: unknown, fallback = false) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value === "true";
  return fallback;
}

function frontmatterValue(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => `  - ${JSON.stringify(String(item))}`).join("\n");
  }

  if (typeof value === "boolean") {
    return String(value);
  }

  return JSON.stringify(String(value ?? ""));
}

function parseScalar(value: string) {
  const clean = value.trim();

  if (clean === "true") return true;
  if (clean === "false") return false;

  try {
    return JSON.parse(clean);
  } catch {
    return clean.replace(/^["']|["']$/g, "");
  }
}

function parseMarkdown(raw: string) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);

  if (!match) {
    return { data: {}, body: raw };
  }

  const data: Record<string, unknown> = {};
  const lines = match[1].split("\n");
  let activeArrayKey = "";

  for (const line of lines) {
    if (/^\s+-\s+/.test(line) && activeArrayKey) {
      const value = line.replace(/^\s+-\s+/, "");
      const current = Array.isArray(data[activeArrayKey]) ? data[activeArrayKey] as unknown[] : [];
      current.push(parseScalar(value));
      data[activeArrayKey] = current;
      continue;
    }

    const field = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!field) continue;

    const [, key, value] = field;
    if (value === "") {
      activeArrayKey = key;
      data[key] = [];
      continue;
    }

    activeArrayKey = "";
    data[key] = parseScalar(value);
  }

  return { data, body: match[2] };
}

function serializeMarkdown(post: CmsWritingPost) {
  const tagsField =
    post.tags.length > 0
      ? `tags:\n${frontmatterValue(post.tags)}`
      : `tags: []`;

  const frontmatter = [
    ...textFields.map((field) => `${field}: ${frontmatterValue(post[field as keyof CmsWritingPost])}`),
    tagsField,
    `draft: ${frontmatterValue(post.draft)}`,
  ].join("\n");

  return `---\n${frontmatter}\n---\n\n${post.body.trim()}\n`;
}

function normalizeWritingPost(input: Record<string, unknown>): CmsWritingPost {
  const title = asString(input.title).trim();
  const headline = asString(input.headline, title).trim();
  const slug = safeSlug(input.slug || headline || title);

  if (!title || !headline) {
    throw new Error("Writing entries need a title and headline.");
  }

  return {
    slug,
    title,
    headline,
    summary: asString(input.summary).trim(),
    keyword: asString(input.keyword).trim(),
    metaDescription: asString(input.metaDescription).trim(),
    coverImage: asString(input.coverImage).trim(),
    publishedAt: asString(input.publishedAt, new Date().toISOString().slice(0, 10)).slice(0, 10),
    tags: asStringArray(input.tags),
    draft: Boolean(input.draft),
    body: asString(input.body, "Start writing here..."),
  };
}

async function readJsonFile<T>(filePath: string, fallback: T): Promise<T> {
  if (useGithub) {
    try {
      const content = await readGithubFile(filePath);
      return JSON.parse(content) as T;
    } catch (err) {
      if (err instanceof Error && err.message.includes("404")) {
        return fallback;
      }
      throw err;
    }
  }

  if (!existsSync(filePath)) {
    return fallback;
  }

  return JSON.parse(await readFile(filePath, "utf8")) as T;
}

async function writeJsonFile(filePath: string, value: unknown) {
  const jsonContent = `${JSON.stringify(value, null, 2)}\n`;
  if (useGithub) {
    await writeGithubFile(filePath, jsonContent);
    return;
  }

  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, jsonContent, "utf8");
}

type OrderedJsonEntry = Record<string, unknown> & {
  slug: string;
  order?: unknown;
};

async function readJsonCollection<T extends OrderedJsonEntry>(dir: string): Promise<T[]> {
  let files: string[] = [];
  if (useGithub) {
    files = await readGithubDir(dir);
  } else if (existsSync(dir)) {
    files = await readdir(dir);
  }

  files = files.filter((file) => file.endsWith(".json")).sort();
  const entries = await Promise.all(
    files.map(async (file) => {
      const fullPath = path.join(dir, file);
      const data = await readJsonFile<Record<string, unknown>>(fullPath, {});
      return { ...data, slug: asString(data.slug, file.replace(/\.json$/, "")) } as T;
    }),
  );

  return entries.sort((a, b) => asNumber(a.order) - asNumber(b.order));
}

function stripMongoDocument<T extends object>(document: T & { _id: string }) {
  const { _id, ...rest } = document;
  return rest as T;
}

async function readMongoSingle<T extends object>(
  collectionName: string,
  id: string,
  fallback: T,
): Promise<T> {
  const collection = await getCmsCollection<T>(collectionName);
  if (!collection) return fallback;

  const document = await collection.findOne({ _id: id } as Filter<T & { _id: string }>);
  return document ? (stripMongoDocument(document) as T) : fallback;
}

async function writeMongoSingle<T extends object>(
  collectionName: string,
  id: string,
  value: T,
): Promise<T> {
  const collection = await getCmsCollection<T>(collectionName);
  if (!collection) throw new Error(`MongoDB collection not available: ${collectionName}`);

  const document = createMongoDocument(id, value);
  await collection.replaceOne({ _id: id } as Filter<typeof document>, document, { upsert: true });
  return value;
}

async function readMongoCollection<T extends OrderedJsonEntry>(
  collectionName: string,
): Promise<T[]> {
  const collection = await getCmsCollection<T>(collectionName);
  if (!collection) return [];

  const entries = await collection.find({}).sort({ order: 1 }).toArray();
  return entries.map((entry) => stripMongoDocument(entry as T & { _id: string }));
}

async function deleteMongoEntry(collectionName: string, slug: string): Promise<void> {
  const collection = await getCmsCollection<object>(collectionName);
  if (!collection) return;
  await collection.deleteOne({ _id: slug });
}

export async function readWritingPosts(): Promise<CmsWritingPost[]> {
  const mongoWriting = await readMongoCollection<CmsWritingPost>("cms_writing");
  if (mongoWriting.length > 0) {
    return mongoWriting.sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
  }

  let files: string[] = [];
  if (useGithub) {
    files = await readGithubDir(writingDir);
  } else if (existsSync(writingDir)) {
    files = await readdir(writingDir);
  }

  files = files.filter((file) => file.endsWith(".md")).sort();
  const posts = await Promise.all(
    files.map(async (file) => {
      const fullPath = path.join(writingDir, file);
      let raw = "";
      let mtimeStr = new Date().toISOString();

      if (useGithub) {
        raw = await readGithubFile(fullPath);
      } else {
        raw = await readFile(fullPath, "utf8");
        const fileStat = await stat(fullPath);
        mtimeStr = fileStat.mtime.toISOString();
      }

      const { data, body } = parseMarkdown(raw);
      const post = normalizeWritingPost({
        ...data,
        slug: asString(data.slug, file.replace(/\.md$/, "")),
        body,
      });

      return {
        ...post,
        updatedAt: mtimeStr,
      };
    }),
  );

  return posts.sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
}

async function readGear(): Promise<CmsGear> {
  const mongoGear = await readMongoSingle<CmsGear>("cms_gear", MONGO_GEAR_ID, {
    title: "",
    headline: "",
    description: "",
    sections: [],
  });
  if (mongoGear.title || mongoGear.headline || mongoGear.description || mongoGear.sections.length > 0) {
    return mongoGear;
  }

  return readJsonFile<CmsGear>(gearPath, { title: "", headline: "", description: "", sections: [] });
}

async function readProjects(): Promise<CmsProject[]> {
  const mongoProjects = await readMongoCollection<CmsProject>("cms_projects");
  if (mongoProjects.length > 0) return mongoProjects;
  return readJsonCollection<CmsProject>(projectsDir);
}

export const collectionNames = ["categories", "amenities", "cities", "districts", "tags", "articles"] as const;
export type CollectionName = typeof collectionNames[number];

function normalizeCollectionEntry(input: Record<string, unknown>, fallbackOrder = 99): CmsCollectionEntry {
  const name = asString(input.name || input.title).trim();
  const slug = safeSlug(input.slug || name);

  if (!name) {
    throw new Error("Collection entries need a name.");
  }

  return {
    slug,
    order: asNumber(input.order, fallbackOrder),
    name,
    description: asString(input.description),
  };
}

async function readCollectionEntries(name: CollectionName): Promise<CmsCollectionEntry[]> {
  const mongoEntries = await readMongoCollection<CmsCollectionEntry>(`cms_${name}`);
  if (mongoEntries.length > 0) return mongoEntries;
  return readJsonCollection<CmsCollectionEntry>(path.join(cmsDataDir, name));
}

async function readCmsCollections(): Promise<CmsCollections> {
  const entries = await Promise.all(collectionNames.map((name) => readCollectionEntries(name)));
  return collectionNames.reduce((acc, name, index) => {
    acc[name] = entries[index];
    return acc;
  }, {} as CmsCollections);
}

export async function saveCollectionEntry(resource: CollectionName, input: Record<string, unknown>) {
  checkWriteAccess();
  const entry = normalizeCollectionEntry(input);
  const collection = await getCmsCollection<CmsCollectionEntry>(`cms_${resource}`);
  if (collection) {
    await writeMongoSingle(`cms_${resource}`, entry.slug, entry);
    return entry;
  }

  await writeJsonFile(path.join(cmsDataDir, resource, `${entry.slug}.json`), entry);
  return entry;
}

async function readPhotoLocations(): Promise<CmsPhotoLocation[]> {
  const mongoPhotos = await readMongoCollection<CmsPhotoLocation>("cms_photos");
  if (mongoPhotos.length > 0) return mongoPhotos;
  return readJsonCollection<CmsPhotoLocation>(photosDir);
}

export async function readCmsPayload(): Promise<CmsPayload> {
  const [writing, gear, projects, photos, collections] = await Promise.all([
    readWritingPosts(),
    readGear(),
    readProjects(),
    readPhotoLocations(),
    readCmsCollections(),
  ]);

  return { writing, gear, projects, photos, collections };
}

export async function saveWritingPost(input: Record<string, unknown>) {
  checkWriteAccess();
  const post = normalizeWritingPost(input);
  const collection = await getCmsCollection<CmsWritingPost>("cms_writing");
  if (collection) {
    await writeMongoSingle("cms_writing", post.slug, post);
    return post;
  }

  const filePath = path.join(writingDir, `${post.slug}.md`);
  const content = serializeMarkdown(post);

  if (useGithub) {
    await writeGithubFile(filePath, content);
  } else {
    await mkdir(writingDir, { recursive: true });
    await writeFile(filePath, content, "utf8");
  }
  return post;
}

function normalizeGear(input: Record<string, unknown>) {
  const sections = Array.isArray(input.sections) ? input.sections : [];

  return {
    title: asString(input.title, "My Gear"),
    headline: asString(input.headline, "Tools I actually use."),
    description: asString(input.description),
    sections: sections.map((section, sectionIndex) => {
      const value = section as Record<string, unknown>;
      const title = asString(value.title, `Section ${sectionIndex + 1}`);
      const items = Array.isArray(value.items) ? value.items : [];

      return {
        title,
        slug: safeSlug(value.slug || title),
        headline: asString(value.headline),
        description: asString(value.description),
        image: asString(value.image),
        items: items.map((item, itemIndex) => {
          const itemValue = item as Record<string, unknown>;
          const name = asString(itemValue.name, `Item ${itemIndex + 1}`);

          return {
            name,
            slug: safeSlug(itemValue.slug || name),
            headline: asString(itemValue.headline),
            description: asString(itemValue.description),
            image: asString(itemValue.image),
            url: asString(itemValue.url),
            tag: asString(itemValue.tag),
          };
        }),
      };
    }),
  };
}

export async function saveGear(input: Record<string, unknown>) {
  checkWriteAccess();
  const gear = normalizeGear(input);
  const collection = await getCmsCollection<CmsGear>("cms_gear");
  if (collection) {
    await writeMongoSingle("cms_gear", MONGO_GEAR_ID, gear);
    return gear;
  }

  await writeJsonFile(gearPath, gear);
  return gear;
}

function normalizeProject(input: Record<string, unknown>) {
  const title = asString(input.title).trim();
  const slug = safeSlug(input.slug || title);

  if (!title) {
    throw new Error("Projects need a title.");
  }

  return {
    slug,
    order: asNumber(input.order, 99),
    number: asString(input.number, "00"),
    title,
    client: asString(input.client),
    year: asString(input.year),
    role: asString(input.role),
    summary: asString(input.summary),
    description: asString(input.description),
    tools: asStringArray(input.tools),
    skills: asStringArray(input.skills),
    coverImage: asString(input.coverImage),
    images: asStringArray(input.images),
    link: asString(input.link),
    linkLabel: asString(input.linkLabel),
    caseStudyLink: asString(input.caseStudyLink),
  };
}

export async function saveProject(input: Record<string, unknown>) {
  checkWriteAccess();
  const project = normalizeProject(input);
  const collection = await getCmsCollection<CmsProject>("cms_projects");
  if (collection) {
    await writeMongoSingle("cms_projects", project.slug, project);
    return project;
  }

  await writeJsonFile(path.join(projectsDir, `${project.slug}.json`), project);
  return project;
}

function normalizePhotoImage(input: unknown, fallbackAlt: string): CmsPhotoImage | null {
  const value = input as Record<string, unknown>;
  const src = asString(value?.src).trim();
  if (!src) return null;

  return {
    id: asString(value.id) || slugify(`${src}-${asString(value.alt, fallbackAlt)}`).slice(0, 80),
    src,
    alt: asString(value.alt, fallbackAlt),
    width: asNumber(value.width, 1600),
    height: asNumber(value.height, 1200),
    caption: asString(value.caption),
    order: asOptionalNumber(value.order),
    isCover: asBoolean(value.isCover),
  };
}

function normalizeRelatedLocations(input: unknown): CmsRelatedLocation[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((item) => {
      const value = item as Record<string, unknown>;
      return {
        slug: asString(value.slug).trim(),
        distance: asString(value.distance),
        category: asString(value.category),
      };
    })
    .filter((item) => item.slug);
}

function normalizeRelatedArticles(input: unknown): CmsRelatedArticle[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((item) => {
      const value = item as Record<string, unknown>;
      return {
        slug: asString(value.slug).trim(),
        title: asString(value.title),
      };
    })
    .filter((item) => item.slug || item.title);
}

const allowedLocationTypes = new Set(["hotel", "restaurant", "cafe", "check-in"]);
const defaultLocationBlocks = [
  "Hero",
  "Gallery",
  "Editorial Review",
  "Quick Facts",
  "Tips",
  "Pros & Cons",
  "Map",
  "Nearby Places",
  "Related Articles",
  "FAQ",
  "CTA",
];

function normalizeLocationBlocks(input: unknown): CmsLocationBlock[] {
  const rawBlocks = Array.isArray(input) ? input : [];
  const normalized = rawBlocks
    .map((item, index) => {
      const value = item as Record<string, unknown>;
      const title = asString(value.title || value.type, defaultLocationBlocks[index] ?? `Block ${index + 1}`);
      const type = asString(value.type, slugify(title));
      return {
        id: asString(value.id, `${slugify(type)}-${index + 1}`),
        type,
        enabled: asBoolean(value.enabled, true),
        title,
        content: asString(value.content),
      };
    })
    .filter((block) => block.type);

  for (const title of defaultLocationBlocks) {
    const type = slugify(title);
    if (!normalized.some((block) => block.type === type)) {
      normalized.push({ id: type, type, enabled: true, title, content: "" });
    }
  }

  return normalized;
}

function normalizePhotoLocation(input: Record<string, unknown>) {
  const location = asString(input.location || input.name).trim();
  const slug = safeSlug(input.slug || location);
  const images = Array.isArray(input.images) ? input.images : [];
  const menuImages = Array.isArray(input.menuImages) ? input.menuImages : [];
  const rawType = asString(input.type, "check-in");
  const type = allowedLocationTypes.has(rawType) ? rawType as CmsLocationType : "check-in";
  const allowedWouldReturn = new Set(["definitely", "maybe", "unsure", "no"]);
  const rawWouldReturn = asString(input.wouldReturn);
  const allowedCrowdLevel = new Set(["quiet", "moderate", "busy_weekends", "very_busy"]);
  const rawCrowdLevel = asString(input.crowdLevel);
  const allowedTravelDifficulty = new Set(["very_easy", "easy", "moderate", "requires_preparation"]);
  const rawTravelDifficulty = asString(input.travelDifficulty);
  const scoresInput = (input.scores ?? {}) as Record<string, unknown>;

  if (!location) {
    throw new Error("Photo locations need a location name.");
  }

  const normalizedImages = images
    .map((image, index) => normalizePhotoImage(image, `${location} photo ${index + 1}`))
    .filter((image): image is CmsPhotoImage => Boolean(image))
    .map((image, index) => ({ ...image, order: image.order ?? index + 1 }));
  const coverIndex = normalizedImages.findIndex((image) => image.isCover);
  const heroImage = normalizePhotoImage(input.heroImage, `${location} hero`)
    ?? (coverIndex >= 0 ? normalizedImages[coverIndex] : normalizedImages[0]);
  const scores = {
    scenery: asScore(scoresInput.scenery, "Scenery Score"),
    food: asScore(scoresInput.food, "Food Score"),
    cafe: asScore(scoresInput.cafe, "Cafe Score"),
    relaxation: asScore(scoresInput.relaxation, "Relaxation Score"),
    value: asScore(scoresInput.value, "Value Score"),
    accessibility: asScore(scoresInput.accessibility, "Accessibility Score"),
  };

  return {
    slug,
    order: asNumber(input.order, 99),
    type,
    location,
    name: asString(input.name || location),
    city: asString(input.city),
    district: asString(input.district),
    country: asString(input.country, "Vietnam"),
    province: asString(input.province || input.city),
    region: asString(input.region),
    headline: asString(input.headline),
    subheadline: asString(input.subheadline),
    introduction: asString(input.introduction || input.shortDescription || input.description),
    shortDescription: asString(input.shortDescription || input.description),
    description: asString(input.description || input.shortDescription),
    longDescription: asString(input.longDescription),
    travelFrom: asString(input.travelFrom),
    travelTime: asString(input.travelTime),
    recommendedStay: asString(input.recommendedStay),
    bestMonths: asString(input.bestMonths),
    budgetMin: asOptionalNumber(input.budgetMin),
    budgetMax: asOptionalNumber(input.budgetMax),
    budgetNote: asString(input.budgetNote),
    transportation: asStringArray(input.transportation),
    suitableFor: asStringArray(input.suitableFor),
    overview: asString(input.overview),
    favoriteThings: asString(input.favoriteThings),
    whatIWouldDoAgain: asString(input.whatIWouldDoAgain),
    editorialReview: asString(input.editorialReview),
    personalRating: asScore(input.personalRating, "Personal Rating"),
    wouldReturn: allowedWouldReturn.has(rawWouldReturn) ? rawWouldReturn : undefined,
    scores: Object.fromEntries(
      Object.entries(scores).filter(([, value]) => typeof value !== "undefined"),
    ),
    bestTimeOfDay: asStringArray(input.bestTimeOfDay),
    localTransport: asStringArray(input.localTransport),
    weatherNote: asString(input.weatherNote),
    crowdLevel: allowedCrowdLevel.has(rawCrowdLevel) ? rawCrowdLevel : undefined,
    travelDifficulty: allowedTravelDifficulty.has(rawTravelDifficulty) ? rawTravelDifficulty : undefined,
    travelTips: asStringArray(input.travelTips),
    notFor: asStringArray(input.notFor),
    heroImage,
    images: normalizedImages,
    googleMapsUrl: asString(input.googleMapsUrl),
    latitude: asString(input.latitude),
    longitude: asString(input.longitude),
    openingHours: asString(input.openingHours),
    priceRange: asString(input.priceRange),
    website: asString(input.website),
    phone: asString(input.phone),
    bookingUrl: asString(input.bookingUrl),
    instagram: asString(input.instagram),
    tags: asStringArray(input.tags),
    featured: asBoolean(input.featured),
    published: asBoolean(input.published, true),
    seoTitle: asString(input.seoTitle),
    seoDescription: asString(input.seoDescription),
    seoImage: asString(input.seoImage),
    relatedLocations: normalizeRelatedLocations(input.relatedLocations),
    relatedArticles: normalizeRelatedArticles(input.relatedArticles),
    amenities: asStringArray(input.amenities),
    roomTypes: asStringArray(input.roomTypes),
    checkInTime: asString(input.checkInTime),
    checkOutTime: asString(input.checkOutTime),
    breakfastIncluded: asBoolean(input.breakfastIncluded),
    parking: asBoolean(input.parking),
    petFriendly: asBoolean(input.petFriendly),
    pricePerNight: asString(input.pricePerNight),
    bookingLinks: asStringArray(input.bookingLinks),
    cuisine: asString(input.cuisine),
    menuImages: menuImages
      .map((image, index) => normalizePhotoImage(image, `${location} menu ${index + 1}`))
      .filter((image): image is CmsPhotoImage => Boolean(image)),
    mustTryDishes: asStringArray(input.mustTryDishes),
    averagePrice: asString(input.averagePrice),
    reservationRequired: asBoolean(input.reservationRequired),
    delivery: asBoolean(input.delivery),
    outdoorSeating: asBoolean(input.outdoorSeating),
    coffeeType: asString(input.coffeeType),
    workingFriendly: asBoolean(input.workingFriendly),
    powerOutlets: asBoolean(input.powerOutlets),
    wifi: asBoolean(input.wifi),
    viewRating: asString(input.viewRating),
    indoor: asBoolean(input.indoor),
    outdoor: asBoolean(input.outdoor),
    openingStyle: asString(input.openingStyle),
    entranceFee: asString(input.entranceFee),
    bestTime: asString(input.bestTime),
    sunrise: asBoolean(input.sunrise),
    sunset: asBoolean(input.sunset),
    walkingTime: asString(input.walkingTime),
    difficulty: asString(input.difficulty),
    droneAllowed: asBoolean(input.droneAllowed),
    thingsToKnow: asString(input.thingsToKnow),
    blocks: normalizeLocationBlocks(input.blocks),
  };
}

export async function savePhotoLocation(input: Record<string, unknown>) {
  checkWriteAccess();
  const location = normalizePhotoLocation(input);
  const collection = await getCmsCollection<CmsPhotoLocation>("cms_photos");
  if (collection) {
    await writeMongoSingle("cms_photos", location.slug, location);
    return location;
  }

  await writeJsonFile(path.join(photosDir, `${location.slug}.json`), location);
  return location;
}

export async function deleteEntry(resource: string, slugValue: unknown) {
  checkWriteAccess();
  const slug = safeSlug(slugValue);
  const mongoCollection =
    resource === "writing"
      ? "cms_writing"
      : resource === "projects"
        ? "cms_projects"
        : resource === "photos"
          ? "cms_photos"
          : collectionNames.includes(resource as CollectionName)
            ? `cms_${resource}`
            : "";

  if (mongoCollection) {
    const collection = await getCmsCollection<object>(mongoCollection);
    if (collection) {
      await deleteMongoEntry(mongoCollection, slug);
      return;
    }
  }

  const target =
    resource === "writing"
      ? path.join(writingDir, `${slug}.md`)
      : resource === "projects"
        ? path.join(projectsDir, `${slug}.json`)
        : resource === "photos"
          ? path.join(photosDir, `${slug}.json`)
          : collectionNames.includes(resource as CollectionName)
            ? path.join(cmsDataDir, resource, `${slug}.json`)
            : "";

  if (!target) {
    throw new Error("This resource cannot be deleted here.");
  }

  if (useGithub) {
    await deleteGithubFile(target);
  } else {
    await rm(target, { force: true });
  }
}

function sanitizeFileName(name: string) {
  const parsed = path.parse(name);
  const base = slugify(parsed.name).slice(0, 80);
  const ext = parsed.ext.toLowerCase().replace(/[^a-z0-9.]/g, "");
  return `${base || "asset"}${ext || ".webp"}`;
}

function webpUploadFileName(name: string) {
  const parsed = path.parse(name);
  const base = slugify(parsed.name).slice(0, 80);
  return `${base || "asset"}.webp`;
}

function gearUploadFileName(name: string) {
  const parsed = path.parse(name);
  const base = slugify(parsed.name).slice(0, 80) || "gear-product";
  return `${base}.webp`;
}

async function imageMetadata(buffer: Buffer) {
  try {
    const metadata = await sharp(buffer).metadata();
    return {
      width: metadata.width,
      height: metadata.height,
    };
  } catch {
    return {};
  }
}

async function processGearImage(buffer: Buffer) {
  const metadata = await sharp(buffer, { failOn: "none" }).metadata();
  const { data, info } = await sharp(buffer, { failOn: "none" })
    .rotate()
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  let transparentBuffer: Buffer;
  const hasUsefulAlpha = Boolean(metadata.hasAlpha) && data.some((value, index) => index % 4 === 3 && value < 250);

  if (hasUsefulAlpha) {
    transparentBuffer = await sharp(data, {
      raw: {
        width: info.width,
        height: info.height,
        channels: 4,
      },
    })
      .png()
      .toBuffer();
  } else {
    const samplePoints = [
      [0, 0],
      [info.width - 1, 0],
      [0, info.height - 1],
      [info.width - 1, info.height - 1],
      [Math.floor(info.width / 2), 0],
      [Math.floor(info.width / 2), info.height - 1],
      [0, Math.floor(info.height / 2)],
      [info.width - 1, Math.floor(info.height / 2)],
    ];

    const bg = samplePoints.reduce(
      (acc, [x, y]) => {
        const idx = (y * info.width + x) * 4;
        acc.r += data[idx] ?? 255;
        acc.g += data[idx + 1] ?? 255;
        acc.b += data[idx + 2] ?? 255;
        return acc;
      },
      { r: 0, g: 0, b: 0 },
    );

    bg.r /= samplePoints.length;
    bg.g /= samplePoints.length;
    bg.b /= samplePoints.length;

    const hardThreshold = 28;
    const softThreshold = 72;

    for (let i = 0; i < data.length; i += 4) {
      const dr = (data[i] ?? 0) - bg.r;
      const dg = (data[i + 1] ?? 0) - bg.g;
      const db = (data[i + 2] ?? 0) - bg.b;
      const distance = Math.sqrt(dr * dr + dg * dg + db * db);

      if (distance <= hardThreshold) {
        data[i + 3] = 0;
      } else if (distance < softThreshold) {
        const alpha = Math.round(((distance - hardThreshold) / (softThreshold - hardThreshold)) * 255);
        data[i + 3] = Math.min(data[i + 3] ?? 255, alpha);
      }
    }

    transparentBuffer = await sharp(data, {
      raw: {
        width: info.width,
        height: info.height,
        channels: 4,
      },
    })
      .png()
      .toBuffer();
  }

  const productBuffer = await sharp(transparentBuffer, { failOn: "none" })
    .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 8 })
    .resize(560, 390, {
      fit: "inside",
      withoutEnlargement: false,
    })
    .png()
    .toBuffer();

  const productMetadata = await sharp(productBuffer).metadata();
  const left = Math.max(0, Math.round((640 - (productMetadata.width ?? 0)) / 2));
  const top = Math.max(0, Math.round((480 - (productMetadata.height ?? 0)) / 2));

  return sharp({
    create: {
      width: 640,
      height: 480,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: productBuffer, left, top }])
    .webp({ quality: 75, alphaQuality: 80 })
    .toBuffer();
}

async function processUploadedImage(
  file: File,
  target: "photos" | "gear" | "writing",
): Promise<{ buffer: Buffer; name: string }> {
  const originalBuffer = Buffer.from(await file.arrayBuffer());

  if (target === "gear") {
    return {
      buffer: await processGearImage(originalBuffer),
      name: gearUploadFileName(file.name),
    };
  }

  const settings = uploadImageSettings[target];

  try {
    const buffer = await sharp(originalBuffer, {
      failOn: "none",
      limitInputPixels: false,
    })
      .rotate()
      .resize({
        width: settings.maxEdge,
        height: settings.maxEdge,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({
        quality: settings.quality,
        alphaQuality: 90,
        effort: 5,
        smartSubsample: true,
      })
      .toBuffer();

    return {
      buffer,
      name: webpUploadFileName(file.name),
    };
  } catch {
    return {
      buffer: originalBuffer,
      name: sanitizeFileName(file.name),
    };
  }
}

export async function uploadAssets(options: {
  target: "photos" | "gear" | "writing";
  slug?: string;
  files: File[];
}) {
  checkWriteAccess();
  const uploaded: UploadedAsset[] = [];
  const targetSlug = options.slug ? safeSlug(options.slug) : "";
  const folder =
    options.target === "photos"
      ? path.join(photoAssetsDir, targetSlug || "uncategorized")
      : options.target === "writing"
        ? path.join(publicUploadsDir, "writing", targetSlug || "draft")
        : publicUploadsDir;
  const publicPrefix =
    options.target === "photos"
      ? `/assets/photos/${targetSlug || "uncategorized"}`
      : options.target === "writing"
        ? `/uploads/writing/${targetSlug || "draft"}`
        : "/uploads";

  const useUploadThing = canUploadToUploadThing();

  if (!useUploadThing && !useGithub) {
    await mkdir(folder, { recursive: true });
  }

  for (const file of options.files) {
    const processed = await processUploadedImage(file, options.target);
    const uniqueName = `${Date.now()}-${uploaded.length + 1}-${processed.name}`;
    const buffer = processed.buffer;
    const metadata = await imageMetadata(buffer);
    const filePath = path.join(folder, uniqueName);
    const remoteUrl = useUploadThing ? await uploadToUploadThing(buffer, uniqueName) : null;

    if (!remoteUrl) {
      if (useGithub) {
        await writeGithubFile(filePath, buffer);
      } else {
        await writeFile(filePath, new Uint8Array(buffer));
      }
    }

    uploaded.push({
      src: remoteUrl ?? `${publicPrefix}/${uniqueName}`,
      alt: targetSlug ? `${targetSlug} photo` : processed.name.replace(/\.[^.]+$/, ""),
      ...metadata,
    });
  }

  if (options.target === "photos" && targetSlug && uploaded.length > 0) {
    const fallback = {
      slug: targetSlug,
      order: 99,
      location: targetSlug,
      headline: "",
      description: "",
      images: [],
    };
    const collection = await getCmsCollection<CmsPhotoLocation>("cms_photos");
    const mongoCurrent = collection
      ? await collection.findOne({ _id: targetSlug } as Filter<CmsPhotoLocation & { _id: string }>)
      : null;
    const filePath = path.join(photosDir, `${targetSlug}.json`);
    const current = mongoCurrent
      ? stripMongoDocument(mongoCurrent as CmsPhotoLocation & { _id: string })
      : await readJsonFile<Record<string, unknown>>(filePath, fallback);
    const location = normalizePhotoLocation({
      ...current,
      images: [...(Array.isArray(current.images) ? current.images : []), ...uploaded],
    });
    if (collection) {
      await writeMongoSingle("cms_photos", location.slug, location);
    } else {
      await writeJsonFile(filePath, location);
    }
  }

  return uploaded;
}
