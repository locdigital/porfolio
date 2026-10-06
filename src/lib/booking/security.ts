import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { APIContext } from "astro";

function secret() {
  return process.env.BOOKING_ADMIN_TOKEN || process.env.CMS_SESSION_SECRET || "";
}

export function isBookingAdminRequest(request: Request) {
  const expected = process.env.BOOKING_ADMIN_TOKEN;
  if (!expected) return false;

  const auth = request.headers.get("authorization") || "";
  const bearer = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7) : "";
  const headerToken = request.headers.get("x-booking-admin-token") || "";
  const cookieToken = request.headers.get("cookie")?.match(/(?:^|;\s*)booking_admin=([^;]+)/)?.[1] ?? "";
  const provided = bearer || headerToken || decodeURIComponent(cookieToken);

  if (!provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function requireBookingAdmin(context: APIContext) {
  if (!isBookingAdminRequest(context.request)) {
    return new Response(JSON.stringify({ success: false, error: "Unauthorized." }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  return null;
}

function encryptionKey() {
  const raw = process.env.BOOKING_TOKEN_ENCRYPTION_KEY || secret();
  if (!raw) throw new Error("Missing BOOKING_TOKEN_ENCRYPTION_KEY or BOOKING_ADMIN_TOKEN.");
  return createHash("sha256").update(raw).digest();
}

export function encryptSecret(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64")}.${tag.toString("base64")}.${encrypted.toString("base64")}`;
}

export function decryptSecret(payload?: string | null) {
  if (!payload) return "";
  const [ivRaw, tagRaw, encryptedRaw] = payload.split(".");
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(ivRaw, "base64"));
  decipher.setAuthTag(Buffer.from(tagRaw, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(encryptedRaw, "base64")), decipher.final()]).toString("utf8");
}

export function signState(payload: Record<string, unknown>) {
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + 10 * 60_000 })).toString("base64url");
  const sig = createHmac("sha256", secret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verifyState(state: string) {
  const [body, sig] = state.split(".");
  if (!body || !sig || !secret()) throw new Error("Invalid OAuth state.");
  const expected = createHmac("sha256", secret()).update(body).digest("base64url");
  if (expected.length !== sig.length || !timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) {
    throw new Error("Invalid OAuth state.");
  }
  const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  if (!payload.exp || payload.exp < Date.now()) throw new Error("Expired OAuth state.");
  return payload;
}

export function clientIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}
