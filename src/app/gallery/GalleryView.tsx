'use client';

import React, { useState, useEffect, useRef } from 'react';
import { OptimizedPhoto } from '@/lib/photo-assets';

interface GalleryViewProps {
  photos: OptimizedPhoto[];
}

export default function GalleryView({ photos }: GalleryViewProps) {
  const [cols, setCols] = useState(6);
  const [visibleCount, setVisibleCount] = useState(15);
  const triggerRef = useRef<HTMLDivElement | null>(null);

  const getNumCols = () => {
    if (typeof window === 'undefined') return 6;
    const w = window.innerWidth;
    if (w < 600) return 2;
    if (w < 900) return 3;
    if (w < 1200) return 4;
    return 6;
  };

  // Setup resize listeners to adjust column count
  useEffect(() => {
    setCols(getNumCols());

    let resizeTimer: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        setCols(getNumCols());
      }, 250);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Setup infinite scroll observer
  useEffect(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && visibleCount < photos.length) {
        setVisibleCount((prev) => Math.min(prev + 15, photos.length));
      }
    }, { rootMargin: '800px' });

    observer.observe(trigger);
    return () => {
      observer.unobserve(trigger);
    };
  }, [visibleCount, photos.length]);

  // Distribute items into columns based on cumulative aspect ratios (logical heights)
  const columns: OptimizedPhoto[][] = Array.from({ length: cols }, () => []);
  const colHeights = Array(cols).fill(0);

  const activePhotos = photos.slice(0, visibleCount);

  activePhotos.forEach((photo) => {
    let shortestColIndex = 0;
    for (let j = 1; j < cols; j++) {
      if (colHeights[j] < colHeights[shortestColIndex]) {
        shortestColIndex = j;
      }
    }

    columns[shortestColIndex].push(photo);
    const pw = photo.previewWidth || photo.w || 1280;
    const ph = photo.previewHeight || photo.h || 853;
    colHeights[shortestColIndex] += ph / pw;
  });

  return (
    <main className="gallery-page">
      <div id="gallery-grid" className="gallery-grid">
        {columns.map((colItems, colIdx) => (
          <div key={colIdx} className="gallery-col">
            {colItems.map((photo) => {
              const pw = photo.previewWidth || photo.w || 1280;
              const ph = photo.previewHeight || photo.h || 853;
              const pb = ((ph / pw) * 100).toFixed(3) + '%';

              return (
                <div key={photo.src} className="gal-item">
                  <div className="ratio-box" style={{ paddingBottom: pb }}>
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
                          width={pw}
                          height={ph}
                          alt={photo.alt}
                          loading="lazy"
                          decoding="async"
                        />
                      </picture>
                    ) : (
                      <img
                        src={photo.previewSrc}
                        width={pw}
                        height={ph}
                        alt={photo.alt}
                        loading="lazy"
                        decoding="async"
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div ref={triggerRef} id="loading-trigger" style={{ height: '1px', width: '100%' }}></div>

      <style jsx global>{`
        .gallery-page {
          min-height: 100vh;
          background: transparent;
          padding: 8px;
          padding-top: var(--page-top-mobile);
          width: 100%;
          margin: 0;
        }

        .gallery-grid {
          display: flex;
          gap: 3px;
          width: 100%;
          align-items: flex-start;
        }

        .gallery-col {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .gal-item {
          width: 100%;
          overflow: hidden;
          border-radius: var(--radius);
          background: #ddd;
        }

        .gal-item .ratio-box {
          position: relative;
          width: 100%;
          height: 0;
          overflow: hidden;
        }

        .gal-item .ratio-box img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        .gal-item:hover .ratio-box img {
          transform: scale(1.04);
        }
      `}</style>
    </main>
  );
}
