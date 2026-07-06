import { existsSync, readFileSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { MongoClient } from "mongodb";

const rootDir = process.cwd();
const postsDir = path.join(rootDir, "data", "writing-posts");

loadEnvFile(path.join(rootDir, ".env"));
loadEnvFile(path.join(rootDir, ".env.local"));

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || getDatabaseNameFromUri(uri) || "portfolio";

if (!uri) {
  console.error("Missing MONGODB_URI. Add it to .env.local before running this script.");
  process.exit(1);
}

if (!existsSync(postsDir)) {
  console.log("No data/writing-posts directory found. Nothing to migrate.");
  process.exit(0);
}

const client = new MongoClient(uri);

try {
  await client.connect();
  const collection = client.db(dbName).collection("writing_posts");
  await collection.createIndex({ slug: 1 });
  await collection.createIndex({ status: 1, updatedAt: -1 });

  const files = (await readdir(postsDir)).filter((file) => file.endsWith(".json"));
  let migrated = 0;
  let skipped = 0;

  for (const file of files) {
    try {
      const content = await readFile(path.join(postsDir, file), "utf-8");
      const post = JSON.parse(content);
      if (!post.id) {
        skipped += 1;
        console.warn(`Skipped ${file}: missing id`);
        continue;
      }

      const storedPost = removeUndefined({ ...post, _id: post.id });
      await collection.replaceOne({ _id: post.id }, storedPost, { upsert: true });
      migrated += 1;
    } catch (error) {
      skipped += 1;
      console.warn(`Skipped ${file}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  console.log(`Migrated ${migrated} writing post(s) to MongoDB database "${dbName}".`);
  if (skipped > 0) {
    console.log(`Skipped ${skipped} file(s).`);
  }
} finally {
  await client.close();
}

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return;

  const content = readFileSync(filePath, "utf-8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function getDatabaseNameFromUri(value) {
  if (!value) return undefined;
  try {
    const pathname = new URL(value).pathname.replace(/^\//, "");
    return pathname || undefined;
  } catch {
    return undefined;
  }
}

function removeUndefined(value) {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined));
}
