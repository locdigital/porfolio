# Architecture

The portfolio is an Astro 5 static site with React 19 islands, deployed to Vercel through the Build Output API (Node 22). Run `pnpm build` from the repository root: it type-checks, prerenders every page, patches the function runtime, generates Markdown representations for content negotiation and prunes R2-hosted media masters from the deploy output.

## Repository layout

| Path | Responsibility |
| --- | --- |
| `src/pages` | Routes only. Each page is a thin wrapper around a page component. |
| `src/layouts` | `DashboardLayout` (workspace window + ClientRouter) and `PhotosLayout` (standalone Photos window). |
| `src/components/layout` | `SiteHead.astro`: the shared `<head>` (SEO/OG/Twitter, JSON-LD graph, icons, preloads, analytics). |
| `src/components/pages`, `photos`, `writing`, `growth` | Page-level Astro components. |
| `src/components/desktop`, `dock` | Desktop shell, window manager, widgets and the Dock. |
| `src/components/apps` | Lazily opened floating apps (Spotify, Netflix, Nikon recipes) and `app-styles.ts`. |
| `src/components/ui`, `icons`, `dashboard` | Shared UI primitives, icon sets and workspace chrome. |
| `src/content` | Astro content collections (projects, photos, gear, writing; `growth` is reserved). |
| `src/data`, `src/i18n` | Curated datasets and UI copy. |
| `src/lib` | View models, SEO, asset resolution (R2 → UploadThing → local), caching and utilities. |
| `src/scripts` | Page-scoped DOM behaviour, cleaned up on navigation. |
| `src/styles` | Global tokens, Tailwind entry and workspace styles. |
| `src/config` | Site constants (origins, R2, wallpaper, analytics IDs, cache headers). |
| `scripts` | Build patches, media tooling (optimise/migrate/thumbnails), audits and validators. |
| `data` | Build inputs: R2 and UploadThing media manifests, photo update timestamps. |
| `docs` | Operational guides; `docs/reports` and `docs/metrics` hold benchmark evidence. |

## Rendering and loading

Astro renders article text, photo grids, case studies, metadata and links at build time. There are no server-rendered routes; the only function is `_agent-content`, which serves Markdown when a client sends `Accept: text/markdown`.

The Dock and window manager hydrate on load. Each floating app is a dynamic import inside its own window boundary. App stylesheets are imported as `?url` (`src/components/apps/app-styles.ts`) so they are **not** hoisted into every page; `src/lib/load-stylesheet.ts` attaches them when an app opens and keeps them alive across ClientRouter navigations. Routes that server-render an app (`/music/spotify*`, `/entertainment/netflix*`) link that app's CSS at the start of `<body>`, after the page bundle, preserving the cascade order.

The Photos map imports MapLibre and its stylesheet only on activation. The command palette loads its UI and JSON index on intent. Google Tag Manager is queued immediately but fetched once the page is idle.

## Media and storage

Photos, covers and other heavy media are served from Cloudflare R2 (`https://assets.loc.digital`), indexed by `data/r2-assets.json`. Masters stay in `public/` for the tooling (see `docs/MEDIA_MANAGEMENT.md`), but `scripts/prune-deploy-assets.mjs` removes every R2-mirrored, unreferenced master from `.vercel/output/static` and adds a static edge redirect (302) from its old URL to the R2 original.

## Caching

Astro content-hashes generated JavaScript, CSS and fonts (`/_astro/*`, immutable). The three public JSON feeds get one hour of freshness and one day of stale revalidation. The browser JSON helper caches successes for five minutes and falls back to the previous result on failure. HTML uses content negotiation with `Vary: Accept`. Window preferences remain in browser storage.
