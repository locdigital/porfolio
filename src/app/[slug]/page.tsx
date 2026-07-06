import { getCollection } from "@/lib/content";
import { absoluteUrl, pageSchema, safeJsonLd, DEFAULT_DESCRIPTION } from "@/lib/seo";
import AnimatedPageHeadline from "@/components/ui/animated-page-headline";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import React from "react";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const pages = await getCollection("pages");
  const page = pages.find((entry) => entry.slug === slug);

  if (!page) {
    return {};
  }

  const pageTitle = `${page.data.title} | Phuc Loc Nguyen`;
  const pageDescription = page.data.metaDescription || page.data.description || DEFAULT_DESCRIPTION;

  return {
    title: pageTitle,
    description: pageDescription,
    openGraph: {
      title: pageTitle,
      description: pageDescription,
      images: page.data.coverImage ? [{ url: absoluteUrl(page.data.coverImage) }] : undefined,
    },
  };
}

export async function generateStaticParams() {
  const pages = await getCollection("pages");
  return pages.map((page) => ({
    slug: page.slug,
  }));
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  const pages = await getCollection("pages");
  const page = pages.find((entry) => entry.slug === slug);

  if (!page) {
    notFound();
  }

  const pageTitle = `${page.data.title} | Phuc Loc Nguyen`;
  const pageDescription = page.data.metaDescription || page.data.description || DEFAULT_DESCRIPTION;
  const pageUrl = absoluteUrl(`/${slug}`);

  const jsonLd = safeJsonLd(
    pageSchema({
      url: pageUrl,
      title: pageTitle,
      description: pageDescription,
      type: "WebPage",
    })
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd }}
      />
      <main className="cms-page">
        <article className="cms-page-inner">
          <header className="cms-page-header">
            <p className="cms-page-kicker">{page.data.title}</p>
            <AnimatedPageHeadline headline={page.data.headline || page.data.title} />
            {page.data.subheadline && <p className="cms-page-subtitle">{page.data.subheadline}</p>}
          </header>

          {page.data.coverImage && (
            <img className="cms-page-cover" src={page.data.coverImage} alt={page.data.title} loading="eager" decoding="async" />
          )}

          <div 
            className="cms-page-content"
            dangerouslySetInnerHTML={{ __html: page.body || '' }}
          />
        </article>
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        .cms-page {
          padding: var(--page-top) 0 var(--page-bottom);
        }

        .cms-page-inner {
          width: min(880px, calc(100% - 40px));
          margin: 0 auto;
        }

        .cms-page-header {
          margin-bottom: 48px;
        }

        .cms-page-kicker {
          font-family: var(--mono);
          font-size: var(--type-caption);
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--muted);
          margin-bottom: 16px;
        }

        .cms-page-header h1 {
          font-family: var(--serif);
          font-size: var(--type-page-title);
          font-weight: 400;
          line-height: 1.02;
          letter-spacing: 0;
          color: var(--text);
        }

        .cms-page-subtitle {
          max-width: 620px;
          margin-top: 20px;
          color: var(--muted);
          font-size: var(--type-body-lg);
          line-height: 1.7;
        }

        .cms-page-cover {
          width: 100%;
          aspect-ratio: 16 / 9;
          object-fit: cover;
          margin-bottom: 56px;
        }

        .cms-page-content {
          color: var(--text);
          font-size: var(--type-body);
          line-height: var(--leading-prose);
        }

        .cms-page-content p {
          margin-bottom: 1.4em;
        }

        .cms-page-content h2 {
          font-family: var(--serif);
          font-size: var(--type-section-title);
          font-weight: 400;
          line-height: 1.15;
          margin: 2em 0 0.7em;
        }
      `}} />
    </>
  );
}
