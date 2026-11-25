interface CacheEntry<T> {
  data?: T;
  expiresAt: number;
  inflight?: Promise<T | null>;
}

const DEFAULT_TTL_MS = 5 * 60 * 1000;
const memoryCache = new Map<string, CacheEntry<unknown>>();

/**
 * Deduplicates concurrent client-side JSON fetches and caches resolved responses
 * in memory. Expired entries are revalidated and serve as a fallback on error.
 */
export async function fetchJsonDeduped<T>(
  url: string,
  options?: { ttlMs?: number; fetchImpl?: typeof fetch },
): Promise<T | null> {
  const ttlMs = options?.ttlMs ?? DEFAULT_TTL_MS;
  const runFetch = options?.fetchImpl ?? fetch;
  const now = Date.now();
  const existing = memoryCache.get(url) as CacheEntry<T> | undefined;

  if (existing?.data !== undefined && existing.expiresAt > now) {
    return existing.data;
  }

  if (existing?.inflight) {
    return existing.inflight;
  }

  const requestPromise = runFetch(url)
    .then(async (res) => {
      if (!res.ok) return existing?.data ?? null;
      const parsed = (await res.json()) as T;
      memoryCache.set(url, {
        data: parsed,
        expiresAt: Date.now() + ttlMs,
      });
      return parsed;
    })
    .catch(() => existing?.data ?? null)
    .finally(() => {
      const current = memoryCache.get(url) as CacheEntry<T> | undefined;
      if (current?.inflight === requestPromise) {
        delete current.inflight;
      }
    });

  memoryCache.set(url, {
    data: existing?.data,
    expiresAt: existing?.expiresAt ?? 0,
    inflight: requestPromise,
  });

  return requestPromise;
}

export function prefetchJson(url: string, options?: { ttlMs?: number; fetchImpl?: typeof fetch }): void {
  void fetchJsonDeduped(url, options);
}

export function clearClientCache(): void {
  memoryCache.clear();
}
