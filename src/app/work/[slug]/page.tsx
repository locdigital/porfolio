import { getProjects } from "@/lib/cms";
import { absoluteUrl, pageSchema, safeJsonLd } from "@/lib/seo";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ExternalLink } from "lucide-react";
import BlurFade from "@/components/ui/blur-fade";
import { Metadata } from "next";
import React from "react";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const projects = await getProjects();
  const project = projects.find((p) => p.slug === slug);

  if (!project) {
    return {};
  }

  return {
    title: `${project.title} | Phuc Loc Nguyen`,
    description: project.summary,
  };
}

export async function generateStaticParams() {
  const projects = await getProjects();
  return projects.map((p) => ({ slug: p.slug }));
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  const projects = await getProjects();
  const currentIndex = projects.findIndex((p) => p.slug === slug);

  if (currentIndex === -1) {
    notFound();
  }

  const project = projects[currentIndex];
  const prevProject = currentIndex > 0 ? projects[currentIndex - 1] : null;
  const nextProject = currentIndex < projects.length - 1 ? projects[currentIndex + 1] : null;

  const paragraphs = project.description.split("\n\n").filter(Boolean);
  const projectUrl = absoluteUrl(`/work/${project.slug}`);
  const projectLinkLabel = project.linkLabel?.replace(/\s*->\s*$/, "") ?? "Visit site";

  const creativeWorkSchema = {
    "@type": "CreativeWork",
    "@id": `${projectUrl}#case-study`,
    name: project.title,
    description: project.summary,
    ...(project.coverImage ? { image: absoluteUrl(project.coverImage) } : {}),
    url: projectUrl,
    dateCreated: project.year,
    creator: { "@id": `${absoluteUrl("/")}#person` },
    keywords: project.tags,
    mentions: {
      "@type": "Organization",
      name: project.client,
      url: project.link,
    },
  };

  const jsonLd = safeJsonLd([
    pageSchema({
      url: projectUrl,
      title: `${project.title} | Phuc Loc Nguyen`,
      description: project.summary,
      type: "WebPage",
    }),
    creativeWorkSchema,
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd }}
      />
      <main className="project-detail-page">
        <div className="container">

          {/* Back link */}
          <Link href="/work" className="back-link r">
            <ArrowLeft size={14} strokeWidth={1.8} aria-hidden="true" />
            All work
          </Link>

          {/* Project header */}
          <header className="detail-header">
            <div className="detail-header-top r">
              <span className="detail-number">{project.number}</span>
              <span className="detail-year">{project.year}</span>
            </div>

            <BlurFade>
              <h1 className="detail-title r" data-d="1">{project.title}</h1>
            </BlurFade>

            <div className="detail-meta r" data-d="2">
              <div className="meta-item">
                <span className="meta-label">Client</span>
                <span className="meta-value">{project.client}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Role</span>
                <span className="meta-value">{project.role}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Year</span>
                <span className="meta-value">{project.year}</span>
              </div>
            </div>
          </header>

          {project.coverImage && (
            /* Hero visual */
            <div className="detail-hero r" data-d="3">
              <div className="detail-hero-img">
                <div className="hero-logo-wrapper">
                  <img
                    src={project.coverImage}
                    alt={project.client}
                    className="hero-logo"
                    loading="eager"
                    decoding="async"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Content grid */}
          <div className="detail-content r" data-d="4">

            {/* Main body */}
            <div className="detail-body">
              <p className="detail-summary">{project.summary}</p>

              {paragraphs.map((para: string, idx: number) => (
                <p className="detail-para" key={idx}>{para}</p>
              ))}

              {project.link && (
                <a
                  href={project.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="detail-link"
                >
                  <span>{projectLinkLabel}</span>
                  <ExternalLink size={14} strokeWidth={1.8} aria-hidden="true" />
                </a>
              )}
            </div>

            {/* Sidebar */}
            <aside className="detail-sidebar">
              <div className="sidebar-block">
                <span className="sidebar-label">Tools / Skills</span>
                <ul className="sidebar-tags">
                  {project.tags.map((tag: string) => (
                    <li className="sidebar-tag" key={tag}>{tag}</li>
                  ))}
                </ul>
              </div>

              <div className="sidebar-block">
                <span className="sidebar-label">Client</span>
                <span className="sidebar-value">{project.client}</span>
              </div>

              <div className="sidebar-block">
                <span className="sidebar-label">Year</span>
                <span className="sidebar-value">{project.year}</span>
              </div>

              {project.link && (
                <div className="sidebar-block">
                  <span className="sidebar-label">Live</span>
                  <a
                    href={project.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="sidebar-link"
                  >
                    <span>{projectLinkLabel}</span>
                    <ExternalLink size={13} strokeWidth={1.8} aria-hidden="true" />
                  </a>
                </div>
              )}
            </aside>

          </div>

        </div>

        {/* Project navigation */}
        <nav className="project-nav" aria-label="Project navigation">
          <div className="container">
            <div className="project-nav-inner">
              {prevProject ? (
                <Link href={`/work/${prevProject.slug}`} className="pnav-item pnav-prev r">
                  <span className="pnav-dir"><ArrowLeft size={13} strokeWidth={1.8} aria-hidden="true" />Previous</span>
                  <span className="pnav-title">{prevProject.title}</span>
                </Link>
              ) : (
                <div></div>
              )}

              {nextProject ? (
                <Link href={`/work/${nextProject.slug}`} className="pnav-item pnav-next r" data-d="2">
                  <span className="pnav-dir">Next<ArrowRight size={13} strokeWidth={1.8} aria-hidden="true" /></span>
                  <span className="pnav-title">{nextProject.title}</span>
                </Link>
              ) : (
                <Link href="/work" className="pnav-item pnav-next r" data-d="2">
                  <span className="pnav-dir">Back to</span>
                  <span className="pnav-title">All Work</span>
                </Link>
              )}
            </div>
          </div>
        </nav>

      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        .project-detail-page {
          padding: var(--page-top) 0 0;
        }

        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: var(--type-ui);
          font-family: var(--mono);
          color: var(--muted);
          text-decoration: none;
          margin-bottom: var(--hero-gap);
          transition: color 0.25s ease, gap 0.25s ease;
        }

        .back-link:hover {
          color: var(--accent);
          gap: 12px;
        }

        .detail-header {
          margin-bottom: var(--hero-gap);
        }

        .detail-header-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
        }

        .detail-number {
          font-family: var(--mono);
          font-size: var(--type-caption);
          color: var(--muted);
          letter-spacing: 0.12em;
        }

        .detail-year {
          font-family: var(--mono);
          font-size: var(--type-caption);
          color: var(--muted);
          letter-spacing: 0.08em;
        }

        .detail-title {
          font-family: var(--serif);
          font-size: var(--fs-display);
          font-weight: 400;
          line-height: 1.1;
          letter-spacing: -0.02em;
          color: var(--text);
          margin-bottom: 40px;
          max-width: 790px;
        }

        .detail-meta {
          display: flex;
          gap: 48px;
          padding-top: 28px;
          border-top: 1px solid var(--divider);
        }

        .meta-item {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .meta-label {
          font-family: var(--mono);
          font-size: var(--type-micro);
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--muted);
        }

        .meta-value {
          font-size: var(--type-body);
          color: var(--text);
        }

        .detail-hero {
          margin-bottom: var(--section-gap);
        }

        .detail-hero-img {
          position: relative;
          aspect-ratio: 2 / 1;
          background: transparent;
          border-radius: var(--radius);
          overflow: hidden;
          border: 1px solid rgba(0, 0, 0, 0.06);
        }

        .hero-logo-wrapper {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
        }

        .hero-logo {
          width: 100%;
          height: 100%;
          object-fit: contain;
          border-radius: var(--radius);
        }

        .detail-content {
          display: grid;
          grid-template-columns: 1fr 280px;
          gap: 80px;
          margin-bottom: 0;
          padding-bottom: var(--section-gap);
          border-bottom: 1px solid var(--divider);
        }

        .detail-summary {
          font-family: var(--serif);
          font-size: var(--type-subhead);
          font-weight: 400;
          line-height: 1.55;
          color: var(--text);
          margin-bottom: 36px;
          letter-spacing: -0.01em;
        }

        .detail-para {
          font-size: var(--type-body);
          line-height: 1.78;
          color: var(--muted);
          margin-bottom: 20px;
        }

        .detail-link {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          margin-top: 12px;
          font-size: var(--type-body);
          font-weight: 500;
          color: var(--text);
          text-decoration: underline;
          text-underline-offset: 4px;
          text-decoration-thickness: 1px;
          text-decoration-color: var(--divider);
          transition: color 0.25s ease, text-decoration-color 0.25s ease;
        }

        .detail-link:hover {
          color: var(--accent);
          text-decoration-color: var(--accent);
        }

        .detail-sidebar {
          display: flex;
          flex-direction: column;
          gap: 32px;
          padding-top: 8px;
        }

        .sidebar-block {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .sidebar-label {
          font-family: var(--mono);
          font-size: var(--type-micro);
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--muted);
        }

        .sidebar-tags {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .sidebar-tag {
          font-size: var(--type-ui);
          color: var(--text);
          list-style: none;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .sidebar-tag::before {
          content: "";
          width: 4px;
          height: 4px;
          border-radius: var(--radius);
          background: var(--muted);
          flex-shrink: 0;
        }

        .sidebar-value {
          font-size: var(--type-body);
          color: var(--text);
        }

        .sidebar-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: var(--type-ui);
          color: var(--muted);
          text-decoration: underline;
          text-underline-offset: 3px;
          transition: color 0.25s ease;
        }

        .sidebar-link:hover {
          color: var(--accent);
        }

        .project-nav {
          border-top: 1px solid var(--divider);
          padding: 0;
        }

        .project-nav-inner {
          display: grid;
          grid-template-columns: 1fr 1fr;
        }

        .pnav-item {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 48px 0;
          text-decoration: none;
          color: var(--text);
          transition: color 0.25s ease;
          border-right: 1px solid var(--divider);
        }

        .pnav-next {
          border-right: none;
          text-align: right;
          align-items: flex-end;
          padding-left: 40px;
        }

        .pnav-prev {
          padding-right: 40px;
        }

        .pnav-dir {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          font-family: var(--mono);
          font-size: var(--type-caption);
          color: var(--muted);
          letter-spacing: 0.08em;
          transition: color 0.25s ease;
        }

        .pnav-title {
          font-family: var(--serif);
          font-size: var(--type-subhead);
          font-weight: 400;
          line-height: 1.25;
          transition: color 0.25s ease;
        }

        .pnav-item:hover .pnav-title {
          color: var(--accent);
        }

        .pnav-item:hover .pnav-dir {
          color: var(--text);
        }

        @media (max-width: 900px) {
          .detail-content {
            grid-template-columns: 1fr;
            gap: 48px;
          }

          .detail-sidebar {
            flex-direction: row;
            flex-wrap: wrap;
            gap: 24px;
            padding-top: 0;
            border-top: 1px solid var(--divider);
            padding-top: 32px;
          }

          .detail-meta {
            flex-wrap: wrap;
            gap: 24px;
          }
        }

        @media (max-width: 600px) {
          .project-nav-inner {
            grid-template-columns: 1fr;
          }

          .pnav-item {
            border-right: none;
            border-bottom: 1px solid var(--divider);
            padding: 32px 0;
          }

          .pnav-next {
            padding-left: 0;
            text-align: left;
            align-items: flex-start;
          }

          .pnav-item:last-child {
            border-bottom: none;
          }
        }
      `}} />
    </>
  );
}
