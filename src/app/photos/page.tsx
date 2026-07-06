import { getPhotoLocations } from "@/lib/cms";
import { PHOTO_GRID_SIZES, optimizePhoto } from "@/lib/photo-assets";
import AnimatedPageHeadline from "@/components/ui/animated-page-headline";
import { absoluteUrl, pageSchema, safeJsonLd } from "@/lib/seo";
import { Metadata } from "next";
import Link from "next/link";
import React from "react";

const photosTitle = "Photos | Phuc Loc Nguyen";
const photosDescription = "Photography archive by Phuc Loc Nguyen - travel, street, and landscape frames from around the world.";

export const metadata: Metadata = {
  title: "Photos",
  description: photosDescription,
};

export default async function Page() {
  const sourceLocations = await getPhotoLocations();
  const optimizedLocations = await Promise.all(
    sourceLocations.map(async (loc: any) => ({
      ...loc,
      photos: await Promise.all(
        loc.photos.map(async (photo: any) => {
          if (!photo.src.startsWith("/assets/photos/")) {
            return {
              ...photo,
              previewSrc: photo.src,
              previewSrcSet: "",
              webpSrcSet: "",
              previewSizes: PHOTO_GRID_SIZES,
              previewWidth: photo.w,
              previewHeight: photo.h,
              fullSrc: photo.src,
              fullWidth: photo.w,
              fullHeight: photo.h,
            };
          }

          return optimizePhoto(photo, {
            previewWidth: 720,
            previewWidths: [240, 400, 640, 960],
            previewSizes: PHOTO_GRID_SIZES,
            fullQuality: 78,
            withWebpFallback: true,
          });
        }),
      ),
    })),
  );

  const photosHeadline = "Places I've <em>wandered.</em>";

  const jsonLd = safeJsonLd(
    pageSchema({
      url: absoluteUrl("/photos"),
      title: photosTitle,
      description: photosDescription,
      type: "CollectionPage",
    })
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd }}
      />
      <main className="gear-page photos-page">
        <div className="gear-container">
          {/* PAGE HERO */}
          <section className="gear-hero photos-hero-copy" aria-label="Photos introduction">
            <div className="page-kicker-wrapper">
              <span className="page-kicker-text">My photos</span>
            </div>
            <AnimatedPageHeadline headline={photosHeadline} />
            <p className="gear-intro">
              Shot on whatever was in my pocket. These are the places that stayed with me.
            </p>
          </section>
        </div>

        {/* QUICK NAV */}
        <div id="photos-nav-sentinel"></div>
        <div className="photos-nav-wrapper">
          <div className="container">
            <nav className="photos-nav" aria-label="Locations navigation">
              <div className="photos-nav-list">
                {optimizedLocations.map((loc: any, i: number) => (
                  <a key={loc.slug} href={`#${loc.slug}`} className={`photos-nav-link ${i === 0 ? 'active' : ''}`}>
                    {loc.name} <span className="photos-nav-count">{loc.photos.length}</span>
                  </a>
                ))}
                <Link href="/gallery" className="photos-nav-link photos-nav-gallery-btn">
                  Gallery <span className="photos-gallery-icon" aria-hidden="true">↗</span>
                </Link>
              </div>
            </nav>
          </div>
        </div>

        {/* LOCATION SECTIONS */}
        {optimizedLocations.map((loc: any, locIdx: number) => (
          <section
            key={loc.slug}
            className="loc-section"
            id={loc.slug}
            aria-label={`Photos from ${loc.name}`}
          >
            <div className="container">
              {/* Location header */}
              <div className="loc-header">
                <div className="loc-meta">
                  <span className="loc-index">{String(locIdx + 1).padStart(2, '0')}</span>
                  <div>
                    <h2 className="loc-name">{loc.name}</h2>
                    <p className="loc-desc">{loc.description}</p>
                  </div>
                </div>
                <span className="loc-count">{loc.photos.length} photos</span>
              </div>
            </div>

            {/* Photo grid --- full-bleed inside container */}
            <div className="container">
              <div className="loc-grid" data-gallery={`gallery-${loc.slug}`} aria-label={`${loc.name} gallery`}>
                {loc.photos.map((photo: any, i: number) => (
                  <div
                    key={i}
                    className={`loc-photo-item ${photo.h > photo.w ? 'loc-photo-tall' : ''}`}
                    data-pswp-width={photo.fullWidth}
                    data-pswp-height={photo.fullHeight}
                    aria-label={photo.alt}
                    style={{ aspectRatio: `${photo.previewWidth} / ${photo.previewHeight}` }}
                  >
                    {photo.previewSrcSet ? (
                      <picture>
                        <source
                          type="image/avif"
                          srcSet={photo.previewSrcSet}
                          sizes={photo.previewSizes}
                        />
                        {photo.webpSrcSet && (
                          <source
                            type="image/webp"
                            srcSet={photo.webpSrcSet}
                            sizes={photo.previewSizes}
                          />
                        )}
                        <img
                          src={photo.previewSrc}
                          width={photo.previewWidth}
                          height={photo.previewHeight}
                          alt={photo.alt}
                          loading={locIdx === 0 && i < 3 ? "eager" : "lazy"}
                          decoding="async"
                          fetchPriority={locIdx === 0 && i === 0 ? "high" : "auto"}
                        />
                      </picture>
                    ) : (
                      <img
                        src={photo.previewSrc}
                        width={photo.previewWidth}
                        height={photo.previewHeight}
                        alt={photo.alt}
                        loading={locIdx === 0 && i < 3 ? "eager" : "lazy"}
                        decoding="async"
                        fetchPriority={locIdx === 0 && i === 0 ? "high" : "auto"}
                      />
                    )}
                    <div className="loc-photo-overlay" aria-hidden="true">
                      <span className="loc-photo-index">{String(i + 1).padStart(2, '0')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ))}
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        #photos-nav-sentinel {
          height: 1px;
          margin-bottom: -1px;
          pointer-events: none;
          opacity: 0;
        }

        .photos-nav-wrapper {
          position: relative;
          z-index: 50;
          background: transparent;
          padding: var(--space-lg) 0 0;
          margin-bottom: var(--section-header-gap);
          margin-top: -1px;
        }

        .photos-nav {
          border-bottom: 1px solid var(--divider);
          padding-bottom: 0;
        }

        .photos-nav-list {
          position: relative;
          display: flex;
          align-items: center;
          gap: 6px;
          list-style: none;
          margin: 0;
          padding: 0;
          overflow-x: auto;
          scrollbar-width: none;
          -webkit-overflow-scrolling: touch;
          cursor: grab;
        }

        .photos-nav-list:active { cursor: grabbing; }
        .photos-nav-list::-webkit-scrollbar { display: none; }

        .photos-nav-active-line {
          position: absolute;
          bottom: -1px;
          height: 2px;
          background: var(--text);
          pointer-events: none;
          z-index: 2;
          transition: left 0.3s cubic-bezier(0.25, 1, 0.5, 1),
                      width 0.3s cubic-bezier(0.25, 1, 0.5, 1);
        }

        .photos-nav-link {
          position: relative;
          z-index: 2;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 6px 14px;
          height: 36px;
          border-radius: var(--radius);
          font-size: var(--type-body);
          font-family: var(--sans);
          font-weight: 500;
          color: color-mix(in srgb, var(--text) 72%, var(--muted));
          text-decoration: none;
          white-space: nowrap;
          background: transparent;
          transition: color 0.2s ease;
          cursor: pointer;
          user-select: none;
        }

        .photos-nav-link.active {
          color: var(--text);
        }

        .photos-nav-link:hover {
          color: var(--accent);
        }

        .photos-nav-count {
          color: inherit;
          font-size: var(--type-caption);
          font-family: var(--mono, monospace);
          opacity: 0.55;
          transform: translateY(-30%);
          display: inline-block;
        }

        .photos-nav-gallery-btn {
          margin-left: 10px;
          color: color-mix(in srgb, var(--text) 68%, var(--muted));
        }

        .photos-gallery-icon {
          display: inline-block;
        }

        .loc-section {
          display: block;
          opacity: 1;
          padding: clamp(40px, 6vw, 64px) 0 var(--section-gap);
          scroll-margin-top: calc(var(--hdr-h) + 70px);
          content-visibility: visible;
        }

        .loc-section.active {
          display: block;
          opacity: 1;
        }

        .loc-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 24px;
          margin-bottom: 28px;
        }

        .loc-meta {
          display: flex;
          align-items: flex-start;
          gap: 16px;
        }

        .loc-index {
          font-family: var(--mono);
          font-size: var(--type-caption);
          color: var(--muted);
          letter-spacing: .08em;
          padding-top: 10px;
          flex-shrink: 0;
        }

        .loc-name {
          font-family: var(--serif);
          font-size: var(--type-display);
          font-weight: 400;
          line-height: 1.05;
          letter-spacing: -.025em;
          color: var(--text);
          margin-bottom: 8px;
        }

        .loc-desc {
          font-size: var(--type-body);
          color: color-mix(in srgb, var(--text) 70%, var(--muted));
          max-width: 380px;
          line-height: 1.6;
        }

        .loc-count {
          font-family: var(--mono);
          font-size: var(--type-caption);
          color: var(--muted);
          white-space: nowrap;
          flex-shrink: 0;
          padding-top: 6px;
          letter-spacing: .06em;
        }

        .loc-grid {
          column-count: 3;
          column-gap: 4px;
        }

        .loc-photo-item {
          display: block;
          position: relative;
          overflow: hidden;
          background: rgba(0, 0, 0, 0.05);
          margin-bottom: 4px;
          break-inside: avoid;
          transform: translateZ(0);
        }

        .loc-photo-item img {
          display: block;
          width: 100%;
          height: auto;
          backface-visibility: hidden;
        }

        .loc-photo-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(0,0,0,.3) 0%, transparent 55%);
          opacity: 0;
          transition: opacity .35s ease;
          pointer-events: none;
          display: flex;
          align-items: flex-end;
          padding: 12px 14px;
        }

        .loc-photo-item:hover .loc-photo-overlay {
          opacity: 1;
        }

        .loc-photo-index {
          font-family: var(--mono);
          font-size: var(--type-caption);
          color: rgba(255,255,255,.82);
          letter-spacing: .1em;
        }

        @media (max-width: 900px) {
          .loc-grid {
            column-count: 2;
          }
        }

        @media (max-width: 600px) {
          .loc-grid {
            column-count: 1;
          }
          .loc-photo-item {
            margin-bottom: 8px;
          }
          .loc-header {
            gap: 16px;
          }
        }
      ` }} />
    </>
  );
}
