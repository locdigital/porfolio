import { existsSync, readFileSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const rootDir = process.cwd();

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return;

  for (const line of readFileSync(filePath, "utf8").split("\n")) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match || match[1].startsWith("#") || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
  }
}

loadEnvFile(path.join(rootDir, ".env"));

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Missing SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function stripDiacritics(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\u0111/g, "d")
    .replace(/\u0110/g, "d");
}

function slugify(value) {
  const slug = stripDiacritics(String(value ?? ""))
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || `entry-${Date.now()}`;
}

function parseScalar(value) {
  const clean = value.trim();
  if (clean === "true") return true;
  if (clean === "false") return false;
  try {
    return JSON.parse(clean);
  } catch {
    return clean.replace(/^["']|["']$/g, "");
  }
}

function parseMarkdown(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return { data: {}, body: raw };

  const data = {};
  let activeArrayKey = "";

  for (const line of match[1].split("\n")) {
    if (/^\s+-\s+/.test(line) && activeArrayKey) {
      data[activeArrayKey] ??= [];
      data[activeArrayKey].push(parseScalar(line.replace(/^\s+-\s+/, "")));
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

async function readJsonFile(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

async function readJsonCollection(dir) {
  if (!existsSync(dir)) return [];
  const files = (await readdir(dir)).filter((file) => file.endsWith(".json")).sort();
  return Promise.all(
    files.map(async (file) => {
      const value = await readJsonFile(path.join(dir, file));
      return { ...value, slug: value.slug || file.replace(/\.json$/, "") };
    }),
  );
}

async function readMarkdownWriting(dir) {
  if (!existsSync(dir)) return [];
  const files = (await readdir(dir)).filter((file) => file.endsWith(".md")).sort();
  return Promise.all(
    files.map(async (file) => {
      const raw = await readFile(path.join(dir, file), "utf8");
      const { data, body } = parseMarkdown(raw);
      const title = String(data.title || data.headline || file.replace(/\.md$/, ""));
      return {
        slug: data.slug || slugify(title),
        title,
        headline: data.headline || title,
        summary: data.summary || "",
        keyword: data.keyword || "",
        metaDescription: data.metaDescription || "",
        coverImage: data.coverImage || "",
        publishedAt: String(data.publishedAt || new Date().toISOString().slice(0, 10)).slice(0, 10),
        tags: Array.isArray(data.tags) ? data.tags : [],
        draft: Boolean(data.draft),
        body,
      };
    }),
  );
}

function toRecord(collection, id, payload) {
  const order = Number(payload.order);
  return {
    collection,
    id,
    slug: typeof payload.slug === "string" && payload.slug ? payload.slug : id,
    order_index: Number.isFinite(order) ? order : null,
    payload,
  };
}

async function upsertMany(collection, entries, getId = (entry) => entry.slug) {
  if (entries.length === 0) return 0;

  const records = entries.map((entry) => toRecord(collection, getId(entry), entry));
  const { error } = await supabase
    .from("cms_entries")
    .upsert(records, { onConflict: "collection,id" });

  if (error) throw new Error(`Failed migrating ${collection}: ${error.message}`);
  return records.length;
}

const collections = ["categories", "amenities", "cities", "districts", "tags", "articles"];
const stats = [];

stats.push([
  "cms_projects",
  await upsertMany("cms_projects", await readJsonCollection(path.join(rootDir, "src/content/projects"))),
]);

stats.push([
  "cms_photos",
  await upsertMany("cms_photos", await readJsonCollection(path.join(rootDir, "src/content/photos"))),
]);

const gearPath = path.join(rootDir, "src/content/gear/setup.json");
if (existsSync(gearPath)) {
  stats.push(["cms_gear", await upsertMany("cms_gear", [await readJsonFile(gearPath)], () => "setup")]);
}

stats.push([
  "cms_writing",
  await upsertMany("cms_writing", await readMarkdownWriting(path.join(rootDir, "src/content/writing"))),
]);

stats.push([
  "writing_posts",
  await upsertMany("writing_posts", await readJsonCollection(path.join(rootDir, "data/writing-posts")), (entry) => entry.id),
]);

for (const collection of collections) {
  stats.push([
    `cms_${collection}`,
    await upsertMany(`cms_${collection}`, await readJsonCollection(path.join(rootDir, "data/cms", collection))),
  ]);
}

console.log("Migrated CMS data to Supabase:");
for (const [collection, count] of stats) {
  console.log(`- ${collection}: ${count}`);
}
