# Design Rules & Style Guidelines - `loc.digital`

This document defines the unified design system for the **`loc.digital`** website. It outlines the typography scales, color roles, spacing variables, and component guidelines to maintain a highly polished, editorial, and consistent experience across all pages.

![Design System Visual Guide](/Users/phucloc/.gemini/antigravity-ide/brain/d85b0fba-2518-40c4-bc64-083b42d21a18/design_rules_showcase_1781960033350.png)

---

## 1. Visual Theme & Atmosphere
The website follows a **warm-editorial** design language:
- **Canvas-first:** Anchored on a soft, warm cream background that reduces eye strain and feels more like a literary publication than a SaaS template.
- **High contrast, soft ink:** Text is rendered in deep charcoal ink instead of harsh pure black.
- **Accented hierarchy:** A vibrant cobalt blue carries interactive states, links, and focus rings, creating clear focal points.

---

## 2. Color Palette & Tokens
Standardized variables defined in the system root:

| CSS Variable | Hex Code | Role / Usage |
|---|---|---|
| `--bg` | `#FAFAF7` | The primary warm cream background canvas |
| `--text` | `#1C1C1C` | Primary text and headings (deep charcoal ink) |
| `--muted` | `#6E6E6E` | Secondary/body text, dates, and minor labels |
| `--divider` | `#E8E8E2` | Borders, list separators, and input boundaries |
| `--accent` | `#0075de` | Interactive states, links, active indicators, and accents |
| `--accent-solid` | `#0075de` | Solid accent fills (buttons, icons, badges) |

---

## 3. Typography Scale
Standardized type scales ensure headings, body prose, and code sections are consistent:

| Token | CSS Variable / Value | Font Family | Usage |
|---|---|---|---|
| **Display XL** | `var(--fs-display-xl)` / `clamp(42px, 6.5vw, 90px)` | `PP Editorial Old` (Serif) | Hero display titles (Index) |
| **Display LG** | `var(--fs-display-lg)` / `clamp(42px, 7vw, 86px)` | `PP Editorial Old` (Serif) | Category header titles (Gear) |
| **Display MD** | `var(--fs-display)` / `clamp(38px, 5vw, 52px)` | `PP Editorial Old` (Serif) | Section hero titles (About) |
| **Title LG** | `var(--fs-xl)` / `clamp(24px, 3.5vw, 34px)` | `PP Editorial Old` (Serif) | Section card titles |
| **Title MD** | `var(--fs-lg)` / `clamp(16px, 1.8vw, 20px)` | `PP Editorial Old` (Serif) | Timeline items, post titles |
| **Body Base** | `var(--fs-base)` / `15.5px` | `Plus Jakarta Sans` (Sans) | Default body prose, biographical text |
| **Body SM** | `var(--fs-sm)` / `14px` | `Plus Jakarta Sans` (Sans) | Card descriptions, list rows |
| **Kicker / Label** | `var(--fs-xs)` / `12px` | `DM Mono` (Monospace) | Category tags, timelines, kickers |

---

## 4. Icon Dimensions
Standardized sizes prevent misaligned layout icons:

- **Icon XS** (`--icon-xs` / `14px`): Text inline icons (e.g. arrow link tags in cards).
- **Icon SM** (`--icon-sm` / `16px`): Small buttons and Q&A accordions.
- **Icon MD** (`--icon-md` / `20px`): Navigation buttons and interface toggles.
- **Icon LG** (`--icon-lg` / `24px`): Standard grid controls.
- **Icon XL** (`--icon-xl` / `32px`): Section illustrations.

```css
svg.icon-xs { width: var(--icon-xs); height: var(--icon-xs); }
svg.icon-sm { width: var(--icon-sm); height: var(--icon-sm); }
svg.icon-md { width: var(--icon-md); height: var(--icon-md); }
svg.icon-lg { width: var(--icon-lg); height: var(--icon-lg); }
svg.icon-xl { width: var(--icon-xl); height: var(--icon-xl); }
```

---

## 5. Layout & Spacing
A 4px-base grid system defines structural spacing:
- `--space-xs`: `8px`
- `--space-sm`: `12px`
- `--space-md`: `16px`
- `--space-lg`: `24px`
- `--space-xl`: `32px`
- `--space-xxl`: `48px`
- `--space-section`: `96px`

---

## 6. Border Radius Scale
Hierarchy of rounded shapes:
- `--rounded-xs`: `4px` (Tags, category tabs)
- `--rounded-sm`: `6px` (Small buttons, input fields)
- `--rounded-md`: `8px` (Standard buttons, cards)
- `--rounded-lg`: `12px` (Medium containers, image frames)
- `--rounded-xl`: `16px` (Large cards, glassmorphic card containers)
- `--rounded-full`: `9999px` (Pills, circular avatars)
