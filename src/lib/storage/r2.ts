/**
 * Server-only Cloudflare R2 S3-compatible storage client.
 *
 * Uses native Node.js `node:crypto` AWS Signature V4 signing and Web `fetch`,
 * requiring zero external SDK dependencies. Never import this module into
 * client-side browser bundles or expose credentials to the browser.
 */
import { createHash, createHmac } from "node:crypto";
import { CACHE_CONTROL, R2_BUCKET_NAME, R2_PUBLIC_ORIGIN } from "@/config/site";

export interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicBaseUrl: string;
}

export interface R2CredentialStatus {
  configured: boolean;
  bucketName: string;
  publicBaseUrl: string;
  endpoint?: string;
  missing: string[];
}

export interface R2ObjectMetadata {
  key: string;
  exists: boolean;
  etag?: string;
  contentLength?: number;
  contentType?: string;
  cacheControl?: string;
  lastModified?: string;
}

export interface R2PutObjectInput {
  key: string;
  body: Uint8Array | Buffer;
  contentType: string;
  cacheControl?: string;
  contentDisposition?: string;
  metadata?: Record<string, string>;
}

export interface R2PutObjectResult {
  key: string;
  etag?: string;
  publicUrl: string;
  bytes: number;
}

export interface R2ListedObject {
  key: string;
  size: number;
  etag?: string;
  lastModified?: string;
}

export interface R2ListObjectsResult {
  objects: R2ListedObject[];
  isTruncated: boolean;
  nextContinuationToken?: string;
}

const AWS_REGION = "auto";
const AWS_SERVICE = "s3";
const HASHED_KEY_PATTERN = /\.[a-f0-9]{8,64}\.[a-z0-9]+$/i;

function assertServerOnly(): void {
  if (typeof window !== "undefined") {
    throw new Error("src/lib/storage/r2.ts is server-only and must never run in the browser.");
  }
}

export function normalizeObjectKey(key: string): string {
  const cleaned = key.replace(/^\/+/, "").replace(/\/{2,}/g, "/");
  if (!cleaned || cleaned.includes("..")) {
    throw new Error(`Invalid R2 object key: "${key}"`);
  }
  return cleaned;
}

export function encodeR2KeyPath(key: string): string {
  return normalizeObjectKey(key)
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

export function normalizePublicBaseUrl(rawUrl?: string): string {
  const value = (rawUrl || R2_PUBLIC_ORIGIN).trim().replace(/\/+$/, "");
  const parsed = new URL(value);
  if (parsed.protocol !== "https:" && parsed.hostname !== "localhost") {
    throw new Error("PUBLIC_ASSET_BASE_URL must use https://");
  }
  return parsed.origin + parsed.pathname.replace(/\/+$/, "");
}

export function buildR2Endpoint(accountId: string): string {
  const trimmed = accountId.trim();
  if (!/^[a-zA-Z0-9_-]{8,64}$/.test(trimmed)) {
    throw new Error("Invalid R2_ACCOUNT_ID format.");
  }
  return `https://${trimmed}.r2.cloudflarestorage.com`;
}

export function buildR2PublicUrl(key: string, publicBaseUrl?: string): string {
  const base = normalizePublicBaseUrl(publicBaseUrl);
  return `${base}/${encodeR2KeyPath(key)}`;
}

export function defaultCacheControlForKey(key: string): string {
  return HASHED_KEY_PATTERN.test(key)
    ? CACHE_CONTROL.immutableAsset
    : CACHE_CONTROL.mutableAsset;
}

export function verifyR2Credentials(
  env: Record<string, string | undefined> = process.env,
): R2CredentialStatus {
  assertServerOnly();
  const accountId = env.R2_ACCOUNT_ID?.trim() || "";
  const accessKeyId = env.R2_ACCESS_KEY_ID?.trim() || "";
  const secretAccessKey = env.R2_SECRET_ACCESS_KEY?.trim() || "";
  const bucketName = env.R2_BUCKET_NAME?.trim() || R2_BUCKET_NAME;
  const publicBaseUrl = normalizePublicBaseUrl(env.PUBLIC_ASSET_BASE_URL || R2_PUBLIC_ORIGIN);

  const missing: string[] = [];
  if (!accountId) missing.push("R2_ACCOUNT_ID");
  if (!accessKeyId) missing.push("R2_ACCESS_KEY_ID");
  if (!secretAccessKey) missing.push("R2_SECRET_ACCESS_KEY");
  if (!bucketName) missing.push("R2_BUCKET_NAME");

  return {
    configured: missing.length === 0,
    bucketName,
    publicBaseUrl,
    endpoint: accountId ? buildR2Endpoint(accountId) : undefined,
    missing,
  };
}

export function getR2Config(
  env: Record<string, string | undefined> = process.env,
): R2Config {
  const status = verifyR2Credentials(env);
  if (!status.configured) {
    throw new Error(
      `Cloudflare R2 credentials are incomplete. Missing: ${status.missing.join(", ")}`,
    );
  }
  return {
    accountId: env.R2_ACCOUNT_ID!.trim(),
    accessKeyId: env.R2_ACCESS_KEY_ID!.trim(),
    secretAccessKey: env.R2_SECRET_ACCESS_KEY!.trim(),
    bucketName: status.bucketName,
    publicBaseUrl: status.publicBaseUrl,
  };
}

function sha256Hex(data: string | Uint8Array): string {
  return createHash("sha256").update(data).digest("hex");
}

function hmacSha256(key: string | Buffer, data: string): Buffer {
  return createHmac("sha256", key).update(data).digest();
}

function formatAmzDate(date: Date): { amzDate: string; dateStamp: string } {
  const iso = date.toISOString().replace(/[:-]|\.\d{3}/g, "");
  return {
    amzDate: iso,
    dateStamp: iso.slice(0, 8),
  };
}

function encodeRfc3986(value: string): string {
  return encodeURIComponent(value).replace(
    /[!'()*]/g,
    (ch) => `%${ch.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

export interface SignedRequestParams {
  method: "GET" | "HEAD" | "PUT" | "DELETE";
  url: URL;
  headers?: Record<string, string>;
  body?: Uint8Array | Buffer;
  accessKeyId: string;
  secretAccessKey: string;
  now?: Date;
}

/**
 * Generates AWS Signature Version 4 headers for an S3-compatible Cloudflare R2 request.
 */
export function signR2Request(params: SignedRequestParams): Record<string, string> {
  assertServerOnly();
  const {
    method,
    url,
    headers = {},
    body = new Uint8Array(0),
    accessKeyId,
    secretAccessKey,
    now = new Date(),
  } = params;

  const { amzDate, dateStamp } = formatAmzDate(now);
  const payloadHash = sha256Hex(body);

  const normalizedHeaders: Record<string, string> = {
    host: url.host,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": amzDate,
  };

  for (const [k, v] of Object.entries(headers)) {
    const lower = k.toLowerCase().trim();
    if (lower === "authorization") continue;
    normalizedHeaders[lower] = v.trim().replace(/\s+/g, " ");
  }

  const sortedHeaderKeys = Object.keys(normalizedHeaders).sort();
  const canonicalHeaders = sortedHeaderKeys
    .map((key) => `${key}:${normalizedHeaders[key]}\n`)
    .join("");
  const signedHeaders = sortedHeaderKeys.join(";");

  const queryPairs = Array.from(url.searchParams.entries()).sort(([ak, av], [bk, bv]) =>
    ak === bk ? av.localeCompare(bv) : ak.localeCompare(bk),
  );
  const canonicalQuery = queryPairs
    .map(([k, v]) => `${encodeRfc3986(k)}=${encodeRfc3986(v)}`)
    .join("&");

  const canonicalRequest = [
    method,
    url.pathname || "/",
    canonicalQuery,
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");

  const credentialScope = `${dateStamp}/${AWS_REGION}/${AWS_SERVICE}/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join("\n");

  const kDate = hmacSha256(`AWS4${secretAccessKey}`, dateStamp);
  const kRegion = hmacSha256(kDate, AWS_REGION);
  const kService = hmacSha256(kRegion, AWS_SERVICE);
  const kSigning = hmacSha256(kService, "aws4_request");
  const signature = createHmac("sha256", kSigning).update(stringToSign).digest("hex");

  const authorization = `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  return {
    ...normalizedHeaders,
    authorization,
  };
}

function decodeXmlEntities(text: string): string {
  return text
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'");
}

function parseListObjectsXml(xml: string): R2ListObjectsResult {
  const objects: R2ListedObject[] = [];
  const contentsRegex = /<Contents>([\s\S]*?)<\/Contents>/g;
  let match: RegExpExecArray | null;
  while ((match = contentsRegex.exec(xml)) !== null) {
    const block = match[1];
    const keyMatch = /<Key>([\s\S]*?)<\/Key>/.exec(block);
    const sizeMatch = /<Size>(\d+)<\/Size>/.exec(block);
    const etagMatch = /<ETag>([\s\S]*?)<\/ETag>/.exec(block);
    const modifiedMatch = /<LastModified>([\s\S]*?)<\/LastModified>/.exec(block);
    if (keyMatch) {
      objects.push({
        key: decodeXmlEntities(keyMatch[1]),
        size: sizeMatch ? Number(sizeMatch[1]) : 0,
        etag: etagMatch ? decodeXmlEntities(etagMatch[1]).replaceAll('"', "") : undefined,
        lastModified: modifiedMatch ? decodeXmlEntities(modifiedMatch[1]) : undefined,
      });
    }
  }

  const truncatedMatch = /<IsTruncated>(true|false)<\/IsTruncated>/i.exec(xml);
  const tokenMatch = /<NextContinuationToken>([\s\S]*?)<\/NextContinuationToken>/.exec(xml);

  return {
    objects,
    isTruncated: truncatedMatch?.[1]?.toLowerCase() === "true",
    nextContinuationToken: tokenMatch ? decodeXmlEntities(tokenMatch[1]) : undefined,
  };
}

export function createR2Client(configInput?: Partial<R2Config>, fetchImpl: typeof fetch = fetch) {
  assertServerOnly();
  const baseConfig =
    configInput?.accountId && configInput?.accessKeyId && configInput?.secretAccessKey
      ? {
          accountId: configInput.accountId.trim(),
          accessKeyId: configInput.accessKeyId.trim(),
          secretAccessKey: configInput.secretAccessKey.trim(),
          bucketName: configInput.bucketName?.trim() || R2_BUCKET_NAME,
          publicBaseUrl: normalizePublicBaseUrl(configInput.publicBaseUrl),
        }
      : {
          ...getR2Config(),
          ...configInput,
        };

  const endpoint = buildR2Endpoint(baseConfig.accountId);

  function objectUrl(key?: string, query?: Record<string, string | undefined>): URL {
    const pathname = key
      ? `/${encodeURIComponent(baseConfig.bucketName)}/${encodeR2KeyPath(key)}`
      : `/${encodeURIComponent(baseConfig.bucketName)}`;
    const url = new URL(pathname, endpoint);
    if (query) {
      for (const [k, v] of Object.entries(query)) {
        if (v !== undefined && v !== "") url.searchParams.set(k, v);
      }
    }
    return url;
  }

  async function request(
    method: "GET" | "HEAD" | "PUT" | "DELETE",
    url: URL,
    options: { headers?: Record<string, string>; body?: Uint8Array | Buffer; timeoutMs?: number } = {},
  ): Promise<Response> {
    const signedHeaders = signR2Request({
      method,
      url,
      headers: options.headers,
      body: options.body,
      accessKeyId: baseConfig.accessKeyId,
      secretAccessKey: baseConfig.secretAccessKey,
    });
    // Remove synthetic host header before passing to Fetch API (runtime manages Host)
    const { host: _host, ...requestHeaders } = signedHeaders;
    return fetchImpl(url, {
      method,
      headers: requestHeaders,
      body: options.body ? new Uint8Array(options.body) : undefined,
      signal: AbortSignal.timeout(options.timeoutMs ?? 30_000),
    });
  }

  return {
    config: {
      bucketName: baseConfig.bucketName,
      publicBaseUrl: baseConfig.publicBaseUrl,
      endpoint,
    },

    publicUrl(key: string): string {
      return buildR2PublicUrl(key, baseConfig.publicBaseUrl);
    },

    async headObject(key: string): Promise<R2ObjectMetadata> {
      const normalized = normalizeObjectKey(key);
      const res = await request("HEAD", objectUrl(normalized));
      if (res.status === 404) {
        return { key: normalized, exists: false };
      }
      if (!res.ok) {
        throw new Error(`R2 HEAD failed for "${normalized}" with HTTP ${res.status}`);
      }
      const len = res.headers.get("content-length");
      return {
        key: normalized,
        exists: true,
        etag: res.headers.get("etag")?.replaceAll('"', "") || undefined,
        contentLength: len ? Number(len) : undefined,
        contentType: res.headers.get("content-type") || undefined,
        cacheControl: res.headers.get("cache-control") || undefined,
        lastModified: res.headers.get("last-modified") || undefined,
      };
    },

    async putObject(input: R2PutObjectInput): Promise<R2PutObjectResult> {
      const normalized = normalizeObjectKey(input.key);
      const headers: Record<string, string> = {
        "content-type": input.contentType,
        "cache-control": input.cacheControl ?? defaultCacheControlForKey(normalized),
        "content-disposition": input.contentDisposition ?? "inline",
      };
      if (input.metadata) {
        for (const [k, v] of Object.entries(input.metadata)) {
          const safeKey = k.toLowerCase().replace(/[^a-z0-9-]/g, "");
          if (safeKey) headers[`x-amz-meta-${safeKey}`] = String(v);
        }
      }

      const res = await request("PUT", objectUrl(normalized), {
        headers,
        body: input.body,
        timeoutMs: 60_000,
      });
      if (!res.ok) {
        throw new Error(`R2 PUT failed for "${normalized}" with HTTP ${res.status}`);
      }
      return {
        key: normalized,
        etag: res.headers.get("etag")?.replaceAll('"', "") || undefined,
        publicUrl: buildR2PublicUrl(normalized, baseConfig.publicBaseUrl),
        bytes: input.body.byteLength,
      };
    },

    async deleteObject(key: string): Promise<void> {
      const normalized = normalizeObjectKey(key);
      const res = await request("DELETE", objectUrl(normalized));
      if (!res.ok && res.status !== 404) {
        throw new Error(`R2 DELETE failed for "${normalized}" with HTTP ${res.status}`);
      }
    },

    async listObjects(
      options: { prefix?: string; continuationToken?: string; maxKeys?: number } = {},
    ): Promise<R2ListObjectsResult> {
      const url = objectUrl(undefined, {
        "list-type": "2",
        prefix: options.prefix,
        "continuation-token": options.continuationToken,
        "max-keys": options.maxKeys ? String(options.maxKeys) : undefined,
      });
      const res = await request("GET", url);
      if (!res.ok) {
        throw new Error(`R2 ListObjectsV2 failed with HTTP ${res.status}`);
      }
      const xml = await res.text();
      return parseListObjectsXml(xml);
    },

    async verifyPublicObject(
      key: string,
      expectedBytes?: number,
    ): Promise<{ ok: boolean; status: number; contentType?: string; contentLength?: number; url: string }> {
      const url = buildR2PublicUrl(key, baseConfig.publicBaseUrl);
      const res = await fetchImpl(url, {
        method: "HEAD",
        redirect: "error",
        signal: AbortSignal.timeout(15_000),
      });
      const contentType = res.headers.get("content-type") || undefined;
      const lenHeader = res.headers.get("content-length");
      const contentLength = lenHeader ? Number(lenHeader) : undefined;
      const sizeMatches = expectedBytes === undefined || contentLength === undefined || contentLength === expectedBytes;
      return {
        ok: res.ok && sizeMatches,
        status: res.status,
        contentType,
        contentLength,
        url,
      };
    },
  };
}
