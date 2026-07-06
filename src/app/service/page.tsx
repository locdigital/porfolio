import { getPhotoAsset } from "@/lib/photo-assets";
import { absoluteUrl, pageSchema, safeJsonLd } from "@/lib/seo";
import ServiceView from "./ServiceView";
import { Metadata } from "next";
import React from "react";

const serviceTitle = "Digital Services | Phuc Loc Nguyen";
const serviceDescription = "Scale conversions, build community trust, and deploy lightning-fast headless websites. Explore my modern digital marketing and engineering services.";

export const metadata: Metadata = {
  title: "Digital Services",
  description: serviceDescription,
};

export default async function Page() {
  const performanceImg = getPhotoAsset("/assets/photos/img-portfolio/photo-10.webp");
  const seedingImg = getPhotoAsset("/assets/photos/img-portfolio/photo-15.webp");
  const brandImg = getPhotoAsset("/assets/photos/img-portfolio/photo-3.webp");
  const ecommerceImg = getPhotoAsset("/assets/photos/img-portfolio/photo-19.webp");
  const webdevImg = getPhotoAsset("/assets/photos/img-portfolio/photo-20.webp");
  const automationImg = getPhotoAsset("/assets/photos/img-portfolio/photo-21.webp");

  const services = [
    {
      id: "performance",
      num: "01",
      kicker: "PERFORMANCE MARKETING",
      title: "Performance Ads & Attribution",
      metric: "4.2x Avg ROAS",
      desc: "Scale conversions and lower CAC through high-intent paid campaigns and modern server-side measurement frameworks.",
      img: performanceImg,
      alt: "Performance Marketing Analytics",
      tags: ["Meta Ads", "Google Ads", "TikTok Ads", "GA4 Server-Side", "Looker Studio"],
      checklist: [
        "Custom pixel tracking & server-side CAPI integration",
        "Full-funnel Google, Meta, and TikTok ad accounts build",
        "Advanced attribution auditing & GA4 tracking setups",
        "Weekly analytics dashboards (Looker Studio)"
      ],
      capabilities: [
        { name: "Attribution Setup", desc: "Setting up server-side Conversions API (CAPI), GTM Server container, and GA4 for perfect tracking accuracy." },
        { name: "Paid Acquisition", desc: "Building, bidding, and scaling ads campaigns on Meta, Google Search/PMax, and TikTok Shop." },
        { name: "A/B Testing Funnels", desc: "Configuring landing page variations and optimizing the user signup path to maximize conversion rates." }
      ]
    },
    {
      id: "seeding",
      num: "02",
      kicker: "SOCIAL SEEDING",
      title: "Organic Seeding & Advocacy",
      metric: "85% Trust Index",
      desc: "Deploy natural forum discussion threads and community seeding campaigns that establish genuine peer recommendation.",
      img: seedingImg,
      alt: "Social Seeding and Community Advocacy",
      tags: ["Forum Seeding", "Reddit & Facebook", "Sentiment Mgmt", "KOC Booking"],
      checklist: [
        "Organic discussion angle engineering across Reddit & Forums",
        "Targeted niche group monitoring & sentiment control",
        "Validating brand trust via micro-influencers & KOCs",
        "Viral community response playbook creation"
      ],
      capabilities: [
        { name: "Dialogue Engineering", desc: "Drafting organic discussion scenarios that introduce product recommendations naturally." },
        { name: "Forum Outreach", desc: "Leading campaigns across tech platforms, general groups, Facebook hubs, and Reddit pages." },
        { name: "Crisis Sentiment Control", desc: "Monitoring social threads and proactively resolving negative community discussions." }
      ]
    },
    {
      id: "brand",
      num: "03",
      kicker: "BRAND MARKETING",
      title: "Strategic Brand Positioning",
      metric: "100% Alignment",
      desc: "Outline your core positioning, styleguides, and messaging maps to stand out in crowded tech markets.",
      img: brandImg,
      alt: "Brand Identity Layout",
      tags: ["Market Positioning", "Messaging Maps", "Visual Styleguides", "Tone of Voice"],
      checklist: [
        "Brand voice guidelines & copywriting frameworks",
        "Core market positioning audits & value proposition design",
        "Launch campaign themes and key message mapping",
        "Cohesive typographic, palette, and symbol rulebooks"
      ],
      capabilities: [
        { name: "Positioning Strategy", desc: "Defining clear target personas, competitor gaps, and your core unique value proposition." },
        { name: "Messaging Frameworks", desc: "Building modular copy blocks that scale from landing page hooks to email headers." },
        { name: "Visual System Rules", desc: "Standardizing logo grids, typography, and palettes for developers and creative teams." }
      ]
    },
    {
      id: "ecommerce",
      num: "04",
      kicker: "E-COMMERCE GROWTH",
      title: "DTC Storefront Optimization",
      metric: "+28% Conversion",
      desc: "Refine store interfaces and configure retention flows to increase Customer Lifetime Value and average order index.",
      img: ecommerceImg,
      alt: "E-Commerce Funnel Optimization",
      tags: ["Shopify CRO", "Cart Funnel optimization", "Klaviyo CRM", "Catalog Feed"],
      checklist: [
        "Cart drawer & dynamic checkout design edits (CRO)",
        "Automated email customer flows (Klaviyo CRM)",
        "Highly catalog ad feeds optimized for social shopping",
        "DTC performance audits & order value diagnostics"
      ],
      capabilities: [
        { name: "Checkout Optimization", desc: "Redesigning checkout pages, trust indicators, and cart flows to prevent basket abandonment." },
        { name: "Retention Loops", desc: "Configuring welcome streams, recovery paths, and post-purchase sequences in Klaviyo." },
        { name: "Feed Optimization", desc: "Refining custom product feeds to pass structured variables to TikTok and Meta catalogs." }
      ]
    },
    {
      id: "webdev",
      num: "05",
      kicker: "WEB DEVELOPMENT",
      title: "Headless Web Engineering",
      metric: "100/100 Speed",
      desc: "Build lightning-fast, fully responsive websites on Astro and React that score perfect Lighthouse diagnostics.",
      img: webdevImg,
      alt: "Modern Web Engineering Workspace",
      tags: ["Astro Framework", "React & TS", "Content Collections", "Core Web Vitals"],
      checklist: [
        "Headless static sites deployment using modern framework architectures",
        "Interactive interfaces with smooth, lightweight micro-animations",
        "Technical SEO markup, automated sitemaps, and strict schema",
        "User-friendly local content writing schema setup"
      ],
      capabilities: [
        { name: "Astro Static Builds", desc: "Creating static page assemblies that load in milliseconds and deliver perfect SEO crawls." },
        { name: "Dynamic React Modules", desc: "Building snappier components (collages, listings, query tabs) that run securely in browser frames." },
        { name: "Content Collections", desc: "Setting up local Markdown and MDX collections for structured, superfast page builds." }
      ]
    },
    {
      id: "automation",
      num: "06",
      kicker: "MARKETING AUTOMATION",
      title: "CRM Automation & Lifecycle",
      metric: "+60% Open Rate",
      desc: "Connect lead capture, CRM segmentation, and lifecycle messaging so prospects move through the funnel without manual follow-up.",
      img: automationImg,
      alt: "Marketing Automation Workflow",
      tags: ["n8n Automation", "Email Flows", "Lead Scoring", "CRM Segments"],
      checklist: [
        "Lead capture forms routed into CRM and campaign lists",
        "Welcome, nurture, abandoned lead, and reactivation email flows",
        "Audience segmentation based on source, intent, and lifecycle stage",
        "Automated reports for lead quality, handoff speed, and revenue impact"
      ],
      capabilities: [
        { name: "Workflow Automation", desc: "Connecting forms, sheets, CRM fields, Slack alerts, and campaign lists with lightweight n8n workflows." },
        { name: "Lifecycle Messaging", desc: "Writing and configuring email journeys that educate, qualify, and recover leads after the first touch." },
        { name: "Lead Operations", desc: "Creating lead scoring rules, routing logic, and reporting views for sales and marketing follow-up." }
      ]
    }
  ];

  const pricingPlans = [
    {
      title: "Advocacy Seeding Retainer",
      desc: "Build community trust, handle sentiment issues, and run ongoing seeding loops on niche forums.",
      priceMonthly: "$2,490",
      priceProject: "$6,900",
      features: [
        "Weekly seed posts & organic discussions",
        "Reddit, Facebook, and local forum tracking",
        "Dedicated account campaign engineer",
        "Sentiment monitoring alerts",
        "Basic creative book (KOCs & copy)"
      ],
      tag: "Awareness & Community"
    },
    {
      title: "Full-Funnel Growth Retainer",
      desc: "Complete performance scaling, tracking integration, landing optimization, and reporting dashboards.",
      priceMonthly: "$4,990",
      priceProject: "$12,500",
      popular: true,
      features: [
        "Meta, Google, and TikTok ad management",
        "Server-side Conversions API (CAPI) & GA4 GTM",
        "Weekly analytics updates + Looker dashboards",
        "Custom landing page CRO diagnostics",
        "Creator ad creatives direction & briefs"
      ],
      tag: "Scale & Performance"
    },
    {
      title: "Headless Web Engineering",
      desc: "End-to-end design, static site building, SEO, and CMS setup. Fast, clean, lightweight code.",
      priceMonthly: "$3,800",
      priceProject: "$7,500",
      features: [
        "Astro/React responsive static builds",
        "Local Content Collections or headless CMS integration",
        "100/100 Lighthouse speed performance package",
        "Full technical SEO configuration",
        "4 weeks post-launch support"
      ],
      tag: "Code & SEO"
    }
  ];

  const faqs = [
    {
      q: "How do monthly retainers work?",
      a: "We establish a scoped set of weekly milestones and retainers are billed monthly in advance. You gain direct Slack access and regular syncs, and the scope can be scaled up or down with a simple 15-day notice.",
      iconName: "calendar"
    },
    {
      q: "What is your typical web development workflow?",
      a: "We start by auditing existing layouts or assets, proceed to prototype clean responsive layouts in Astro, hook up any requested headless CMS content fields, optimize performance scores, and handle DNS/Vercel settings for launch.",
      iconName: "code"
    },
    {
      q: "Can you implement advanced server-side tracking?",
      a: "Yes. I routinely set up Google Tag Manager Server-Side containers, set up Meta Conversions API via Stape.io or AWS, resolve GA4 tracking gaps, and configure cookie consent parameters.",
      iconName: "zap"
    },
    {
      q: "How do you ensure organic social seeding doesn't look like ads?",
      a: "Authenticity is key. I script real-life user experiences, engage on active accounts, ask questions instead of hard-selling, and thread brand references naturally into existing group dialogues.",
      iconName: "message"
    }
  ];

  const jsonLd = safeJsonLd([
    pageSchema({
      url: absoluteUrl("/service"),
      title: serviceTitle,
      description: serviceDescription,
      type: "WebPage",
    }),
    {
      "@type": "OfferCatalog",
      "@id": `${absoluteUrl("/service")}#services`,
      name: "Digital marketing and web services",
      itemListElement: services.map((service) => ({
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: service.title,
          description: service.desc,
          serviceType: service.kicker,
          provider: { "@id": `${absoluteUrl("/")}#person` },
        },
      })),
    },
    {
      "@type": "FAQPage",
      "@id": `${absoluteUrl("/service")}#faq`,
      mainEntity: faqs.map((faq) => ({
        "@type": "Question",
        name: faq.q,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.a,
        },
      })),
    },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd }}
      />
      <ServiceView 
        services={services} 
        pricingPlans={pricingPlans} 
        faqs={faqs} 
        serviceDescription={serviceDescription}
      />
    </>
  );
}
