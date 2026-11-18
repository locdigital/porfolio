# Photo flip integration

The album route (`/photos/[slug]`) now renders each photograph with `PixelFlipPhoto.astro`. The Photography folder index is unchanged by this integration.

## Files

- `src/components/ui/PixelFlipPhoto.astro`: frameless photo front, minimal white notes back using the website’s Inter font and design tokens, scoped styles, accessible flip button. The front contains only the photograph, with no border, padding or Polaroid frame; photo labels and the expand action were removed as requested.
- `src/scripts/pixel-flip-photo.ts`: 980ms paper/shadow/highlight tracks, synchronized reversals, native button keyboard handling, story scrolling, reduced-motion and CSS fallback, Astro navigation cleanup.
- `src/pages/photos/[slug].astro`: maps album photographs into cards; retains image optimization, masonry breakpoints, editorial content, SEO and routing. A page-specific mobile canvas rule prevents tall albums being vertically centered above the viewport.
- `src/content/config.ts` and `src/lib/content.ts`: optional image metadata and its mapping to gallery photos; existing fields remain compatible.
- `src/lib/photo-capture.ts` and `.test.ts`: date/time formatting without invented timestamps; missing/invalid values, date-only values, wall-clock times and timezone conversion are covered by tests.

## CMS mapping

Add these optional fields to an image in `src/content/photos/<album>.json`, or preserve them in the corresponding CMS export:

| Card property | Source / fallback |
| --- | --- |
| `id` | Stable album slug + frame position, used for DOM IDs |
| `imageUrl`, `srcset`, `sizes`, dimensions | Existing `optimizePhotos` output; original composition/aspect ratio is preserved |
| `alt` | Image `alt`, then caption, then album name + frame position |
| `title` | Image `title`, otherwise its alt text |
| `story` | Image `story`, otherwise `caption`; empty becomes “Chưa cập nhật câu chuyện cho tấm ảnh này.” |
| `capturedAt` | Optional real ISO capture date/timestamp; missing/invalid becomes “Chưa cập nhật” |
| `capturedTimeZone` | Optional IANA timezone used to display an offset timestamp in its actual capture location |
| `location` | Image-specific location, otherwise the existing album name |
| `photoNumber` | Position in the CMS-sorted album, starting at 1 |

Date-only values never acquire a fabricated time. Camera timestamps without timezone information preserve the recorded wall-clock time. Offset timestamps preserve their written time unless a known `capturedTimeZone` is supplied. Values are formatted with `vi-VN`; render time is never used as capture time. Album editorial stories are not represented as individual-photo stories. No EXIF values are inferred from filenames or upload dates.

## Interaction

Click/tap or Enter/Space flips the photo. Hover only lifts it 3px. Each photo has independent state. Repeated clicks reverse all three animations from one shared playhead. The paper has two physical faces with Safari backface handling; shadow remains behind the card. Story text scrolls inside the back; arrow keys, Page Up/Down and Home/End scroll it while the card button is focused. Text selection and scrolling do not trigger a flip.

Reduced motion settles immediately and cancels active tracks if the OS preference changes mid-animation. Without WAAPI, the card uses a CSS transform transition. Route swaps abort listeners and cancel animations; cards returned by navigation initialize from their saved target state.

## Validation

- `pnpm test`: 14 tests across metadata formatting and the existing typography standards.
- `pnpm build`: Astro typecheck, static site generation/image processing, Vercel runtime patch and Markdown export.
- Browser review: Chromium and Playwright WebKit, desktop 1440px and touch/mobile 375px. Checks include forward/backward flips, multiple reversals at 200–400ms with equal track times and unchanged transform at reversal, stable card dimensions, independent cards, long-story scrolling, Enter/Space, reduced-motion changes during animation, WAAPI-disabled fallback, clean photo fronts without labels/actions, and navigation away/back without duplicate handlers.
- Review screenshots and browser results: `/tmp/photo-flip-review/`. WebKit mobile is emulation, not a physical iPhone test.
- Production WebKit desktop emits a recoverable React #424 hydration warning during the navigation-through-folder-index check. The flip, scrolling, reduced-motion and return-navigation assertions pass; this warning is recorded separately in `checks.json`, not counted as a clean console run. Chromium and WebKit mobile did not report this warning.
- Timeline snapshots at 0/150/500/800/980ms verify lift, turn, separate shadow and landing with unchanged layout dimensions. The Quy Nhơn album's long titles were also checked at 375/768/1024/1440px; back content stays inside its scroll region.

The supplied Markdown motion specification was used; the later request replaces its pixel-art styling with the site’s minimal visual style and removes the photo frame. `flip-polaroid-physical-motion.html` was not present in the workspace or supplied attachments, so its exact visual appearance could not be compared.
