# ACTION PLAN

This document lists the recommended SEO modifications in execution order, prioritized by impact and implementation effort.

## 1. Immediate Blockers (Critical)

### Fix Showcase Page SEO
- **File**: [showcase.astro](file:///Users/nguyenphucloc/Documents/porfolio/src/pages/showcase.astro)
- **Problem**: Custom template completely lacks basic meta tags, Open Graph, Twitter cards, canonical tags, and structured schemas.
- **Action**: Inject full HTML meta headers and a custom JSON-LD schema payload utilizing `pageSchema` from `src/lib/seo.ts`.

---

## 2. Quick Wins (High Impact, Low Effort)

### Update Photos Page
- **File**: [photos.astro](file:///Users/nguyenphucloc/Documents/porfolio/src/pages/photos.astro)
- **Problem**: Lacks description and CollectionPage schema.
- **Action**: 
  1. Import `absoluteUrl` and `pageSchema` from `src/lib/seo.ts`.
  2. Pass description to `<Layout>`.
  3. Pass `CollectionPage` schema array to `<Layout>`.

### Update Gallery Page
- **File**: [gallery.astro](file:///Users/nguyenphucloc/Documents/porfolio/src/pages/gallery.astro)
- **Problem**: Lacks description and CollectionPage schema.
- **Action**:
  1. Import `absoluteUrl` and `pageSchema` from `src/lib/seo.ts`.
  2. Pass description to `<Layout>`.
  3. Pass `CollectionPage` schema array to `<Layout>`.

### Update Workflow Space Page
- **File**: [workflow-space.astro](file:///Users/nguyenphucloc/Documents/porfolio/src/pages/workflow-space.astro)
- **Problem**: Lacks description and WebPage schema.
- **Action**:
  1. Import `absoluteUrl` and `pageSchema` from `src/lib/seo.ts`.
  2. Pass description to `<Layout>`.
  3. Pass `WebPage` schema array to `<Layout>`.

### Update Q&A Page
- **File**: [question.astro](file:///Users/nguyenphucloc/Documents/porfolio/src/pages/question.astro)
- **Problem**: Lacks WebPage schema.
- **Action**:
  1. Import `absoluteUrl` and `pageSchema` from `src/lib/seo.ts`.
  2. Pass `WebPage` schema to `<Layout>`.

### Update Dynamic CMS Page
- **File**: [[slug].astro](file:///Users/nguyenphucloc/Documents/porfolio/src/pages/[slug].astro)
- **Problem**: Lacks WebPage schema.
- **Action**:
  1. Import `absoluteUrl` and `pageSchema` from `src/lib/seo.ts`.
  2. Pass `WebPage` schema dynamically to `<Layout>`.

---

## 3. Maintenance (Medium/Low Impact)

### Restrict FAQPage Schema Recommendation
- **File**: [service.astro](file:///Users/nguyenphucloc/Documents/porfolio/src/pages/service.astro)
- **Problem**: Schema includes `FAQPage`. Google restricts FAQPage schema to authoritative sites (government and health) and no longer presents FAQ rich results for commercial portfolios.
- **Action**: Keep the schema for now to preserve standard features, but note that it might be ignored or deprecated in search engine presentation. No immediate action is required but design updates should not rely on FAQ rich snippets.
