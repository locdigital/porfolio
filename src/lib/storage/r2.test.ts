import { describe, expect, it, vi } from "vitest";
import {
  buildR2Endpoint,
  buildR2PublicUrl,
  createR2Client,
  defaultCacheControlForKey,
  normalizeObjectKey,
  signR2Request,
  verifyR2Credentials,
} from "./r2";

describe("Cloudflare R2 storage client", () => {
  it("validates missing and complete R2 credentials from env", () => {
    const empty = verifyR2Credentials({});
    expect(empty.configured).toBe(false);
    expect(empty.missing).toEqual([
      "R2_ACCOUNT_ID",
      "R2_ACCESS_KEY_ID",
      "R2_SECRET_ACCESS_KEY",
    ]);

    const full = verifyR2Credentials({
      R2_ACCOUNT_ID: "abcdef1234567890",
      R2_ACCESS_KEY_ID: "access-key-test",
      R2_SECRET_ACCESS_KEY: "secret-key-test",
      R2_BUCKET_NAME: "loc-digital-assets",
      PUBLIC_ASSET_BASE_URL: "https://assets.loc.digital/",
    });
    expect(full.configured).toBe(true);
    expect(full.missing).toEqual([]);
    expect(full.endpoint).toBe("https://abcdef1234567890.r2.cloudflarestorage.com");
    expect(full.publicBaseUrl).toBe("https://assets.loc.digital");
  });

  it("builds safe endpoints, object keys, and public asset URLs", () => {
    expect(buildR2Endpoint("abcdef1234567890")).toBe(
      "https://abcdef1234567890.r2.cloudflarestorage.com",
    );
    expect(() => buildR2Endpoint("bad id!")).toThrow();

    expect(normalizeObjectKey("/media//photos/sa-pa/frame.webp")).toBe(
      "media/photos/sa-pa/frame.webp",
    );
    expect(() => normalizeObjectKey("../secret")).toThrow();

    expect(
      buildR2PublicUrl("media/photos/sa-pa/frame 1.480w.a1b2c3d4e5f6.webp", "https://assets.loc.digital"),
    ).toBe("https://assets.loc.digital/media/photos/sa-pa/frame%201.480w.a1b2c3d4e5f6.webp");
  });

  it("applies immutable caching only to content-hashed keys", () => {
    expect(defaultCacheControlForKey("media/photos/frame.1200w.a1b2c3d4e5f6.webp")).toBe(
      "public, max-age=31536000, immutable",
    );
    expect(defaultCacheControlForKey("media/photos/latest.webp")).toBe(
      "public, max-age=3600, stale-while-revalidate=86400",
    );
  });

  it("produces deterministic AWS SigV4 signatures", () => {
    const signed = signR2Request({
      method: "PUT",
      url: new URL("https://abcdef1234567890.r2.cloudflarestorage.com/loc-digital-assets/test.webp"),
      headers: { "content-type": "image/webp" },
      body: new TextEncoder().encode("sample-bytes"),
      accessKeyId: "AKIAEXAMPLEKEY",
      secretAccessKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
      now: new Date("2026-11-26T12:00:00.000Z"),
    });

    expect(signed["x-amz-date"]).toBe("20261126T120000Z");
    expect(signed.authorization).toMatch(
      /^AWS4-HMAC-SHA256 Credential=AKIAEXAMPLEKEY\/20261126\/auto\/s3\/aws4_request, SignedHeaders=content-type;host;x-amz-content-sha256;x-amz-date, Signature=[a-f0-9]{64}$/,
    );
  });

  it("executes putObject, headObject, listObjects, and verifyPublicObject with mocked fetch", async () => {
    const mockFetch = vi.fn(async (input: URL | RequestInfo, init?: RequestInit) => {
      const url = String(input);
      if (init?.method === "PUT") {
        return new Response(null, { status: 200, headers: { etag: '"abc123"' } });
      }
      if (init?.method === "HEAD" && url.startsWith("https://assets.loc.digital/")) {
        return new Response(null, {
          status: 200,
          headers: { "content-type": "image/webp", "content-length": "12" },
        });
      }
      if (init?.method === "HEAD") {
        return new Response(null, {
          status: 200,
          headers: {
            etag: '"abc123"',
            "content-length": "12",
            "content-type": "image/webp",
            "cache-control": "public, max-age=31536000, immutable",
          },
        });
      }
      return new Response(
        `<ListBucketResult><IsTruncated>false</IsTruncated><Contents><Key>media/test.480w.a1b2c3d4e5f6.webp</Key><Size>12</Size><ETag>&quot;abc123&quot;</ETag></Contents></ListBucketResult>`,
        { status: 200, headers: { "content-type": "application/xml" } },
      );
    });

    const client = createR2Client(
      {
        accountId: "abcdef1234567890",
        accessKeyId: "test-key",
        secretAccessKey: "test-secret",
        bucketName: "loc-digital-assets",
        publicBaseUrl: "https://assets.loc.digital",
      },
      mockFetch as unknown as typeof fetch,
    );

    const key = "media/test.480w.a1b2c3d4e5f6.webp";
    const put = await client.putObject({
      key,
      body: new TextEncoder().encode("123456789012"),
      contentType: "image/webp",
    });
    expect(put.etag).toBe("abc123");
    expect(put.publicUrl).toBe(`https://assets.loc.digital/${key}`);

    const head = await client.headObject(key);
    expect(head.exists).toBe(true);
    expect(head.contentLength).toBe(12);

    const verified = await client.verifyPublicObject(key, 12);
    expect(verified.ok).toBe(true);

    const list = await client.listObjects({ prefix: "media/" });
    expect(list.objects).toHaveLength(1);
    expect(list.objects[0].key).toBe(key);
  });
});
