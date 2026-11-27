# Cloudflare Infrastructure Before / After Performance & Verification Report

**Date:** 2026-11-26
**Target Site:** `https://loc.digital` (`locdigital/porfolio`, Astro 5 + Vercel + Cloudflare DNS/R2/Web Analytics/Turnstile)
**Baseline Reference:** Existing `PERFORMANCE_REPORT.md` (measured 2026-11-25 against local production output) and `scripts/audit-media.mjs`.
**After Measurement:** Local production output (`.vercel/output/static`) built on 2026-11-26 after Cloudflare infrastructure integration, served over localhost with gzip compression and production `Cache-Control` headers, audited via headless Google Chrome (Chrome DevTools Protocol).

> [!NOTE]
> Cloudflare R2 upload and DNS nameserver migration require authenticated Cloudflare & Spaceship dashboard actions (see `CLOUDFLARE_SETUP.md`). Therefore, "After" measurements reflect the **local build & runtime verification prior to R2 cutover** (with R2 manifest fallback active and responsive image optimization applied to `/about` and the shared asset pipeline). Re-run this comparison against a Vercel Preview Deployment after executing `pnpm run assets:optimize && pnpm run assets:migrate:r2`.

---

## 1. Asset & Build Inventory

| Metric | Before (Baseline Audit) | After (Cloudflare Integration Pass) | Notes |
| :--- | ---: | ---: | :--- |
| Repository media/asset files (`public/` + `src/` + root wallpaper) | 609 media files (142.78 MB) | 613 tracked assets (140.92 MiB / 147.76 MB) | Includes 2 WOFF2 fonts (57 KiB), 1 PDF (`resume.pdf`, 3.23 MiB), and root wallpaper PNG |
| Byte-identical duplicate assets | 0 | 0 | Verified by SHA-256 across all 613 files |
| R2 Free Tier utilization (10 GB/mo) | N/A | **1.38%** (raw originals) | Well inside Cloudflare R2 Free Tier |
| Responsive optimization candidates (`scripts/optimize-assets.mjs --dry-run`) | N/A | 562 images -> 1,884 variants (`480, 768, 1200, 1920`px) | Plus 320px thumbnail + 20px WebP blur placeholder per asset |
| Production build static output (`.vercel/output/static`) | 452.49 MiB | 472 MiB (`.vercel/output` total: 605 MiB) | Expected to drop significantly once R2 variants replace build-time Sharp derivatives |
| Built HTML/CSS asset references (`validate-built-assets.mjs`) | 3,935 refs, 0 missing | **3,970 refs, 0 missing** | Zero broken local asset links |
| Markdown agent-content pages (`build-agent-content.mjs`) | Prerendered | **62 Markdown pages** | `Vary: Accept` & `/_agent-content` Edge Function preserved |

### Single-Asset Optimization Highlight (`/about` Portrait)

| Asset | Before (Raw PNG) | After (Responsive WebP via `<ResponsiveImage>`) | Savings |
| :--- | ---: | ---: | ---: |
| `/images/about-photographer.png` (1024×1536) | 1,663 KiB | `480w`: **62 KiB**, `768w`: **102 KiB**, `1024w`: **135 KiB** | **-91.9% to -96.3%** |

---

## 2. Cold Transfer & Lab Web Vitals Comparison (Headless Chrome CDP)

Measured at **Desktop (1440×900, 1× DPR)** and **Mobile (390×844, 2× DPR)** with browser cache disabled (`Network.setCacheDisabled: true`). Third-party analytics hosts were blocked in the offline localhost harness to keep first-party byte measurements deterministic.

| Route | Desktop Transfer Before → After | Mobile Transfer Before → After | Desktop LCP / CLS | Mobile LCP / CLS | Broken Imgs / Errors / Overflow |
| :--- | ---: | ---: | :---: | :---: | :---: |
| `/` (Workspace) | 483.1 → 632.0 KiB* | 385.2 → 532.5 KiB* | 60 ms / 0.000 | 40 ms / 0.000 | 0 / 0 / 0 px |
| `/about` | **2,041.3 → 628.6 KiB (-69.2%)** | **1,943.4 → 530.6 KiB (-72.7%)** | 44 ms / 0.000 | 40 ms / 0.000 | 0 / 0 / 0 px |
| `/work` | 459.8 → 592.0 KiB* | 339.1 → 484.7 KiB* | 48 ms / 0.000 | 40 ms / 0.000 | 0 / 0 / 0 px |
| `/work/playah` | — → 628.9 KiB | — → 543.6 KiB | 80 ms / 0.000 | 36 ms / 0.000 | 0 / 0 / 0 px |
| `/services` | 532.5 → 578.8 KiB* | 434.6 → 480.9 KiB* | 56 ms / 0.000 | 48 ms / 0.000 | 0 / 0 / 0 px |
| `/writing` | 508.6 → 612.4 KiB* | 410.7 → 514.4 KiB* | 68 ms / 0.000 | 44 ms / 0.000 | 0 / 0 / 0 px |
| `/growth` | 438.2 → 589.1 KiB* | 340.2 → 491.1 KiB* | 48 ms / 0.0029 | 52 ms / 0.000 | 0 / 0 / 0 px |
| `/photos` | **1,551.1 → 997.9 KiB (-35.7%)** | 523.1 → 647.9 KiB* | 104 ms / 0.000 | 60 ms / 0.000 | 0 / 0 / 0 px |
| `/photos/sa-pa` | — → 810.5 KiB | — → 666.0 KiB | 68 ms / 0.000 | 48 ms / 0.000 | 0 / 0 / 0 px |
| `/music/spotify` | — → 2,209.0 KiB | — → 2,111.1 KiB | 216 ms / 0.000 | 312 ms / 0.000 | 0 / 0 / 0 px |
| `/entertainment/netflix` | — → 1,687.9 KiB | — → 1,591.4 KiB | 84 ms / 0.000 | 52 ms / 0.000 | 0 / 0 / 0 px |

*\*Note on baseline transfer delta:* The working tree already contained uncommitted pre-session changes (including Astro 5 upgrade, `AssistiveTouch.tsx`, Spotify player updates, and additional writing/growth pages) compared to the Nov 25 `PERFORMANCE_REPORT.md` snapshot. The Cloudflare integration itself added **zero** client-side JS dependencies and **zero** extra runtime bytes when `PUBLIC_CF_WEB_ANALYTICS_TOKEN` is unset.

---

## 3. Lighthouse Status & Target (95+)

- **Installed CLI status:** `lighthouse` CLI is not installed in the local environment (`which lighthouse` -> not found), so live Lighthouse 12 scores were not re-run locally in this pass.
- **Recorded baseline (`PERFORMANCE_REPORT.md`):** Homepage Desktop **100 / 100** (LCP 0.71 s, CLS 0.000, TBT 0 ms); Homepage Mobile **93 / 100** (LCP 3.16 s, CLS 0.000, TBT 3 ms).
- **Expected post-preview Lighthouse impact:**
  - `/about` Mobile & Desktop LCP and Total Byte Weight improve dramatically (~1.41 MiB saved via responsive WebP + `fetchpriority="high"`).
  - Once assets are migrated to Cloudflare R2 (`assets.loc.digital`), edge-cached `480/768/1200/1920` WebP/AVIF variants with `public, max-age=31536000, immutable` reduce TTFB on photography pages globally.
  - Because `PUBLIC_CF_WEB_ANALYTICS_TOKEN` loads `beacon.min.js` with `defer` and no new client bundles were introduced, Homepage Desktop remains targeted at **99–100** and Mobile **93–96+**.
  - **Recommended verification step:** Run Lighthouse (`npx lighthouse <preview-url> --preset=desktop` and mobile) against the **Vercel Preview Deployment** before production release.

---

## 4. Regression & Verification Checklist Results

| Check | Command / Scope | Result |
| :--- | :--- | :--- |
| Type checking | `pnpm run check` (`astro check`) | **PASS** — 0 errors, 0 warnings across 176 files |
| Unit tests (Vitest) | `pnpm test` | **PASS** — 11 test files, **61 / 61 tests passed** (incl. R2 SigV4/client, asset resolver, Turnstile verifier) |
| Script tests (`node --test`) | `scripts/agent-content.test.mjs`, `sync-photo-updates.test.mjs`, `assets-scripts.test.mjs` | **PASS** — **12 / 12 tests passed** (incl. Sharp optimization, idempotency, R2 dry-run) |
| Production build | `pnpm run build` | **PASS** — 51.74 s, Node 22 runtime patched, 62 Markdown pages generated |
| Built asset integrity | `node scripts/validate-built-assets.mjs` | **PASS** — 3,970 references, **0 missing** |
| API & crawler endpoints | `/api/photos.json`, `/api/photos-widget.json`, `/robots.txt`, `/sitemap-index.xml` | **PASS** — All HTTP 200 with expected `Cache-Control` headers |
| Headless Chrome regression | 11 routes × 2 viewports (22 runs) | **PASS** — 0 failed requests, 0 JS exceptions, 0 broken eager images, 0 horizontal overflow, Dock & main content verified |
| GEO audit (`pnpm run geo:audit`) | 4,798 checks | **4,790 passed**, 8 pre-existing failures from Astro 5 regex redirects (`^/service$` vs `/service` in `geo-audit.mjs`) and pre-existing route removals (`/certificates`, sidebar links) — none introduced by Cloudflare changes |
