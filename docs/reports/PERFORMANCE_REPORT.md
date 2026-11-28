# Performance report

Measured on November 25, 2026, against local production output. The baseline is the working tree at the beginning of this continuation, including the earlier uncommitted changes. The older `docs/baseline-metrics.json` is retained separately. Both local servers used the same compression and cache policy. Vercel edge latency and user devices will vary.

## Lighthouse on the homepage

Lighthouse 12.8.2, installed outside the repository, ran once per profile and build with the standard mobile settings or desktop preset. Analytics was enabled. Results are lab observations. INP requires interaction data, and field INP was unavailable.

| Profile | Build | Performance | Accessibility | Best practices | SEO | LCP | CLS | TBT | Transfer | Requests |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| mobile | Before | 81 | 100 | 100 | 100 | 5.00 s | 0.000 | 66 ms | 744.5 KiB | 39 |
| mobile | After | 93 | 100 | 100 | 100 | 3.16 s | 0.000 | 3 ms | 570.6 KiB | 44 |
| desktop | Before | 99 | 96 | 100 | 100 | 0.85 s | 0.000 | 0 ms | 744.5 KiB | 39 |
| desktop | After | 100 | 96 | 100 | 100 | 0.71 s | 0.000 | 0 ms | 668.3 KiB | 39 |

## Bundle analysis and browser transfers

The bundle analysis follows the initial HTML and static import graph. The Chrome DevTools Protocol measurements use a 450 ms settling window after load. Later requests can fall outside this window. The audit's synthetic lab score is separate from Lighthouse. Raw route records are in `docs/continuation-baseline.json` and `docs/after-metrics.json`.

| Route | Initial JS gzip before | Initial JS gzip after | Desktop cold transfer before → after | Mobile cold transfer before → after | Mobile requests before → after |
| --- | ---: | ---: | ---: | ---: | ---: |
| / | 159.2 KiB | 90.8 KiB | 559.3 → 483.1 KiB | 559.3 → 385.2 KiB | 38 → 37 |
| /work | 160.2 KiB | 91.8 KiB | 535.9 → 459.8 KiB | 513.2 → 339.1 KiB | 39 → 38 |
| /services | 280.5 KiB | 212.1 KiB | 608.7 → 532.5 KiB | 608.7 → 434.6 KiB | 37 → 36 |
| /photos | 206.1 KiB | 94.2 KiB | 2738.0 → 1551.1 KiB | 1620.6 → 523.1 KiB | 64 → 34 |
| /writing | 159.2 KiB | 90.8 KiB | 584.8 → 508.6 KiB | 584.8 → 410.7 KiB | 36 → 35 |
| /growth | 170.0 KiB | 101.6 KiB | 514.3 → 438.2 KiB | 514.3 → 340.2 KiB | 36 → 35 |
| /about | 159.2 KiB | 90.8 KiB | 2117.5 → 2041.3 KiB | 2117.5 → 1943.4 KiB | 34 → 33 |

| Warm desktop transfer | Before | After |
| --- | ---: | ---: |
| / | 222.4 KiB | 211.3 KiB |
| /services | 166.5 KiB | 155.4 KiB |
| /photos | 114.5 KiB | 105.0 KiB |

## Media and storage

- The source/public inventory found 607 media files totaling 142,417,703 bytes after this pass, with zero byte-identical duplicates. It excludes the root-level wallpaper master and the private originals archive. The two new Dock derivatives account for 48,132 bytes. The original PNGs total 60,258 bytes, saving 12,126 bytes per uncached pair while preserving the masters.
- The full photo feed is 311,739 bytes. The widget feed is 54,526 bytes and supplies display-sized local images. The Photos widget previously fetched the full feed and used original image URLs.
- Static output grew from 448.93 to 452.49 MiB. Additional responsive variants increase build storage while reducing client transfers.
- The application asset trees contain zero local video files, so video storage savings are zero. A synthetic clip verified generation of H.264 MP4, VP9 WebM and a WebP poster.
- All 573 distinct image URLs in the manifest returned successful image responses, including 57 that needed a retry. The photo migration dry-run matched all 310 current sources by hash. The explicit two-cover dry-run projected 173,524 additional bytes. Credentials were unavailable and no uploads occurred.

## Verification

- Production build and type checking passed with zero errors, zero warnings and eight compiler hints. Vitest passed 48 tests, and Node's built-in test runner passed 10 script tests. There is no repository lint script. `git diff --check` passed.
- The production GEO audit passed 4,314 checks. All 3,935 distinct local HTML/CSS asset references and all 74 search destinations resolved.
- Fourteen cold Chrome route/profile runs reported zero initial video requests, duplicate local requests, broken local requests or runtime exceptions. Three routes passed horizontal overflow and visible-main checks at 375, 390, 768, 1024, 1440 and 1920 px.
- Chrome opened and closed four floating apps, restored a minimized Photos window, rendered thirteen pinned-widget thumbnails, opened a collection, handled keyboard unpin, toggled the map and opened the palette. Firefox 157 and WebKit 27.2 also exercised Search, Netflix and the photo map. The native navigation fallback worked both with JavaScript disabled and with a failed search-index request.
- Compared 20 screenshot pairs using a 16-level per-channel tolerance. Seventeen pairs rounded to 0.000% changed pixels. The other captures differed on About desktop (10.483%), About mobile (1.381%) and Photos desktop (1.557%). A separate settled desktop geometry comparison matched all 12 sampled About elements and all 280 Photos elements. Exact visual identity across animated and photographic pixels remains unverified.

## Remaining bottlenecks

Photos on desktop still downloads more than 1 MiB on a cold visit. Dense thumbnail rows and browser lazy-load distance contribute. The Services chart brings Recharts into its initial graph and exceeds the 200 KiB compressed target. Changing the chart requires retesting the tooltip, SVG rendering and animations. The homepage still hydrates React for the Dock, and production analytics contributes a third-party request chain. Field Core Web Vitals and real CDN billing require deployment-side data. Live Safari WebDriver was disabled in the host settings.
