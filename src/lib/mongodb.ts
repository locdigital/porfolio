import { MongoClient, type Db } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || getDatabaseNameFromUri(uri) || "portfolio";

declare global {
  // eslint-disable-next-line no-var
  var __mongoClientPromise: Promise<MongoClient> | undefined;
}

function getDatabaseNameFromUri(value?: string): string | undefined {
  if (!value) return undefined;
  try {
    const pathname = new URL(value).pathname.replace(/^\//, "");
    return pathname || undefined;
  } catch {
    return undefined;
  }
}

export function isMongoConfigured(): boolean {
  return Boolean(uri);
}

export async function getMongoDb(): Promise<Db> {
  if (!uri) {
    throw new Error("MONGODB_URI is not configured");
  }

  if (!globalThis.__mongoClientPromise) {
    const client = new MongoClient(uri);
    globalThis.__mongoClientPromise = client.connect();
  }

  const client = await globalThis.__mongoClientPromise;
  return client.db(dbName);
}
