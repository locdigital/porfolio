# Source & delivery cleanup (2026-11-28)

| Area | Change |
| --- | --- |
| CSS | Spotify and Netflix app styles no longer ship in the shared bundle (133 KB → 99 KB on every page); they load with the app via `src/lib/load-stylesheet.ts`. MapLibre CSS (71 KB) is no longer render-blocking on `/photos`; it loads with the map. |
| HTML | `src/components/layout/SiteHead.astro` replaces the duplicated `<head>` in both layouts. Google Tag Manager is fetched on idle instead of competing with first paint. |
| Media | Desktop wallpaper re-encoded (600 KB → 304 KB). `scripts/prune-deploy-assets.mjs` drops 687 R2-mirrored masters (135.6 MB) from the deploy output and redirects their old URLs to R2; the `/assets/photos/*` SSR proxy (and its function) is removed. |
| Build | The empty `growth` collection is skipped, removing a warning on every rendered page. |
| Removed | Unreferenced `src/lib/uploadthing/server.ts`, `scripts/generate-majesticons.mjs`, `scripts/optimize-dock-images.mjs`, `scripts/optimize-image.mjs`, root `all-three-transparent.svg` / `gallery-icon.svg`, unused `public/favicon.svg` (137 KB). |
| Layout | Root docs moved to `docs/`; reports to `docs/reports/`, benchmark JSON to `docs/metrics/`. |

# Performance refactor

This continuation started from an uncommitted refactor. The starting build already had separate search and photo feed builders, a cache helper, a typed UploadThing registry and extensive page and stylesheet edits. The measurements in the performance report use that working tree as the starting point.

| Area | Files and changes in this continuation |
| --- | --- |
| Desktop | `src/components/desktop/DesktopShell.tsx` gives each floating app an independent import boundary. `AppWindow.tsx` delays the first mount of a restored minimized app. |
| Photos | `src/lib/api/photos-feed.ts`, `src/pages/api/photos-widget.json.ts` and `PhotosDesktopWidget.tsx` build and consume a compact feed with build-generated thumbnails. The mosaic supports keyboard activation. |
| Gallery | `src/pages/photos/index.astro` reuses region definitions, serves smaller responsive candidates, and defers hidden album images. Leaflet JS and CSS load via `src/scripts/photos-map.ts` on map activation. |
| Shared UI | `DashboardLayout.astro` selects wallpaper at the desktop breakpoint. `dock.config.ts` selects the optimized local icons. `CommandSearch.astro`, `command-search-loader.tsx`, `command-search.tsx` and `src/lib/api/search-index.ts` handle shortcut activation, failed index fetches, topic archives and unlinked article previews. |
| Delivery | `astro.config.mjs` redirects the previously removed contact page to About and excludes noindex app routes from the sitemap. `scripts/build-agent-content.mjs` sets response caching for the public JSON feeds. `scripts/geo-audit.mjs` verifies the redirect and noindex app shells. |
| Media administration | `scripts/upload-photo-assets.mjs` checks source hashes, file signatures, storage capacity, explicit cover paths and rollback backups. `src/lib/uploadthing/client.ts` validates URL origins. `src/lib/cache/client-cache.ts` documents refresh behavior. |
| Tools and evidence | Added image and video conversion, Dock regeneration, media inventory and CDN validation scripts. Updated the production audit harness to allow analytics requests during measurement. Added before/after reports and operational documentation. |
| Removed | `src/components/ui/demo.tsx` and its only dependency `src/components/ui/sss.tsx` were an unreferenced video demo. Confirmed through source imports and glob inspection. Both are recoverable from Git. |

No files moved in this continuation. Its changes introduce no package dependency or database schema change. The edits to the dependency manifests, the article and the original contact-page deletion were already present at the beginning. The original photo feed and URLs remain supported. The new widget feed is additive. No external deployment was performed.

The final search pass adds crawlable navigation when the command palette is unavailable and shares the routable category list between the writing archive, palette and fallback. A production-output validator checks local HTML and CSS asset references.
