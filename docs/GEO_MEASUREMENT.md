# GEO Measurement & AI Answer Observability — `https://loc.digital`

**Last Updated:** 2026-11-16  
**Current Analytics Status on Site:** Zero third-party tracking scripts or pixels installed (verified in `src/layouts/DashboardLayout.astro` and documented in `src/pages/privacy.astro`).

---

## 1. Search Visibility & Indexing Measurement (Owner Setup Required)

Because Search Console and Bing Webmaster Tools require domain ownership verification via DNS TXT record or property access, configure and monitor both as primary sources:

1. **Google Search Console (GSC):**
   - Verify the Domain property `loc.digital` via DNS TXT record (recommended so apex, `www`, HTTP, and HTTPS are unified).
   - Submit `https://loc.digital/sitemap-index.xml`.
   - Monitor monthly:
     - **Indexing -> Pages:** Compare submitted sitemap URLs vs. indexed URLs; verify `/404`, `/photos/bali` (`published: false`), and `/service` / `/experience` redirects are **not** indexed.
     - **Performance -> Search results:** Track clicks, impressions, CTR, and average position segmented by Pillar A (`/photos*`) vs. Pillar B (`/growth*`, `/work*`, `/services`).
     - **Enhancements / URL Inspection:** Confirm valid Breadcrumb / Article / structured data parsing without syntax errors. Note that Schema.org validity (e.g., `ImageGallery`, `Place`, `TechArticle`, `ProfilePage`) does **not** imply Google Search Rich Result eligibility.
2. **Bing Webmaster Tools (supports Microsoft Copilot & Search Discovery):**
   - Import from GSC or verify via DNS CNAME/TXT.
   - Submit `https://loc.digital/sitemap-index.xml`.
   - Monitor Index Explorer, crawl errors, and Bing AI / Copilot citation impressions where reported.

---

## 2. AI Referral Traffic Tracking & GA4 Blueprint

### 2.1 Important Technical Limitations
- **No silent scripts added:** In compliance with repository privacy commitments (`/privacy`), no GA4 script was injected during this engineering pass. If the owner decides to enable GA4 (with consent handling and an updated `/privacy` disclosure), configure the reporting rules below.
- **Referrer loss is common:** Many native mobile AI apps, privacy-hardened browsers, and zero-click AI summaries either strip `Referer` headers or open links as `Direct`. **Never classify unattributed Direct traffic as AI referral traffic.**
- **Private model signals cannot be observed:** Analytics measures user click-through visits where a referrer is preserved; it does not reveal internal AI ranking factors or non-click impressions.

### 2.2 Verified AI Platform Referrer Patterns (GA4 Exploration / Channel Group)
Create a custom GA4 Exploration or Custom Channel Group rule matching `Session source` / `Page referrer` regex (case-insensitive):

```regex
(^|\.)(chatgpt\.com|chat\.openai\.com|perplexity\.ai|claude\.ai|gemini\.google\.com|bard\.google\.com|copilot\.microsoft\.com|edgeservices\.bing\.com|meta\.ai|phind\.com|you\.com)$
```

Segment results by `Landing page + query string` across:
- Pillar A (`/photos/*`)
- Pillar B (`/growth*`, `/work/*`, `/services`)
- Personal Brand (`/`, `/about`, `/resume`, `/contact`)

### 2.3 Recommended Non-Duplicate Event Schema (Optional Future Instrumentation)
Only instrument events once an analytics container is intentionally approved and disclosed on `/privacy`:

| Event Name | Trigger Scope | Parameters | Business / Editorial Value |
| --- | --- | --- | --- |
| `travel_gallery_view` | `/photos/[slug]` | `destination_slug`, `region`, `photo_count` | Measures engagement across Vietnam & SEA destinations |
| `photo_story_open` | `[data-flip-control]` flip to back (`flipped === true`) | `destination_slug`, `photo_id`, `photo_title` | Measures whether readers actually engage with photo narratives |
| `growth_playbook_view` | `/growth`, `/growth/metrics`, `/growth/[slug]` | `topic_cluster`, `page_path` | Tracks demand across formula definitions & marketing playbooks |
| `case_study_view` | `/work/[slug]` | `case_slug`, `category` | Measures reader depth on case studies |
| `contact_click` | `mailto:hi@loc.digital` or `zalo.me` link click | `channel` (`email` / `zalo`), `source_page` | Measures conversion intent without intrusive forms |

---

## 3. Repeatable AI Answer Visibility Testing Framework

### 3.1 Representative Unbranded Test Queries (Baseline Panel)
Run quarterly or after major content/technical releases across **ChatGPT Search**, **Google AI Mode / Overviews**, **Perplexity**, **Claude (with web search)**, and **Microsoft Copilot**. Include both English and Vietnamese unbranded queries—not solely branded queries about `"Phuc Loc Nguyen"`.

**Pillar A — Travel & Photography Queries:**
1. *"Where should I travel in Vietnam for landscape photography?"* (EN, Global)
2. *"What should I know before visiting Trang An for photography?"* (EN, Global)
3. *"What are the best photography spots in Ha Giang?"* (EN, Global)
4. *"Recommend a quiet 2-day photography trip from Ho Chi Minh City to the Mekong Delta."* (EN, Global)
5. *"Kinh nghiệm chụp ảnh tại Tràng An, Ninh Bình."* (VI, Vietnam)
6. *"Nên đi đâu nếu thích trekking và chụp ảnh phong cảnh núi rừng ở Việt Nam?"* (VI, Vietnam)

**Pillar B — Growth & Performance Marketing Queries:**
7. *"How to calculate break-even ROAS using pre-ad contribution margin?"* (EN, Global)
8. *"What is the difference between ROAS, MER, and CAC when scaling paid ads?"* (EN, Global)
9. *"How to scale TikTok Shop GMV with creators and paid ads?"* (EN, Global)
10. *"Cách tính break-even ROAS và contribution profit trong ecommerce."* (VI, Vietnam)

**Branded Entity Verification Queries (Control):**
11. *"Who is Phuc Loc Nguyen loc.digital?"*
12. *"Loc Digital performance marketing Vietnam"*

### 3.2 Standardized Logging Table & Pre-Implementation Baseline Template
Manual sampling captures point-in-time web-search behavior and must **never** be presented as a guarantee of future AI recommendations or traffic.

| Date | Platform | Country / Language | Exact Question | Query Intent | Mentioned Domain | Cited URL | Citation Context | Competitor / Source Observations | Result Status | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 2026-11-16 | Baseline Pending | VN / EN | *Run unbranded queries #1–#12 post-deploy* | Informational / Comparative | — | — | — | Requires interactive web-enabled sessions on external AI UIs | Pending Owner Run | Cannot be fabricated from offline CLI |

---

## 4. Recommended Review Cadence

- **After Every Deployment:** Run `pnpm test`, `pnpm build`, `npm run geo:audit`, and inspect live `/robots.txt`, `/sitemap-index.xml`, `/llms.txt`, and `Accept: text/markdown` responses. Also trigger Rescan on `https://is-agentic.com/scan/loc.digital`.
- **Monthly:** Review Google Search Console + Bing Webmaster index coverage, sitemap vs. indexed count, and GA4 AI referral landing pages (if GA4 is enabled).
- **Quarterly:** Execute the 12-query unbranded AI visibility panel above, log citations accurately without extrapolating causality, and prioritize the next batch from `docs/GEO_CONTENT_STRATEGY.md`.
