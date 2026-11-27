# Media Management — Cloudflare R2 + UploadThing Pipeline

This site uses a **dual-CDN media storage architecture** designed for zero Vercel image bloat, fast static builds, and safe instant rollback:

1. **Tier 1 (Primary CDN) — Cloudflare R2 (`https://assets.loc.digital`)**
   - Stores pre-generated, content-hashed responsive variants (`320w` thumbnail, `480w`, `768w`, `1200w`, `1920w` WebP + optional AVIF) and lightweight blur placeholders.
   - Served with `Cache-Control: public, max-age=31536000, immutable` and zero egress fees.
   - Indexed in `data/r2-assets.json`.
2. **Tier 2 (Secondary / Fallback CDN) — UploadThing (`https://65wv0vnolo.ufs.sh`)**
   - Serves UploadThing-hosted media directly from UploadThing CDN without re-downloading or duplicating files into Vercel `_astro/`.
   - Acts as an instant fallback if an asset has not yet been migrated to Cloudflare R2 (or during manifest rollback).
   - Indexed in `data/uploadthing-images.json`.
3. **Tier 3 (Local Static UI Assets)**
   - Small UI icons, favicons, dock icons, and brand logos in `public/assets/logos/` and `public/assets/dock/` stay local. Only `/assets/logos/*` are run through Astro Sharp at build time.

## Resolution Flow

- `src/lib/assets.ts`: `resolveAssetUrl()` and `buildR2ResponsiveImage()` resolve **Cloudflare R2 -> UploadThing -> local** (including automatically upgrading legacy UploadThing URLs when a verified Cloudflare R2 entry exists).
- `src/lib/photo-assets.ts`: `responsiveImageAttributes()` and `optimizePhoto()` fast-path R2 responsive `srcset` + `320w` thumbnails, pass UploadThing URLs directly to UploadThing CDN, and never emit duplicate CDN images into `dist/client/_astro/`.
- `src/components/ui/ResponsiveImage.astro`: emits `<picture>` with AVIF `<source>` when available, `loading="eager"` + `fetchpriority="high"` when `priority={true}`, and opt-in `placeholder={true}` for opaque photos only.

## Adding & Migrating New Images

### Option A — Cloudflare R2 (Recommended for Photos, Covers & Heavy Media)
1. Place master assets under `public/assets/photos/<album>/` or `public/images/...` (keep RAW masters in `_local/photo-originals/`).
2. Audit current storage and free-tier headroom:
   ```bash
   pnpm run assets:audit
   ```
3. Generate content-hashed WebP/AVIF responsive variants + `320w` thumbnail in `_local/r2-staging/`:
   ```bash
   pnpm run assets:optimize -- --avif
   ```
4. Preview and upload to Cloudflare R2 (requires `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` in `.env.local`):
   ```bash
   pnpm run assets:migrate:r2:dry
   pnpm run assets:migrate:r2
   ```
   Every object is verified via public HTTPS `HEAD` before `data/r2-assets.json` is atomically updated.

### Option B — UploadThing (Direct/Secondary Uploads)
1. Configure server-side `UPLOADTHING_TOKEN` in `.env.local`.
2. Preview and upload via `scripts/upload-photo-assets.mjs`:
   ```bash
   node scripts/upload-photo-assets.mjs --dry-run
   node scripts/upload-photo-assets.mjs
   ```
3. Validate mapped UploadThing URLs via `node scripts/validate-media.mjs`.

## Rollback

- **Cloudflare R2 -> UploadThing/Local**:
  ```bash
  node scripts/migrate-assets-to-r2.mjs --rollback=_local/r2-migration/r2-assets-<timestamp>.json
  pnpm run build
  ```
- **UploadThing manifest rollback**:
  ```bash
  cp _local/media-migration/manifest-<timestamp>.json data/uploadthing-images.json
  pnpm run build
  ```
