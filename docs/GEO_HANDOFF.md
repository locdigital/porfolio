# GEO Implementation Handoff — `https://loc.digital`

**Completion Date:** 2026-11-16  
**Production Deployment:** `https://porfolio-ekwnqg8i6-phucloc.vercel.app` -> aliased to `https://loc.digital` (`dpl_CXceyFtsnhjkcqDt6UMMPCSJ7jtg`, `● Ready`)  
**Repository:** `/Users/phucloc/Downloads/portfolio vibe dashboard`

---

## 1. Summary of Changes Implemented

1. **P0 Crawlability, Indexing & Canonicalization:**
   - Configured `trailingSlash: 'never'` and permanent `301` alias redirects (`/service -> /services`, `/experience -> /about`) in `astro.config.mjs`. `@astrojs/vercel` now serves `308` redirects from trailing-slash paths (`/path/`) to canonical `/path`.
   - Enforced `published !== false` filtering in `getPhotoLocations()` (`src/lib/content.ts`) and excluded unpublished albums (`bali.json`, `published: false`) and `/404` from `@astrojs/sitemap`, with real `lastmod` dates sourced from `data/photo-updates.json`.
   - Updated `404.astro` + `DashboardLayout.astro` to emit `<meta name="robots" content="noindex, nofollow">`, suppress `<link rel="canonical">` / `og:url` / `hreflang` / Markdown alternate / JSON-LD on 404, and render live published gallery count (`24`).
   - Preserved `PixelFlipPhoto.astro` visual and flip mechanics untouched while wiring `aria-describedby` in initial SSR HTML and updating `scripts/html-to-markdown.mjs` to extract `[data-pixel-photo]` front images, titles, capture metadata, and stories cleanly into `.md` alternates without duplicating visible text in HTML.
   - Scoped `.gear-masonry:not([data-gear-shuffled="1"])` under `:global(html.js)` in `src/pages/gear.astro` so non-JS renders display the full catalog.
   - Added a minimal `.workspace-doc-footer` in `DashboardLayout.astro` (excluded from `.md` alternates) plus contextual cross-links across `/`, `/about`, `/resume`, `/certificates`, `/services`, `/work`, `/growth`, and `/photos` so zero indexable pages are orphaned.

2. **P1 Centralized Technical SEO & Schema.org Knowledge Graph:**
   - Refactored `src/lib/seo.ts` (`canonicalPath`, `canonicalUrl`, `pruneEmpty`, `personSchema`, `websiteSchema`, `breadcrumbListSchema`, `pageSchema`, `collectionPageSchema`, `articleSchema`, `imageGallerySchema`, `serviceItemsSchema`).
   - Fixed stale telephone `+84777779459` -> `+84888886038` (matching `/contact`), added verified `alternateName` (`Loc`, `Henry`, `Nguyen Phuc Loc`, `Loc Nguyen`), `alumniOf` (`FPT University`), and dual-pillar `knowsAbout`.
   - Removed blanket `ProfessionalService` from non-service pages; attached page-specific schemas (`WebPage`, `ProfilePage`, `CollectionPage`/`ItemList`, `ImageGallery`+`Place`+`ImageObject[]`, `CreativeWork`, `TechArticle`, `BlogPosting`, `Service[]`, `ContactPage`, `BreadcrumbList`) per route.
   - Updated `DashboardLayout.astro` to support `ogType`, `ogImageAlt`, `author`, `datePublished`, `dateModified`, `noindex`, `lang`, and `alternates`.

3. **P1 Travel & Photography GEO System:**
   - Extended `photos` and `photoImageSchema` in `src/content/config.ts` with backward-compatible optional fields (`alternateNames`, `destinationType`, `visitStartDate`, `visitEndDate`, `budgetCurrency`, `budgetVerifiedAt`, `activities`, `highlights`, `photographySpots`, `bestLightConditions`, `limitations`, `safetyNotes`, `historicalContext`, `historicalSources`, `officialSources`, `camera`, `lens`, `focalLength`, `aperture`, `shutterSpeed`, `iso`, `creator`, `license`, etc.).
   - Created `src/lib/photo-alt.ts` (`resolvePhotoAlt`) to replace raw camera-filename placeholders (`DSC_*`, `photo N`) using verified frame `title` and `location`.
   - Enhanced `src/pages/photos/[slug].astro` to use destination `seoTitle`, `seoDescription`, cover `ogImage`, and render verified non-empty planning/experience fields (`overview`, `favoriteThings`, `whatIWouldDoAgain`, `suitableFor`, `notFor`, `transportation`, `localTransport`, `weatherNote`, `travelTips`, `crowdLevel`, `travelDifficulty`, `relatedLocations`) while clearly separating personal observations from external historical references.
   - Removed the hidden `display: none` `#photos-list` duplicate block from `src/pages/photos/index.astro` and added a visible **Destinations by region** directory below the GlassFolder grid.

4. **P1 Growth & Performance Marketing Knowledge System:**
   - Added `growth` playbook collection schema in `src/content/config.ts` and `getGrowthPlaybooks()` in `src/lib/content.ts`.
   - Created `src/pages/growth/index.astro` (Growth Hub across 5 core clusters), `src/pages/growth/metrics.astro` (Performance Marketing Formula Library for ROAS, MER, CAC, CVR, AOV, Revenue Decomposition, Break-even ROAS, and Contribution Profit with variable units, revenue-basis distinctions, and limitations), and `src/pages/growth/[slug].astro` (reusable playbook route).
   - Enriched `src/pages/work/[slug].astro` with `CreativeWork` JSON-LD, `ogImage`, and links to `/services`, `/growth`, `/growth/metrics`, and `/about`, preserving `ShowcasePassGate` protection.

5. **P2 Discovery, Documentation & Automated Audit Gate:**
   - Updated `public/llms.txt` accurately with both pillars, `/growth`, `/growth/metrics`, 24 published galleries, and current `/writing` status.
   - Added `scripts/geo-audit.mjs` (`npm run geo:audit`) and `src/lib/seo.test.ts`.
   - Produced all 5 GEO documentation artifacts in `docs/`.

---

## 2. File-by-File Inventory (This Implementation)

### Modified Files
- `astro.config.mjs` — `trailingSlash: 'never'`, `301` redirects, custom `@astrojs/sitemap` filter/serializer with real `lastmod`
- `package.json` — Added `"geo:audit": "node scripts/geo-audit.mjs"`
- `public/llms.txt` — Updated site guide reflecting both pillars, `/growth`, `/growth/metrics`, and accurate `/writing` status
- `scripts/html-to-markdown.mjs` — Extracts `[data-pixel-photo]` front images, titles, metadata, and stories; omits `.workspace-doc-footer`
- `scripts/agent-content.test.mjs` — Added test for `PixelFlipPhoto` Markdown extraction
- `src/content/config.ts` — Extended `projects`, `photos`, `writing` schemas; added `growth` playbook collection
- `src/lib/content.ts` — Filtered `published !== false` in `getPhotoLocations()`, integrated `resolvePhotoAlt()`, added `getGrowthPlaybooks()`
- `src/lib/seo.ts` — Fixed phone `+84888886038`, added canonicalization helpers and page-specific Schema.org graph builders
- `src/layouts/DashboardLayout.astro` — Full SEO props (`ogType`, `ogImageAlt`, `noindex`, `lang`, `alternates`), automatic `BreadcrumbList` / `WebPage` graph assembly, minimal `.workspace-doc-footer`
- `src/components/ui/PixelFlipPhoto.astro` & `src/scripts/pixel-flip-photo.ts` — Initial `aria-describedby` accessibility wiring without changing visual flip behavior
- `src/pages/index.astro`, `about.astro`, `services.astro`, `resume.astro`, `certificates.astro`, `contact.astro`, `gear.astro`, `404.astro` — Page-specific schemas, `noindex` on 404, non-JS visibility on `/gear`, internal linking across all routes
- `src/pages/work/index.astro` & `src/pages/work/[slug].astro` — `CollectionPage` / `CreativeWork` schemas, `ogImage`, cross-links
- `src/pages/photos/index.astro` & `src/pages/photos/[slug].astro` — Excluded draft `bali`, removed hidden `#photos-list`, added region directory, destination SEO/OG metadata, `ImageGallery` + `Place` + `ImageObject[]` schemas, verified planning/experience sections
- `src/components/writing/WritingArchive.astro` & `src/pages/writing/[slug].astro` — `CollectionPage` / `BlogPosting` schemas, author link, `ogType="article"`

### Added Files
- `src/lib/photo-alt.ts` — Pure descriptive `resolvePhotoAlt()` utility
- `src/lib/seo.test.ts` — Vitest suite for canonicalization, JSON-LD safety, schema builders, and `resolvePhotoAlt`
- `src/pages/growth/index.astro` — Growth & Performance Marketing Hub (`/growth`)
- `src/pages/growth/metrics.astro` — Performance Marketing Formula Library (`/growth/metrics`)
- `src/pages/growth/[slug].astro` — Reusable Playbook template (`/growth/[slug]`)
- `src/content/growth/.gitkeep` — Collection directory ready for future published Markdown playbooks
- `scripts/geo-audit.mjs` — Automated static build GEO verification gate
- `docs/GEO_AUDIT.md`, `docs/GEO_ARCHITECTURE.md`, `docs/GEO_CONTENT_STRATEGY.md`, `docs/GEO_MEASUREMENT.md`, `docs/GEO_HANDOFF.md`

---

## 3. Tests & Build Results Observed

| Command | Result | Notes |
| --- | --- | --- |
| `pnpm test` (`vitest run`) | **5 files, 24 tests passed** | Includes `typography.test.ts` (10), `seo.test.ts` (6), `photo-capture.test.ts` (4), `gear-shuffle.test.ts` (2), `photo-title-colors.test.ts` (2) |
| `node --test scripts/agent-content.test.mjs scripts/sync-photo-updates.test.mjs` | **10 tests passed** | Covers Markdown negotiation, `PixelFlipPhoto` Markdown extraction, and photo timestamp hashing |
| `pnpm build` (`astro check && astro build && patch-vercel-runtime && build-agent-content`) | **Passed** | `astro check`: 80 files, 0 errors, 0 warnings, 0 hints; `44` Markdown pages + static output built in 7.01s |
| `npm run geo:audit` | **3911 checks passed, 0 warnings, 0 failures** | Audited all built HTML, JSON-LD, Markdown alternates, sitemap, robots, `llms.txt`, alt attributes, and non-leakage of private passwords |
| `vercel deploy --prebuilt --prod --yes` | **Ready in 37s** | Live at `https://loc.digital` (`dpl_CXceyFtsnhjkcqDt6UMMPCSJ7jtg`) |
| Live HTTP verification (`curl`) | **Passed** | Verified `200` on all 43 canonical routes, `404` on `/photos/bali` and missing routes (`noindex, nofollow`), `308` trailing-slash redirects, `301` `/service` and `/experience` redirects, `Accept: text/markdown` on `/photos/trang-an` |

---

## 4. Deployment & Infrastructure Considerations

- **Always deploy via prebuilt pipeline (`pnpm build && vercel deploy --prebuilt --prod`)** or ensure CI runs `pnpm build` before deploying `.vercel/output/`, because `scripts/patch-vercel-runtime.mjs` (Node 22 runtime patch) and `scripts/build-agent-content.mjs` (`.md` alternates + `/_agent-content` Edge Function) mutate `.vercel/output/` after `astro build`.
- **Pre-existing Uncommitted Workspace Changes:** This repository already contained uncommitted work from the current branch/session (Phosphor icon migration, GlassFolder, PixelFlipPhoto, photo JSON updates, writing files). None of those in-progress assets were overwritten; both pre-existing edits and new GEO changes are currently uncommitted in git and ready for you to review and commit when ready.

---

## 5. Manual Actions Requiring Owner Account / Editorial Input

1. **Add & Redirect `www.loc.digital` in Vercel / DNS:**
   - Currently `vercel domains ls` lists `loc.digital`, and `https://www.loc.digital/` failed to connect during audit. In Vercel Dashboard (`phucloc/porfolio` -> Settings -> Domains) and your DNS registrar, add `www.loc.digital` and configure a permanent `308`/`301` redirect to `https://loc.digital`.
2. **Verify Ownership in Google Search Console & Bing Webmaster Tools:**
   - Verify `loc.digital` via DNS TXT record and submit `https://loc.digital/sitemap-index.xml`.
   - Trigger a fresh Rescan at `https://is-agentic.com/scan/loc.digital`.
3. **Cloudflare / WAF Settings (if Cloudflare sits in front or is added later):**
   - If Bot Fight Mode or Managed Challenges are enabled, allow verified search bots (`Googlebot`, `Bingbot`, `OAI-SearchBot`, `Claude-SearchBot`, `PerplexityBot`) via vendor verified-bot controls rather than raw User-Agent rules.
4. **Editorial Decisions & Backlog (`docs/GEO_CONTENT_STRATEGY.md`):**
   - **`bali.json`:** Currently `"published": false` (excluded from public site & sitemap). Set `"published": true` and populate `region: "Southeast Asia"` when ready to publish.
   - **Budget Currency Verification:** Verify currency (`USD` vs `VND`) and add `budgetCurrency` + `budgetVerifiedAt` to the 16 photo JSONs that have numeric `budgetMin`/`budgetMax`.
   - **8 Photo JSONs Missing Planning Logistics:** Add `travelFrom`, `travelTime`, `recommendedStay`, `bestMonths`, `suitableFor`, and `travelTips` to `ha-long-bay`, `ha-noi`, `sa-pa`, `sai-gon`, `ta-chi-nhu`, `tam-coc-hoa-lu`, `thung-ui`, and `trang-an` (when verified from personal trips).
   - **7 Essays in `src/content/writing/*.md`:** Currently marked `linkable: false`. Flip `linkable: true` on the complete essays (`sa-pa`, `my-first-100k`, `believe-in-yourself`, `from-curiosity-to-creation`, `phoenix`, `youth-without-regrets`) once ready for public indexing.
   - **Growth Playbooks:** Author real SOP-backed playbooks in `src/content/growth/*.md` (using the schema in `src/content/config.ts`) and flip `draft: false`, `status: "published"`.
5. **Analytics / GA4 Decision (`docs/GEO_MEASUREMENT.md`):**
   - Decide whether to enable consent-compliant GA4 tracking (updating `/privacy` first) to monitor AI-referral traffic and run the quarterly 12-query AI visibility baseline.
