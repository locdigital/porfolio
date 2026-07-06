# Portfolio Project Summary & Technical Blueprint

This document serves as a complete technical reference and context guide for the [loc.digital](https://loc.digital) portfolio project. Use this file as a prompt helper or context reference for future pair-programming or Codex sessions.

---

## 1. Directory Structure & Key Files

```
├── src/
│   ├── layouts/
│   │   └── Layout.astro         # Main HTML layout wrapper (global HEAD, SEO, scripts)
│   ├── pages/
│   │   ├── index.astro          # Homepage (Hero, Work Timeline, Bento Photo, Writings, Draggable Collage)
│   │   ├── [slug].astro         # Dynamic server-side rendered CMS custom pages
│   │   ├── showcase.astro       # High-fidelity custom scroll-scrolled showcase page
│   │   ├── blog/
│   │   │   ├── index.astro      # Blog list
│   │   │   └── [slug].astro     # Blog post detail page
│   │   └── work/
│   │       ├── index.astro      # Selected cases list
│   │       └── [slug].astro     # Project case detail page (static prerendered)
│   ├── components/
│   │   └── ui/
│   │       ├── draggable-collage.tsx  # React physics-based card canvas (desktop)
│   │       ├── MobileAboutPanel.astro # Fallback mobile list layout for the collage
│   │       ├── animated-page-headline.tsx # Framer Motion text reveal headers
│   │       └── bento-infinite-gallery.tsx # Infinite marquee bento grid for photos
│   ├── lib/
│   │   └── seo.ts               # Centralized JSON-LD schema generators & meta constants
│   └── styles/
│       └── global.css           # Core stylesheet containing global theme configurations
├── tailwind.config.mjs          # Tailwind CSS style overrides
└── package.json                 # Dependency manifest (Astro 4.16, Tailwind 3.4)
```

---

## 2. Design System & Style Guide

The design follows a modern, highly editorial, minimal **blue - black - white** (xanh - đen - trắng) branding style with clean layouts, white backgrounds, and subtle micro-interactions.

### A. Typography Rules (AGENTS.md)
* **Body/Article Copy**: Uses **Plus Jakarta Sans** via `var(--sans)`. Body copy should remain compact, styled at `14px` when appropriate.
* **Headlines & Headings**: Uses **Imbue** via `var(--serif)`. Beautiful, high-contrast, editorial serif style.
* **Monospace/Data Text**: Uses system monospace via `var(--mono)`.

### B. Color Tokens (global.css)
* **Primary Accent Color**: `#097fe8` (Blue)
* **Hover Accent Color**: `#076ec9` (Slightly darker blue)
* **Background (`var(--bg)`)**: Pure white `#FFFFFF` (Hero section background and body is solid white, no radial spots).
* **Divider & Border lines**: Clean borders with low opacity (`rgba(0, 0, 0, 0.07)` or similar). Header bottom dividing borders have been completely removed (`border-bottom: none`).

### C. Buttons
* **`.hero-primary`**: Clean flat styling without gradients or intense glows. Background color is solid `#097fe8`, with transitions to `#076ec9` on hover.
* **`.hero-secondary`**: Semi-transparent dark overlay background (`rgba(0, 0, 0, 0.04)`) with fine outline.

---

## 3. Core Component Architectures

### A. Interactive Draggable Collage (`draggable-collage.tsx`)
Desktop playground utilizing Framer Motion for draggable widgets:
* **Physics & Rotations**: Cards feature elastic constraints (`dragElastic={0.22}`) and organic velocity-based rotation using Framer Motion's `useVelocity` and `useTransform` hooks (cards rotate slightly based on drag speed).
* **Custom Cursor Follower**: A blue morphing tooltip (`bg-[#0075de]`) follows the cursor with a smooth lag effect (`useSpring`). It scales down and reads `holding ✦` while dragging cards, and displays context-aware tips on hover:
  * Portrait: `"it's me ✦"`
  * Available Status: `"status ✦"`
  * Spotify Music Player: `"play music ✦"` / `"pause music ✦"`
  * Movie poster: `"watching movie ✦"`
  * Writings folder: `"open writings ✦"`
  * LinkedIn card: `"connect linkedin ✦"`
  * Clock: `"saigon time ✦"`
  * Rating stars: `"give rating! ✦"`
* **Card Font Scale Compatibility**: Card micro texts utilize `text-micro` (11px) and time numbers use `text-[26px]` instead of uncompiled raw CSS variable classes, allowing text to wrap naturally in a 3-line format.

### B. Mobile Fallback Collage (`MobileAboutPanel.astro`)
A static, vertical flex list wrapper containing identical widgets optimized for small viewports where dragging physics are disabled. Font sizes also map to the standardized `text-micro` configuration.

### C. Infinite Bento Gallery (`bento-infinite-gallery.tsx`)
A clean multi-row marquee bento layout showing responsive photo previews dynamically. Hydrated instantly on page load (`client:load`).

---

## 4. Scroll Reveal & Intersection Observer

* **Global Reveal Classes**: Elements styled with `.r` or `.toki-r` initialize at `opacity: 0`, `filter: blur(6px)`, and `transform: translateY(12px)`.
* **IntersectionObserver (Layout.astro)**: Tracks elements on entry and appends the `.in` class to smoothly transition them to `opacity: 1`, `filter: blur(0px)`, and `transform: translateY(0)`.
* **Collage Hydration**: Hydrated immediately on page load (`client:load`) rather than viewport entry, ensuring Framer Motion hooks and event listeners are fully ready on page scroll.

---

## 5. SEO Schema Configuration (`seo.ts`)

Page schema templates leverage structured JSON-LD configurations parsed server-side:
* **`personSchema`**: Central biographical entity representing Loc's profile.
* **`websiteSchema`**: Global website schema properties.
* **`pageSchema`**: Page-level structured meta linked dynamically.
* **Dynamic routes (`[slug].astro`)**: Parse CMS content details, mapping titles and canonical references, falling back gracefully to `DEFAULT_DESCRIPTION` when descriptions are absent.
