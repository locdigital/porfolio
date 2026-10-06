# SYSTEM DESIGN SPECIFICATION: MACOS WORKSPACE DASHBOARD
**Portfolio & Digital Studio Architecture — Phuc Loc Nguyen (loc.digital)**

> **Document Type:** Production Design System & Frontend Architecture  
> **Status:** Active / Production Baseline  
> **Framework:** Astro 4.16+, Vanilla CSS Tokens, Tailwind Utilities, React 19 Islands  
> **Target Audience:** UI/UX Designers, Frontend Engineers, AI Agents inheriting the codebase  

---

## 1. DESIGN PHILOSOPHY & CONCEPT

### 1.1 The "Personal Operating System" Metaphor
Traditional personal portfolios often suffer from one of two extremes:
1. **Generic Marketing Landing Page:** Loud hero banners, giant oversized cards, decorative purple gradients, and aggressive sales pitches.
2. **Minimalist Raw Blog:** Austere, text-only layouts lacking visual hierarchy, interactive verification, or editorial weight.

This system takes a third approach: **The Personal Operating System / macOS Workspace Studio**.
The visitor does not just view a portfolio; they enter a focused digital workspace where Phuc Loc's performance marketing track record, media investments, verified metrics, travel photography, and hardware tools are organized with the precision of a native desktop application.

```
┌────────────────────────────────────────────────────────────────────────┐
│  PURE WHITE OUTER BACKGROUND (#FFFFFF)                                  │
│                                                                        │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │ [● ● ●] Phuc Loc Nguyen — Personal Workspace & Portfolio    [↗]│   │ macOS Titlebar
│   ├──────────────┬─────────────────────────────────────────────────┤   │
│   │              │                                                 │   │
│   │  PERSISTENT  │  MAIN CONTENT VIEWPORT                          │   │
│   │  SIDEBAR     │  - Warm Off-White Canvas (#FAF9F5)              │   │
│   │  NAV         │  - Clean Modular Cards (#FFFFFF)                │   │
│   │  (250px)     │  - Scaled Headlines (Weight 600, -30% Size)     │   │
│   │              │  - Compact Precision Action Buttons (-30%)      │   │
│   │              │  - Verified Impact Metrics & Live Demos         │   │
│   │              │                                                 │   │
│   └──────────────┴─────────────────────────────────────────────────┘   │ macOS Window Frame
│                                                                        │ (Radius: 22px, Shadow)
└────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Core Design Tenets
1. **Warm Editorial Tactility:** Built on warm off-white canvases (`#FAF9F5`), refined cream accents (`#FAF8EE`), and crisp white modular cards (`#FFFFFF`) instead of harsh pure grays or distracting wallpapers.
2. **Type-First Density:** All headlines use `font-weight: 600` and are scaled down by 30% to maintain clean, scannable information density suitable for a professional dashboard.
3. **Verified Evidence over Claims:** Every case study highlights hard business outcomes (e.g. `10x Revenue`, `ROAS > 10`, `4M+ Reach`) accompanied by interactive Before/After sliders and confidential documentation access gates.
4. **Cohesive Desktop Window Shell:** The entire web application sits centered inside an authentic macOS-styled window with realistic window controls, window title, and subtle ambient elevation.

---

## 2. CANVAS & WINDOW CONTAINER ARCHITECTURE

### 2.1 The Outer Canvas
- **Background Color:** `#FFFFFF` (Pure white).
- **Decorations:** Strictly **NO** desktop wallpapers, NO fake desktop icons, NO blurry colored mesh gradients, and NO background noise. The outer background must remain pure, clean, and silent.
- **Padding:** Generous viewport breathing room on desktop (`clamp(1.5rem, 3vw, 3rem)` vertical and horizontal padding).

### 2.2 The Floating macOS Window Frame
The application shell encapsulates the entire dashboard layout:
- **Max Width:** `1440px` (centered horizontally via `margin: 0 auto;`).
- **Border Radius:** `22px` (outer window corners) with `overflow: hidden;`.
- **Border:** `1px solid rgba(0, 0, 0, 0.08)` (crisp, subtle neutral boundary).
- **Elevation & Shadow:** Multi-layered, diffused soft shadow ensuring crisp definition against the white outer background:
  ```css
  box-shadow: 
    0 25px 65px -12px rgba(0, 0, 0, 0.12),
    0 12px 30px -8px rgba(0, 0, 0, 0.08),
    0 0 0 1px rgba(0, 0, 0, 0.05);
  ```
- **Responsive Adaptation:**
  - **Desktop (`>= 1024px`):** Floating macOS window with outer white margin and visible rounded corners.
  - **Mobile & Tablet (`< 1024px`):** Full-bleed window (`border-radius: 0; margin: 0; box-shadow: none;`) for maximum screen real estate, while retaining the unified title bar and mobile-optimized navigation.

### 2.3 Window Title Bar (`MacTitlebar.astro`)
A slim, native-feeling macOS title bar spans the full width of the window, sitting directly above both the sidebar and the main content viewport:
- **Height:** `44px`.
- **Background:** `rgba(255, 255, 255, 0.95)` with `backdrop-filter: blur(12px);`.
- **Border Bottom:** `1px solid var(--dash-border)` (`#E8E6DC`).
- **Traffic Light Controls (Left):**
  - Close button: `#FF5F56` (12px circle, border `rgba(0,0,0,0.1)`).
  - Minimize button: `#FFBD2E` (12px circle).
  - Expand button: `#27C93F` (12px circle).
- **Center Title:**
  - Font: `Plus Jakarta Sans`, `12px`, `font-weight: 500`, color `var(--dash-muted)`.
  - Icon: Folder / Terminal icon (`13px`).
  - Text: `Phuc Loc Nguyen — Personal Workspace & Portfolio (Saigon, GMT+7)`.
- **Action Controls (Right):**
  - Live availability badge (`Available for Q3/Q4 Retainers` with pulsing emerald dot).
  - Quick action buttons (Copy Email, View Live site).

### 2.4 Unified Document Alignment & Spacing Standards
To ensure seamless, rock-solid page-to-page navigation without content jumping horizontally or vertically:
- **Universal Container Width (`.workspace-content`):** Strictly standardized to `max-width: 960px; margin-inline: auto;` across **all pages** (`/`, `/work`, `/experience`, `/services`, `/certificates`, `/photos`, `/gear`, `/about`, `/contact`). No page should use isolated widths (e.g. 760px or 1120px) that cause left margins to shift between routes.
- **Main Viewport Padding (`.workspace-main`):** `36px 40px` on desktop.
- **Breadcrumb Spacing:** `margin-bottom: 1.25rem` (20px).
- **Page Header (`.page-header`):** `margin-bottom: var(--space-8)` (32px).
- **Page Lead (`.page-lead`):** `margin-bottom: var(--space-4)` (16px) if followed by secondary elements (toolbar/callout), or `0` if last element in header.
- **Section Spacing:** `.page-section + .page-section` has `margin-top: var(--space-12)` (48px).
- **Footer Spacing:** `margin-top: var(--space-12)` (48px).

---

## 3. COLOR & SURFACE TOKEN SYSTEM

All color tokens are declared centrally in `:root` inside [src/styles/dashboard.css](file:///Users/phucloc/Downloads/portfolio%20vibe%20dashboard/portfolio-foundation-starter/src/styles/dashboard.css).

### 3.1 Color Palette & Semantic Roles

| Token Name | Hex / Value | Semantic Role & Usage |
| :--- | :--- | :--- |
| `--dash-bg` | `#FAF9F5` | Canvas background inside the macOS window frame. Warm, low-strain neutral. |
| `--dash-surface` | `#FFFFFF` | Primary card, modal, and module surface. Clean and elevated. |
| `--dash-surface-subtle` | `#F5F4EE` | Secondary surface for nested blocks, code tags, timeline pills, and hover states. |
| `--dash-surface-highlight`| `#FAF8EE` | Warm highlight surface for hero cards, popular pricing tiers, and notices. |
| `--dash-border` | `#E8E6DC` | Universal card, separator, and container border. |
| `--dash-border-subtle` | `rgba(0, 0, 0, 0.06)` | Inner dividers, table borders, and nested card borders. |
| `--dash-text` | `#171717` | High-contrast primary text (headings, key metrics, client names). |
| `--dash-muted` | `#6B6A66` | Secondary body text, descriptions, timestamps, and metadata. |
| `--dash-accent` | `#0075DE` | Primary brand & interaction accent (macOS Finder blue). Active tabs, links, primary badges. |
| `--dash-accent-soft` | `rgba(0, 117, 222, 0.08)` / `#EBF5FF` | Soft background for tags, badges, and category indicators. |
| `--dash-accent-border` | `rgba(0, 117, 222, 0.22)` | Border for active buttons, focus outlines, and selected cards. |
| `--dash-success` | `#1E8E62` | Positive metrics, verified achievements, and live availability status. |
| `--dash-success-soft` | `rgba(30, 142, 98, 0.1)` | Subtle pill background for growth metrics (`+10x`, `ROAS > 10`). |
| `--dash-warning` | `#D97706` | Star ratings, highlighted cautions, and curated travel scores. |

### 3.2 Shadows & Elevation
```css
/* Resting Card Elevation */
--dash-card-shadow: 
  0 1px 3px rgba(0, 0, 0, 0.03), 
  0 6px 16px -2px rgba(0, 0, 0, 0.025);

/* Interactive Hover Elevation */
--dash-card-shadow-hover: 
  0 4px 12px rgba(0, 0, 0, 0.04), 
  0 14px 28px -4px rgba(0, 0, 0, 0.04);
```

### 3.3 Concentric Nested Border-Radius System

To ensure mathematical visual harmony across nested containers (window shells, cards with media, modals, comparison sliders, and surface blocks), the system strictly enforces the **Concentric Border-Radius Formula**:

$$\text{inner radius} = \max(0, \text{outer radius} - \text{inset})$$

where $\text{inset} = \text{padding} + \text{border thickness}$.

#### Core Principles:
1. **No Shared Radii Across Inset Layers:** Never give both an outer container and an inner surface the same border-radius when there is padding between them.
2. **Formula Implementation:** Implement via CSS calculation: `border-radius: max(0px, calc(var(--outer-radius) - var(--inset)));`.
3. **Multi-layer Nesting:** For multiple nested layers, each layer calculates its radius from its immediate parent's radius minus the intermediate inset.
4. **Flush Elements ($inset = 0$ or border-only):** For child elements flush against the container border (e.g. desktop titlebar and sidebar inside `.mac-window-container`), use `max(0px, calc(var(--radius-window) - 1px))` to match the interior contour without clipping.
5. **Intentional Exceptions:** Independent buttons, category badges, status chips, circular avatars (`50%`), and pill elements (`9999px`) maintain their dedicated control geometries and do not follow the parent card's concentric curve.

---

## 4. TYPOGRAPHY SYSTEM

### 4.1 Single Universal Font Family
The typography system strictly standardizes on **Plus Jakarta Sans** across all text layers:
```css
*, *::before, *::after {
  font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
}

:root {
  --serif: 'Plus Jakarta Sans', sans-serif !important;
  --sans: 'Plus Jakarta Sans', sans-serif !important;
  --mono: 'Plus Jakarta Sans', monospace !important;
}
```

### 4.2 Headline Hierarchy: Weight 600–650 & Strict 32px H1 Rule
To maintain a refined, high-density Notion/craft document feel rather than an oversized landing brochure, all H1 page headlines strictly enforce `font-size: 32px` (`2rem` desktop / `26px` mobile) with `font-weight: 650` (or `600`), line-height `1.25` (`40px`), and tight letter-spacing (`-0.025em`):

| Element / Class | Target Font Size | Font Weight | Line Height | Tracking | Usage Context |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Headline H1 / Page H1** | `2rem` (`32px` desktop, `26px` mobile) | `600–650` | `1.25` (`40px`) | `-0.025em` | Universal H1 rule across all workspace pages (`.page-title`, `h1`) |
| **Section H2** | `1.375rem` (`22px` desktop, `21px` mobile) | `600` | `1.364` (`30px`) | `-0.015em` | Major module headers (e.g. Featured Case Studies, Career Timeline) |
| **Card H3 / Item Title** | `1.0625rem` (`17px`) | `600` | `1.41` (`24px`) | `-0.01em` | Case study titles, job titles, service plan names |
| **Sub-item H4** | `0.875rem` (`14px`) | `600` | `1.40` (`20px`) | `-0.01em` | Nested list items, mini cards, deliverables |

### 4.3 Body & Metadata Scale
| Text Style | Font Size | Font Weight | Line Height | Usage Context |
| :--- | :--- | :--- | :--- | :--- |
| **Lead Body** | `0.9375rem` (`15px`) | `400` | `1.65` | Section introductions, executive summaries |
| **Standard Body**| `0.8125rem` (`13px`) – `0.875rem` (`14px`) | `400` | `1.60` | Card summaries, timeline bullets, narrative paragraphs |
| **Small / Meta** | `0.75rem` (`12px`) | `500` | `1.50` | Date stamps, subtext, captions, filter labels |
| **Micro / Tag** | `0.6875rem` (`11px`) | `600` | `1.40` | Status badges, category pills, kickers, code IDs |
| **Key Metric** | `1.75rem – 2.25rem` | `700` | `1.05` | Large metric figures (`10x`, `1B+`, `ROAS > 10`) |

### 4.4 Iconography: Majesticons System
All icons across the workspace strictly standardize on **Majesticons** (`majesticons`):
- **Stroke & Grid:** 24×24 grid geometry with `stroke="currentColor"` and `stroke-width="2"` (or custom `strokeWidth`), inheriting CSS text color.
- **Sizes:**
  - Sidebar & Topbar nav items: `16px – 18px`
  - Action button icons: `13px – 14px`
  - Breadcrumbs & Carets: `12px`
  - Inline badges, kickers, & status indicators: `12px – 13px`
- **Imports:** Always import specific icon components from `@/components/icons/majesticons` (or relative `../components/icons/majesticons`) using named exports (e.g. `Folder`, `Briefcase`, `Camera`, `Cpu`, `Award`, `Mail`, `ChevronRight`, `ArrowRight`, `Send`, `Open`, `CheckCircle`, `Lock`, `LinkedIn`, `Instagram`).
- **Astro & React Support:** Components are fully supported in both `.astro` pages/components and `.tsx` islands with zero hydration overhead.

---

## 5. COMPONENT SPECIFICATIONS

### 5.1 The Workspace Sidebar (`250px`)
- **Position:** Sticky desktop sidebar navigation on the left of the content area.
- **Top Brand Lockup:**
  - Avatar: Circular 38px profile image with green active dot.
  - Name: "Phuc Loc Nguyen" (`13px`, `font-weight: 600`).
  - Subtitle: "Saigon · Performance Media" (`11px`, `color: var(--dash-muted)`).
- **Navigation Groups:**
  1. **WORKSPACE:** Overview (`/`), Selected Work (`/work`), Career History (`/experience`), Capabilities & Pricing (`/services`).
  2. **RESOURCES & FIELD:** Travel Photos (`/photos`), Everyday Gear (`/gear`), Google Certificates (`/certificates`), Personal Bio (`/about`), Direct Contact (`/contact`).
- **Nav Item Styling:**
  - Resting: `padding: 0.45rem 0.75rem; font-size: 0.8125rem; color: var(--dash-muted); border-radius: 6px;`.
  - Active: `background: #EBF5FF; color: var(--dash-accent); font-weight: 600;`.
  - Hover: `background: var(--dash-surface-subtle); color: var(--dash-text);`.
- **Bottom Status Widget:**
  - Live local time in Saigon (`GMT+7`) running dynamically via client script.
  - "Available for Q3/Q4 Retainers" indicator.

### 5.2 Buttons & Action Controls (-30% Compact Sizing)
All buttons use compact, high-precision geometry rather than bulky web shapes:

```css
/* Primary Action Button */
.dash-cta-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.42rem 0.85rem;      /* Scaled down 30% from 0.6rem 1.25rem */
  font-size: 0.75rem;            /* Scaled down 30% from 0.875rem */
  font-weight: 600;
  border-radius: 6px;
  background: var(--dash-accent);
  color: #FFFFFF !important;
  text-decoration: none;
  border: 1px solid rgba(0, 0, 0, 0.08);
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}
.dash-cta-btn:hover {
  background: #0060B6;
  transform: translateY(-1px);
}

/* Secondary Filter / Pill Button */
.dash-filter-btn {
  padding: 0.35rem 0.75rem;
  font-size: 0.72rem;
  font-weight: 500;
  border-radius: 6px;
  background: var(--dash-surface);
  border: 1px solid var(--dash-border);
  color: var(--dash-muted);
  cursor: pointer;
  transition: all 0.15s ease;
}
.dash-filter-btn.active {
  background: var(--dash-text);
  color: #FFFFFF;
  border-color: var(--dash-text);
}
```

### 5.3 Modular Cards (`.dash-card`)
Every content unit is housed inside a standardized card container:
- **Background:** `var(--dash-surface)` (`#FFFFFF`).
- **Border:** `1px solid var(--dash-border)` (`#E8E6DC`).
- **Border Radius:** `12px` (`var(--rounded-md)`).
- **Padding:** `clamp(1rem, 2vw, 1.5rem)`.
- **Kicker Element:**
  ```html
  <span class="dash-card-kicker">
    <span style="color:var(--dash-accent);"><Icon size={13} /></span> Section Subheading
  </span>
  ```
  - Font: `0.6875rem` (`11px`), `font-weight: 600`, uppercase, `letter-spacing: 0.06em`, `color: var(--dash-muted)`.

### 5.4 Metric Highlight Badges
Used to display growth numbers in case studies and headers:
```html
<div class="dash-metric-badge">
  <TrendingUp size={12} />
  <span>10x Revenue · 1B+ / Month · ROAS > 10</span>
</div>
```
- Background: `var(--dash-success-soft)` (`rgba(30, 142, 98, 0.1)`).
- Border: `1px solid rgba(30, 142, 98, 0.2)`.
- Text Color: `var(--dash-success)` (`#1E8E62`).
- Font: `0.75rem`, `font-weight: 600`.

### 5.5 Before & After Performance Slider (`BeforeAfterPerformance.tsx`)
Interactive component demonstrating conversion rate optimization:
- Dual-layer comparison container with drag slider or click-toggle mechanism.
- Left/Top layer: "Before" state (e.g. Traditional static ads, low ROAS).
- Right/Bottom layer: "After" state (e.g. Scaled UGC funnel, 10x ROAS).
- Title styling: `font-size: clamp(25px, 3.5vw, 43px); font-weight: 600; line-height: 1.05; letter-spacing: -0.03em;`.

### 5.6 Private Showcase Pass Gate (`ShowcasePassGate.astro`)
Confidential client reporting unlocker for proprietary case study data:
- Dashed border card with lock icon.
- Interactive password input field with client-side verification hash.
- Unlocks full spend charts, attribution schemas, and internal documentation without full backend dependencies.

### 5.7 Photo Grid & Masonry Gallery
- Destination preview cards: fixed `4:3` aspect ratio with hover zoom effect (`transform: scale(1.03)`).
- Location detail galleries: CSS columns masonry (`columns: 2` or `columns: 3`), progressive lazy loading, click-to-lightbox modal with full-screen preview and camera EXIF details.

---

## 6. PAGE ANATOMY & INFORMATION ARCHITECTURE

The application contains 10 primary workspace views, all wrapping inside `DashboardLayout.astro`:

```
/                             -> Workspace Overview & Executive Cockpit
├── /work                     -> Case Studies Directory (Filterable)
│   └── /work/[slug]          -> In-depth Case Study & Attribution Blueprint
├── /experience               -> Verified Career History & Harvard Skill Clusters
├── /services                 -> 6 Capabilities & Retainer Pricing Plans
├── /photos                   -> Travel Photography Journal (17 Destinations)
│   └── /photos/[slug]        -> Destination Field Notes & Lightbox Gallery
├── /about                    -> Operating Philosophy & Bio
├── /gear                     -> Hardware, Cameras, Keyboards & Cycling Setup
├── /certificates             -> 10 Official Google & Coursera Credentials
└── /contact                  -> Direct Inquiries, Fast Mailto & Socials
```

### 6.1 Layout Anatomy: Homepage (`/`)
1. **Hero Header Card:** Compact portrait avatar, role pill ("Digital Media Senior Executive"), scaled headline H1, core elevator pitch, direct CTA buttons.
2. **Evidence & Verified Impact Grid:** 4-column metric cards showing verified commercial performance:
   - `1B+ VND`: Monthly GMV per store.
   - `10x`: Revenue acceleration on TikTok Shop.
   - `ROAS > 10`: Average return on paid ad spend.
   - `4M+`: Community reach and engagement.
3. **Featured Case Studies (3 Top Projects):** PlayAh! (E-Commerce), WorkFlow Space (Brand & Booking), POPS Kids (Streaming Platform) with tags, metric badges, and cover previews.
4. **Career Track Record:** Quick chronological role summaries with live company logos.
5. **Core Capabilities:** 6 service modules with scope bullets and inquiry buttons.
6. **Places Wandered:** 4 featured travel photo cards with ratings and frame counts.
7. **Direct Collaboration Card:** Ready-to-use mailto action and response SLA notice (< 24 hours).

---

## 7. RESPONSIVE BREAKPOINT SYSTEM

| Breakpoint | Target Screen Width | Layout Behavior |
| :--- | :--- | :--- |
| **Desktop XL** | `>= 1440px` | Center-aligned floating macOS window (1440px width, 22px radius, soft ambient shadow, generous outer whitespace). |
| **Desktop Standard** | `1024px – 1439px` | Floating window scales to 96% width with outer margin. Sidebar sticky at 250px. |
| **Tablet** | `768px – 1023px` | Window expands to 100% width. Sidebar collapses to icon drawer or horizontal scrollbar. Grids collapse to 2 columns. |
| **Mobile** | `< 768px` | Window frame edges flush with device boundaries (`border-radius: 0`). Sticky topbar + mobile bottom navigation bar. Single column card stack. All headlines fluidly clamp to comfortable mobile sizes (`1.4rem` – `1.6rem`). |

---

## 8. CODE IMPLEMENTATION GUIDELINES FOR AGENTS & DEVELOPERS

When extending or creating new components in this codebase, **strictly follow these rules**:

### Rule 1: Always Use `Plus Jakarta Sans`
Never introduce serif fonts, Inter, Roboto, or system serif fonts for headings. The entire website is unified under `Plus Jakarta Sans`.

### Rule 2: Keep Headlines at Weight 600
Never use `font-weight: 300`, `font-weight: 400`, or `font-weight: 800` for headline tags (`h1`, `h2`, `h3`, `h4`).
- **Correct:** `<h2 style="font-weight: 600; font-size: 1.12rem;">Section Title</h2>`
- **Incorrect:** `<h2 style="font-weight: 400; font-size: 2.2rem;">Section Title</h2>`

### Rule 3: Respect the -30% Scaled Density
Never introduce massive landing page display typography (`3rem+` or `60px+`). All hero headers must fit within `clamp(1.4rem, 2.5vw, 1.95rem)` (or up to `2.25rem` max on the homepage hero).

### Rule 4: Keep the Outer Background Pure White
The background outside `.mac-window-container` must always remain `#FFFFFF`. Do not add gradients, wallpapers, background blobs, or patterns outside the window frame.

### Rule 5: Card Construction Pattern
Always wrap new modules in the standard card structure:
```astro
---
import { Folder } from "@/components/icons/majesticons";
---
<section class="dash-card">
  <div style="margin-bottom: 1rem; border-bottom: 1px solid var(--dash-border); padding-bottom: 0.75rem;">
    <span class="dash-card-kicker">
      <span style="color: var(--dash-accent); display: inline-flex;"><FolderSimple size={13} /></span> Module Name
    </span>
    <h2 style="font-family: var(--serif); font-size: 1.12rem; font-weight: 600; margin-top: 0.25rem;">
      Module Headline
    </h2>
  </div>

  <div class="dash-grid-2">
    <!-- Module content here -->
  </div>
</section>
```

---

## 9. DESIGN SYSTEM ARTIFACT REGISTRY

- **Primary CSS Token Engine:** [src/styles/dashboard.css](file:///Users/phucloc/Downloads/portfolio%20vibe%20dashboard/portfolio-foundation-starter/src/styles/dashboard.css)
- **Base Layout & macOS Shell:** [src/layouts/DashboardLayout.astro](file:///Users/phucloc/Downloads/portfolio%20vibe%20dashboard/portfolio-foundation-starter/src/layouts/DashboardLayout.astro)
- **macOS Window Titlebar:** [src/components/dashboard/MacTitlebar.astro](file:///Users/phucloc/Downloads/portfolio%20vibe%20dashboard/portfolio-foundation-starter/src/components/dashboard/MacTitlebar.astro)
- **Desktop Navigation Sidebar:** [src/components/dashboard/DashboardSidebar.astro](file:///Users/phucloc/Downloads/portfolio%20vibe%20dashboard/portfolio-foundation-starter/src/components/dashboard/DashboardSidebar.astro)
- **Global Typography & Reset:** [src/styles/global.css](file:///Users/phucloc/Downloads/portfolio%20vibe%20dashboard/portfolio-foundation-starter/src/styles/global.css)
- **Content Bible (100% Copy & Data):** [PORTFOLIO_CONTENT_BIBLE.md](file:///Users/phucloc/Downloads/portfolio%20vibe%20dashboard/portfolio-foundation-starter/PORTFOLIO_CONTENT_BIBLE.md)
