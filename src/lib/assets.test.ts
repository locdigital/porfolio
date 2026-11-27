import { describe, expect, it } from "vitest";
import {
  buildR2ResponsiveImage,
  getAssetCatalogStats,
  getAssetPlaceholder,
  getImageStorageProvider,
  isR2AssetUrl,
  isTrustedAssetUrl,
  isUploadThingAssetUrl,
  normalizeLocalAssetPath,
  resolveAssetUrl,
  type R2AssetManifest,
} from "./assets";

const sampleManifest: R2AssetManifest = {
  version: 1,
  bucket: "loc-digital-assets",
  publicBaseUrl: "https://assets.loc.digital",
  generatedAt: "2026-11-26T15:00:00.000Z",
  totals: { assets: 1, variants: 5, bytes: 250000 },
  assets: {
    "/assets/photos/sa-pa/sample.webp": {
      sourcePath: "/assets/photos/sa-pa/sample.webp",
      hash: "deadbeef1234567890",
      width: 1920,
      height: 1280,
      aspectRatio: 1.5,
      contentType: "image/webp",
      bytes: 400000,
      blurDataURL: "data:image/webp;base64,UklGRh4AAABXRUJQVlA4TBEAAAAvAAAAAAfQ//73v/+BiOh/AAA=",
      thumbnail: {
        width: 320,
        height: 213,
        format: "webp",
        key: "media/assets/photos/sa-pa/sample.thumb.a1b2c3d4e5f6.webp",
        url: "https://assets.loc.digital/media/assets/photos/sa-pa/sample.thumb.a1b2c3d4e5f6.webp",
        bytes: 12000,
      },
      variants: [
        {
          width: 480,
          height: 320,
          format: "webp",
          key: "media/assets/photos/sa-pa/sample.480w.a1b2c3d4e5f6.webp",
          url: "https://assets.loc.digital/media/assets/photos/sa-pa/sample.480w.a1b2c3d4e5f6.webp",
          bytes: 22000,
        },
        {
          width: 768,
          height: 512,
          format: "webp",
          key: "media/assets/photos/sa-pa/sample.768w.b1b2c3d4e5f6.webp",
          url: "https://assets.loc.digital/media/assets/photos/sa-pa/sample.768w.b1b2c3d4e5f6.webp",
          bytes: 45000,
        },
        {
          width: 1200,
          height: 800,
          format: "webp",
          key: "media/assets/photos/sa-pa/sample.1200w.c1b2c3d4e5f6.webp",
          url: "https://assets.loc.digital/media/assets/photos/sa-pa/sample.1200w.c1b2c3d4e5f6.webp",
          bytes: 85000,
        },
        {
          width: 1920,
          height: 1280,
          format: "webp",
          key: "media/assets/photos/sa-pa/sample.1920w.d1b2c3d4e5f6.webp",
          url: "https://assets.loc.digital/media/assets/photos/sa-pa/sample.1920w.d1b2c3d4e5f6.webp",
          bytes: 160000,
        },
        {
          width: 1200,
          height: 800,
          format: "avif",
          key: "media/assets/photos/sa-pa/sample.1200w.e1b2c3d4e5f6.avif",
          url: "https://assets.loc.digital/media/assets/photos/sa-pa/sample.1200w.e1b2c3d4e5f6.avif",
          bytes: 60000,
        },
      ],
      verifiedAt: "2026-11-26T15:00:00.000Z",
    },
  },
};

describe("Unified R2 / UploadThing / local asset resolver", () => {
  it("normalizes local asset paths cleanly", () => {
    expect(normalizeLocalAssetPath("public/images/about.png")).toBe("/images/about.png");
    expect(normalizeLocalAssetPath("/src/assets/photos/a.webp?v=1")).toBe("/assets/photos/a.webp");
  });

  it("recognizes trusted R2, UploadThing, and local asset URLs", () => {
    expect(isR2AssetUrl("https://assets.loc.digital/media/test.webp")).toBe(true);
    expect(isR2AssetUrl("https://evil.example/test.webp")).toBe(false);
    expect(isTrustedAssetUrl("/images/about.png")).toBe(true);
    expect(isTrustedAssetUrl("https://assets.loc.digital/media/test.webp")).toBe(true);
    expect(isTrustedAssetUrl("https://65wv0vnolo.ufs.sh/f/abc123")).toBe(true);
    expect(isTrustedAssetUrl("https://user:pass@assets.loc.digital/media/test.webp")).toBe(false);
  });

  it("resolves R2 variants when migrated and falls back cleanly when unmigrated", () => {
    const r2Url = resolveAssetUrl("/assets/photos/sa-pa/sample.webp", {
      preferredWidth: 768,
      manifest: sampleManifest,
    });
    expect(r2Url).toBe(
      "https://assets.loc.digital/media/assets/photos/sa-pa/sample.768w.b1b2c3d4e5f6.webp",
    );

    const localFallback = resolveAssetUrl("/images/non-existent-local-only.webp", {
      manifest: sampleManifest,
    });
    expect(localFallback).toBe("/images/non-existent-local-only.webp");

    const thumbUrl = resolveAssetUrl("/assets/photos/sa-pa/sample.webp", {
      preferredWidth: 320,
      manifest: sampleManifest,
    });
    expect(thumbUrl).toBe(
      "https://assets.loc.digital/media/assets/photos/sa-pa/sample.thumb.a1b2c3d4e5f6.webp",
    );

    const unmigratedUtUrl = "https://65wv0vnolo.ufs.sh/f/unmigrated-only-key";
    expect(resolveAssetUrl(unmigratedUtUrl, { manifest: sampleManifest })).toBe(unmigratedUtUrl);
    expect(isUploadThingAssetUrl(unmigratedUtUrl)).toBe(true);
    expect(getImageStorageProvider(r2Url)).toBe("cloudflare-r2");
    expect(getImageStorageProvider(unmigratedUtUrl)).toBe("uploadthing");
    expect(getImageStorageProvider("/assets/logos/logo-sony.webp")).toBe("local");
    expect(getImageStorageProvider("https://example.com/photo.jpg")).toBe("external");
  });

  it("builds responsive WebP and AVIF srcsets with blur placeholder from R2 manifest", () => {
    const responsive = buildR2ResponsiveImage("/assets/photos/sa-pa/sample.webp", {
      width: 768,
      sizes: "(max-width: 768px) 100vw, 50vw",
      manifest: sampleManifest,
    });

    expect(responsive).not.toBeNull();
    expect(responsive!.srcset).toContain("480w");
    expect(responsive!.srcset).toContain("768w");
    expect(responsive!.srcset).toContain("1200w");
    expect(responsive!.srcset).toContain("1920w");
    expect(responsive!.avifSrcSet).toContain("1200w");
    expect(responsive!.blurDataURL).toMatch(/^data:image\/webp;base64,/);
    expect(getAssetPlaceholder("/assets/photos/sa-pa/sample.webp", sampleManifest)).toBe(
      responsive!.blurDataURL,
    );

    const stats = getAssetCatalogStats(sampleManifest);
    expect(stats.migratedAssets).toBe(1);
    expect(stats.totalVariants).toBe(5);
  });
});
