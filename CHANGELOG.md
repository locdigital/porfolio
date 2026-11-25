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
