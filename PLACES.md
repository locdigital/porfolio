# Places

Places now uses a server-side Notion CMS in production, with Vercel CDN refreshes and stable image proxy URLs. `/places` retains browser-only location discovery; `/places/[slug]` retains the personal review. See [NOTION_PLACES.md](NOTION_PLACES.md) for the current setup, property mapping, refresh behavior, and deployment instructions. The local Astro 4 Content Collection remains available for development with `PLACES_CONTENT_SOURCE=local`; the guide below documents that legacy/local workflow.

## Add a place to the local development collection

1. Copy `src/content/places/development-example.md` to a lowercase, hyphenated name such as `my-coffee-stop.md`. The filename becomes `/places/my-coffee-stop`.
2. Put your own photographs in `public/images/places/my-coffee-stop/`. Use lowercase filenames without spaces. WebP is recommended; JPEG, PNG, and AVIF also work.
3. Replace **all** example values with information from your actual visit. Add a short description, a personal rating out of 10, your reason for recommending it, and a longer Markdown review.
4. Set **both** `visited: true` and `published: true` when ready. Either flag being false keeps the entry out of cards, city choices, browser data, recommendations, detail routes, and the sitemap.
5. Run `pnpm check`, `pnpm test`, and `pnpm build`, then deploy through the site's existing Vercel workflow. No frontend changes are needed.

Minimal frontmatter to adapt (illustrative placeholders, not a real recommendation):

```yaml
---
name: "Replace with the place you visited"
category: coffee
city: "Replace with the city"
country: "Replace with the country"
coordinates:
  lat: 0 # Replace with the actual latitude
  lng: 0 # Replace with the actual longitude
rating: 0 # Replace with your own rating, from 0 to 10
description: "Your short, personal impression."
coverImage: "/images/places/my-coffee-stop/cover.webp"
coverImageAlt: "Describe what is visible in your photograph."
favorite: false
visited: false
published: false
---

## My experience

Write your personal review here.
```

Supported categories: `food`, `coffee`, `attraction`, `hidden-gem`.

Optional frontmatter:

```yaml
address: "The address you visited"
personalNotes: "Why you recommend this place."
gallery:
  - "/images/places/my-coffee-stop/interior.webp"
  - "/images/places/my-coffee-stop/details.webp"
visitedAt: "2026-11-09" # YYYY-MM-DD; remove if unknown
bestTimeToVisit: "Your own practical advice."
```

`favorite`, `visited`, and `published` default to false; `gallery` defaults to an empty list. Required strings must be nonempty, ratings must be 0–10, and coordinates must fall within latitude −90…90 and longitude −180…180. Dates and local raster image paths are validated. Missing cover/gallery files fail the build with the content entry and path in the error. Drafts are validated too, so keep their referenced images available.

The bundled `development-example.md` stays unpublished and unvisited. Its zero coordinates, rating, city, and existing portfolio photograph are explicitly illustrative. It does not create a public detail page. Do not publish it as travel history.

## Discovery behavior

- The initial view contains all published, visited places, ordered by personal rating.
- “Explore near me” requests one position through the native browser API **only after a click**. The request times out after 10 seconds and does not continuously track the visitor.
- Haversine distances are computed in kilometres inside the page. The active category is applied before searching at **3 km**, then **10 km**, then **25 km**. Expansion stops at the first nonempty radius; places outside that radius stay excluded.
- The radius is displayed. If all three searches are empty, visitors can browse the whole collection. A category change can expand or contract the radius based on that category's matches.
- Nearest sorts by distance, then rating, favorite, and slug. Highest rated sorts by rating, distance when available, favorite, and slug. My favorites puts favorites first, then rating, distance, and slug; it is a sort, so other places remain visible. Slugs break ties consistently.
- City choices come only from public entries. Selecting a city does not request location; it clears any previous position. Nearest becomes available only after a successful location request.
- “Browse all places” clears location, city, and category. Leaving the page clears its location state; late callbacks cannot overwrite a new city selection or a different page.
- Permission denial, unavailable location, timeout, unsupported browsers, and approximate positions have accessible status messages. Browsing remains available throughout.
- Without JavaScript, all public cards and review pages remain readable. Interactive controls appear only after enhancement succeeds.

Coordinates are never written to storage, URLs, history, a server, or analytics. The content JSON contains only public places' metadata and **their** coordinates. Google Maps links include the destination only; Google handles any subsequent request for the visitor's origin separately.

## Implementation and design

| Concern | Files |
| --- | --- |
| Content and collection registration | `src/content/places/*.md`, `src/content/config.ts` |
| Validation and shared types | `src/lib/places/schema.ts`, `constants.ts`, `types.ts` |
| Build-only content adapter and asset checks | `src/lib/places/data.ts` |
| Distance, recommendations, directions | `src/lib/places/distance.ts`, `recommendations.ts`, `directions.ts` |
| Static cards, filters, gallery | `src/components/places/` |
| Index and generated detail routes | `src/pages/places/` |
| Browser enhancement and cleanup | `src/scripts/places-discovery.ts` |
| Scoped feature styles | `src/styles/places.css` |
| Unit tests and Vitest/Node runner separation | `src/lib/places/places.test.ts`, `vitest.config.ts` |
| Integration | Sidebar navigation, privacy page, and the existing responsive image resolver |

Both routes share `getPlaceEntries()`, which selects the server-side Notion adapter or explicit local development content. Local content retains Astro 4's `src/content/config.ts`, `getCollection()`, `entry.slug`, and `entry.render()` conventions. Production Places routes render on demand so new Notion entries do not require `getStaticPaths()` or a rebuild. See the [Astro 4 collection guide](https://v4.docs.astro.build/en/guides/content-collections/).

The interface inherits `DashboardLayout`, Inter, the 960px content container, `--dash-*` colors, and existing photo/media styles. Local Places typography uses a 36px title (30px on mobile), 22px collection heading, 20px empty-state heading, 15px body copy, and 12–14px supporting text. Cards form two columns, becoming one below 640px; detail sidebars stack below 769px. Existing Astro page transitions and `onPageLoad` cleanup are reused.

Places action buttons share a 44px height, 14px text, and 10px radius. Category segments are 36px high with an 8px radius; mobile labels have 44px touch areas and scroll horizontally without a visible scrollbar. A small focus handler keeps the complete keyboard-selected category in view. City and Sort remain accessible native selects with custom chevrons, 40px heights on desktop, and 44px on mobile. The controls wrap naturally on tablet; below 768px the selects share a row beneath the categories. Hover changes only color and borders over 180ms, with no image scaling; reduced motion disables these transitions. These values are scoped to Places, as specified by the UI refinement brief, and do not modify global tokens or unrelated pages.

Consistency was checked against `DashboardLayout.astro`, `global.css`, `dashboard.css`, and `page-transitions.css`. Places does not replace the shared chrome. Scoped card/action link resets prevent the incumbent dotted-link and hover-color rules from affecting whole cards and buttons. The shared `--button-font-size` is overridden only within Places action buttons to keep links and buttons consistent. Pre-existing drift remains in the shared styles: `global.css` and `dashboard.css` define overlapping spacing scales, including different `--space-8` values. Existing card/detail spacing follows the dashboard values; the refined discovery controls use the brief's explicit pixel dimensions and the shared 64px section-gap token. This extension does not reconcile those global scales.

`ResponsiveImage` generates WebP variants at build time. The existing resolver now also accepts JPEG/PNG/AVIF photographs in `public/images/places/`; existing WebP paths and upload directories remain supported. Covers have reserved aspect ratios; gallery images and cards after the first load lazily. Places adds only its discovery script to the existing browser behavior; schema validation and content loading stay out of the client bundle.

No map toggle is included. The list is the primary experience, and directions work without a Maps SDK, API key, tile provider, or additional dependency. This intentionally avoids map bundle and provider setup costs.

## Validation

```sh
pnpm check
pnpm test
node --test scripts/agent-content.test.mjs scripts/sync-photo-updates.test.mjs
pnpm build
```

Vitest covers schema boundaries, safe defaults, publication gates, known Haversine distances, antimeridian/antipodal coordinates, radius expansion, category/city intersections, all sort orders, deterministic ties, directions URLs, and location error recovery. The existing `.test.mjs` suites use `node:test` and run separately; Vitest excludes those files.

Browser QA should cover desktop and 320/390/768/1024/1440px layouts; native location success; denial/unavailable/timeout/unsupported states; manual city changes while location is pending; back/forward and Astro route transitions; detail galleries and directions; no-JavaScript browsing; keyboard filters; and reduced motion. Use explicitly synthetic temporary fixtures locally if no real entries exist, and remove them before the production build. An empty public collection is an intentional state until real visit content is supplied.

### Recorded implementation verification — 9 November 2026

- `pnpm check` completed with 0 errors, warnings, or hints; all 36 Vitest tests and 9 existing `node:test` tests passed. `pnpm build` succeeded and generated 50 public Markdown pages.
- Thirteen Playwright groups covered native geolocation success, 3/10/25km expansion, category/city/sort/reset behavior, geolocation errors and unsupported browsers, no automatic permission prompt, stale callbacks, no-JavaScript reading, responsive layouts, reduced motion, galleries, SEO, Google Maps directions, and draft/unvisited 404s.
- The design detector returned no Places findings. The reviewer's final verdict scored the scoped link-style correction resolved and returned `Ship`.
- Following the UI refinement, the emitted discovery bundle is 5,922 bytes before compression (approximately 2.5KB gzip), without Zod. Synthetic QA entries were removed. The sole source entry is the unpublished, unvisited development example; production `/places/` contains only `index.html` until real visit content is added. No deployment was performed.

### UI refinement verification — 9 November 2026

- Changed only `src/styles/places.css`, `src/components/places/PlaceFilters.astro`, the category-focus handler in `src/scripts/places-discovery.ts`, and this guide. Routes, data structures, geolocation, and privacy behavior remain unchanged.
- The production build and Astro checks passed with 0 type errors, warnings, or hints. All 36 Vitest and 9 existing Node tests passed. Fifteen browser groups covered the original discovery behavior plus the requested control dimensions, typography, hover timing, horizontal filter scrolling, and keyboard focus.
- Verified layouts at 320, 360, 390, 640, 767, 768, 1024, and 1440px. Mobile dropdowns retain 44px touch targets, while category segments retain their 36px visible height inside 44px labels. Keyboard navigation scrolls the entire selected label into view. Reduced motion disables the transitions.
- The manual UI detector reported no findings. Desktop, tablet, mobile, empty, populated, and detail-page captures were checked; populated captures used temporary, explicitly synthetic entries that were removed before the final build.
