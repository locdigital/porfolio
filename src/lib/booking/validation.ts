export function asString(value: unknown, max: number) {
  return String(value ?? "").trim().slice(0, max);
}

export function assertEmail(email: string) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Email không hợp lệ.");
}

export function assertDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error("Ngày không hợp lệ.");
}

export function assertIso(value: string) {
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime())) throw new Error("Thời gian không hợp lệ.");
}

export function rateLimitKey(prefix: string, id: string) {
  return `${prefix}:${id}`;
}

const memoryHits = new Map<string, number[]>();

export function assertMemoryRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const hits = (memoryHits.get(key) ?? []).filter((time) => now - time < windowMs);
  if (hits.length >= limit) throw new Error("Bạn thao tác quá nhanh. Vui lòng thử lại sau.");
  hits.push(now);
  memoryHits.set(key, hits);
}
