# Global Typography System & Design Standards

**Website:** [loc.digital](https://loc.digital)  
**Design Direction:** Swiss Minimalism × Editorial Typography × Notion Workspace Interface  
**Enforcement:** Automated testing in `src/styles/typography.test.ts` via Vitest.

---

## 1. Centralized Font Stacks

All font families are defined centrally in `:root` inside [`src/styles/dashboard.css`](file:///Users/nguyenphucloc/Documents/porfolio/src/styles/dashboard.css) and synchronized with [`src/styles/global.css`](file:///Users/nguyenphucloc/Documents/porfolio/src/styles/global.css):

| Token | CSS Value | Usage |
|---|---|---|
| `--font-family-base` | `"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif` | Default sans-serif for UI, navigation, body copy, and metadata. |
| `--font-family-mono` | `"JetBrains Mono", "SF Mono", Menlo, Consolas, Monaco, monospace` | Numeric tables, code blocks, timezones, badges, system metrics. |
| `--font-family-headline` | `"Newsreader", "Georgia", "Times New Roman", serif` | High-contrast editorial headlines, photo essays, and narrative quotes. |

Aliases maintained for compatibility:
- `--font-sans`: alias for `var(--font-family-base)`
- `--font-mono`: alias for `var(--font-family-mono)`
- `--font-headline`: alias for `var(--font-family-headline)`

---

## 2. Responsive Type Scale (Compact Minimalism)

The type scale follows a compact Swiss editorial typography scale reduced by approximately 10–12.5% across desktop, tablet, and mobile, establishing **14px** (`0.875rem`) as the standard body text base.

Display and heading levels use a responsive CSS `clamp()` system that smoothly interpolates between viewport widths from mobile (`< 768px`) to tablet (`768px - 1279px`) and desktop (`>= 1280px`).

| Token | Desktop (≥1280px) | Tablet (768–1279px) | Mobile (<768px) | Implementation |
|---|---|---|---|---|
| `--text-display-xl` | 72px (4.5rem) | 58px (3.625rem) | 40px (2.5rem) | `clamp(2.5rem, 5vw, 4.5rem)` |
| `--text-display` | 58px (3.625rem) | 47px (2.9375rem) | 36px (2.25rem) | `clamp(2.25rem, 4.1vw, 3.625rem)` |
| `--text-h1` | 43px (2.6875rem) | 36px (2.25rem) | 29px (1.8125rem) | `clamp(1.8125rem, 3.1vw, 2.6875rem)` |
| `--text-h2` | 29px (1.8125rem) | 25px (1.5625rem) | 23px (1.4375rem) | `clamp(1.4375rem, 2.15vw, 1.8125rem)` |
| `--text-h3` | 22px (1.375rem) | 20px (1.25rem) | 19px (1.1875rem) | `clamp(1.1875rem, 1.45vw, 1.375rem)` |
| `--text-h4` | 18px (1.125rem) | 16px (1.0rem) | 16px (1.0rem) | `clamp(1rem, 1.15vw, 1.125rem)` |
| `--text-body-lg` | 16px (1.0rem) | 15px (0.9375rem) | 15px (0.9375rem) | `clamp(0.9375rem, 1.05vw, 1rem)` |
| `--text-body` | 14px (0.875rem) | 14px (0.875rem) | 14px (0.875rem) | `0.875rem` (14px standard body across all devices) |
| `--text-body-sm` | 13px (0.8125rem) | 13px (0.8125rem) | 13px (0.8125rem) | `0.8125rem` (13px compact body & meta) |
| `--text-caption` | 12px (0.75rem) | 12px (0.75rem) | 12px (0.75rem) | `0.75rem` (12px secondary labels & dates) |
| `--text-micro` | 11px (0.6875rem) | 11px (0.6875rem) | 11px (0.6875rem) | `0.6875rem` (11px dense badges & tags) |

> [!NOTE]
> Body text tokens (`--text-body` down to `--text-micro`) maintain crisp, un-subpixel-blurred legibility across displays with fixed rem values, while body text standard defaults to exactly **14px** with `line-height: 1.65` (`--leading-body`) to maintain optimal editorial reading comfort.
>
> ### Accessibility & Legibility Considerations
> - Interactive controls, primary buttons, input fields, and essential content use `--text-body` (14px) or `--text-body-sm` (13px) to protect tap target usability and readability on high-DPI mobile viewports.
> - `--text-micro` (11px) is reserved for supplementary uppercase tags, mono badges, and non-critical metadata.
> - Vietnamese diacritics render clearly with the variable font stack and generous line-height ratios (`1.65` for body copy).


---

## 3. Line Heights & Letter Spacing

To preserve Swiss typography discipline, line height contracts proportionally as font size increases, while letter spacing tightens for display text and expands for small uppercase labels:

### Line Height (`line-height`)

| Token | Ratio | Target Roles |
|---|---|---|
| `--leading-display` | `1.05` | Large display statements and hero text |
| `--leading-heading` | `1.2` | H1, H2, and major section titles |
| `--leading-snug` | `1.35` | H3, H4, and card titles |
| `--leading-compact` | `1.5` | Dense metadata, captions, cards summary |
| `--leading-body` | `1.65` | Default body paragraphs and long-form editorial copy |
| `--leading-loose` | `1.75` | Reading mode prose and relaxed articles |

### Tracking (`letter-spacing`)

| Token | Value | Target Roles |
|---|---|---|
| `--tracking-display` | `-0.035em` | Display XL and Display titles |
| `--tracking-heading` | `-0.025em` | H1 and H2 page/section titles |
| `--tracking-subheading`| `-0.015em` | H3, H4, and primary card titles |
| `--tracking-body` | `0` | Standard body text and paragraphs |
| `--tracking-label` | `0.01em` | UI labels and interactive pills |
| `--tracking-caps` | `0.04em` | Uppercase category badges, timezones, and mono tags |

---

## 4. Font Weight Scale

| Token | Weight | Usage |
|---|---|---|
| `--font-weight-regular` | `400` | Paragraphs, long-form descriptions, standard body |
| `--font-weight-medium` | `500` | Buttons, navigation links, section titles, card links |
| `--font-weight-semibold`| `600` | Page titles, major headings, key metric values, active pills |
| `--font-weight-bold` | `700` | Emphasized statistics and rare accentuation |
| `--heading-weight` | `600` | Default heading weight (`var(--font-weight-semibold)`) |

---

## 5. Semantic Spacing System (4px Base Grid)

Spacing follows a consistent 4px rhythm defined in `dashboard.css`:

```css
--space-1: 4px;   --space-2: 8px;    --space-3: 12px;   --space-4: 16px;
--space-5: 20px;  --space-6: 24px;   --space-8: 32px;   --space-10: 40px;
--space-12: 48px; --space-16: 64px;  --space-20: 80px;
```

### Semantic Relationships

- `--space-heading-to-desc`: `8px` (`--space-2`)
- `--space-heading-to-body`: `16px` (`--space-4`)
- `--space-para-to-para`: `16px` (`--space-4`)
- `--space-section-gap`: `48px` (`--space-12`)
- `--space-card-padding`: `16px` (`--space-4`)

---

## 6. Structural Fixes & Anti-Pattern Eradication

### 1. Removal of Destructive `p, span { font-size: 14px; }`
Previously, `dashboard.css`, `places.css`, and `global.css` had blanket rules forcing all `<span>` tags to `14px`. This caused nested spans inside `<h1>` through `<h4>` (e.g. Notion review headers `<h2><span>Title</span></h2>`) to shrink down to 14px, leading developers to use `!important` hacks.
- **Resolution:** `span` now inherits font size naturally (`span { font-size: inherit; }`). Headings and rich text render at their true intended design token sizes.

### 2. Elimination of Hardcoded Pixel Font Sizes
All hardcoded pixel font sizes across components and templates (`.astro`) have been replaced with CSS design tokens.

### 3. Removal of Unnecessary `!important`
Stripped arbitrary `!important` overrides from `.page-title`, `.section-title`, `.work-narrative-prose`, `.item-title`, and form inputs, restoring clean cascade inheritance.

---

## 7. Automated Enforcement

The test suite in [`src/styles/typography.test.ts`](file:///Users/nguyenphucloc/Documents/porfolio/src/styles/typography.test.ts) runs on every `pnpm test` and CI build to verify:
1. Complete token presence in `dashboard.css`.
2. Span elements inherit font size and are never forcibly flattened to 14px.
3. Zero hardcoded `px` or `rem` font sizes in any Astro page or component.

