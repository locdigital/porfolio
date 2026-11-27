# Cloudflare Infrastructure Setup Guide (`loc.digital`)

This guide documents the complete setup, DNS migration, Cloudflare R2 asset migration, caching configuration, Web Analytics, Turnstile evaluation, and rollback procedures for **https://loc.digital** (repository: `locdigital/porfolio`, Astro 5 + Vercel).

> [!IMPORTANT]
> **Paid Services Guardrail:** Do **not** enable paid Cloudflare add-ons (Pro/Business plans, Argo, Image Resizing, Workers Paid, etc.) without explicit approval. Everything in this architecture operates comfortably on **Cloudflare Free** + **Cloudflare R2 Free Tier** (10 GB storage, 1M Class A ops, 10M Class B ops, zero egress fees).

---

## 1. Exact Status & Pending Dashboard / Account Actions

### Completed via Cloudflare API (Account `3c30e4e1d62272aec3c0a93c37f19fd1`, Free Plan)
- **Cloudflare DNS Zone staged (`status: pending`)**: `loc.digital` (Zone ID: `bc09b0ee9d2b627e8049e89626b4d954`, Plan: Free Website).
- **Assigned Cloudflare Nameservers**: `julian.ns.cloudflare.com` and `marjory.ns.cloudflare.com`.
- **Pre-populated DNS records (all verified in DNS Only / `proxied: false` mode)**:
  - `A` `loc.digital` -> `216.198.79.1` (Vercel)
  - `MX` `loc.digital` -> `0 mx1.spacemail.com`, `0 mx2.spacemail.com`
  - `TXT` `loc.digital` -> `"v=spf1 include:spf.spacemail.com ~all"`
  - `TXT` `spacemail._domainkey.loc.digital` -> Spacemail DKIM public key
  - `TXT` `_vercel.loc.digital` -> `"vc-domain-verify=loc.digital,33918e6f72e80f07fb5d"`
- **Cloudflare Web Analytics site created (`auto_install: false`)**: host `loc.digital`, Site Tag `ef2d956fff3c4b0387d73289f55464f7`.

### Remaining Manual Dashboard Actions (Not Executed Remotely)

1. **Spaceship Registrar (Pre-flight DNSSEC Disable & Nameserver Cutover)**
   - **CRITICAL:** Live DNS shows DNSSEC is currently **enabled** on `loc.digital` (`DS 33647 13 2 A254787431FEAE46D1445CB0E170E6117A162BD87D8C5465C23CF78ACF8A804A`).
   - Disable DNSSEC in Spaceship **first** and wait until `dig +short DS loc.digital` returns empty (typically 24–48 hours or per DS TTL) **before** switching nameservers.
   - Review the staged zone in Cloudflare Dashboard (check Spaceship for any additional private/custom subdomains not visible publicly, and add `www` if configured in Vercel).
   - Switch nameservers at Spaceship from `launch1.spaceship.net` / `launch2.spaceship.net` to:
     - `julian.ns.cloudflare.com`
     - `marjory.ns.cloudflare.com`
   - Optionally re-enable Cloudflare-managed DNSSEC after Cloudflare becomes authoritative and propagation is stable.
2. **Cloudflare R2 Activation & Bucket Setup**
   - R2 is not yet enabled on account `3c30e4e1d62272aec3c0a93c37f19fd1` (API returned `code 10042: Please enable R2 through the Cloudflare Dashboard`).
   - Enable R2 in Cloudflare Dashboard (requires payment method on file; free tier covers 10 GB/mo — our entire media tree is ~141 MiB, 1.38% of the free tier).
   - Once enabled, create bucket **`loc-digital-assets`**, connect Custom Domain **`assets.loc.digital`** (after DNS cutover completes), apply the CORS policy in Section 3.2, and create a bucket-scoped R2 API Token (`Object Read & Write` on `loc-digital-assets` only).
3. **Environment Variables (Local `.env.local` & Vercel Project `porfolio`)**
   - Add server-side variables (`R2_ACCOUNT_ID=3c30e4e1d62272aec3c0a93c37f19fd1`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME=loc-digital-assets`) to `.env.local` for running migrations.
   - Add `PUBLIC_ASSET_BASE_URL=https://assets.loc.digital` to Vercel (Production & Preview).
4. **Run Asset Optimization & R2 Migration**
   - Execute `pnpm run assets:optimize -- --avif` locally, review `pnpm run assets:migrate:r2:dry`, then run `pnpm run assets:migrate:r2`.
   - Commit the verified `data/r2-assets.json` manifest to a preview branch, verify the Vercel Preview Deployment, then promote to Production.
5. **Cloudflare Web Analytics Activation (Optional)**
   - Set `PUBLIC_CF_WEB_ANALYTICS_TOKEN` in Vercel environment variables to the Web Analytics site token created for `loc.digital` (visible in Cloudflare Dashboard -> Analytics & Logs -> Web Analytics -> `loc.digital`) and redeploy. (Note: review and update `src/pages/privacy.astro` copy before enabling alongside GTM.)

---

## 2. Phase 2 — Cloudflare DNS Migration Checklist

### 2.1 Current Live DNS Snapshot (Verified via `dig` on 2026-11-26)

| Record Type | Name | Current Value | Proxy Mode in Cloudflare | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `NS` (current) | `loc.digital` | `launch1.spaceship.net.`, `launch2.spaceship.net.` | N/A | Replace with Cloudflare NS only after DNSSEC is off & records are verified |
| `A` | `loc.digital` (`@`) | **`216.198.79.1`** | **DNS Only (Grey Cloud)** | Vercel apex hosting IP (actual assigned value — do NOT hardcode generic `76.76.21.21`) |
| `CNAME` (optional) | `www` | *(Confirm exact target in Vercel Project -> Settings -> Domains before adding)* | **DNS Only (Grey Cloud)** | Canonical `www` -> apex redirect handled by Vercel |
| `MX` | `loc.digital` (`@`) | `0 mx1.spacemail.com.` | **DNS Only** | Production email (`hi@loc.digital`) — **MUST PRESERVE** |
| `MX` | `loc.digital` (`@`) | `0 mx2.spacemail.com.` | **DNS Only** | Production email failover — **MUST PRESERVE** |
| `TXT` | `loc.digital` (`@`) | `"v=spf1 include:spf.spacemail.com ~all"` | **DNS Only** | Spacemail SPF authorization — **MUST PRESERVE** |
| `TXT` | `spacemail._domainkey` | `"v=DKIM1;k=rsa;p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAzOXndgwsEKiCvq1ZFgx4zMuguZqnDQwcZd2iZpET0CyUoBmc9MbwHGMQg94NMt8aLELIEc54D/xi0C65Lyxrr8eRUnfNRP8ei2mTYa+jpGxeOSnEj36X47IZwqZCYddA+S/yg8CAOnb3RzOHVfv2jM/q0ufdXebOzgIs3KZYRRCqelOPwKIBT0p4W1VnYDe3B2W" "pT4lvG6fnbI/vx3Wqis6yrCfws4/68ibwMUK/1+gWJ+aDDv2+VK3LLMIKojLtS+ouJ8sPD/fzSnWsTOcT9KHwhA3RYZ0WfO4HRjJY7PH9mu8PH8yo9aSSQ4m2uLF8EHC9EszFKAiExIUtC9es7QIDAQAB"` | **DNS Only** | Spacemail DKIM signing key — **MUST PRESERVE** |
| `TXT` | `_vercel` | `"vc-domain-verify=loc.digital,33918e6f72e80f07fb5d"` | **DNS Only** | Vercel domain ownership verification — **MUST PRESERVE** |
| `TXT` (recommended post-cutover) | `_dmarc` | *(Currently absent)* Optionally add `"v=DMARC1; p=none; rua=mailto:hi@loc.digital"` after migration | **DNS Only** | Passive DMARC visibility without rejecting mail |
| `DS` (DNSSEC) | `loc.digital` | `33647 13 2 A2547874...CF8A804A` | **DISABLE AT SPACESHIP FIRST** | Must be removed prior to NS change to prevent SERVFAIL |
| Custom Domain (Phase 3) | `assets.loc.digital` | Managed by Cloudflare R2 (`loc-digital-assets`) | **Proxied (Orange Cloud via R2)** | Cloudflare CDN delivery for immutable R2 assets |

> [!WARNING]
> **Avoid Double-Proxy:** Keep `loc.digital` (and `www.loc.digital` if configured) strictly in **DNS Only (Grey Cloud)** mode. Proxying Vercel traffic through Cloudflare adds double TLS termination, breaks automatic Vercel Let's Encrypt renewals, and creates conflicting CDN cache layers.

### 2.2 Step-by-Step DNS Cutover Checklist

- [ ] **Step 1 — Export Spaceship Zone**: Screenshot or export the full Spaceship DNS table (check for any undocumented subdomains not visible to public DNS queries).
- [ ] **Step 2 — Verify Vercel DNS Target**: In Vercel Dashboard (`porfolio` -> Settings -> Domains -> `loc.digital`), confirm the current assigned `A` record (`216.198.79.1`) and any `www` `CNAME` target.
- [ ] **Step 3 — Disable DNSSEC at Spaceship**: Turn off DNSSEC at Spaceship and wait until `dig +short DS loc.digital @1.1.1.1` and `dig +short DS loc.digital @8.8.8.8` both return empty.
- [ ] **Step 4 — Populate Cloudflare DNS**: Add `loc.digital` (Free plan), verify every record from Section 2.1 is present verbatim, and confirm **DNS Only** (grey cloud) on all Vercel records.
- [ ] **Step 5 — Pre-Cutover Verification**: Query the assigned Cloudflare nameserver directly before changing registrar NS:
  ```bash
  dig @<assigned-cf-ns> A loc.digital
  dig @<assigned-cf-ns> MX loc.digital
  dig @<assigned-cf-ns> TXT loc.digital
  dig @<assigned-cf-ns> TXT spacemail._domainkey.loc.digital
  dig @<assigned-cf-ns> TXT _vercel.loc.digital
  ```
- [ ] **Step 6 — Switch Nameservers at Spaceship**: Replace `launch1.spaceship.net` and `launch2.spaceship.net` with Cloudflare's two assigned nameservers.
- [ ] **Step 7 — Post-Cutover Verification**:
  ```bash
  dig +short NS loc.digital
  curl -sI https://loc.digital | grep -iE "http/|server:|location:|cache-control:|x-vercel-cache:"
  curl -sI https://loc.digital/contact | grep -iE "http/|location:" # Expect 301 -> /about
  ```
- [ ] **Step 8 — Verify Production Email**: Send a test email to and from `hi@loc.digital` and confirm SPF + DKIM pass in the received message headers.
- [ ] **Step 9 — Re-enable DNSSEC (Optional)**: Once Cloudflare DNS is active for 24h+, enable DNSSEC in Cloudflare Dashboard -> DNS -> Settings and paste the new DS record into Spaceship.

---

## 3. Phase 3 & 4 — Cloudflare R2 & Responsive Asset Pipeline

### 3.1 Architecture Files Created / Adapted

| File | Role |
| :--- | :--- |
| `src/lib/storage/r2.ts` | Server-only, zero-dependency S3-compatible R2 client (AWS SigV4 via `node:crypto` + `fetch`). |
| `src/lib/assets.ts` | Unified public asset resolver (`R2 -> UploadThing -> local`), responsive `srcset` (`480, 768, 1200, 1920`), AVIF `srcset`, and blur placeholders. |
| `data/r2-assets.json` | Committed R2 asset manifest (starts empty-safe; updated atomically after verified uploads). |
| `src/lib/photo-assets.ts` | Fast-paths verified R2 responsive variants; falls back to Astro Sharp WebP derivatives for local/UploadThing assets. |
| `src/lib/media/registry.ts` | Delegates URL/metadata lookup to `src/lib/assets.ts`. |
| `src/components/ui/ResponsiveImage.astro` | Emits `<picture>` with AVIF `<source>` when R2 AVIF variants exist, supports `priority` LCP hints and `blurDataURL` placeholders. |
| `scripts/audit-assets.mjs` | Full media/font/PDF/wallpaper audit with duplicate detection and R2 free-tier headroom check. |
| `scripts/optimize-assets.mjs` | Generates content-hashed `480, 768, 1200, 1920` WebP (+ optional `--avif`), `320px` thumbnail, and `20px` LQIP placeholder in `_local/r2-staging/` while preserving Photos JSON metadata and original files. |
| `scripts/migrate-assets-to-r2.mjs` | Dry-run-first, idempotent R2 uploader with public HTTPS `HEAD` verification and automatic rollback manifest backup. |

### 3.2 Bucket & Token Configuration

1. In Cloudflare Dashboard -> **R2 Object Storage** -> **Create bucket**:
   - Name: `loc-digital-assets`
   - Location: Automatic (or Asia-Pacific)
   - Default Storage Class: Standard
2. Connect Custom Domain:
   - Bucket -> **Settings** -> **Public Access** -> **Custom Domains** -> **Connect Domain** -> `assets.loc.digital`
   - Disable the default `*.r2.dev` public development URL once `assets.loc.digital` is active.
3. Configure Bucket CORS Policy (Bucket -> **Settings** -> **CORS Policy**):
   ```json
   [
     {
       "AllowedOrigins": [
         "https://loc.digital",
         "https://www.loc.digital"
       ],
       "AllowedMethods": ["GET", "HEAD"],
       "AllowedHeaders": ["Range", "If-None-Match", "If-Modified-Since"],
       "ExposeHeaders": ["ETag", "Content-Length", "Content-Type"],
       "MaxAgeSeconds": 86400
     }
   ]
   ```
4. Create Scoped R2 API Token (R2 -> **Manage R2 API Tokens** -> **Create API token**):
   - Permissions: **Object Read & Write**
   - Specify bucket(s): **`loc-digital-assets` only**
   - Store `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` in `.env.local` (never commit to Git).

### 3.3 Running Optimization & Staged Migration

```bash
# 1. Audit current repository assets
pnpm run assets:audit

# 2. Dry-run optimization to preview candidate count
pnpm run assets:optimize -- --dry-run

# 3. Generate content-hashed WebP (and optional AVIF) responsive variants into _local/r2-staging/
pnpm run assets:optimize -- --avif

# 4. Dry-run R2 migration (checks object count, bytes, and % of 10 GB R2 free tier)
pnpm run assets:migrate:r2:dry

# 5. Pilot migration on first 10 assets to verify custom domain delivery & headers
pnpm run assets:migrate:r2 -- --limit=10

# 6. Full idempotent migration (verifies every URL via HTTPS HEAD before writing data/r2-assets.json)
pnpm run assets:migrate:r2
```

Local originals in `public/` remain untouched until you verify the Vercel Preview Deployment and production traffic.

---

## 4. Phase 5 — Caching Policy

| Surface | CDN | `Cache-Control` | Rationale |
| :--- | :--- | :--- | :--- |
| `https://loc.digital/` & HTML pages | Vercel CDN | `public, max-age=0, must-revalidate` + `Vary: Accept` | Immediate HTML freshness & Markdown content negotiation |
| `https://loc.digital/_astro/*` | Vercel CDN | `public, max-age=31536000, immutable` | Astro build-time content-hashed JS/CSS/images |
| `https://loc.digital/api/photos.json`, `/api/photos-widget.json`, `/api/search-index.json` | Vercel CDN | `public, max-age=3600, stale-while-revalidate=86400` | Prerendered public JSON feeds |
| `https://loc.digital/assets/photos/*` (302 redirect) | Vercel CDN | `public, max-age=300, stale-while-revalidate=3600` | Mutable redirect pointer; safe for fast rollback |
| `https://loc.digital/api/private/*` (future auth/forms) | None | `private, no-store, max-age=0` | Never cache private, authenticated, or personalized APIs |
| `https://assets.loc.digital/media/*` (hashed objects) | Cloudflare CDN | `public, max-age=31536000, immutable` | Content-hashed immutable R2 variants (`<name>.<w>w.<hash12>.webp`) |

### Cloudflare Cache Rule for `assets.loc.digital`

Because every uploaded R2 object carries `Cache-Control: public, max-age=31536000, immutable`, Cloudflare honors origin headers automatically. Optionally add a **Cache Rule** scoped strictly to `(http.host eq "assets.loc.digital")`:
- Cache eligibility: **Eligible for cache**
- Edge TTL: **Use cache-control header if present** (bypass/respect origin for any non-hashed files)
- Browser TTL: **Respect origin**

---

## 5. Phase 6 — Analytics, Turnstile & Crawler Safety

### 5.1 Cloudflare Web Analytics
- Integrated once in `src/layouts/DashboardLayout.astro` (shared by `PhotosLayout.astro`), strictly gated by `PUBLIC_CF_WEB_ANALYTICS_TOKEN`.
- Uses `<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token":"..."}'>`.
- Existing Google Tag Manager (`GTM-KMGLHHMB`) is preserved untouched; zero duplicate scripts.
- Because `loc.digital` stays in **DNS Only** mode, Cloudflare does not auto-inject a second beacon.

### 5.2 Cloudflare Turnstile Evaluation
- **Audit finding:** `loc.digital` currently has **no server-submitted contact or booking forms** (`about.astro` and `services.astro` use `mailto:hi@loc.digital` and social links; `FormulaCalculator.astro` is a client-side calculator).
- No unrequested UI form was added.
- A production-ready, server-side verifier (`src/lib/security/turnstile.ts`) + unit tests (`src/lib/security/turnstile.test.ts`) is included. When adding a future `/api/contact` or `/api/booking` route:
  1. Create a Turnstile widget (Managed mode) for `loc.digital` in Cloudflare Dashboard.
  2. Set `PUBLIC_TURNSTILE_SITE_KEY` and server-only `TURNSTILE_SECRET_KEY`.
  3. Validate tokens server-side with `verifyTurnstileToken({ token, remoteIp: extractClientIp(request.headers), expectedHostname: "loc.digital", expectedAction: "contact" })` and return `privateJsonResponse(...)`.

### 5.3 Search Engine & AI Crawler Preservation
- `public/robots.txt`, `@astrojs/sitemap` (`/sitemap-index.xml`), JSON-LD structured data, canonical URLs, `llms.txt`, and `Accept: text/markdown` content negotiation are fully preserved.
- In Cloudflare Dashboard -> Security -> Bots:
  - Keep **AI Scrapers and Crawlers** block **OFF** (so AI search/citation crawlers and GEO indexing remain open).
  - Keep **Super Bot Fight Mode / Bot Fight Mode** **OFF** for `assets.loc.digital` so Googlebot-Image, OpenGraph unfurlers, and AI crawlers can fetch images reliably.
- Primary application firewall protection stays on **Vercel Firewall** (DNS Only).

---

## 6. Rollback Strategy

### 6.1 Instant Asset Rollback (R2 -> UploadThing / Local)
Every live migration writes a timestamped backup to `_local/r2-migration/r2-assets-<timestamp>.json`. To roll back immediately without deleting any R2 objects or local originals:

```bash
# Option A: Restore a specific pre-migration manifest backup
node scripts/migrate-assets-to-r2.mjs --rollback=_local/r2-migration/r2-assets-<timestamp>.json

# Option B: Reset to empty manifest via git (falls back 100% to UploadThing + local files)
git checkout HEAD -- data/r2-assets.json

# Rebuild & redeploy
pnpm run build
```

### 6.2 DNS Rollback (Cloudflare -> Spaceship)
1. Ensure DNSSEC is disabled in Cloudflare (if it was re-enabled) and wait for DS removal.
2. In Spaceship Registrar, revert nameservers back to:
   - `launch1.spaceship.net`
   - `launch2.spaceship.net`
3. Spaceship retains the original zone records (`A 216.198.79.1`, Spacemail `MX`/`SPF`/`DKIM`, `_vercel` `TXT`). Verify with `dig +short NS loc.digital` and `dig +short MX loc.digital`.

### 6.3 Analytics Rollback
Remove or unset `PUBLIC_CF_WEB_ANALYTICS_TOKEN` in Vercel environment variables and redeploy; the beacon script tag is omitted completely at build time.
