import type { Collection } from "mongodb";
import { getMongoDb, isMongoConfigured } from "./mongodb";

export type CmsMongoDocument<T extends object> = T & { _id: string };

const readyCollections = new Set<string>();

export async function getCmsCollection<T extends object>(
  name: string,
): Promise<Collection<CmsMongoDocument<T>> | null> {
  if (!isMongoConfigured()) return null;

  const db = await getMongoDb();
  const collection = db.collection<CmsMongoDocument<T>>(name);

  if (!readyCollections.has(name)) {
    await collection.createIndex({ slug: 1 });
    await collection.createIndex({ order: 1 });
    readyCollections.add(name);
  }

  return collection;
}

export function stripMongoId<T extends object>(
  document: CmsMongoDocument<T>,
): T {
  const { _id, ...rest } = document;
  return rest as T;
}

export function createMongoDocument<T extends object>(
  id: string,
  value: T,
): CmsMongoDocument<T> {
  const document = { ...value, _id: id } as Record<string, unknown>;
  return Object.fromEntries(
    Object.entries(document).filter(([, entry]) => entry !== undefined),
  ) as CmsMongoDocument<T>;
}
