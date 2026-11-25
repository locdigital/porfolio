# Architecture

The portfolio uses Astro 4.16.19 with hybrid rendering, React 19.3.0 islands, Node 22 and the Vercel adapter. Run `pnpm build` from the repository root. The build type-checks the project, prerenders pages and images, selects the Node 22 function runtime and generates Markdown representations for content negotiation.

| Area | Responsibility |
| --- | --- |
| `src/pages`, `src/layouts` | Route definitions, document metadata, static HTML, shared window chrome and Astro navigation |
| `src/content`, `src/lib/content.ts`, `src/lib/writing.ts` | Authoritative content collections, publication filtering, ordering and view models |
| `src/components/desktop`, `src/components/dock` | Desktop shell, keyboard shortcuts, session state, window geometry, pinning and Dock animation |
| `src/components/apps`, `src/data` | App presentation, player behavior and curated datasets |
| `src/lib/api`, `src/pages/api` | Build-time projections for the search index, full photo feed and compact widget feed |
| `src/lib/photo-assets.ts`, `src/lib/media`, `src/lib/uploadthing` | Responsive derivatives, typed media metadata, CDN lookup and server SDK boundary |
| `src/config`, `src/constants`, `src/lib/cache` | Site configuration, geographical labels, HTTP headers and browser request deduplication |
| `src/scripts`, `src/styles` | Page-scoped DOM behavior, cleanup on navigation and shared visual styles |
| `scripts`, `docs` | Media tooling, build patches, production checks and benchmark evidence |

## Rendering and loading

Astro renders article text, photo grids, case studies, metadata and links before hydration. The workspace route renders directly in the host window. The Dock and window manager hydrate on load. Each floating application uses a dynamic import inside its own window boundary. Pinned widgets load through a separate boundary. Opening an app can load its own styles and shared runtime chunks. React state and session storage retain the existing window lifecycle.

The command palette loads its UI and JSON index on intent or activation. Concurrent requests for the same index share one promise. The Photos widget consumes only album counts, covers and the first thirteen thumbnails per album. The full public feed remains available at `/api/photos.json`. Opening the map imports Leaflet, its stylesheet and the controller. Leaving the page aborts listeners and destroys the map.

## Storage and caching

The collections and media manifest are static build inputs. Updating either requires a rebuild. Astro content-hashes generated images, JavaScript and CSS. The Vercel output configuration sets a one-hour freshness lifetime and one day of stale revalidation for the three public JSON feeds. The browser JSON helper caches successes for five minutes and falls back to a previous result if a refresh fails. Markdown and HTML use content negotiation with `Vary: Accept`. Window preferences remain in browser storage.

The mobile Search button also opens a native HTML navigation popover before hydration. The same fallback opens if the palette chunk or index fails to load. Its links are available in the initial HTML. Writing category routes, palette items and these navigation links share the category selection logic in `src/lib/writing.ts`.
