import { getGear } from "@/lib/cms";
import { absoluteUrl, pageSchema, safeJsonLd } from "@/lib/seo";
import AnimatedPageHeadline from "@/components/ui/animated-page-headline";
import { Metadata } from "next";
import React from "react";

const gearPageTitle = "My Gear | Phuc Loc Nguyen";
const gearPageDescription = "The hardware, camera kit, audio gear, and apps Phuc Loc Nguyen uses for marketing, content, and creative work.";

export const metadata: Metadata = {
  title: "My Gear",
  description: gearPageDescription,
};

const fallbackGearSections = [
  {
    title: "Workstation",
    description: "Daily setup for writing, planning campaigns, editing, and building small tools.",
    items: [
      {
        name: "MacBook Air M2",
        role: "Main laptop",
        note: "Lightweight enough for cafe work, strong enough for Astro, Figma, ads dashboards, and photo edits.",
        url: "https://www.apple.com/macbook-air/",
        tag: "Laptop",
        image: undefined,
      },
      {
        name: "LG UltraFine 27 inch",
        role: "External display",
        note: "A clean second screen for GA4, Meta Ads, docs, and timeline-heavy work.",
        url: "https://www.lg.com/us/monitors",
        tag: "Display",
        image: undefined,
      },
      {
        name: "Keychron K2",
        role: "Keyboard",
        note: "Compact mechanical keyboard that keeps the desk neat without losing function keys.",
        url: "https://www.keychron.com/products/keychron-k2-wireless-mechanical-keyboard",
        tag: "Keys",
        image: undefined,
      },
      {
        name: "Logitech MX Master 3S",
        role: "Mouse",
        note: "The horizontal scroll wheel is ridiculously useful for spreadsheets and creative timelines.",
        url: "https://www.logitech.com/products/mice/mx-master-3s.html",
        tag: "Mouse",
        image: undefined,
      },
    ],
  },
  {
    title: "Camera & Content",
    description: "Small kit for travel photos, product shots, and behind-the-scenes content.",
    items: [
      {
        name: "Sony Alpha a6400",
        role: "Camera body",
        note: "Reliable autofocus, compact size, and still a very capable hybrid camera for the road.",
        url: "https://electronics.sony.com/imaging/interchangeable-lens-cameras/aps-c/p/ilce6400-b",
        tag: "Camera",
        image: undefined,
      },
      {
        name: "Sigma 30mm F1.4 DC DN",
        role: "Everyday lens",
        note: "My favorite focal length for low-light street photos, portraits, and natural product frames.",
        url: "https://www.sigmaphoto.com/30mm-f1-4-dc-dn-c",
        tag: "Lens",
        image: undefined,
      },
      {
        name: "iPhone 15 Pro",
        role: "Pocket camera",
        note: "Quick capture, story drafts, notes, voice memos, and the fastest camera because it is always there.",
        url: "https://www.apple.com/iphone-15-pro/",
        tag: "Phone",
        image: undefined,
      },
    ],
  },
  {
    title: "Audio & Focus",
    description: "The tiny things that make deep work and calls easier.",
    items: [
      {
        name: "AirPods Pro",
        role: "Everyday audio",
        note: "Noise cancellation for flights, cafes, and long strategy blocks.",
        url: "https://www.apple.com/airpods-pro/",
        tag: "Audio",
        image: undefined,
      },
      {
        name: "Sony WH-1000XM5",
        role: "Deep work headphones",
        note: "Comfortable for longer editing sessions and focused planning days.",
        url: "https://electronics.sony.com/audio/headphones/headband/p/wh1000xm5-b",
        tag: "Headphones",
        image: undefined,
      },
    ],
  },
  {
    title: "Apps I Keep Open",
    description: "Software and services that sit in the daily loop.",
    items: [
      {
        name: "Notion",
        role: "Workspace",
        note: "Campaign notes, content calendars, project docs, and the personal operating system.",
        url: "https://www.notion.so/",
        tag: "Docs",
        image: undefined,
      },
      {
        name: "Raycast",
        role: "Launcher",
        note: "Fast app switching, snippets, clipboard history, and little shortcuts that compound.",
        url: "https://www.raycast.com/",
        tag: "Utility",
        image: undefined,
      },
      {
        name: "ChatGPT",
        role: "Thinking partner",
        note: "Research, draft structure, coding help, and pressure-testing ideas before they go live.",
        url: "https://chatgpt.com/",
        tag: "AI",
        image: undefined,
      },
      {
        name: "Ahrefs",
        role: "SEO research",
        note: "Keyword exploration, content gaps, competitor checks, and search opportunity sizing.",
        url: "https://ahrefs.com/",
        tag: "SEO",
        image: undefined,
      },
    ],
  },
];

export default async function Page() {
  const gear = await getGear();
  
  const gearSections = (gear?.sections ?? fallbackGearSections.map((section) => ({
    ...section,
    slug: section.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
    headline: section.title,
    items: section.items.map((item) => ({
      name: item.name,
      slug: item.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
      headline: item.role,
      description: item.note,
      url: item.url,
      tag: item.tag,
      image: item.image,
    })),
  }))) as any[];

  const gearTitle = gear?.title ?? "My Gear";
  const gearHeadline = gear?.headline ?? "Tools for <em>focused work</em> and faster <em>building.</em>";
  const gearDescription = gear?.description ?? "A living list of the products in my everyday setup. Each item links out to the product page so it is easy to reference, replace, or share.";

  const jsonLd = safeJsonLd([
    pageSchema({
      url: absoluteUrl("/gear"),
      title: gearPageTitle,
      description: gearPageDescription,
      type: "CollectionPage",
    }),
    {
      "@type": "ItemList",
      "@id": `${absoluteUrl("/gear")}#gear`,
      name: "Gear and tools",
      itemListElement: gearSections.flatMap((section: any) => section.items).map((item: any, index: number) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "Product",
          name: item.name,
          description: item.description,
          category: item.tag,
          url: item.url,
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
      <main className="gear-page">
        <div className="gear-container">
          <section className="gear-hero" aria-label="My Gear introduction">
            <div className="page-kicker-wrapper">
              <span className="page-kicker-text">{gearTitle}</span>
            </div>
            <AnimatedPageHeadline headline={gearHeadline} />
            <p className="gear-intro">{gearDescription}</p>
          </section>

          <nav className="gear-jump-nav" aria-label="Gear categories">
            {gearSections.map((section) => (
              <a key={section.slug} href={`#${section.slug}`}>{section.title}</a>
            ))}
          </nav>

          <section className="gear-featured" aria-label="Featured setup">
            <div className="desk-visual">
              <img src="/images/gear/gear-future.webp" alt="Future desk setup" loading="eager" decoding="async" />
            </div>
            <div className="gear-featured-copy">
              <span className="gear-count">{gearSections.reduce((sum, section) => sum + section.items.length, 0)} items</span>
              <h2>Desk, camera, audio, and apps in one place.</h2>
              <p>
                A curated list of my workstation equipment, camera kit, audio gear, and productivity software that I use on a daily basis.
              </p>
            </div>
          </section>

          {gearSections.map((section, sectionIndex) => (
            <section className="gear-section" id={section.slug} key={section.slug}>
              <div className="gear-section-head">
                <div>
                  <h2>{section.title}</h2>
                  <p>{section.description}</p>
                </div>
                <span>{String(sectionIndex + 1).padStart(2, "0")}</span>
              </div>

              <div className="gear-grid">
                {section.items.map((item: any) => {
                  const cardContent = (
                    <>
                      <div className="gear-card-visual">
                        {item.image ? <img src={item.image} alt="" loading="lazy" decoding="async" /> : <span aria-hidden="true">{item.tag}</span>}
                      </div>
                      <div className="gear-card-copy">
                        <div className="gear-card-title">
                          <h3>{item.name}</h3>
                          {item.url && <span aria-hidden="true">↗</span>}
                        </div>
                        <p className="gear-role">{item.headline}</p>
                        <p className="gear-note">{item.description}</p>
                      </div>
                    </>
                  );

                  return item.url ? (
                    <a key={item.slug} id={item.slug} className={`gear-card gear-card-${item.slug}`} href={item.url} target="_blank" rel="noopener noreferrer" aria-label={`${item.name}: ${item.headline}`}>
                      {cardContent}
                    </a>
                  ) : (
                    <article key={item.slug} id={item.slug} className={`gear-card gear-card-${item.slug}`} aria-label={`${item.name}: ${item.headline}`}>
                      {cardContent}
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        .gear-jump-nav {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin: -22px 0 42px;
        }

        .gear-jump-nav a {
          display: inline-flex;
          min-height: 34px;
          align-items: center;
          border: 1px solid var(--divider);
          border-radius: var(--radius);
          padding: 7px 11px;
          font-family: var(--sans);
          font-size: var(--type-ui);
          font-weight: 600;
          line-height: 1;
          color: color-mix(in srgb, var(--text) 78%, var(--muted));
          background: rgba(255, 255, 255, 0.36);
          transition: border-color 180ms var(--ease-out), color 180ms var(--ease-out), background 180ms var(--ease-out);
        }

        .gear-jump-nav a:hover,
        .gear-jump-nav a:focus-visible {
          border-color: var(--accent-border);
          color: var(--accent);
          background: var(--accent-soft);
        }

        .gear-featured {
          display: grid;
          grid-template-columns: minmax(0, 1.45fr) minmax(280px, 0.75fr);
          gap: 36px;
          align-items: stretch;
          margin-bottom: var(--section-gap);
          border-top: 1px solid var(--divider);
          border-bottom: 1px solid var(--divider);
          padding: 28px 0;
        }

        .desk-visual {
          min-height: 340px;
          position: relative;
          overflow: hidden;
          border: 1px solid var(--divider);
          border-radius: var(--radius);
          background: rgba(255, 255, 255, 0.04);
        }

        .desk-visual img {
          width: 100%;
          height: 100%;
          min-height: inherit;
          display: block;
          object-fit: cover;
          object-position: center;
        }

        .gear-featured-copy {
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .gear-count {
          font-family: var(--mono);
          font-size: var(--type-caption);
          color: var(--muted);
          margin-bottom: 18px;
        }

        .gear-featured-copy h2 {
          font-family: var(--serif);
          font-size: var(--type-section-title);
          line-height: 1.05;
          font-weight: 400;
          color: var(--text);
          margin-bottom: 14px;
          text-wrap: balance;
        }

        .gear-featured-copy p {
          color: color-mix(in srgb, var(--text) 70%, var(--muted));
          font-size: var(--type-body);
          line-height: 1.72;
          text-wrap: pretty;
        }

        .gear-section {
          margin-bottom: var(--section-gap);
          scroll-margin-top: calc(var(--hdr-h) + 24px);
          content-visibility: visible;
        }

        .gear-section-head {
          display: flex;
          justify-content: space-between;
          gap: 24px;
          align-items: flex-start;
          padding-bottom: 22px;
          border-bottom: 1px solid var(--divider);
        }

        .gear-section-head h2 {
          font-family: var(--serif);
          font-size: var(--type-section-title);
          font-weight: 400;
          line-height: 1.08;
          color: var(--text);
          margin-bottom: 8px;
        }

        .gear-section-head p {
          max-width: 560px;
          color: color-mix(in srgb, var(--text) 70%, var(--muted));
          font-size: var(--type-body);
          line-height: 1.62;
          text-wrap: pretty;
        }

        .gear-section-head span {
          font-family: var(--mono);
          font-size: var(--type-caption);
          color: var(--muted);
        }

        .gear-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
          gap: 16px;
          padding-top: 16px;
        }

        .gear-card {
          display: grid;
          grid-template-columns: 128px minmax(0, 1fr);
          min-height: 180px;
          overflow: hidden;
          border: 1px solid var(--divider);
          border-radius: var(--radius);
          background: rgba(255, 255, 255, 0.32);
          color: inherit;
          transition: border-color 180ms var(--ease-out), background 180ms var(--ease-out);
        }

        .gear-card:hover,
        .gear-card:focus-visible {
          border-color: rgba(0, 117, 222, 0.42);
          background: rgba(255, 255, 255, 0.6);
        }

        .gear-card:hover h3 {
          color: var(--accent);
        }

        .gear-card-visual {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 12px;
          background: transparent;
          border-right: 1px solid var(--divider);
          border-radius: var(--radius) !important;
          overflow: hidden;
        }

        .gear-card-visual img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        .gear-card-adidas-adizero-evo-sl .gear-card-visual img {
          transform: translateX(2px) rotate(0deg) scale(1.04);
        }

        .gear-card-kailas-fuga-ex-330 .gear-card-visual img {
          transform: translateX(2px) scaleX(-1) scale(1.04);
        }

        .gear-card-coros-apex-4 .gear-card-visual img {
          transform: translateX(2px) scaleX(-1) scale(1.04);
        }

        .gear-card-gami-crom-pro .gear-card-visual img {
          transform: scale(1.6);
          transform-origin: center;
        }

        .gear-card-visual span {
          font-family: var(--mono);
          font-size: var(--type-caption);
          color: var(--text);
        }

        .gear-card-copy {
          min-width: 0;
          padding: 18px;
        }

        .gear-card-title {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 14px;
          margin-bottom: 4px;
        }

        .gear-card-title h3 {
          font-family: var(--serif);
          font-size: var(--type-card-title);
          line-height: 1.05;
          font-weight: 400;
          color: var(--text);
          transition: color 0.2s ease;
          text-wrap: balance;
        }

        .gear-card-title span {
          flex: 0 0 auto;
          font-family: var(--mono);
          font-size: var(--type-caption);
          color: var(--muted);
        }

        .gear-role {
          font-family: var(--mono);
          font-size: var(--type-caption);
          color: var(--accent);
          margin-bottom: 14px;
        }

        .gear-note {
          color: color-mix(in srgb, var(--text) 72%, var(--muted));
          font-size: var(--type-body);
          line-height: 1.65;
          text-wrap: pretty;
        }

        @media (max-width: 900px) {
          .gear-featured {
            grid-template-columns: 1fr;
          }

          .gear-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 620px) {
          .gear-featured {
            margin-bottom: 64px;
          }

          .gear-jump-nav {
            margin-bottom: 34px;
            overflow-x: auto;
            flex-wrap: nowrap;
            padding-bottom: 6px;
            scrollbar-width: none;
          }

          .gear-jump-nav::-webkit-scrollbar {
            display: none;
          }

          .gear-jump-nav a {
            flex: 0 0 auto;
          }

          .desk-visual {
            min-height: 260px;
          }

          .gear-section-head {
            flex-direction: column;
            gap: 10px;
          }

          .gear-card {
            grid-template-columns: 1fr;
            min-height: auto;
          }

          .gear-card-visual {
            min-height: 96px;
            border-right: 0;
            border-bottom: 1px solid var(--divider);
          }

          .gear-card-gami-crom-pro .gear-card-visual img {
            transform: scale(1);
          }
        }
      ` }} />
    </>
  );
}
