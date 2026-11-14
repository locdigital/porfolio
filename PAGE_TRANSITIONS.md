# Workspace page transitions

Implemented for Astro 4.16.19 using its existing `ViewTransitions` router. No framework upgrade or animation dependency was added. Deployed to https://loc.digital on 2026-11-09. Production deployment: `dpl_7X2ZnKJHmbbm4po2uwBpqURStVHs`.

## Files changed

- `src/layouts/DashboardLayout.astro`
- `src/styles/page-transitions.css` (new)
- `src/scripts/workspace-navigation.ts` (new)
- `src/scripts/dashboard.ts`
- `src/components/dashboard/DashboardSidebar.astro`
- `src/components/ui/BrandPositioningFeed.astro`
- `src/components/ui/ShowcasePassGate.astro`
- `PAGE_TRANSITIONS.md` (this report)

## Architecture

- `src/layouts/DashboardLayout.astro` continues to own routing and the shared workspace shell. Every public page, including Work/Photography details, uses this layout. The router uses `fallback="swap"`; unsupported browsers retain client navigation with an immediate DOM swap.
- `src/styles/page-transitions.css` is the single animation configuration. `:root` opts out of snapshot capture so the sidebar, titlebar and mobile navigation remain live. Only `main#main-content` is animated as `workspace-document`. Its group does not tween geometry or scale. Snapshot overflow is clipped to the content region.
- The sidebar DOM is replaced normally so active links and `aria-current` continue to reflect server-rendered route data. Only the small clock span persists. Its timer is still stopped/restarted through the existing `onPageLoad` abort lifecycle, avoiding a placeholder flash without persisting navigation state or event handlers.
- `src/scripts/workspace-navigation.ts` supplements Astro's window scroll restoration for the desktop scrolling `<main>`. Positions are keyed by Astro history index, with up to 80 cached entries. New documents start at the top; history traversals restore saved positions. Hash navigation is coordinated with Astro/native browser behavior. The current entry also saves its desktop scroll on pagehide for refresh.
- Long mobile documents need a static outgoing-snapshot offset after window scroll is restored. Two geometry reads around a swap preserve the old viewport position; the offset itself is not animated. This avoids a gallery jumping back to its first image during the outgoing fade.
- The new main landmark receives focus with `preventScroll` after swaps. Focus rings on ordinary links/buttons remain unchanged. Astro continues to provide its route announcements.
- Snapshot pointer events are disabled and the root remains outside capture, allowing another sidebar click to interrupt an unfinished transition. Astro owns cancellation and fetching; no artificial navigation timers were added.

## Motion

| State | Properties | Duration | Easing |
| --- | --- | --- | --- |
| Outgoing | opacity 1 → 0; no animated movement or scale | 120ms | `cubic-bezier(0.22, 1, 0.36, 1)` |
| Incoming | opacity 0 → 1; translateY 8px → 0 | 280ms | `cubic-bezier(0.22, 1, 0.36, 1)` |

Both animations begin together. There is no extra delay, blur, loading layer, or first-load entrance. Backward navigation uses the same quiet motion. `prefers-reduced-motion: reduce` disables both animations.

Work/Photography image morphs were deliberately omitted: their list/detail imagery has different crops or folder previews. A uniform document transition avoids additional matching logic, flashes and motion outside the main surface.

## Lifecycle audit

- Existing carousel controls, folder previews, comparison sliders, certificate dialog and clipboard behavior use the shared abortable `onPageLoad` helper. Their listeners/observers/timers are cleaned up before a swap.
- Removed redundant mobile-close handling from the sidebar component; the dashboard controller owns menu open/close and `aria-expanded` updates.
- Removed the previous page-swapping class/rAF toggles from the dashboard controller. Animation is handled by native view-transition pseudo-elements.
- `BrandPositioningFeed.astro` and `ShowcasePassGate.astro` mark their existing inline initialization scripts `data-astro-rerun`, covering repeated same-template/query navigation. The gate retains its per-element initialization guard. Business logic is unchanged.
- React is used for server-rendered icons; no hydrated React islands were found. No analytics/pageview integration is configured in the repository. Existing external/mail/download link behavior remains under Astro/browser control.

## Verification

All 17 checks passed against both the development server and the final production build, with zero page script errors. Chrome headless, desktop 1440×1000 and emulated mobile 390×844:

1. Overview → About → Work → case study, including nested active state.
2. Overview → Photography → gallery → Contact.
3. Native animation names, durations, easing, 8px keyframe, stable sidebar/clock and main focus; document identity retained.
4. Desktop new-page top and browser Back/Forward scroll restoration.
5. Cross-page hashes and same-page hash Back/Forward restoration.
6. Rapid repeated navigation; the final destination wins without a full reload.
7. Real pointer navigation during an active transition.
8. Clipboard, comparison slider and certificate dialog after navigation.
9. Access-code form after repeated same-template navigation.
10. Instagram feed sort after repeated same-template/query navigation.
11. Direct detail loading and refresh without initial entrance animation.
12. All mobile menu destinations, carousel controls, `aria-expanded` and horizontal overflow.
13. Mobile window scroll history restoration.
14. Long mobile gallery viewport alignment and Back restoration.
15. Reduced-motion preference.
16. API-disabled fallback with client navigation and no animation.
17. JavaScript-disabled desktop content and normal links.

Also checked 22 before/after page captures across 11 representative routes at 390px and 1440px. Computed heading/text styles and layout dimensions matched; no horizontal overflow or page script errors were observed. Inspected paused transition frames at 0, 80, 160 and 280ms on desktop and a scrolled mobile gallery. Build and Astro check pass with zero errors, warnings or hints. The design detector reports no findings in the changed files.

## Performance

One before/after Lighthouse 13.4.0 simulated-mobile run of the homepage on local production assets, served with gzip and a shared warmed image-optimizer cache:

| Metric | Before | After |
| --- | --- | --- |
| Performance | 100 | 100 |
| LCP | 1.728s | 1.728s |
| CLS | 0 | 0 |
| Total blocking time | 0ms | 0ms |
| Transferred resources | 107,573 bytes | 108,643 bytes |

These are local lab measurements, not field data or a guarantee for every network/device. Physical Safari/iOS and Firefox devices were not available; unsupported-API behavior was simulated in Chrome. The native animated main surface follows browser snapshot hit-testing during the short transition; the sidebar remains live and interruptible. History-index integration should be rechecked when upgrading Astro's router.

References: [Astro 4 view transitions](https://v4.docs.astro.build/en/guides/view-transitions/), [Chrome guidance on keeping shared controls interactive](https://developer.chrome.com/docs/modern-web-guidance/guides/ui-behaviors/group-element-transitions).

## Production verification

Verified the live domain after deployment: About, Work, Photography and Contact run the native 120ms exit / 280ms entrance with changing opacity and translateY frames. The sidebar stays stable and client navigation retains document identity. Emulated mobile navigation and reduced-motion behavior also pass. No page script errors were observed.
