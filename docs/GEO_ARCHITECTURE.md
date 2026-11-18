# GEO & Technical SEO Architecture — `https://loc.digital`

**Last Updated:** 2026-11-16  
**Framework:** Astro `^4.16.19` (`output: 'hybrid'`, `@astrojs/vercel/serverless`)  
**Canonical Origin:** `https://loc.digital` (no trailing slash on subpages)

---

## 1. Crawler Access & Content Negotiation

### 1.1 `robots.txt` Policy (`public/robots.txt`)
```txt
User-agent: *
Allow: /

Sitemap: https://loc.digital/sitemap-index.xml
```
- **Search Discovery Crawlers Allowed:** `Googlebot`, `Bingbot`, `OAI-SearchBot` (ChatGPT Search), `Claude-SearchBot` (Claude Search), `PerplexityBot` (Perplexity Search), and user-triggered fetchers (`ChatGPT-User`, `Claude-User`, `Perplexity-User`).
- **Model-Training Crawlers (`GPTBot`, `ClaudeBot`, `Google-Extended`):** Unchanged from the site's pre-existing `Allow: /` baseline; no separate restriction was added without explicit owner authorization.
- **Security Boundaries:** Protected project showcase assets and credentials remain protected. `ShowcasePassGate.astro` hashes access codes with SHA-256 at build time and renders `<slot />` inside `[hidden][data-gate-reveal]` (with zero private showcase content serialized in public HTML or Markdown).

### 1.2 WAF / CDN Considerations (Vercel & Cloudflare)
- The site is deployed on Vercel (`server: Vercel`, `strict-transport-security: max-age=63072000`).
- Live verification prior to implementation returned `HTTP 200` for `Googlebot`, `Bingbot`, `OAI-SearchBot`, `Claude-SearchBot`, `PerplexityBot`, `GPTBot`, and `ClaudeBot`.
- If Cloudflare or Vercel Attack Challenge Mode is enabled in front of `loc.digital` in the future, do **not** allowlist based on raw `User-Agent` headers alone; use Cloudflare's Verified Bots / ASN / signed-crawler verification or Vercel Firewall rules for published search crawler IP ranges.

### 1.3 Dual-Format Delivery (HTML + Markdown)
- Built HTML pages in `.vercel/output/static/` serve normal browsers via static CDN caching (`cache-control: public, max-age=0, must-revalidate`).
- `scripts/build-agent-content.mjs` exports `.md` alternates for every public HTML page (`index.md`, `about.md`, `photos/trang-an.md`, `growth.md`, `growth/metrics.md`, etc.) and deploys the `/_agent-content` Edge Function (`scripts/agent-content-handler.mjs`) for requests preferring `Accept: text/markdown`.
- `scripts/html-to-markdown.mjs` extracts content from `<main id="main-content">`, resolves canonical links, omits navigation/forms/hidden gates/`workspace-doc-footer`, and explicitly parses `[data-pixel-photo]` cards so every photograph (`![alt](src)`), title, capture date/time/location, and first-hand story appears in Markdown without duplicating visible HTML text.

---

## 2. Canonicalization & Redirect Architecture

- **Astro Config (`astro.config.mjs`):**
  - `site: 'https://loc.digital'`
  - `trailingSlash: 'never'`
  - `@astrojs/vercel` automatically generates permanent `308` redirects in `.vercel/output/config.json` from `/path/` to `/path` for every route (before `_agent-content` and `filesystem`).
  - Legacy alias redirects `/service -> /services` and `/experience -> /about` use `status: 301` permanent redirects.
- **Canonical Helper (`src/lib/seo.ts`):**
  - `canonicalPath()` strips query strings, hashes, and trailing slashes on non-root paths (`/` remains `/`).
  - `canonicalUrl()` resolves against `https://loc.digital`.
  - `<link rel="canonical">`, `og:url`, `hreflang`, `Content-Location`, internal `<a href>` links, `llms.txt`, and `sitemap-0.xml` all share the exact same canonical format.
- **Error Handling (`404.astro`):**
  - Passes `noindex={true}` to `DashboardLayout.astro`, emitting `<meta name="robots" content="noindex, nofollow">` and suppressing `<link rel="canonical">`, `og:url`, `hreflang`, `<link rel="alternate" type="text/markdown">`, and JSON-LD.

---

## 3. Sitemap Behavior (`@astrojs/sitemap`)

Configured in `astro.config.mjs`:
- **Included:** All canonically indexable public pages (`/`, `/about`, `/work`, `/work/*`, `/services`, `/growth`, `/growth/metrics`, `/photos`, `/photos/*` where `published !== false`, `/writing`, `/gear`, `/resume`, `/certificates`, `/contact`, `/privacy`), plus any future published `/growth/[slug]` playbooks or `linkable: true` `/writing/[slug]` articles.
- **Excluded:** `/404`, `/assets/*` (SSR binary proxy), redirecting routes (`/service`, `/experience`), and unpublished draft albums (`published: false`, currently `src/content/photos/bali.json`).
- **Real `lastmod` Timestamps:** Derived solely from `data/photo-updates.json` (which hashes album JSON + local/UploadThing asset bytes via `scripts/sync-photo-updates.mjs`). Build timestamps are never used as fake `lastmod` values.

---

## 4. Centralized SEO & Metadata System

- **Shared Layout (`src/layouts/DashboardLayout.astro`) + SEO Library (`src/lib/seo.ts`):**
  - Accepts `title`, `description`, `breadcrumbs`, `pageType`, `ogImage`, `ogImageAlt`, `ogType`, `author`, `datePublished`, `dateModified`, `noindex`, `robots`, `lang`, `alternates`, and `schema`.
  - Guarantees single `<title>`, single `<meta name="description">`, single `<meta name="robots">`, single `<link rel="canonical">`, and single `<script type="application/ld+json">` per page.
  - Emits Open Graph (`og:title`, `og:description`, `og:image`, `og:image:alt`, `og:url`, `og:type`, `og:locale`, `og:site_name`), Twitter Cards (`summary_large_image`), `article:published_time` / `article:modified_time` when `ogType === 'article'`, `<meta name="author">`, and Markdown alternate link.
  - Destination pages (`/photos/[slug]`) override `ogImage` with each destination's verified cover/SEO photograph; case studies (`/work/[slug]`) override `ogImage` with `project.coverImage`; general pages fall back to `DEFAULT_OG_IMAGE`.

---

## 5. Schema.org Knowledge Graph

Every indexable page emits a consolidated `@graph` anchored to two stable entity `@id`s:

- **`https://loc.digital/#person`** (`Person`):
  - `name`: `"Phuc Loc Nguyen"`
  - `alternateName`: `["Loc", "Henry", "Nguyen Phuc Loc", "Loc Nguyen"]`
  - `jobTitle`: `"Senior Performance Marketing Executive"`
  - `alumniOf`: `FPT University`
  - `email`: `"mailto:hi@loc.digital"`, `telephone`: `"+84888886038"` (verified against `/contact`)
  - `knowsAbout`: Dual-pillar expertise spanning Performance Marketing, Meta Ads, Google Ads, TikTok Shop Growth, Unit Economics, Attribution Modeling, CRO, Technical SEO, Marketing Automation, Travel Photography, Landscape Photography, Vietnam Travel
  - `sameAs`: Verified Instagram, LinkedIn, X, and Pexels URLs only
- **`https://loc.digital/#website`** (`WebSite`):
  - `publisher`: `{ "@id": "https://loc.digital/#person" }`

### Page-Specific Mapping
| Route Pattern | Schema Types in `@graph` |
| --- | --- |
| `/` | `Person`, `WebSite`, `WebPage` (`mainEntity: #person`) |
| `/about`, `/resume` | `Person`, `WebSite`, `ProfilePage` (`mainEntity: #person`), `BreadcrumbList` |
| `/services` | `Person`, `WebSite`, `WebPage`, `Service[]` (`provider: #person`), `BreadcrumbList` |
| `/work` | `Person`, `WebSite`, `CollectionPage`, `ItemList`, `BreadcrumbList` |
| `/work/[slug]` | `Person`, `WebSite`, `WebPage`, `CreativeWork` (`author/creator: #person`), `BreadcrumbList` |
| `/growth` | `Person`, `WebSite`, `CollectionPage`, `ItemList`, `BreadcrumbList` |
| `/growth/metrics` | `Person`, `WebSite`, `WebPage`, `TechArticle` (`author: #person`), `BreadcrumbList` |
| `/growth/[slug]` | `Person`, `WebSite`, `WebPage`, `TechArticle` (`author: #person`), `BreadcrumbList` |
| `/photos` | `Person`, `WebSite`, `CollectionPage`, `ItemList`, `BreadcrumbList` |
| `/photos/[slug]` | `Person`, `WebSite`, `Place` (`#place`), `ImageGallery` + `CollectionPage`, `ImageObject[]`, `BreadcrumbList` |
| `/writing`, `/certificates`, `/gear` | `Person`, `WebSite`, `CollectionPage`, `ItemList`, `BreadcrumbList` |
| `/writing/[slug]` | `Person`, `WebSite`, `WebPage`, `BlogPosting` (`author: #person`), `BreadcrumbList` |
| `/contact` | `Person`, `WebSite`, `ContactPage` (`mainEntity: #person`), `BreadcrumbList` |
| `/privacy` | `Person`, `WebSite`, `WebPage`, `BreadcrumbList` |
| `/404` | None emitted (`noindex, nofollow`) |

---

## 6. Content Collections, Media Pipeline & Internal Linking

- **`photos` (`src/content/photos/*.json` + `src/data/location-stories.ts`):**
  - Backward-compatible schema (`src/content/config.ts`) supports full destination planning metadata, verified EXIF/creator fields, historical references, and `published` flag (`published !== false` enforced by `getPhotoLocations()`).
  - Generic camera-filename `alt` values (`DSC_*`, `IMG_*`, `photo N`) are resolved in `src/lib/photo-alt.ts` from verified `title` + `location`.
  - Images are processed at build time via `optimizePhotos()` (`sharp`) into responsive WebP variants (`/_astro/*.webp`), with UploadThing manifest mapping (`data/uploadthing-images.json`) and `/assets/photos/[...path]` fallback.
  - `PixelFlipPhoto.astro` preserves the exact 980ms 3D flip experience while exposing `aria-describedby` in initial SSR HTML and exporting stories cleanly into Markdown.
- **`projects` (`src/content/projects/*.json`):**
  - Public summaries and narratives link to `/services`, `/growth`, `/growth/metrics`, and `/about`. Password-gated slots remain protected.
- **`growth` (`src/content/growth/*.md` + `/growth` + `/growth/metrics`):**
  - Standardized Zod schema for marketing playbooks (`problem`, `suitableFor`, `notSuitableFor`, `prerequisites`, `assumptions`, `keyMetrics`, `formulas`, `decisionFramework`, `implementationSteps`, `testingMethod`, `risks`, `limitations`, `commonMistakes`, `relatedCaseStudies`, `sourceReferences`).
- **`writing` (`src/content/writing/*.md`) & `gear` (`src/content/gear/setup.json`):**
  - All indexable pages are cross-linked via contextual links and the minimal workspace footer in `DashboardLayout.astro`, leaving zero orphaned pages.

---

## 7. International & Bilingual Migration Plan (English + Vietnamese)

`astro.config.mjs` already declares `locales: ['en', 'vi']` with `prefixDefaultLocale: false`. Currently, all public pages are authored in English (`<html lang="en">`) and `DashboardLayout.astro` + `src/lib/seo.ts` now support per-page `lang` (`'en' | 'vi'`) and reciprocal `alternates` (`hreflang`).

When ready to publish original Vietnamese content without creating thin machine translations:
1. **Option A (Dedicated `/vi/...` sub-routes for translated guides/playbooks):**
   - Place Vietnamese pages under `src/pages/vi/...` (or add `lang: "vi"` content entries routed to `/vi/growth/[slug]` or `/vi/photos/[slug]`).
   - Pass explicit `alternates` arrays ONLY on pages that have a genuine human-edited counterpart in the other language (never emit `hreflang="vi"` pointing to an untranslated English page).
2. **Option B (Original Vietnamese-only guides):**
   - Publish natively in Vietnamese under `/vi/...` with `lang="vi"`, `og:locale="vi_VN"`, `inLanguage: "vi"` in JSON-LD, and `hreflang="vi"` + `hreflang="x-default"` pointing to itself.
3. **Sitemap & Agent Markdown:**
   - Configure `@astrojs/sitemap`'s `i18n` option once reciprocal `/vi/` routes exist, and `build-agent-content.mjs` will automatically export `/vi/...md` variants.
