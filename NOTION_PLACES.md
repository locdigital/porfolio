# Notion Places CMS

`/places` reads its content live from a Notion database through a server-only adapter. Filtering, sorting, radius expansion, optional browser geolocation, typography, and layout are unchanged. Notion is the production content source; the local `src/content/places` collection is only an explicit development fallback.

## Status checklist

| Step | Where | Done when |
| --- | --- | --- |
| Connection token | `.env.local`, Vercel | `NOTION_API_TOKEN` set (server-only) |
| Places database | Notion page **loc.digital Places CMS** | An inline database titled **Places** exists with the 19 properties below |
| IDs | `.env.local`, Vercel | `NOTION_DATABASE_ID` and `NOTION_DATA_SOURCE_ID` set |
| Production env | Vercel Production + Preview | All three variables added, then redeployed |

## Architecture

- **Astro 4.16.19**, `output: 'hybrid'`, `@astrojs/vercel` 7.8.2 (serverless). All other pages remain prerendered.
- Places routes set `export const prerender = false` and render per request through the Vercel function:

| Route | File | Purpose |
| --- | --- | --- |
| `/places` | `src/pages/places/index.astro` | Collection, filters, Explore near me, empty/unavailable state |
| `/places/<slug>` | `src/pages/places/[slug].astro` | Detail page with Notion page-body review |
| `/places.md`, `/places/<slug>.md` | `src/pages/places.md.ts`, `src/pages/places/[slug].md.ts` | Public Markdown |
| `/places-sitemap.xml` | `src/pages/places-sitemap.xml.ts` | Live sitemap of public places |
| `/api/places/images/<page-id>/<slot>?w=<width>` | `src/pages/api/places/images/[id]/[slot].ts` | Stable image proxy |

- Navigation: **Places** (`map-marker` icon) is in the sidebar's Personal group in `src/components/dashboard/DashboardSidebar.astro`. The same sidebar is the mobile drawer. Places is English-only, so the Vietnamese sidebar ("Địa điểm") and the language switcher (`getLocalizedPath` in `src/lib/i18n.ts`) keep `/places` instead of linking to a non-existent `/vi/places`.
- Sitemap: `@astrojs/sitemap` (3.1.6) only lists static routes. After the build, `scripts/build-agent-content.mjs` appends `https://loc.digital/places-sitemap.xml` to `.vercel/output/static/sitemap-index.xml`. The live sitemap only lists `/places` plus public (Published and Visited) entries.
- Markdown negotiation: requests with `Accept: text/markdown` for `/places` or `/places/<slug>` reach the edge `_agent-content` function (`scripts/agent-content-handler.mjs`). That function has no build-time snapshot for Places, so it forwards to the live `.md` endpoint and keeps `no-store` caching and the upstream status (404/503).

## Environment variables

Set these **server-only** variables in Git-ignored `.env.local` (mode `0600`) and in Vercel **Production** and **Preview**:

```dotenv
NOTION_API_TOKEN=<connection-token>
NOTION_DATABASE_ID=<database-uuid>
NOTION_DATA_SOURCE_ID=<data-source-uuid>
```

Optional:

```dotenv
# Force local Markdown during development (omit in production).
PLACES_CONTENT_SOURCE=local
# Extra trusted image hostnames, comma separated; hostnames only, no wildcards.
NOTION_IMAGE_HOSTS=
```

Never use a `PUBLIC_`/`NEXT_PUBLIC_` prefix and never commit or paste the token. Rotate any token shared in chats or screenshots.

Source selection (`usesNotion()` in `src/lib/places/notion.server.ts`): `PLACES_CONTENT_SOURCE=local` uses Markdown. Otherwise Notion is used whenever any `NOTION_*` variable is set, and always in production. If the Notion configuration is incomplete or Notion fails, the request fails closed: the page shows the "Places are taking a short break" state with HTTP 503. It never silently switches to another source.

> [!WARNING]
> Deploying these routes before the three Vercel variables are set makes `/places` return the 503 unavailable state in production.

## Database setup

Parent page: [loc.digital Places CMS](https://app.notion.com/p/loc-digital-Places-CMS-ce66d69bc87241e398a958b75db48f35) (`ce66d69b-c872-41e3-98a9-58b75db48f35`). It contains a heading, a **simple table** (not a queryable database), and a paragraph. The setup script leaves this content untouched.

1. In Notion → Settings → Connections / Integrations, open the connection that owns the token and enable **Read content**, **Insert content**, and **Update content**. Save. Make sure the parent page is shared with the connection (page `•••` → Connections).
2. Create the database, validate the schema, and write both IDs into `.env.local`:

   ```sh
   node --env-file=.env.local scripts/setup-notion-places.mjs \
     --parent ce66d69b-c872-41e3-98a9-58b75db48f35 \
     --create --write-env
   ```

3. After creation, the site runtime only needs **Read content**. You can remove Insert/Update again.

The script is idempotent. It reuses an existing child database titled **Places**, refuses to continue if there are several, and only adds missing properties (with `--create`). It never overwrites existing property types and never prints the token or raw response bodies. Without `--create` it only discovers and validates. With `NOTION_DATABASE_ID` set, it validates that database directly. On success it prints the IDs, the property count, and the number of public rows.

The adapter pins **`Notion-Version: 2026-03-11`**. It uses `GET /v1/databases/{id}`, `GET /v1/data_sources/{id}` (schema check), and `POST /v1/data_sources/{id}/query`.

## Property mapping

| Notion property | Type | Places field | Required for publishing |
| --- | --- | --- | --- |
| Name | Title | `name` | Yes |
| Slug | Text | `slug` (blank → stable page-ID slug) | No |
| Category | Select | `category` | Yes |
| City | Text | `city` | Yes |
| Country | Text | `country` | Yes |
| Address | Text | `address` | No |
| Latitude | Number | `coordinates.lat` | Yes |
| Longitude | Number | `coordinates.lng` | Yes |
| Rating | Number | `rating`, 0–10 | Yes |
| Favorite | Checkbox | `favorite` | No |
| Visited | Checkbox | `visited` | Must be checked |
| Published | Checkbox | `published` | Must be checked |
| Description | Text | `description` | Yes |
| Personal notes | Text | `personalNotes` | No |
| Cover image | Files & media | `coverImage` (falls back to the page cover) | Yes |
| Cover image alt | Text | `coverImageAlt` | No |
| Gallery | Files & media | `gallery` | No |
| Visited at | Date | `visitedAt` (YYYY-MM-DD) | No |
| Best time to visit | Text | `bestTimeToVisit` | No |

Category options **Food**, **Coffee**, **Attractions**, **Hidden gems** map to `food`, `coffee`, `attraction`, `hidden-gem`.

## Publishing workflow

1. Add a row to the **Places** database and fill in every required field. Use a lowercase, hyphenated **Slug** (for example `cong-caphe-hoan-kiem`) and don't change it after publishing.
2. Write the longer review in the row's page body. Supported: paragraphs, headings, bold/italic/inline code, HTTP(S)/email links, lists, quotes, callouts/toggles (as text), dividers, code. Not reproduced: images in the body, tables, embeds, synced blocks, child pages/databases.
3. Check **Visited** and **Published**. Unchecking either one hides the entry again (it is a draft).
4. The entry appears on `/places`, `/places/<slug>`, `/places.md`, and `/places-sitemap.xml` within the cache window below. No code change or redeploy is needed.

Drafts are filtered out by the Notion query itself (`Published = true AND Visited = true`), and the mapper checks again. Published entries that are missing a required field are skipped (the server logs a count, never content). Duplicate slugs or a changed property type make the whole collection fail closed with HTTP 503. Missing numbers are never replaced with made-up coordinates or ratings.

## Photos

- Upload photos to **Cover image** (one) and **Gallery** (several, in display order), or use links from trusted hosts: `images.unsplash.com`, `images.pexels.com`, `65wv0vnolo.ufs.sh`, plus anything in `NOTION_IMAGE_HOSTS`.
- Notion file URLs are signed and expire after about one hour. They never reach HTML, JSON, or Markdown. Pages reference stable URLs such as `/api/places/images/<page-id>/cover?w=720` and `/gallery-0?w=960`.
- The proxy only serves slots of entries in the current public collection. It accepts only widths 320/480/720/960/1280/1600, `https` without credentials, allowlisted hosts (re-checked on every redirect, up to 4 redirects), raster types (JPEG/PNG/WebP/AVIF/GIF), at most 20 MB, and at most 40 megapixels. The Notion token is never sent to media hosts. It is not an open proxy.
- When a signed URL is close to expiry, or the media host returns 401/403, the proxy fetches fresh file metadata from Notion and retries once.
- Images are resized with Sharp and served as WebP with `Cache-Control: public, max-age=300` plus 5-minute CDN caching. Unknown or private slots return 404 and upstream failures return 503 (`no-store`). The image container keeps its neutral background and the `alt` text shows if an image fails.

## Refresh and caching

- HTML and the live sitemap: `Vercel-CDN-Cache-Control: public, s-maxage=300, stale-while-revalidate=60`. Browsers revalidate on each navigation.
- Notion metadata is shared in memory for 60 s per function instance, and the schema check for 5 min. Concurrent requests are coalesced.
- Changes become visible within about 5–6 minutes, on the next request. This depends on traffic: there is no cron, deploy hook, or rebuild. An open tab does not poll.
- Failures return HTTP 503 with `Retry-After: 60` and `no-store`. Unknown slugs return 404. Stack traces, tokens, and raw Notion responses never reach visitors.

## Deployment (Vercel)

Project: `porfolio` (team `phucloc`). Add the variables with the Vercel CLI (it prompts for the value, so nothing lands in shell history) or in Dashboard → Settings → Environment Variables:

```sh
vercel env add NOTION_API_TOKEN production
vercel env add NOTION_API_TOKEN preview
vercel env add NOTION_DATABASE_ID production
vercel env add NOTION_DATABASE_ID preview
vercel env add NOTION_DATA_SOURCE_ID production
vercel env add NOTION_DATA_SOURCE_ID preview
vercel env ls   # names only; values stay encrypted
```

Environment changes only take effect after a new deployment. Content edits never need one. After deploying, check:

- the `/places` response headers;
- an entry added after the deployment;
- `/places-sitemap.xml`, and that `/sitemap-index.xml` links it;
- `curl -H 'Accept: text/markdown' https://loc.digital/places`;
- an image more than one hour after upload.

## Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Setup: `HTTP 403` / `restricted_resource` on create | Connection lacks **Insert content** (or **Update content** when adding properties) | Enable the capability on that exact connection, save, and rerun |
| Setup: `HTTP 404` | Page/database not shared with the connection | Page `•••` → Connections → add the connection |
| Setup: "No Places database exists here" | Only the simple table exists | Rerun with `--create` |
| Setup: "Missing or mismatched property types" | A property was renamed or retyped in Notion | Restore the name/type from the mapping table |
| `/places` shows "taking a short break" (503) | Missing/invalid env vars, revoked access, schema drift, duplicate slug, or Notion outage | Check the server log line `[places] Content service unavailable`, then run the setup script without `--create` |
| An entry doesn't appear | Not both Visited and Published, a required field is empty, or the cache window hasn't passed | Fill in the fields, wait about 5 minutes, and reload |
| Image 404 | Entry not public, or no file in that slot | Publish it, or add a cover/gallery file |
| Image 503 | Host not allowlisted, not a raster image, too large, or upstream error | Use a Notion upload or add the host to `NOTION_IMAGE_HOSTS` |

## Files

- `src/lib/places/notion-client.server.ts`: authenticated HTTP boundary, pinned API version, timeout, bounded retries.
- `src/lib/places/notion.server.ts`: source selection, schema/data-source verification, filtered paginated queries, caches.
- `src/lib/places/notion-mapping.ts`, `notion-types.ts`, `notion-review.ts`: property mapping and safe normalization.
- `src/lib/places/notion-image.server.ts` + `src/pages/api/places/images/[id]/[slot].ts`: restricted image delivery.
- `src/lib/places/data.ts`: shared local/Notion adapter. `schema.ts` holds field validation.
- `src/components/places/*`: cards, filters, gallery, responsive images, escaped review rendering, unavailable state.
- `scripts/setup-notion-places.mjs`: setup/discovery utility. `scripts/agent-content-handler.mjs` + `build-agent-content.mjs`: Markdown forwarding and sitemap-index link.

## Verification

```sh
pnpm test                                   # Places unit tests (vitest)
node --test scripts/agent-content.test.mjs scripts/sync-photo-updates.test.mjs
pnpm check
pnpm build
node --env-file=.env.local scripts/setup-notion-places.mjs   # live connectivity + schema check
```

A successful build does not prove the token has access, because content is fetched at runtime. CDN behavior can only be verified on Vercel.
