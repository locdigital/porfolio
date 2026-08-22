import { getSupabaseServerClient, isSupabaseServerConfigured } from "./supabase-server";

type CmsEntryRecord = {
  collection: string;
  id: string;
  slug: string;
  order_index: number | null;
  payload: Record<string, unknown>;
};

export function isSupabaseCmsConfigured() {
  return isSupabaseServerConfigured();
}

function withoutUndefined<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined),
  ) as T;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function entrySlug(id: string, value: Record<string, unknown>) {
  return typeof value.slug === "string" && value.slug.trim() ? value.slug.trim() : id;
}

function entryOrder(value: Record<string, unknown>) {
  const order = Number(value.order);
  return Number.isFinite(order) ? order : null;
}

function formatSupabaseError(error: { message: string; code?: string; details?: string } | null) {
  if (!error) return "Unknown Supabase error.";
  const details = error.details ? ` ${error.details}` : "";
  return `Supabase error${error.code ? ` ${error.code}` : ""}: ${error.message}${details}`;
}

function rowToPayload<T extends object>(row: { payload: unknown }): T {
  return asRecord(row.payload) as T;
}

export async function readSupabaseCmsEntry<T extends object>(
  collectionName: string,
  id: string,
): Promise<T | null> {
  if (!isSupabaseCmsConfigured()) return null;

  try {
    const { data, error } = await getSupabaseServerClient()
      .from("cms_entries")
      .select("payload")
      .eq("collection", collectionName)
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.warn(`[Supabase CMS] ${formatSupabaseError(error)}`);
      return null;
    }
    return data ? rowToPayload<T>(data) : null;
  } catch (err) {
    console.warn(`[Supabase CMS] Network or fetch error reading entry ${id}:`, err);
    return null;
  }
}

export async function findSupabaseCmsEntryBySlug<T extends object>(
  collectionName: string,
  slug: string,
): Promise<T | null> {
  if (!isSupabaseCmsConfigured()) return null;

  try {
    const { data, error } = await getSupabaseServerClient()
      .from("cms_entries")
      .select("payload")
      .eq("collection", collectionName)
      .eq("slug", slug)
      .maybeSingle();

    if (error) {
      console.warn(`[Supabase CMS] ${formatSupabaseError(error)}`);
      return null;
    }
    return data ? rowToPayload<T>(data) : null;
  } catch (err) {
    console.warn(`[Supabase CMS] Network or fetch error finding entry by slug ${slug}:`, err);
    return null;
  }
}

export async function readSupabaseCmsCollection<T extends object>(
  collectionName: string,
): Promise<T[]> {
  if (!isSupabaseCmsConfigured()) return [];

  try {
    const { data, error } = await getSupabaseServerClient()
      .from("cms_entries")
      .select("payload")
      .eq("collection", collectionName)
      .order("order_index", { ascending: true, nullsFirst: false })
      .order("updated_at", { ascending: false });

    if (error) {
      console.warn(`[Supabase CMS] ${formatSupabaseError(error)}`);
      return [];
    }
    return (data ?? []).map(rowToPayload<T>);
  } catch (err) {
    console.warn(`[Supabase CMS] Network or fetch error reading collection ${collectionName}:`, err);
    return [];
  }
}

export async function writeSupabaseCmsEntry<T extends object>(
  collectionName: string,
  id: string,
  value: T,
): Promise<T> {
  if (!isSupabaseCmsConfigured()) {
    throw new Error("Supabase CMS storage is not configured.");
  }

  const payload = withoutUndefined({ ...value } as Record<string, unknown>);
  const record: CmsEntryRecord = {
    collection: collectionName,
    id,
    slug: entrySlug(id, payload),
    order_index: entryOrder(payload),
    payload,
  };

  const { error } = await getSupabaseServerClient()
    .from("cms_entries")
    .upsert(record, { onConflict: "collection,id" });

  if (error) throw new Error(formatSupabaseError(error));
  return value;
}

export async function deleteSupabaseCmsEntry(collectionName: string, id: string): Promise<void> {
  if (!isSupabaseCmsConfigured()) return;

  const { error } = await getSupabaseServerClient()
    .from("cms_entries")
    .delete()
    .eq("collection", collectionName)
    .eq("id", id);

  if (error) throw new Error(formatSupabaseError(error));
}
