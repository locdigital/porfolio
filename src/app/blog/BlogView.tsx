'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import AnimatedPageHeadline from "@/components/ui/animated-page-headline";

interface PostData {
  title: string;
  headline: string;
  summary?: string;
  keyword?: string;
  metaDescription?: string;
  coverImage?: string;
  publishedAt: string | null;
  tags?: string[];
}

interface Post {
  slug: string;
  data: PostData;
}

interface BlogViewProps {
  posts: Post[];
}

export default function BlogView({ posts }: BlogViewProps) {
  const fallbackPreviewImage = "/og-image.jpg";

  const previewImageFor = (image?: string) => {
    if (!image) return fallbackPreviewImage;
    if (/^https?:\/\//i.test(image)) return image;
    return image.startsWith("/") ? image : `/${image}`;
  };

  // Hover states
  const [activeLink, setActiveLink] = useState<{
    image: string;
    title: string;
    summary: string;
    date: string;
  } | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isLeft, setIsLeft] = useState(false);

  const previewRef = useRef<HTMLDivElement | null>(null);
  const hideTimerRef = useRef<number | null>(null);

  // Track visibility in a ref so the rAF loop always reads the latest value
  // (avoids stale closure where the loop captures the old isVisible=false)
  const isVisibleRef = useRef(false);

  // Position updates
  const targetPos = useRef({ x: 0, y: 0 });
  const currentPos = useRef({ x: 0, y: 0 });
  const showPreview = (
    post: Post,
    clientX: number,
    clientY: number
  ) => {
    if (hideTimerRef.current) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }

    const dateStr = post.data.publishedAt ? new Date(post.data.publishedAt).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    }) : '';

    const previewImage = previewImageFor(post.data.coverImage);
    const previewSummary = post.data.summary || post.data.metaDescription || "Open this note";

    setActiveLink({
      image: previewImage,
      title: post.data.headline,
      summary: previewSummary,
      date: dateStr,
    });

    targetPos.current = { x: clientX, y: clientY };

    if (!isVisibleRef.current) {
      currentPos.current = { x: clientX, y: clientY };
      if (previewRef.current) {
        previewRef.current.style.transform = `translate3d(${clientX}px, ${clientY}px, 0)`;
      }
      isVisibleRef.current = true;
      setIsVisible(true);
    }

    const shouldFlip = clientX + 330 + 44 > window.innerWidth;
    setIsLeft(shouldFlip);

  };

  const hidePreview = () => {
    hideTimerRef.current = window.setTimeout(() => {
      isVisibleRef.current = false;
      setIsVisible(false);
    }, 90);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isVisible) return;
    targetPos.current = { x: e.clientX, y: e.clientY };
    currentPos.current = targetPos.current;
    if (previewRef.current) {
      previewRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
    }

    const shouldFlip = e.clientX + 330 + 44 > window.innerWidth;
    setIsLeft(shouldFlip);
  };

  useEffect(() => {
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  return (
    <main className="gear-page">
      <div className="gear-container">
        {/* PAGE HERO */}
        <section className="gear-hero blog-hero about-reveal-hero toki-r" data-d="1" aria-label="Writing">
          <div className="page-kicker-wrapper">
            <span className="page-kicker-text">Writing</span>
          </div>
          <AnimatedPageHeadline
            className="hero-title hero-title--animated"
            headline={"Notes on <em>marketing</em>, code & growth."}
          />
          <p className="gear-intro">
            A collection of thoughts, tutorials, and reflections on marketing, code, and life.
          </p>
        </section>

        {posts.length > 0 ? (
          <div className="blog-posts-list">
            {posts.map((post, i) => {
              const dateStr = post.data.publishedAt ? new Date(post.data.publishedAt).toLocaleDateString('en-US', { 
                month: 'short', 
                year: 'numeric' 
              }) : '';
              
              return (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`} 
                  className="blog-post-link group toki-r"
                  data-d={String(i + 2)}
                  onPointerEnter={(e) => showPreview(post, e.clientX, e.clientY)}
                  onPointerMove={handlePointerMove}
                  onPointerLeave={hidePreview}
                  onFocus={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    showPreview(post, rect.right - 28, rect.top + rect.height / 2);
                  }}
                  onBlur={hidePreview}
                >
                  <div className="blog-post-date">
                    {dateStr}
                  </div>
                  <div className="blog-post-copy">
                    <h2 className="blog-post-headline">{post.data.headline}</h2>
                    <div className="blog-post-summary">{post.data.summary}</div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="py-10 text-[var(--muted)]">
            <p>New writing is coming soon.</p>
          </div>
        )}

        {/* Hover preview box */}
        {activeLink && (
          <div 
            ref={previewRef} 
            className={`post-hover-preview ${isVisible ? 'is-visible' : ''} ${isLeft ? 'is-left' : ''}`}
            aria-hidden="true"
          >
            <div className="post-hover-preview__inner">
              <div className="post-hover-preview__image-wrap">
                <img
                  src={activeLink.image}
                  alt=""
                  decoding="async"
                  loading="lazy"
                  width="330"
                  height="206"
                />
              </div>
              <div className="post-hover-preview__body">
                <span className="post-hover-preview__date">{activeLink.date}</span>
                <strong className="post-hover-preview__title">{activeLink.title}</strong>
                <span className="post-hover-preview__summary">{activeLink.summary}</span>
              </div>
            </div>
          </div>
        )}

      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        /* gear-page and gear-container are defined in global.css */

        /* Blog hero: full width, tighter bottom gap than default */
        .gear-page .gear-hero.blog-hero {
          max-width: none;
          margin-bottom: var(--hero-gap);
        }

        .gear-page .gear-hero.blog-hero h1 {
          text-wrap: balance;
        }

        .blog-posts-list {
          display: flex;
          flex-direction: column;
          gap: 0;
          max-width: 980px;
        }

        .blog-post-link {
          display: flex;
          flex-direction: column;
          position: relative;
          padding: 26px 0 30px;
          border-top: 1px solid rgba(28, 28, 28, 0.1);
          transition:
            opacity 220ms var(--ease-out),
            transform 220ms var(--ease-out);
          text-decoration: none;
        }

        .blog-post-link:last-child {
          border-bottom: 1px solid rgba(28, 28, 28, 0.1);
        }

        .blog-post-link:hover,
        .blog-post-link:focus-visible {
          opacity: 0.82;
          transform: translateX(4px);
        }

        .blog-post-date {
          flex-shrink: 0;
          margin-bottom: 8px;
          padding-top: 9px;
          font-family: var(--mono);
          font-size: var(--type-caption);
          letter-spacing: 0.08em;
          line-height: 1.2;
          text-transform: uppercase;
          color: var(--muted);
        }

        .blog-post-copy {
          flex-grow: 1;
          max-width: 74ch;
        }

        .blog-post-headline {
          font-family: var(--sans);
          margin-bottom: 10px;
          font-size: var(--type-section-title);
          font-weight: 400;
          letter-spacing: -0.02em;
          line-height: 1.1;
          color: var(--text);
          text-wrap: balance;
        }

        .blog-post-summary {
          display: -webkit-box;
          overflow: hidden;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 2;
          font-family: var(--sans);
          font-size: var(--type-body);
          line-height: 1.55;
          color: var(--muted);
          text-wrap: pretty;
        }

        .post-hover-preview {
          position: fixed;
          top: 0;
          left: 0;
          z-index: 80;
          width: min(330px, calc(100vw - 40px));
          pointer-events: none;
          will-change: transform;
          opacity: 0;
          transition: opacity 160ms var(--ease-out);
        }

        .post-hover-preview.is-visible {
          opacity: 1;
        }

        .post-hover-preview__inner {
          width: 100%;
          opacity: 0;
          transform:
            translate3d(24px, -52%, 0)
            scale(0.92)
            rotate(-1.5deg);
          transform-origin: 20% 50%;
          transition:
            opacity 160ms var(--ease-out),
            transform 360ms var(--spring);
          will-change: transform, opacity;
        }

        .post-hover-preview.is-visible .post-hover-preview__inner {
          opacity: 1;
          transform:
            translate3d(24px, -52%, 0)
            scale(1)
            rotate(-1.5deg);
        }

        .post-hover-preview.is-left .post-hover-preview__inner {
          transform-origin: 80% 50%;
          transform:
            translate3d(-354px, -52%, 0)
            scale(1)
            rotate(1.5deg);
        }

        .post-hover-preview__image-wrap {
          position: relative;
          aspect-ratio: 16 / 10;
          overflow: hidden;
          border-radius: var(--radius);
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.05);
          box-shadow:
            0 24px 70px rgba(0, 0, 0, 0.5),
            0 3px 10px rgba(0, 0, 0, 0.3);
        }

        .post-hover-preview__image-wrap::after {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: var(--radius);
          background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.18), rgba(255, 255, 255, 0) 34%),
            linear-gradient(0deg, rgba(28, 28, 28, 0.1), rgba(28, 28, 28, 0));
          pointer-events: none;
        }

        .post-hover-preview img {
          width: 100%;
          height: 100%;
          border-radius: var(--radius);
          object-fit: cover;
          transform: scale(1.035);
          transition: transform 500ms var(--ease-out);
        }

        .post-hover-preview.is-visible img {
          transform: scale(1);
        }

        .post-hover-preview__body {
          position: relative;
          margin: -28px 16px 0;
          padding: 14px 14px 13px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: var(--radius);
          background: rgba(10, 11, 16, 0.88);
          backdrop-filter: blur(14px) saturate(140%);
          -webkit-backdrop-filter: blur(14px) saturate(140%);
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.45);
        }

        .post-hover-preview__date {
          display: block;
          margin-bottom: 5px;
          font-family: var(--mono);
          font-size: var(--type-micro);
          letter-spacing: 0.08em;
          line-height: 1.2;
          text-transform: uppercase;
          color: var(--accent-solid);
        }

        .post-hover-preview__title {
          display: block;
          overflow: hidden;
          font-family: var(--sans);
          font-size: var(--type-body);
          font-weight: 700;
          line-height: 1.25;
          color: var(--text);
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .post-hover-preview__summary {
          display: -webkit-box;
          overflow: hidden;
          margin-top: 4px;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 2;
          font-size: var(--type-caption);
          line-height: 1.45;
          color: var(--muted);
        }

        @media (min-width: 768px) {
          .blog-post-link {
            flex-direction: row;
            align-items: flex-start;
            gap: clamp(40px, 6vw, 72px);
          }

          .blog-post-date {
            width: 120px;
            margin-bottom: 0;
          }
        }

        @media (max-width: 767px), (hover: none), (pointer: coarse) {
          .post-hover-preview {
            display: none;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .blog-post-link,
          .post-hover-preview,
          .post-hover-preview__inner,
          .post-hover-preview img {
            transition: none;
          }
        }

        @media (max-width: 620px) {
          /* gear-page mobile padding handled in global.css */

          .gear-page .gear-hero.blog-hero {
            margin-bottom: clamp(28px, 5vw, 40px);
          }

          .blog-post-link {
            padding: 21px 0 25px;
          }
        }
      ` }} />
    </main>
  );
}
