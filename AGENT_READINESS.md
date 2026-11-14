# Agent readiness

Verified on 9 November 2026: `npx is-agentic loc.digital` improved from **69/100 to 100/100**, with all 6 Essential and 9 Recommended checks passing. The public report is https://is-agentic.com/scan/loc.digital. The CLI reads the latest archived report; after publishing changes, use the report page’s Rescan action to collect fresh evidence.

## Published behavior

- Browser pages remain prerendered HTML. Normal browser and asset requests do not invoke the Markdown function.
- Every generated public page has a Markdown representation at its canonical URL when requested with `Accept: text/markdown`. Responses include `Content-Type: text/markdown; charset=utf-8` and `Vary: Accept`.
- Accept quality values and explicit `q=0` exclusions are honored. Negotiated responses use `private, no-store`, preventing a Markdown variant from replacing a cached HTML page.
- Missing extensionless pages return HTTP 404, an explanatory Markdown body, and recovery links when Markdown is requested. Browser requests retain the existing HTML error page.
- Explicit Markdown files are available at `/index.md`, `/about.md`, `/photos/sai-gon.md`, and the equivalent path for every generated public page. HTML alternate links point to these files.
- Markdown is generated from each page’s public `<main>` at build time. Scripts, navigation, forms, decorative content, and hidden project showcases are excluded.
- `/llms.txt` documents appropriate use, current page links, citation guidance, and contact routes. `/privacy` documents the site’s actual request and storage behavior and is linked from the sidebar footer.
- The Person JSON-LD includes a description. Photo galleries include readable context in their raw HTML, including the previously sparse albums.

## Implementation

`npm run build` runs `scripts/build-agent-content.mjs` after Astro and the runtime patch. It writes Markdown files and a small Edge Function into the Vercel Build Output API directory, then inserts content-negotiation routes before filesystem handling. `parse5` is a build-only dependency; no HTML parser is shipped to browsers or the Edge Function.

## Verification

```sh
node --test scripts/agent-content.test.mjs scripts/sync-photo-updates.test.mjs
npm run build
curl -i -H 'Accept: text/markdown' https://loc.digital/
curl -i -H 'Accept: text/html' https://loc.digital/
curl -i -H 'Accept: text/markdown' https://loc.digital/a-page-that-does-not-exist
curl -i https://loc.digital/index.md
npx is-agentic loc.digital
```

Checks cover content negotiation, quality values, hidden-content exclusion, error status and recovery, and HTML fallback. Browser checks at 1440px and 390px with JavaScript disabled verified meaningful main content, one H1, and no horizontal overflow. All 25 gallery pages contain at least 500 characters of main text without JavaScript. All 42 generated HTML pages have a corresponding Markdown alternate.
