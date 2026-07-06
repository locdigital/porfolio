import { getProjects } from "@/lib/cms";
import { absoluteUrl, pageSchema, safeJsonLd } from "@/lib/seo";
import AnimatedPageHeadline from "@/components/ui/animated-page-headline";
import ClickBlurGroup from "@/components/ui/click-blur-group";
import LinkComponent from "next/link";
import { Metadata } from "next";
import React from "react";

const workTitle = "Work | Phuc Loc Nguyen";
const workDescription = "Selected projects by Phuc Loc Nguyen: paid media scaling, TikTok Shop growth, SEO, lead generation, and community strategy.";

export const metadata: Metadata = {
  title: "Work",
  description: workDescription,
};

export default async function Page() {
  const sortedProjects = await getProjects();

  const jsonLd = safeJsonLd([
    pageSchema({
      url: absoluteUrl("/work"),
      title: workTitle,
      description: workDescription,
      type: "CollectionPage",
    }),
    {
      "@type": "ItemList",
      "@id": `${absoluteUrl("/work")}#projects`,
      name: "Selected case studies",
      itemListElement: sortedProjects.map((project, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: absoluteUrl(`/work/${project.slug}`),
        name: project.title,
        description: project.summary,
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

          {/* PAGE HERO */}
          <section className="gear-hero work-hero" aria-label="My work">
            <div className="page-kicker-wrapper">
              <span className="page-kicker-text">My work</span>
            </div>
            <AnimatedPageHeadline
              className="hero-title hero-title--animated"
              headline="Selected work & <em>case studies</em>"
            />
            <p className="gear-intro">
              Paid media scaling, TikTok Shop growth, technical SEO,
              lead generation, and community work across e-commerce,
              education, and entertainment.
            </p>
          </section>

          {/* Project List */}
          <ClickBlurGroup className="project-list" itemSelector=".project-row">
            {sortedProjects.map((project) => (
              <article className="project-row" key={project.slug}>
                <div className={`project-row-inner ${!project.coverImage ? 'project-row-inner--text-only' : ''}`}>

                  {/* Left: text */}
                  <div className="project-text">
                    <span className="project-number">{project.number} / {project.client.toUpperCase()}</span>
                    <LinkComponent href={`/work/${project.slug}`} className="project-title-link">
                      <h2 className="project-name">{project.title}</h2>
                    </LinkComponent>
                    <p className="project-summary">{project.summary}</p>

                    <p className="project-tools">
                      {project.tags.map((tag: string) => (
                        <span className="tag" key={tag}>{tag}</span>
                      ))}
                    </p>

                  </div>

                  {project.coverImage && (
                    /* Right: visual card */
                    <div className="project-visual">
                      <LinkComponent href={`/work/${project.slug}`} className="project-card-link" aria-label={`View ${project.title}`}>
                        <div className="project-card-img">
                          <div className="card-logo-wrapper">
                            <img
                              src={project.coverImage}
                              alt={project.client}
                              className="card-logo"
                              loading="lazy"
                              decoding="async"
                            />
                          </div>
                        </div>
                      </LinkComponent>
                    </div>
                  )}

                </div>
                <div className="project-divider"></div>
              </article>
            ))}
          </ClickBlurGroup>

        </div>
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        .work-hero {
          margin-bottom: var(--hero-gap);
          padding-bottom: clamp(36px, 5vw, 56px);
          border-bottom: 1px solid var(--divider);
        }

        .work-hero .gear-intro {
          max-width: 560px;
          margin-top: 18px;
        }

        .project-list {
          display: flex;
          flex-direction: column;
          border-bottom: 1px solid var(--divider);
        }

        .project-row {
          content-visibility: visible;
          outline: none;
          transition: opacity 0.4s ease, filter 0.4s ease;
          will-change: opacity, filter;
        }

        .project-row-inner {
          display: grid;
          grid-template-columns: minmax(0, 0.88fr) minmax(320px, 0.82fr);
          gap: clamp(44px, 6vw, 84px);
          align-items: center;
          padding: clamp(44px, 6vw, 72px) 0;
        }

        .project-row-inner--text-only {
          grid-template-columns: minmax(0, 860px);
        }

        .project-number {
          display: block;
          font-family: var(--mono);
          font-size: var(--type-caption);
          color: color-mix(in srgb, var(--text) 68%, var(--muted));
          letter-spacing: 0.04em;
          text-transform: uppercase;
          margin-bottom: 16px;
        }

        .project-title-link {
          text-decoration: none;
          display: inline-block;
        }

        .project-title-link:hover .project-name {
          color: var(--accent);
        }

        .project-name {
          font-family: var(--serif);
          font-size: var(--type-card-title);
          font-weight: 400;
          line-height: 1.2;
          letter-spacing: -0.015em;
          color: var(--text);
          margin-bottom: 14px;
          transition: color 0.25s ease;
        }

        .project-summary {
          font-size: var(--type-body);
          line-height: 1.72;
          color: color-mix(in srgb, var(--text) 72%, var(--muted));
          margin-bottom: 20px;
          max-width: 620px;
          text-wrap: pretty;
        }

        .project-tools {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 26px;
        }

        .tag {
          font-family: var(--mono);
          font-size: calc(var(--type-caption) * 0.72);
          letter-spacing: 0.02em;
          color: color-mix(in srgb, var(--text) 72%, var(--muted));
          border: 1px solid var(--divider);
          border-radius: 4px;
          padding: 2px 6px;
          text-transform: uppercase;
          transition: color 0.2s ease;
        }

        .project-card-link {
          display: block;
          text-decoration: none;
          border-radius: var(--radius);
        }

        .project-card-img {
          --thumb-radius: var(--rounded-md);
          --thumb-border-width: 1.5px;
          --thumb-inner-radius: calc(var(--thumb-radius) - var(--thumb-border-width));

          position: relative;
          aspect-ratio: 2 / 1;
          background: transparent;
          border-radius: var(--radius);
          overflow: hidden;
          border: var(--thumb-border-width) solid rgba(0, 0, 0, 0.06);
          transition: border-color 180ms var(--ease-out), background 180ms var(--ease-out);
        }

        .project-card-link:focus-visible .project-card-img {
          border-color: var(--accent-border);
          background: var(--accent-soft);
        }

        .card-logo-wrapper {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          border-radius: var(--radius);
        }

        .card-logo {
          width: 100%;
          height: 100%;
          object-fit: contain;
          border-radius: var(--radius);
        }

        .project-divider {
          height: 1px;
          background: var(--divider);
        }

        .project-row:last-child .project-divider {
          display: none;
        }

        .project-list[data-click-blur-active="true"] .project-row[data-click-blur-selected="false"] {
          opacity: 0.18 !important;
          filter: saturate(0.8) !important;
        }

        .project-list[data-click-blur-active="true"] .project-row[data-click-blur-selected="true"] {
          opacity: 1 !important;
          filter: blur(0) saturate(1) !important;
        }

        @media (max-width: 900px) {
          .project-row-inner {
            grid-template-columns: 1fr;
            gap: 32px;
            padding: 48px 0;
          }

          .project-visual {
            order: -1;
          }

          .project-summary {
            max-width: 100%;
          }
        }

        @media (max-width: 480px) {
          .project-row-inner {
            padding: 36px 0;
          }

        }
      `}} />
    </>
  );
}
