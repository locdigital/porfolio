# Static WebP image delivery

Deployed to https://loc.digital on 2026-11-09 (`dpl_BKcDpDYaXmfkoSqb7up48REP67qR`).

Images rendered through the shared photo helper now use Astro's Sharp pipeline during prerendering. The resulting hashed `/_astro/*.webp` files are served directly by the CDN. Visitors no longer invoke Vercel's on-demand image transformation for these images.

- WebP quality: 75.
- Responsive `srcset`, lazy loading and first-image priority are retained.
- Available local originals are imported as image metadata; remaining sources are read from UploadThing during the build.
- Candidate widths are capped to the local source's real pixel width and deduplicated, keeping width descriptors accurate and avoiding upscaling.
- Original files and UploadThing mappings remain intact.
- Vercel's legacy image endpoint remains configured for WebP, preserving image URLs in older open tabs.
- Generated assets return `Content-Type: image/webp` and `Cache-Control: public, max-age=31536000, immutable` on the live site, including when the request accepts AVIF.

## Validation

- Production build and Astro check: zero errors, warnings or hints.
- 41 prerendered HTML pages contain no `/_vercel/image` image references.
- Verified 3,600 referenced WebP files (3,599 generated variants plus the avatar), 602 srcsets, and the encoded pixel widths of 3,463 unique responsive candidate files. No missing files or width mismatches.
- Twelve desktop/mobile image checks across Photography, gallery, Gear, About and case-study pages passed.
- Seventeen navigation and interaction checks passed on the production build, including the page transitions, menu, history, hash links, forms and reduced-motion fallback.
- Live checks confirmed gallery images and folder previews decode, mobile navigation works, and no page script or HTTP errors occur. A legacy photo path still redirects to its UploadThing original.
- Warmed 125 first-gallery image variants at the CDN edge used by verification; all returned successfully. Other regions can still have cold cache entries.

## Timing samples

Before this change, three 960px image requests with cold Vercel optimizer caches returned AVIF with 1.11–1.40s time to first byte. Three newly deployed static WebP samples returned in 0.61–0.81s with cold CDN caches. Cache hits observed afterward were faster. These individual samples include network/edge-cache effects and are not field averages.

WebP and AVIF have different compression characteristics; the timing samples do not imply that WebP always has a smaller file size. The main change is generating display-ready images once at build time and keeping them in immutable caches.

## Files

- `astro.config.mjs`: Sharp build pipeline, WebP compatibility endpoint.
- `src/lib/photo-assets.ts`: local source metadata, responsive width caps, WebP quality.
