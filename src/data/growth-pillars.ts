export type GrowthTopicCluster =
  | "meta-ads-scaling"
  | "tiktok-shop-gmv"
  | "google-ads"
  | "unit-economics"
  | "growth-architecture";

export interface GrowthPillarSection {
  title: string;
  summary: string;
  points: string[];
}

export interface GrowthPillar {
  id: GrowthTopicCluster;
  slug: string;
  href: string;
  title: string;
  shortSubtitle: string;
  seoTitle: string;
  seoDescription: string;
  summary: string;
  topics: string[];
  caseSlugs: string[];
  sections: GrowthPillarSection[];
  guardrails: string[];
}

export const GROWTH_PILLARS: GrowthPillar[] = [
  {
    id: "meta-ads-scaling",
    slug: "meta-ads",
    href: "/growth/meta-ads",
    title: "Meta Ads",
    shortSubtitle: "Creative testing · Scaling · CAPI",
    seoTitle: "Meta Ads — Creative Testing, Scaling & CAPI — Phuc Loc Nguyen",
    seoDescription:
      "Practical Meta Ads operating system covering creative testing, consolidated campaign structure, horizontal vs. vertical scaling, and server-side CAPI measurement.",
    summary:
      "Campaign structure, creative hook testing, horizontal versus vertical scaling readiness, funnel segmentation, delivery diagnostics, and server-side CAPI guardrails.",
    topics: [
      "Campaign structure & consolidation",
      "Creative testing systems & fatigue",
      "Horizontal vs. vertical scaling",
      "Server-side CAPI & attribution checks",
    ],
    caseSlugs: ["workflow-space", "playah", "tomato-childrens-home"],
    sections: [
      {
        title: "Creative Testing",
        summary:
          "Treat creative as the primary targeting lever. Separate net-new concept discovery from winning-ad iteration so learning signals stay clean.",
        points: [
          "Isolate hook, angle, and format variables instead of changing everything at once.",
          "Evaluate thumbstop rate, hold rate, and outbound CTR alongside CPA/ROAS to diagnose where drop-off happens.",
          "Promote proven winners into consolidated scaling campaigns without resetting account-wide learning.",
        ],
      },
      {
        title: "Scaling",
        summary:
          "Scale spend only when contribution margin and blended MER hold—not just when platform-reported ROAS looks strong.",
        points: [
          "Use vertical budget increases (15–25% cadence) on stable winners to avoid delivery shock.",
          "Expand horizontally via new creative angles, landing page offers, and Advantage+ / broad segments.",
          "Monitor frequency, CPM inflation, and marginal CPA to catch diminishing returns early.",
        ],
      },
      {
        title: "CAPI & Measurement",
        summary:
          "Protect optimization signals with deduplicated Pixel + Conversions API (CAPI) events and server-side match quality.",
        points: [
          "Verify Event Match Quality (EMQ) and event_id deduplication across Purchase, InitiateCheckout, and Lead events.",
          "Pass hashed first-party parameters (email, phone, external_id, fbp/fbc) where consent allows.",
          "Cross-check Meta attribution windows against blended MER and holdout/geo tests.",
        ],
      },
    ],
    guardrails: [
      "Avoid splitting small budgets across too many ad sets—consolidation speeds up learning exit.",
      "Do not judge creative tests on 1-day clicks alone for higher-AOV or multi-touch products.",
      "Always pair platform ROAS with break-even ROAS and contribution profit in /growth/metrics.",
    ],
  },
  {
    id: "tiktok-shop-gmv",
    slug: "tiktok-shop",
    href: "/growth/tiktok-shop",
    title: "TikTok Shop",
    shortSubtitle: "GMV · Affiliate · Live Commerce",
    seoTitle: "TikTok Shop — GMV, Affiliate & Live Commerce — Phuc Loc Nguyen",
    seoDescription:
      "TikTok Shop growth architecture decomposing GMV across Spark Ads, KOC/creator affiliate pipelines, live commerce operations, and contribution margin.",
    summary:
      "Decomposing TikTok Shop GMV across paid Spark Ads, creator/KOC affiliate seeding, live commerce, product assortment, conversion rate, and margin discipline.",
    topics: [
      "GMV decomposition & unit economics",
      "Affiliate & KOC creator pipelines",
      "TikTok Shop Ads vs. blended MER",
      "Commission, returns & contribution margin",
    ],
    caseSlugs: ["playah"],
    sections: [
      {
        title: "GMV Architecture",
        summary:
          "Break total GMV down into traffic source (Video, Live, Shop Tab, Paid), click-to-order CVR, AOV, and net realized revenue after cancellations and returns.",
        points: [
          "Track paid GMV vs. organic/affiliate GMV separately to measure true halo effect.",
          "Account for platform fees, voucher subsidies, shipping support, and return rates before scaling.",
          "Use hero SKUs with strong visual demonstration and healthy margin to anchor acquisition.",
        ],
      },
      {
        title: "Affiliate & KOC Pipelines",
        summary:
          "Build a repeatable creator engine rather than relying on one-off viral hits.",
        points: [
          "Tier creators by output reliability, audience fit, and conversion efficiency—not follower count alone.",
          "Provide structured creative briefs, sample seeding workflows, and commission tiers.",
          "Amplify top-converting organic affiliate videos with Spark Ads / GMV Max.",
        ],
      },
      {
        title: "Live Commerce",
        summary:
          "Treat live sessions as structured retail programming with clear retention hooks, pacing, and offer cadence.",
        points: [
          "Structure sessions around recurring 10–15 minute product loops for newly joining viewers.",
          "Monitor GPM (GMV per 1,000 impressions), average watch duration, and product click-through rate.",
          "Pair paid live traffic with peak conversion windows and flash-offer scarcity.",
        ],
      },
    ],
    guardrails: [
      "High headline GMV can still lose money if voucher co-funding, affiliate commission, and ad spend stack unchecked.",
      "Separate gross GMV from settled net revenue when computing MER and contribution profit.",
    ],
  },
  {
    id: "google-ads",
    slug: "google-ads",
    href: "/growth/google-ads",
    title: "Google Ads",
    shortSubtitle: "Search · PMax · Shopping",
    seoTitle: "Google Ads — Search, PMax & Shopping — Phuc Loc Nguyen",
    seoDescription:
      "Intent-led Google Ads architecture covering Search segmentation, Performance Max hygiene, Shopping feed optimization, and enhanced conversions.",
    summary:
      "Intent-led Search architecture, Performance Max asset & feed hygiene, brand vs. non-brand separation, and offline/server conversion quality.",
    topics: [
      "Search intent segmentation",
      "Performance Max & Shopping feeds",
      "Brand vs. non-brand incrementality",
      "Enhanced conversions & lead quality",
    ],
    caseSlugs: ["workflow-space", "playah"],
    sections: [
      {
        title: "Search Architecture",
        summary:
          "Organize Search campaigns by commercial intent and margin tier so Smart Bidding optimizes toward profitable demand.",
        points: [
          "Isolate Brand, High-Intent Non-Brand, and Competitor queries to prevent blended ROAS distortion.",
          "Maintain disciplined negative keyword lists and search term audits.",
          "Align ad copy, extensions, and landing page messaging tightly with query intent.",
        ],
      },
      {
        title: "Performance Max (PMax)",
        summary:
          "Guide PMax with clean asset groups, brand exclusions, and margin-segmented product feeds.",
        points: [
          "Apply brand exclusions so PMax does not inflate performance by harvesting existing brand demand.",
          "Segment asset groups by product category or margin bucket with tailored creative assets.",
          "Use New Customer Acquisition goals carefully and validate against CRM new-to-brand data.",
        ],
      },
      {
        title: "Shopping & Feed Hygiene",
        summary:
          "In Shopping and PMax retail, product feed quality is your keyword targeting.",
        points: [
          "Optimize product titles (brand + core attributes + use case), GTINs, and custom labels for margin/velocity.",
          "Use high-contrast primary images and keep Merchant Center diagnostics free of disapprovals.",
          "Feed Enhanced Conversions and offline CRM conversion values back into Google Ads.",
        ],
      },
    ],
    guardrails: [
      "Never mix Brand and Non-Brand in the same campaign when evaluating scaling efficiency.",
      "Audit lead quality (SQL/qualified bookings), not just raw form submissions, for B2B and local services.",
    ],
  },
  {
    id: "unit-economics",
    slug: "metrics",
    href: "/growth/metrics",
    title: "Marketing Metrics",
    shortSubtitle: "ROAS · MER · CAC · LTV",
    seoTitle: "Marketing Metrics — ROAS, MER, CAC & LTV — Phuc Loc Nguyen",
    seoDescription:
      "Definitions, formulas, assumptions, and limitations for ROAS, MER, CAC, LTV, Break-even ROAS, and Contribution Profit.",
    summary:
      "Connecting platform metrics (ROAS, CPA, CPL) with blended business health (MER, CAC, LTV, payback period, and contribution profit before scaling budget).",
    topics: [
      "ROAS vs. MER vs. Contribution Profit",
      "Break-even ROAS & margin thresholds",
      "CAC payback & cohort retention",
      "Scenario modeling & budget pacing",
    ],
    caseSlugs: ["playah", "tomato-childrens-home", "sony"],
    sections: [],
    guardrails: [],
  },
  {
    id: "growth-architecture",
    slug: "automation",
    href: "/growth/automation",
    title: "Growth Systems",
    shortSubtitle: "SEO · CRO · CRM · AI",
    seoTitle: "Growth Systems — SEO, CRO, CRM & AI Automation — Phuc Loc Nguyen",
    seoDescription:
      "Full-funnel growth systems connecting technical SEO, conversion rate optimization (CRO), CRM lifecycle automation, and AI-assisted marketing workflows.",
    summary:
      "Full-funnel acquisition systems connecting fast web experiences, CRO, GA4 server-side instrumentation, CRM lifecycle flows, and AI-assisted marketing workflows.",
    topics: [
      "Technical SEO & organic scale",
      "Landing page CRO & booking flows",
      "GA4 & server-side event schemas",
      "CRM & AI workflow automation",
    ],
    caseSlugs: ["pops-worldwide", "sony", "education-communities"],
    sections: [
      {
        title: "Technical SEO",
        summary:
          "Build durable organic acquisition through clean information architecture, fast Core Web Vitals, and structured entity data.",
        points: [
          "Structure hub-and-spoke topic clusters with clear canonicals, internal links, and JSON-LD schema.",
          "Optimize page speed, image delivery (WebP/responsive sizing), and crawlable static HTML.",
          "Align content briefs with real search intent and first-hand evidence rather than thin templates.",
        ],
      },
      {
        title: "CRO & Funnel Experience",
        summary:
          "Improve conversion efficiency so every paid and organic click produces more qualified revenue.",
        points: [
          "Audit message match between ad creative, search query, and above-the-fold landing page value prop.",
          "Reduce checkout and booking friction across mobile viewports.",
          "Instrument micro-conversions in GA4 to pinpoint exact step-level drop-offs.",
        ],
      },
      {
        title: "CRM & AI Automation",
        summary:
          "Compound acquisition gains with automated retention, lead routing, and AI-assisted operational workflows.",
        points: [
          "Connect ad leads and checkout events to CRM lifecycle sequences (welcome, win-back, repeat purchase).",
          "Automate reporting pipelines and anomaly alerts for MER, CPA, and creative fatigue.",
          "Use AI workflows for research synthesis, creative brief drafting, and QA checks with human review.",
        ],
      },
    ],
    guardrails: [
      "Automate proven workflows—automating a broken funnel only scales waste faster.",
      "Keep human editorial and measurement review in the loop for AI-assisted content and reporting.",
    ],
  },
];

export function getGrowthPillarBySlug(slug: string): GrowthPillar | undefined {
  return GROWTH_PILLARS.find((pillar) => pillar.slug === slug);
}
