import AboutHero from "@/components/ui/about-hero";
import { absoluteUrl, pageSchema, safeJsonLd } from "@/lib/seo";
import { Metadata } from "next";
import Link from "next/link";
import React from "react";

const aboutTitle = "About | Phuc Loc Nguyen";
const aboutDescription = "Learn more about Nguyen Phuc Loc, a Senior Performance Marketing Executive focused on paid media, TikTok Shop growth, SEO, automation, and full-funnel execution.";

export const metadata: Metadata = {
  title: "About",
  description: aboutDescription,
};

export default function Page() {
  const jsonLd = safeJsonLd(
    pageSchema({
      url: absoluteUrl("/about"),
      title: aboutTitle,
      description: aboutDescription,
      type: "AboutPage",
    })
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd }}
      />
      <main className="gear-page">
        <div className="gear-container">
          <section className="about-intro gear-hero" aria-label="About me">
            <AboutHero />
          </section>

          <section className="about-section">
            <div className="about-section-header">
              <p className="section-kicker">Selected work</p>
              <h2 className="card-title">What I Do</h2>
              <p className="card-desc">Campaigns, funnels, and communities scaled across e-commerce, education, and entertainment.</p>
            </div>
            <div className="about-section-body">
              <div className="evidence-panel">
                <div className="work-list">
                  <Link href="/work/playah" className="work-list-item is-link">
                    <div className="item-main">PlayAh!</div>
                    <div className="item-desc">Revenue Scaling & TikTok Shop GMV</div>
                    <div className="item-meta">playahvietnam.com</div>
                  </Link>
                  <Link href="/work/workflow-space" className="work-list-item is-link">
                    <div className="item-main">WorkFlow Space</div>
                    <div className="item-desc">Branch Launches & Lead Generation</div>
                    <div className="item-meta">workflowspace.vn</div>
                  </Link>
                  <Link href="/work/tomato-childrens-home" className="work-list-item is-link">
                    <div className="item-main">TOMATO Children's Home</div>
                    <div className="item-desc">Marketing 360 & Enrollment Growth</div>
                    <div className="item-meta">education growth</div>
                  </Link>
                  <Link href="/work/pops-worldwide" className="work-list-item is-link">
                    <div className="item-main">POPS Worldwide</div>
                    <div className="item-desc">Technical SEO & Organic Growth</div>
                    <div className="item-meta">pops.vn</div>
                  </Link>
                  <Link href="/work/education-communities" className="work-list-item is-link">
                    <div className="item-main">Education Communities</div>
                    <div className="item-desc">3M+ and 1M Member Communities</div>
                    <div className="item-meta">founding member</div>
                  </Link>
                </div>
              </div>
            </div>
          </section>

          <section className="about-section">
            <div className="about-section-header">
              <p className="section-kicker">Toolset & skills</p>
              <h2 className="card-title">Toolset & Skills</h2>
              <p className="card-desc">Platforms and systems I use to scale performance, attribution, SEO, and automation.</p>
            </div>
            <div className="about-section-body">
              <div className="skills-grid">
                <div className="skill-item">
                  <div className="item-main">Meta Ads</div>
                  <div className="item-desc">Paid Social Campaigns</div>
                  <div className="item-meta">facebook.com</div>
                </div>
                <div className="skill-item">
                  <div className="item-main">Google Ads</div>
                  <div className="item-desc">Performance Max, Search & Web Conversion</div>
                  <div className="item-meta">ads.google.com</div>
                </div>
                <div className="skill-item">
                  <div className="item-main">TikTok Ads</div>
                  <div className="item-desc">Spark Ads, GMV Max & TikTok Shop</div>
                  <div className="item-meta">ads.tiktok.com</div>
                </div>
                <div className="skill-item">
                  <div className="item-main">Google Analytics</div>
                  <div className="item-desc">Data Audits & GA4 Reporting</div>
                  <div className="item-meta">analytics.google.com</div>
                </div>
                <div className="skill-item">
                  <div className="item-main">Figma</div>
                  <div className="item-desc">Interface Design & Creative Mockups</div>
                  <div className="item-meta">figma.com</div>
                </div>
                <div className="skill-item">
                  <div className="item-main">n8n</div>
                  <div className="item-desc">AI-powered Funnel Automation</div>
                  <div className="item-meta">n8n.io</div>
                </div>
                <div className="skill-item">
                  <div className="item-main">Ahrefs</div>
                  <div className="item-desc">SEO Keyword & Competitor Research</div>
                  <div className="item-meta">ahrefs.com</div>
                </div>
                <div className="skill-item">
                  <div className="item-main">Looker Studio</div>
                  <div className="item-desc">Dashboarding & Performance Reporting</div>
                  <div className="item-meta">lookerstudio.google.com</div>
                </div>
              </div>
            </div>
          </section>

          <section className="about-section">
            <div className="about-section-header">
              <p className="section-kicker">Education</p>
              <h2 className="card-title">Education & Credentials</h2>
              <p className="card-desc">Formal degree and professional marketing certifications.</p>
            </div>
            <div className="about-section-body">
              <div className="evidence-panel is-compact">
                <div className="work-list">
                  <div className="work-list-item">
                    <div className="item-main">FPT University</div>
                    <div className="item-desc">Bachelor of Digital Marketing, Graduated with Honors</div>
                    <div className="item-meta">2019-2023 · GPA 9.4/10</div>
                  </div>
                  <div className="work-list-item">
                    <div className="item-main">Google</div>
                    <div className="item-desc">Digital Marketing Specialization</div>
                    <div className="item-meta">Issued 2022</div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        /* about-intro: separator between hero and sections */
        .about-intro {
          margin-bottom: var(--section-gap);
          padding-bottom: clamp(40px, 5vw, 64px);
          border-bottom: 1px solid var(--divider);
        }

        /* Override gear-hero max-width for about — wider layout */
        .about-intro.gear-hero {
          max-width: 1120px;
        }

        .about-kicker,
        .section-kicker {
          margin-bottom: 18px;
          font-family: var(--mono);
          font-size: var(--type-caption);
          font-weight: 600;
          line-height: 1;
          letter-spacing: 0.02em;
          color: var(--accent);
        }

        .about-hero-title {
          max-width: 980px;
          font-family: var(--serif);
          font-size: var(--type-display-lg);
          font-weight: 400;
          line-height: 0.98;
          letter-spacing: 0;
          color: var(--text);
          text-wrap: balance;
        }

        .about-hero-grid {
          display: grid;
          grid-template-columns: minmax(0, 620px) minmax(220px, 1fr);
          gap: clamp(28px, 7vw, 96px);
          align-items: end;
          margin-top: clamp(24px, 4vw, 44px);
        }

        .about-hero-copy {
          max-width: 68ch;
          font-family: var(--sans);
          font-size: var(--type-body);
          line-height: 1.72;
          color: color-mix(in srgb, var(--text) 73%, var(--muted));
          text-wrap: pretty;
        }

        .about-hero-aside {
          display: grid;
          gap: 6px;
          justify-items: end;
          padding-bottom: 2px;
          font-family: var(--mono);
          font-size: var(--type-caption);
          line-height: 1.45;
          color: var(--muted);
          text-align: right;
        }

        .about-hero-aside strong {
          color: var(--text);
          font-weight: 600;
          letter-spacing: 0.03em;
          text-transform: uppercase;
        }

        .about-hero-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 28px;
        }

        .about-hero-actions a {
          display: inline-flex;
          min-height: 36px;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--divider);
          border-radius: var(--radius);
          padding: 8px 13px;
          font-family: var(--sans);
          font-size: var(--type-ui);
          font-weight: 600;
          line-height: 1;
          color: var(--text);
          background: rgba(255, 255, 255, 0.42);
          transition: border-color 180ms var(--ease-out), color 180ms var(--ease-out), background 180ms var(--ease-out);
        }

        .about-hero-actions a:hover {
          border-color: var(--accent-border);
          color: var(--accent);
          background: var(--accent-soft);
        }

        .about-section {
          display: grid;
          grid-template-columns: minmax(220px, 0.82fr) minmax(0, 1.35fr);
          gap: clamp(28px, 6vw, 84px);
          align-items: start;
          margin-bottom: var(--section-gap);
        }

        .about-section:last-child {
          margin-bottom: 0;
        }

        .about-section-header {
          position: sticky;
          top: calc(var(--hdr-h) + 32px);
        }

        .card-title {
          font-family: var(--serif);
          font-size: var(--type-section-title);
          font-weight: 400;
          line-height: 1.05;
          color: var(--text);
          text-wrap: balance;
        }

        .card-desc {
          max-width: 34ch;
          margin-top: 14px;
          font-family: var(--sans);
          font-size: var(--type-body);
          line-height: 1.6;
          color: color-mix(in srgb, var(--text) 68%, var(--muted));
          text-wrap: pretty;
        }

        .about-section-body {
          min-width: 0;
        }

        .evidence-panel {
          border-top: 1px solid var(--text);
          border-bottom: 1px solid var(--divider);
        }

        .evidence-panel.is-compact {
          border-top-color: var(--divider);
        }

        .work-list {
          display: flex;
          flex-direction: column;
        }

        .work-list-item {
          display: grid;
          grid-template-columns: minmax(150px, 0.9fr) minmax(220px, 1.45fr) minmax(128px, 0.8fr);
          gap: clamp(14px, 2.5vw, 28px);
          align-items: baseline;
          padding: 18px 0;
          border-bottom: 1px solid var(--divider);
          color: var(--text);
          font-family: var(--sans);
          font-size: var(--type-body);
          transition: color 180ms var(--ease-out), background 180ms var(--ease-out);
        }

        .work-list-item:last-child {
          border-bottom: none;
        }

        a.work-list-item:hover {
          color: var(--accent);
          background: var(--accent-soft);
        }

        a.work-list-item:hover .item-desc,
        a.work-list-item:hover .item-meta {
          color: var(--text);
        }

        .skills-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          border-top: 1px solid var(--text);
          border-left: 1px solid var(--divider);
        }

        .skill-item {
          min-height: 132px;
          padding: 18px;
          border-right: 1px solid var(--divider);
          border-bottom: 1px solid var(--divider);
          background: rgba(255, 255, 255, 0.28);
        }

        .item-main {
          font-family: var(--serif);
          font-size: var(--type-subhead);
          font-weight: 400;
          line-height: 1.05;
          color: var(--text);
        }

        .item-desc {
          color: color-mix(in srgb, var(--text) 70%, var(--muted));
          transition: color 180ms var(--ease-out);
        }

        .item-meta {
          font-family: var(--mono);
          font-size: var(--type-caption);
          line-height: 1.5;
          color: var(--muted);
          text-align: right;
          transition: color 180ms var(--ease-out);
        }

        .skill-item .item-desc {
          margin-top: 10px;
          line-height: 1.5;
        }

        .skill-item .item-meta {
          display: block;
          margin-top: 22px;
          text-align: left;
        }

        @media (max-width: 992px) {
          .about-section {
            grid-template-columns: 1fr;
            gap: 32px;
            margin-bottom: clamp(48px, 7vw, 64px);
          }

          .about-section-header {
            position: static;
          }

          .about-hero-grid {
            grid-template-columns: 1fr;
            gap: 24px;
          }

          .about-hero-aside {
            justify-items: start;
            text-align: left;
          }

          .card-desc {
            max-width: 58ch;
          }
        }

        @media (max-width: 760px) {
          .work-list-item {
            grid-template-columns: 1fr;
            gap: 7px;
            padding: 17px 0;
          }

          a.work-list-item:hover {
            padding-inline: 0;
            background: transparent;
          }

          .item-meta {
            text-align: left;
          }
        }

        @media (max-width: 640px) {
          /* gear-page mobile top padding is handled in global.css */

          .about-intro {
            margin-bottom: clamp(44px, 7vw, 64px);
          }

          .about-hero-title {
            font-size: var(--type-display-lg);
            line-height: 0.98;
          }

          .about-hero-copy,
          .card-desc,
          .work-list-item {
            font-size: var(--type-body);
          }

          .skills-grid {
            grid-template-columns: 1fr;
          }

          .skill-item {
            min-height: 0;
            padding: 16px 0;
            border-right: none;
            background: transparent;
          }
        }
      ` }} />
    </>
  );
}
