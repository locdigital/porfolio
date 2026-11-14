# Performance optimization — 2026-11-08

Measured locally against a snapshot of the production build immediately before these changes. No live deployment was changed.

## Method

- Lighthouse 13.4.0, installed Google Chrome, default simulated mobile throttling.
- Both builds were served with gzip using the same local static preview server.
- Image optimization was proxied to Astro locally and warmed into a shared disk cache for both builds. This models an image cache hit; it does not measure Vercel edge latency or first-time image transformation.
- The table uses one baseline run and the final optimized validation run, not a field measurement or an average. An earlier optimized run scored 94 for the gallery with a 2.93s LCP; the final run scored 92 with a 3.30s LCP, illustrating normal lab variation. Production results will vary with device, network, CDN cache, and location.

## Results

| Page | Performance score | LCP | Transferred resources |
| --- | --- | --- | --- |
| `/` | 88 → 100 | 3.33s → 1.73s | 537.9KB → 107.6KB |
| `/photos` | 78 → 99 | 4.16s → 2.10s | 446.4KB → 148.9KB |
| `/photos/trang-an` | 71 → 92 | 7.43s → 3.30s | 1412.5KB → 749.5KB |
| `/gear` | 86 → 99 | 3.85s → 1.95s | 500.6KB → 288.9KB |

All four optimized runs had zero measured layout shift (CLS), zero total blocking time, and no HTTP errors.

## Changes

- Self-hosted the existing Inter variable font, retaining Latin and Vietnamese glyphs and weights 400–700. The Latin file is preloaded; fonts use hashed asset URLs with the existing immutable asset cache. Removed the external Google Fonts stylesheet and connection setup. The font license is included beside the font files.
- Replaced the sidebar’s 137,911-byte raster-containing SVG with a visually equivalent 1,474-byte WebP at 84px (suitable for the 28px avatar at 3×). The browser favicon uses the existing 32px PNG.
- Removed 512 unused selectors from the shared legacy stylesheet after checking all generated HTML and component/script class names. Shared CSS fell from 116,173 to 63,776 bytes, or 22,659 to 13,167 bytes with gzip.
- Folder fan previews now fetch their three images on desktop pointer intent or keyboard focus. Initially they use an inline placeholder. Their reveal waits for image decoding, and failed images can retry on the next interaction. Removed repeated preview URL JSON from folder markup.
- Gallery images include 360px and 720px variants and sizes matching the layout. Only the first image is eager with high fetch priority; the rest use native lazy loading. Original UploadThing image files remain unchanged.
- Prioritized the first Gear image and added intermediate responsive widths to Gear and Work images.
- Increased the Vercel optimizer minimum cache lifetime from 60 seconds to one day. UploadThing file URLs identify individual uploads; replacing an upload gives it a new URL. Local assets replaced at the same path may retain a cached transformation for up to the cache lifetime.
- Removed the permanent compositing hint from every hidden folder preview card.

## Validation

- `npm run build`: Astro check passed with zero errors, warnings, or hints; production build completed. The existing runtime patch still sets generated Vercel functions to Node 22.
- Checked 11 representative pages at 390px and 1440px widths against the baseline. Computed heading sizes/weights/colors, text metrics, and content dimensions matched. No horizontal overflow or page JavaScript errors were observed.
- Verified pointer/keyboard previews, repeat hover without duplicate requests, Astro navigation, mobile menu controls, first gallery-image loading, comparison slider keyboard controls, and certificate dialog controls.
- Rechecked UI detector output. Inter is the existing approved font; remaining easing advisories concern existing animation values outside this performance change.
