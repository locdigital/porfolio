'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';

interface TocItem {
  depth: number;
  id: string;
  text: string;
}

interface BlogPostViewProps {
  postTitle: string;
  postDescription: string;
  displayTitle: string;
  publishDate: string;
  tags: string[];
  readingMinutes: number;
  primaryCategory: string;
  featuredImage?: string;
  articleHtml: string;
  tocItems: TocItem[];
  authorName: string;
  authorAvatar: string;
}

export default function BlogPostView({
  postTitle,
  displayTitle,
  publishDate,
  tags,
  readingMinutes,
  primaryCategory,
  featuredImage,
  articleHtml,
  tocItems,
  authorName,
  authorAvatar,
}: BlogPostViewProps) {
  const [isReady, setIsReady] = useState(false);
  const [activeTocId, setActiveTocId] = useState(tocItems[0]?.id || '');
  const contentRef = useRef<HTMLDivElement | null>(null);

  const tocLabel = (value: string) => {
    return value.replace(/^\s*(?:\d+(?:\.\d+)*[.)]?\s+)+/, "").trim();
  };

  useEffect(() => {
    setIsReady(true);

    const content = contentRef.current;
    if (!content) return;

    const headings = Array.from(content.querySelectorAll("h2, h3")) as HTMLElement[];

    // Set headings IDs based on text slugification if not already present
    const used = new Map();
    const slugify = (value: string | null) => {
      const base = (value || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/&/g, " and ")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 72) || "section";
      const count = used.get(base) || 0;
      used.set(base, count + 1);
      return count === 0 ? base : `${base}-${count + 1}`;
    };

    headings.forEach((heading) => {
      if (!heading.id) heading.id = slugify(heading.textContent);
    });

    // Heading Intersection Observer for Table of Contents highlighting.
    if (headings.length > 0) {
      setActiveTocId(headings[0].id);

      const headingObserver = new IntersectionObserver(
        (entries) => {
          const visibleHeadings = entries
            .filter((entry) => entry.isIntersecting)
            .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

          if (visibleHeadings[0]?.target instanceof HTMLElement) {
            setActiveTocId(visibleHeadings[0].target.id);
          }
        },
        { rootMargin: "-18% 0px -66% 0px", threshold: 0 }
      );

      headings.forEach((heading) => headingObserver.observe(heading));

      return () => {
        headingObserver.disconnect();
      };
    }
  }, [tocItems]);

  useEffect(() => {
    // Setup reveal observers
    const content = contentRef.current;
    if (!content) return;

    const revealItems = Array.from(
      content.querySelectorAll("h2, h3, p, ul, ol, blockquote, img, table, pre")
    );

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      revealItems.forEach((item) => item.classList.add("in"));
      return;
    }

    revealItems.forEach((item, index) => {
      item.classList.add("article-content-reveal");
      (item as HTMLElement).style.transitionDelay = `${Math.min(index % 4, 3) * 55}ms`;
    });

    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("in");
          revealObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -42px 0px" }
    );

    revealItems.forEach((item) => revealObserver.observe(item));

    return () => {
      revealObserver.disconnect();
    };
  }, [articleHtml]);

  return (
    <main className={`blog-article-page ${isReady ? 'is-ready' : ''}`}>
      <div className="article-shell">
        <article className="article-main">
          <header className="article-hero">
            <div className="article-hero-copy">
              <Link href="/blog" className="article-back article-enter article-enter-1">
                <span aria-hidden="true">{"<"}</span> Back to Blog
              </Link>

              {publishDate && <p className="article-date article-enter article-enter-1">{publishDate}</p>}

              <h1 className="blog-article-title article-enter article-enter-2">{displayTitle}</h1>

              <p className="article-posted-by article-enter article-enter-3">Posted by</p>
              <div className="article-byline article-enter article-enter-3">
                <img src={authorAvatar} alt={authorName} loading="eager" decoding="async" />
                <p>
                  <strong>{authorName}</strong>
                  {publishDate && <span>{publishDate}</span>}
                </p>
              </div>
            </div>

            <div className={`article-cover article-enter article-enter-4 ${featuredImage ? "" : "article-cover-empty"}`}>
              {featuredImage ? (
                <img src={featuredImage} alt={postTitle} loading="eager" decoding="async" />
              ) : (
                <span>{primaryCategory}</span>
              )}
            </div>
          </header>

          <div className="article-body-grid">
            {tocItems.length > 0 && (
              <aside className="article-rail toki-r" data-d="1" aria-label="Article information">
                <div className="article-rail-inner">
                  <nav className="article-toc" aria-label="Table of contents">
                    <h2>On this page</h2>
                    <ol>
                      {tocItems.map((item) => (
                        <li className={`toc-depth-${item.depth}`} key={item.id}>
                          <a 
                            href={`#${item.id}`} 
                            className={activeTocId === item.id ? 'is-active' : ''}
                          >
                            {tocLabel(item.text)}
                          </a>
                        </li>
                      ))}
                    </ol>
                  </nav>
                </div>
              </aside>
            )}

            <div className="article-content-column">
              <div className="article-meta toki-r" data-d="2">
                <span>{readingMinutes} min read</span>
                {tags.length > 0 && (
                  <div className="article-tags">
                    {tags.map((tag: string) => (
                      <span key={tag}>#{tag.toLowerCase().replace(/\s+/g, "-")}</span>
                    ))}
                  </div>
                )}
              </div>

              <div 
                className="blog-article-content" 
                id="article-content" 
                ref={contentRef}
                dangerouslySetInnerHTML={{ __html: articleHtml }}
              />

              <div className="article-footer toki-r" data-d="2">
                <Link href="/blog" className="article-back-link">
                  <span aria-hidden="true">-</span> Back to writing
                </Link>
              </div>
            </div>
          </div>
        </article>
      </div>
    </main>
  );
}
