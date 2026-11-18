# GEO Technical & Content Audit — `https://loc.digital`

**Audit Date:** 2026-11-16  
**Repository:** `/Users/phucloc/Downloads/portfolio vibe dashboard`  
**Live Target Audited:** `https://loc.digital`  
**Scope:** Full-stack Astro architecture, crawler access, indexability, canonicalization, HTML discoverability, structured data, travel/photography pillar, growth/marketing pillar, image SEO, performance/accessibility, and observability.

---

## 1. Architecture & Rendering Baseline

| Component | Baseline Observation |
| --- | --- |
| Framework & Output | Astro `^4.16.19`, `output: 'hybrid'`, `@astrojs/vercel` (`7.8.2` serverless adapter) |
| Integrations | `@astrojs/tailwind` (`5.1.0`), `@astrojs/sitemap` (`3.1.6`), `@astrojs/react` (`4.4.2`) |
| i18n Config | `defaultLocale: 'en'`, `locales: ['en', 'vi']`, `prefixDefaultLocale: false` (no `/vi` pages exist yet) |
| CMS / Data Source | Local Astro Content Collections (`src/content/projects`, `src/content/photos`, `src/content/writing`, `src/content/gear`) + `src/data/location-stories.ts` + `data/photo-updates.json` + `data/uploadthing-images.json` |
| SSR Endpoints | Only `src/pages/assets/photos/[...path].ts` (`export const prerender = false`), serving local images or 302-redirecting to UploadThing (`65wv0vnolo.ufs.sh`) |
| Build Pipeline | `prebuild`: `sync-photo-updates.mjs`; `build`: `astro check && astro build && patch-vercel-runtime.mjs && build-agent-content.mjs` |
| Agent Readiness | `build-agent-content.mjs` generates `.md` alternates and `/_agent-content` Edge Function (`Accept: text/markdown`, `Vary: Accept`, `private, no-store`) |
| Redirects Configured | `/service -> /services` (`302`), `/experience -> /about` (`302`) |
| Baseline Tests | `pnpm test` (`vitest run`: 4 files, 18 tests passing); `node --test scripts/agent-content.test.mjs scripts/sync-photo-updates.test.mjs` (9 tests passing) |

---

## 2. Baseline Route Inventory (Before Changes)

| Route | Render Mode | Live HTTP | Sitemap | Canonical (Baseline) | Title / Description | H1 | Issues Found |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/` | Prerendered | `200` | Yes (`/`) | `https://loc.digital/` | Present | `Phuc Loc Nguyen` | Blanket `ProfessionalService` JSON-LD emitted; no `WebPage` node; no links to `/resume`, `/certificates`, `/privacy`, or Growth hub |
| `/about` | Prerendered | `200` | Yes (`/about/`) | `https://loc.digital/about/` | Present | `Growth Marketer and Photoholic` | Trailing-slash canonical mismatch vs `/about` links; missing `ProfilePage` JSON-LD; no links to `/resume`, `/certificates`, `/work`, `/photos` |
| `/work` | Prerendered | `200` | Yes (`/work/`) | `https://loc.digital/work/` | Present | `Work` | Trailing-slash mismatch; missing `CollectionPage` + `ItemList` JSON-LD |
| `/work/[slug]` (6 pages) | Prerendered | `200` | Yes (`/work/*/`) | `https://loc.digital/work/*/` | Uses `project.summary` | `{project.title}` | Trailing-slash mismatch; missing `Article`/`CreativeWork` + `BreadcrumbList` JSON-LD; does not pass `project.coverImage` as `ogImage`; lacks links to `/services` and marketing methodology |
| `/services` | Prerendered | `200` | Yes (`/services/`) | `https://loc.digital/services/` | Present | `Services & Capabilities` | Trailing-slash mismatch; missing `Service` + `BreadcrumbList` JSON-LD |
| `/writing` | Prerendered | `200` | Yes (`/writing/`) | `https://loc.digital/writing/` | Generic description | `Writing` | All 7 `.md` entries have `linkable: false` (0 `/writing/[slug]` pages emitted); `llms.txt` falsely describes "three sample articles" |
| `/writing/[slug]` | Prerendered | `404` (0 paths) | No | N/A | N/A | N/A | 0 pages built because all entries have `linkable: false`; template lacks `BlogPosting` JSON-LD & `og:type="article"` |
| `/writing/category/[category]` | Prerendered | `404` (0 paths) | No | N/A | N/A | N/A | 0 pages built while entries have `linkable: false` |
| `/photos` | Prerendered | `200` | Yes (`/photos/`) | `https://loc.digital/photos/` | Present | `Photography` | Includes unpublished `bali` album; contains dead `display: none` `#photos-list` duplicate markup; missing `CollectionPage` + `ItemList` JSON-LD |
| `/photos/[slug]` (25 files) | Prerendered | `200` | Yes (all 25) | `https://loc.digital/photos/*/` | Uses short `headline`, ignores `seoDescription` / `seoTitle` | `{location.name}` | Includes unpublished `bali`; skips verified `seoImage` `ogImage`; ignores rich JSON fields (`overview`, `travelTips`, `suitableFor`, `notFor`, `travelFrom`, `travelTime`, `recommendedStay`, `relatedLocations`); photo stories/titles/images inside `<button>` dropped by `html-to-markdown.mjs`; 298/407 photos have generic `DSC_*` / `photo N` alts; missing `ImageGallery` + `Place` + `ImageObject` JSON-LD |
| `/gear` | Prerendered | `200` | Yes (`/gear/`) | `https://loc.digital/gear/` | Present | `Gear & Hardware` | `.gear-masonry:not([data-gear-shuffled="1"])` sets `visibility: hidden` for all non-JS requests without `noscript` fallback CSS override for crawlers executing partial render |
| `/resume` | Prerendered | `200` | Yes (`/resume/`) | `https://loc.digital/resume/` | Present | `Resume` | **Orphaned page** (0 internal `<a href>` links anywhere on the site); missing `ProfilePage` JSON-LD |
| `/certificates` | Prerendered | `200` | Yes (`/certificates/`) | `https://loc.digital/certificates/` | Present | `Certificates & Credentials` | **Orphaned page** (0 internal `<a href>` links anywhere on the site); missing `CollectionPage` JSON-LD |
| `/contact` | Prerendered | `200` | Yes (`/contact/`) | `https://loc.digital/contact/` | Present | `Contact & Inquiries` | Displays `+84 888 886 038`, contradicting `src/lib/seo.ts` (`+84777779459`); missing `ContactPage` JSON-LD |
| `/privacy` | Prerendered | `200` | Yes (`/privacy/`) | `https://loc.digital/privacy/` | Present | `Privacy` | **Orphaned page** (0 internal `<a href>` links after sidebar footer removal, contradicting `AGENT_READINESS.md`) |
| `/404` (`404.html`) | Prerendered | `404` | Excluded | `https://loc.digital/404/` | Present | `Hmm, this page doesn’t exist.` | Emits `<meta name="robots" content="index, follow">`, self-canonical `/404/`, stale text `"Photography (17 travel galleries)"`, and `ProfessionalService` JSON-LD |
| `/service`, `/experience` | Edge Redirect | `302` | Excluded | N/A | N/A | N/A | Uses temporary `302` instead of permanent `301`/`308` |
| `/assets/photos/[...path]` | SSR (`prerender=false`) | `200`/`302`/`404` | Excluded | N/A | N/A | N/A | Binary asset endpoint; works as designed |

---

## 3. Baseline Technical Findings & Evidence

### P0 — Critical Technical Foundation

#### P0-1: Canonical & Trailing-Slash Split Across Internal Links, Canonicals, Sitemap, and Live HTTP
- **Evidence:**
  - All internal `<a href>` links (`DashboardSidebar.astro`, `work/index.astro`, `photos/index.astro`, `404.astro`), `public/llms.txt`, and `scripts/agent-content-handler.mjs` (`Content-Location`) omit trailing slashes (e.g., `https://loc.digital/about`, `https://loc.digital/photos/trang-an`).
  - Live `https://loc.digital/about` and `https://loc.digital/about/` both returned `HTTP/2 200` without redirecting.
  - Meanwhile, `DashboardLayout.astro` emitted `<link rel="canonical" href="https://loc.digital/about/">` and `.vercel/output/static/sitemap-0.xml` listed `https://loc.digital/about/` (trailing slash).
  - Additionally, `curl -sIL https://www.loc.digital/` failed at TLS/connection level (`www failed`), and `/service` and `/experience` returned `302` temporary redirects.
- **Recommended Fix:** Configure `trailingSlash: 'never'` in `astro.config.mjs` (which prompts `@astrojs/vercel` to emit permanent `308` redirects from `/path/` to `/path`), normalize canonical URLs, `og:url`, `hreflang`, and sitemap `<loc>` URLs to no trailing slash (except `/`), upgrade `/service` and `/experience` to `301`, and document Vercel/DNS `www -> apex` redirect as an owner action.

#### P0-2: Unpublished Draft Gallery (`/photos/bali`) Published, Linked, and Indexed
- **Evidence:**
  - `src/content/photos/bali.json` line 308 explicitly sets `"published": false`.
  - `src/lib/content.ts` (`getPhotoLocations()`) did not filter out `published === false`.
  - Baseline `sitemap-0.xml` included `https://loc.digital/photos/bali/`, `/photos` linked to `/photos/bali`, and `curl -sL https://loc.digital/photos/bali` returned `HTTP/2 200` with `<meta name="robots" content="index, follow">`.
- **Recommended Fix:** Filter `entry.data.published !== false` by default in `getPhotoLocations()` and exclude unpublished photo routes from `@astrojs/sitemap` so draft albums are never publicly built, linked, or indexed until explicitly set to `published: true`.

#### P0-3: Error Page (`404.astro`) Marked `index, follow` with Self-Canonical `/404/`
- **Evidence:**
  - `curl -s https://loc.digital/nonexistent-route-check` returned `HTTP/2 404` HTML containing `<meta name="robots" content="index, follow">` and `<link rel="canonical" href="https://loc.digital/404/">`, plus site-wide `ProfessionalService` JSON-LD.
  - `src/pages/404.astro` line 78 also displayed stale text `"Photography (17 travel galleries)"`.
- **Recommended Fix:** Add `noindex` support to `DashboardLayout.astro` emitting `<meta name="robots" content="noindex, nofollow">` and suppressing `<link rel="canonical">`, `og:url`, `hreflang`, `alternate`, and misleading structured data on 404. Dynamically render the live published gallery count.

#### P0-4: Photo-Flip Stories, Titles, Capture Details, and Images Stripped from Markdown & Screen-Reader Pre-Flip Context
- **Evidence:**
  - In `src/components/ui/PixelFlipPhoto.astro`, both `<img ...>` and `<span class="pixel-photo__back" aria-hidden="true" id={descriptionId}>` live inside `<button class="pixel-photo__control">`.
  - Because `scripts/html-to-markdown.mjs` omits `<button>` and `aria-hidden="true"`, `.vercel/output/static/photos/trang-an.md` (57 lines) contained **zero** photo `<img>` references, **zero** photo titles, **zero** capture dates/locations, and **zero** of the 24 first-hand photo stories.
  - Furthermore, `aria-describedby` on the `<button>` was only added via JS *after* flipping (`pixel-flip-photo.ts` line 54).
- **Recommended Fix:** Preserve the visual and interactive `PixelFlipPhoto` component untouched; wire `aria-describedby={descriptionId}` at initial SSR render; update `html-to-markdown.mjs` to extract `[data-pixel-photo]` front image, title, capture metadata, and story into clean Markdown without duplicating visible text blocks in HTML.

#### P0-5: `/gear` Catalog Hidden via `visibility: hidden` Unless JS Hydration Runs
- **Evidence:**
  - `src/pages/gear.astro` lines 106-108: `.gear-masonry:not([data-gear-shuffled="1"]) { visibility: hidden; }`.
  - Any crawler or client inspecting initial CSS before JS module execution sees `visibility: hidden` on the entire gear catalog.
- **Recommended Fix:** Scope the pre-shuffle anti-flash rule to `:global(html.js) .gear-masonry:not([data-gear-shuffled="1"])` (or render visibly immediately) so non-JS renders and initial HTML never hide content.

#### P0-6: Orphaned Indexable Pages (`/resume`, `/certificates`, `/privacy`)
- **Evidence:**
  - `grep -rnE "/resume|/certificates|/privacy" src/` confirmed **zero** `<a href>` links pointing to `/resume`, `/certificates`, or `/privacy` anywhere in `src/pages/`, `src/components/`, or `src/layouts/` (even though all three are in `sitemap-0.xml` and `AGENT_READINESS.md` documented `/privacy` as linked in the sidebar footer).
- **Recommended Fix:** Add clean, accessible internal navigation links in a subtle workspace footer inside `DashboardLayout.astro` (`Resume`, `Certificates`, `Growth Hub`, `Privacy`, `Contact`) plus contextual links from `/` and `/about`.

---

### P1 — Centralized SEO, Structured Data, Travel & Growth Knowledge Architecture

#### P1-1: Telephone Conflict & Incomplete Person Entity in `src/lib/seo.ts`
- **Evidence:**
  - `src/lib/seo.ts` lines 31 and 72 emit `telephone: "+84777779459"`, whereas `src/pages/contact.astro` lines 57–74 display `+84 888 886 038` (`https://zalo.me/0888886038`).
  - `personSchema()` omits `alternateName` (`Loc`, `Henry`, `Nguyen Phuc Loc`), `alumniOf` (`FPT University`), and Pillar A photography/travel expertise in `knowsAbout`.
- **Recommended Fix:** Synchronize telephone to `+84888886038`, enrich `personSchema()` with verified aliases, education, and dual-pillar expertise.

#### P1-2: Blanket `ProfessionalService` Schema & Zero Page-Specific JSON-LD
- **Evidence:**
  - `DashboardLayout.astro` calls `graphSchema(pageSchemas)` which unconditionally injects `ProfessionalService` on every single route (including travel galleries, privacy policy, gear, and 404).
  - Zero pages pass `schema=` to `DashboardLayout.astro`. No `ProfilePage`, `CollectionPage`, `ImageGallery`, `Place`, `ImageObject`, `CreativeWork`, `Article`, `TechArticle`, `ContactPage`, or `BreadcrumbList` schemas exist.
- **Recommended Fix:** Refactor `src/lib/seo.ts` into a page-type-aware schema graph builder, restrict `ProfessionalService`/`Service` to `/services`, and attach accurate schemas + `BreadcrumbList` per route.

#### P1-3: Travel & Photography Metadata, Unused Rich CMS Fields, Duplicate DOM List, & Generic Image Alts
- **Evidence:**
  - 298 of 407 images across 10 published albums + `bali` use camera-filename or placeholder `alt` strings (e.g. `"Tràng An — DSC_3829"`, `"Hà Giang --- photo 1"`), despite every image having verified `title` and `location` fields.
  - `/photos/[slug].astro` ignores `location.seoTitle`, `location.seoDescription`, `editorial.seoDescription`, and `location.seoImage` / `heroImage` for `ogImage`.
  - 17 of 24 published JSONs contain populated first-hand fields (`overview`, `travelFrom`, `travelTime`, `recommendedStay`, `transportation`, `localTransport`, `suitableFor`, `notFor`, `weatherNote`, `travelTips`, `favoriteThings`, `whatIWouldDoAgain`, `relatedLocations`) that are never rendered in HTML.
  - `/photos/index.astro` contains a permanently hidden `display: none` `#photos-list` duplicate block.
- **Recommended Fix:** Upgrade generic alt generation from verified `title` + `location`; wire destination-specific SEO titles, descriptions, and `ogImage`; render all verified non-empty planning/experience fields and related destinations; remove `#photos-list` duplicate hidden DOM and replace with a visible region & travel-style directory below the GlassFolder grid.

#### P1-4: Missing Growth & Performance Marketing Hub, Playbook Template, and Formula Library
- **Evidence:**
  - Pillar B knowledge is currently scattered across `/`, `/services`, `/resume`, and 6 `/work/[slug]` case studies without a structured hub, standardized marketing playbook schema, or performance formula reference library.
  - Case studies (`/work/[slug]`) do not link to `/services`, `/about`, `/resume`, or methodology formulas.
- **Recommended Fix:** Add `growth` collection schema in `src/content/config.ts`, build `/growth` hub, `/growth/metrics` Performance Marketing Formula Library, and `/growth/[slug].astro` reusable playbook route, and add cross-links across `/work/*`, `/services`, `/`, `/about`, and `/resume`.

#### P1-5: Stale `public/llms.txt` & Writing Metadata
- **Evidence:**
  - `public/llms.txt` line 25 still states: *"The current three articles are clearly marked as samples for a layout preview..."*, whereas `/writing` currently displays 7 personal essays/stories (`linkable: false`, `sample: false`), and `/growth` + `/growth/metrics` were not present.
- **Recommended Fix:** Update `public/llms.txt` to accurately represent both knowledge pillars, canonical no-trailing-slash URLs, 24 published photography albums, `/growth`, `/growth/metrics`, and current `/writing` state.

---

### P2 — Bilingual Readiness, Analytics & Automated Quality Gates

- **P2-1:** `astro.config.mjs` declares `locales: ['en', 'vi']`, but no `/vi/` pages exist; `DashboardLayout.astro` hardcodes `lang="en"` and `en_US` OG locale. -> Parameterize `lang` and `alternates` in `DashboardLayout.astro` + `seo.ts` while documenting a strict bilingual migration plan (no machine-translated doorway pages).
- **P2-2:** No automated GEO audit script exists in `package.json`. -> Implement `scripts/geo-audit.mjs` (`npm run geo:audit`) checking metadata, canonicals, robots, JSON-LD, Markdown alternates, sitemap integrity, internal links, and non-JS HTML content across all routes.
- **P2-3:** Measurement & AI-referral reporting guidance does not exist. -> Document in `docs/GEO_MEASUREMENT.md` without injecting unauthorized tracking pixels.

---

## 4. Verification Status

- **Before Implementation:** All P0/P1 findings above reproduced against live `https://loc.digital` and local `.vercel/output/static/`.
- **After Implementation:** Verified locally via `pnpm test` (`5` files, `24` tests), `node --test` (`10` tests), `astro check` (`80` files, `0` errors, `0` warnings, `0` hints), `pnpm build` (`44` Markdown pages + static output), and `npm run geo:audit` (`3911` checks passed, `0` warnings, `0` failures).

---

## 5. Implemented Fixes & Post-Implementation Results

| Audit ID | Implemented Fix | Files Changed | Verification Result |
| --- | --- | --- | --- |
| **P0-1** | Enabled `trailingSlash: 'never'` in Astro, normalized `canonicalUrl()`/`canonicalPath()`, normalized sitemap `<loc>` URLs, added real `lastmod` from `data/photo-updates.json`, and upgraded `/service` & `/experience` redirects to `301`. Vercel adapter emits `308` redirects from `/path/` to `/path`. | `astro.config.mjs`, `src/lib/seo.ts`, `src/layouts/DashboardLayout.astro` | Verified in `.vercel/output/config.json` and `.vercel/output/static/sitemap-0.xml`; `geo:audit` confirmed canonical consistency across all HTML pages. |
| **P0-2** | Filtered `published !== false` in `getPhotoLocations()` and excluded unpublished photo slugs from `@astrojs/sitemap`. | `src/lib/content.ts`, `astro.config.mjs` | `/photos/bali` (`published: false`) is excluded from `sitemap-0.xml`, `/photos`, and built static output. |
| **P0-3** | Added `noindex` support in `DashboardLayout.astro` (`noindex, nofollow`, no canonical/hreflang/alternate/JSON-LD) and applied to `404.astro`; replaced stale `"17 travel galleries"` with dynamic published gallery count (`24`). | `src/layouts/DashboardLayout.astro`, `src/pages/404.astro` | Verified in `.vercel/output/static/404.html`. |
| **P0-4** | Wired `aria-describedby` in SSR HTML on `PixelFlipPhoto.astro` and preserved it in `pixel-flip-photo.ts`; taught `scripts/html-to-markdown.mjs` to extract `[data-pixel-photo]` front images, titles, capture metadata, and stories cleanly into `.md` alternates without duplicating visible text in HTML. | `src/components/ui/PixelFlipPhoto.astro`, `src/scripts/pixel-flip-photo.ts`, `scripts/html-to-markdown.mjs`, `scripts/agent-content.test.mjs` | Verified `.vercel/output/static/photos/trang-an.md` and all 24 gallery `.md` exports include photos, titles, metadata, and stories; unit test added. |
| **P0-5** | Scoped `.gear-masonry:not([data-gear-shuffled="1"])` under `:global(html.js)` in `src/pages/gear.astro` so non-JS initial HTML renders the full gear catalog visibly. | `src/pages/gear.astro` | Verified in `.vercel/output/static/gear/index.html` and `geo:audit`. |
| **P0-6** | Added a minimal `.workspace-doc-footer` in `DashboardLayout.astro` (excluded from Markdown duplicate output) plus contextual links on `/`, `/about`, `/resume`, `/services`, `/work`, and `/writing`. | `src/layouts/DashboardLayout.astro`, `src/pages/index.astro`, `src/pages/about.astro`, `src/pages/resume.astro`, `src/pages/services.astro`, `src/pages/work/index.astro` | `geo:audit` verified 0 broken internal links and 0 orphaned sitemap pages. |
| **P1-1** | Synchronized `personSchema()` phone to `+84888886038` matching `/contact`; added `alternateName`, `alumniOf` (`FPT University`), and dual-pillar `knowsAbout` topics. | `src/lib/seo.ts`, `src/lib/seo.test.ts` | Verified in unit tests and `geo:audit` (zero stale `+84777779459` strings). |
| **P1-2** | Removed blanket `ProfessionalService` from non-service pages; added `ProfilePage`, `CollectionPage`/`ItemList`, `ImageGallery` + `Place` + `ImageObject[]`, `CreativeWork`, `TechArticle`, `BlogPosting`, `Service[]`, `ContactPage`, and `BreadcrumbList` builders. | `src/lib/seo.ts`, `src/layouts/DashboardLayout.astro`, all route templates | Verified across all representative routes in `geo:audit`. |
| **P1-3** | Created `resolvePhotoAlt()` (`src/lib/photo-alt.ts`) to replace 284 published generic `DSC_*`/`photo N` alts using verified `title` + `location`; wired destination `seoTitle`, `seoDescription`, and cover `ogImage`; rendered verified non-empty planning/experience fields and nearby/related destinations; replaced dead `#photos-list` hidden block on `/photos` with visible region directory. | `src/lib/photo-alt.ts`, `src/lib/content.ts`, `src/pages/photos/index.astro`, `src/pages/photos/[slug].astro`, `src/content/config.ts` | Verified 0 generic `DSC_*` alts remain in built `/photos/*` HTML and all destination stories/logistics render cleanly. |
| **P1-4** | Built `/growth` hub, `/growth/metrics` Performance Marketing Formula Library, and `/growth/[slug].astro` reusable playbook route backed by `growth` Zod collection; enriched `/work/[slug]` with cross-links and `CreativeWork` schema without leaking gated passwords. | `src/pages/growth/index.astro`, `src/pages/growth/metrics.astro`, `src/pages/growth/[slug].astro`, `src/content/config.ts`, `src/pages/work/[slug].astro` | Built and verified via `astro check` and `geo:audit` (0 leaked secrets). |
| **P1-5** | Updated `public/llms.txt` to reflect both pillars, `/growth`, `/growth/metrics`, 24 published galleries, accurate `/writing` state, and canonical no-trailing-slash URLs. | `public/llms.txt` | Verified in `geo:audit`. |
| **P2** | Parameterized `lang` and `alternates` in `DashboardLayout.astro` + `seo.ts`; implemented automated `npm run geo:audit` gate (`scripts/geo-audit.mjs`); documented strategy & measurement. | `scripts/geo-audit.mjs`, `package.json`, `docs/*` | `npm run geo:audit` passed 3911 checks with 0 failures/warnings. |

### Remaining Owner-Side Blockers
- **Apex / `www` DNS & Redirect:** `https://www.loc.digital/` did not establish a TLS/HTTP connection during live inspection and `www.loc.digital` is not configured in `vercel domains ls` (`loc.digital` and `imagecopyrighthub.com` only); add `www.loc.digital` and configure a `301`/`308` redirect to `https://loc.digital` in Vercel Project Settings -> Domains and DNS.
- **Search Console / Bing Webmaster / GA4 / Editorial Backlog:** See `docs/GEO_HANDOFF.md` and `docs/GEO_CONTENT_STRATEGY.md`.

### Production Deployment Status
- Deployed to Vercel production (`https://loc.digital`, deployment `dpl_CXceyFtsnhjkcqDt6UMMPCSJ7jtg`, alias `https://porfolio-ekwnqg8i6-phucloc.vercel.app`) after owner authorization.

