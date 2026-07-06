'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

export default function LayoutController() {
  const pathname = usePathname();

  useEffect(() => {
    // Force scroll to top on path changes
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);

    const reduced = true;

    // ── Favicon visibility sync ──
    const syncFavicon = () => {
      const favicon = document.getElementById("dynamic-favicon") as HTMLLinkElement | null;
      if (favicon) {
        favicon.href = document.hidden || !document.hasFocus()
          ? "/favicon-inactive.svg"
          : "/favicon-active.svg";
      }
    };
    document.addEventListener("visibilitychange", syncFavicon);
    window.addEventListener("focus", syncFavicon);
    window.addEventListener("blur", syncFavicon);
    syncFavicon();

    // ── 1. Image Loading Shimmer & Fallback Loader ──
    const fallbackImageSrc = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800" role="img" aria-label="Image unavailable">
        <defs>
          <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#0A0B10"/>
            <stop offset="1" stop-color="#131420"/>
          </linearGradient>
          <pattern id="grid" width="56" height="56" patternUnits="userSpaceOnUse">
            <path d="M56 0H0v56" fill="none" stroke="#1e1f2e" strokeWidth="1"/>
          </pattern>
        </defs>
        <rect width="1200" height="800" fill="url(#bg)"/>
        <rect width="1200" height="800" fill="url(#grid)" opacity=".7"/>
        <g transform="translate(600 400)" text-anchor="middle">
          <rect x="-170" y="-118" width="340" height="236" rx="8" fill="#13141f" strokeWidth="2"/>
          <circle cx="-64" cy="-42" r="30" fill="#097fe8"/>
          <path d="M-130 78 2-42l58 58 42-38 88 100z" fill="#2196f3"/>
          <text y="190" fill="#7A7D8C" font-family="Arial, Helvetica, sans-serif" font-size="38" font-weight="700" letter-spacing="2">IMAGE UNAVAILABLE</text>
        </g>
      </svg>
    `);

    function setupImageLoaders() {
      const setupImage = (img: HTMLImageElement) => {
        if (img.dataset.loaderSetup) return;
        img.dataset.loaderSetup = 'true';

        const wrapper = img.closest('picture') || 
                        img.closest('.ratio-box') || 
                        img.closest('.loc-photo-item') || 
                        img.closest('.project-card-img') || 
                        img.closest('.tl-logo') || 
                        img.closest('.gallery-item') || 
                        img.parentElement;

        const showFallbackImage = () => {
          if (img.dataset.fallbackApplied === 'true') return;
          img.dataset.fallbackApplied = 'true';
          img.src = fallbackImageSrc;
          img.classList.add('loaded');
          img.classList.remove('skeleton-loading-img');
          if (wrapper) {
            wrapper.classList.remove('skeleton-loading');
          }
        };

        img.addEventListener('error', showFallbackImage, { once: true });

        if (img.closest('.draggable-collage-container') || img.closest('.mobile-about-panel')) return;

        if (img.complete && img.naturalWidth > 0) {
          img.classList.add('loaded');
        } else if (img.complete && img.naturalWidth === 0) {
          showFallbackImage();
        } else {
          if (wrapper) {
            wrapper.classList.add('skeleton-loading');
          }
          img.classList.add('skeleton-loading-img');

          const handleLoad = () => {
            img.classList.add('loaded');
            if (wrapper) {
              wrapper.classList.remove('skeleton-loading');
            }
            img.removeEventListener('load', handleLoad);
          };

          img.addEventListener('load', handleLoad);
        }
      };

      document.querySelectorAll('img').forEach((img) => setupImage(img as HTMLImageElement));

      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const el = node as HTMLElement;
              if (el.tagName === 'IMG') {
                setupImage(el as HTMLImageElement);
              } else {
                el.querySelectorAll('img').forEach((img) => setupImage(img as HTMLImageElement));
              }
            }
          });
        });
      });

      observer.observe(document.body, { childList: true, subtree: true });
      return observer;
    }

    const imageObserver = setupImageLoaders();

    document.body.classList.add('ready');

    // ── 2. Reveal classes ──
    function setupOrderedCardAnimations() {
      const cards = Array.from(document.querySelectorAll('.animated-card')) as HTMLElement[];
      if (!cards.length) return;

      cards.forEach((card) => card.classList.add('card-in'));
    }

    setupOrderedCardAnimations();
    const cardMutationObserver = new MutationObserver((mutations) => {
      const hasAnimatedCardChange = mutations.some((mutation) =>
        Array.from(mutation.addedNodes).some((node) =>
          node.nodeType === Node.ELEMENT_NODE &&
          ((node as HTMLElement).classList?.contains('animated-card') || (node as HTMLElement).querySelector?.('.animated-card'))
        )
      );

      if (hasAnimatedCardChange) {
        setupOrderedCardAnimations();
      }
    });
    cardMutationObserver.observe(document.body, { childList: true, subtree: true });

    document.getElementById('site-header')?.classList.add('in');

    const heroLines = document.querySelectorAll('.hero-line');
    heroLines.forEach((line) => line.classList.add('in'));

    document.querySelector('.hero-aside')?.classList.add('in');

    // ── 3. Reveal content immediately ──
    document.querySelectorAll('.r, .toki-r').forEach((el) => el.classList.add('in'));

    const AUTO_REVEAL_SELECTORS = [
      'main section',
      'main article',
      'main h1:not(.hero-line)',
      'main h2',
      'main h3',
      'main p:not(.hero-line)',
      'main figure',
      'main picture',
      'main blockquote',
      'main .card',
      'main .gear-section',
      'main .gear-item',
      'main .timeline-row',
      'main .project-row',
      'main .writing-row',
      'main .sh',
      'main .about-layout',
      'main .about-photo',
      'main table',
    ].join(', ');

    document.querySelectorAll(AUTO_REVEAL_SELECTORS).forEach((el) => {
      if (
        el.classList.contains('r') ||
        el.classList.contains('toki-r') ||
        el.classList.contains('reveal') ||
        el.classList.contains('gear-intro') ||
        el.closest('.gear-page') ||
        el.closest('.hero') ||
        el.closest('.hero-title') ||
        el.classList.contains('hero-line') ||
        el.classList.contains('hero-aside')
      ) return;

      el.classList.add('reveal', 'in');
    });

    document.querySelectorAll('.reveal-group').forEach((group) => {
      Array.from(group.children).forEach((child) => {
        child.classList.add('reveal', 'in');
      });
    });

    // ── 4. Header & Back to Top Sentinels ──
    const header = document.getElementById('site-header');
    const backToTop = document.getElementById('back-to-top');

    document.querySelectorAll('.viewport-sentinel').forEach((node) => node.remove());

    const headerSentinel = document.createElement('span');
    headerSentinel.setAttribute('aria-hidden', 'true');
    headerSentinel.className = 'viewport-sentinel viewport-sentinel--header';
    document.body.prepend(headerSentinel);

    const headerObserver = new IntersectionObserver(([entry]) => {
      header?.classList.toggle('is-scrolled', !entry.isIntersecting);
    }, { threshold: 0 });
    headerObserver.observe(headerSentinel);

    const topSentinel = document.createElement('span');
    topSentinel.setAttribute('aria-hidden', 'true');
    topSentinel.className = 'viewport-sentinel viewport-sentinel--top';
    document.body.prepend(topSentinel);

    const backToTopObserver = new IntersectionObserver(([entry]) => {
      backToTop?.classList.toggle('is-visible', !entry.isIntersecting);
    }, { threshold: 0, rootMargin: '-72% 0px 0px 0px' });
    backToTopObserver.observe(topSentinel);

    // Back to top click
    const handleBackToTop = () => {
      window.scrollTo({
        top: 0,
        behavior: reduced ? 'auto' : 'smooth',
      });
    };
    backToTop?.addEventListener('click', handleBackToTop);

    // ── 5. Hamburger & Mobile Menu ──
    const hamburger = document.getElementById('hamburger');
    const mobileMenu = document.getElementById('mobile-menu');
    const backdrop = document.getElementById('mobile-backdrop');
    let menuOpen = false;
    let lockScrollY = 0;

    function toggleMenu() {
      menuOpen = !menuOpen;
      if (hamburger) {
        hamburger.setAttribute('aria-expanded', String(menuOpen));
        hamburger.classList.toggle('is-open', menuOpen);
      }
      if (mobileMenu) {
        mobileMenu.classList.toggle('is-open', menuOpen);
        mobileMenu.setAttribute('aria-hidden', String(!menuOpen));
      }
      if (backdrop) backdrop.classList.toggle('is-open', menuOpen);

      if (menuOpen) {
        lockScrollY = window.scrollY;
        document.body.style.cssText = `position:fixed;top:-${lockScrollY}px;width:100%;`;
      } else {
        document.body.style.cssText = '';
        window.scrollTo(0, lockScrollY);
      }
    }

    hamburger?.addEventListener('click', toggleMenu);
    backdrop?.addEventListener('click', () => menuOpen && toggleMenu());
    mobileMenu?.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => menuOpen && toggleMenu()));

    const onKeyDown = (e: KeyboardEvent) => e.key === 'Escape' && menuOpen && toggleMenu();
    document.addEventListener('keydown', onKeyDown);

    // ── 6. Anchor links ──
    const handleAnchorClick = (e: Event) => {
      const a = e.currentTarget as HTMLAnchorElement;
      const href = a.getAttribute('href') || '';
      const isHomePage = window.location.pathname === '/';
      if (href.startsWith('/#') && !isHomePage) return;

      const targetId = href.startsWith('/#') ? href.slice(1) : href;
      const targetElement = document.querySelector(targetId);
      if (!targetElement) return;

      e.preventDefault();
      window.scrollTo({
        top: targetElement.getBoundingClientRect().top + window.scrollY - 56,
        behavior: reduced ? 'auto' : 'smooth',
      });
      if (menuOpen) toggleMenu();
    };

    document.querySelectorAll('a[href^="#"], a[href^="/#"]').forEach((a) => {
      a.addEventListener('click', handleAnchorClick);
    });

    // ── 7. Email copy ──
    const copyBtn = document.getElementById('copy-email');
    const handleCopyEmail = async () => {
      try {
        await navigator.clipboard?.writeText('hi@loc.digital');
      } catch {}
      if (copyBtn) {
        copyBtn.dataset.tip = 'Copied!';
        copyBtn.classList.add('copied');
        setTimeout(() => {
          copyBtn.classList.remove('copied');
          copyBtn.dataset.tip = 'Copy';
        }, 2200);
      }
    };
    copyBtn?.addEventListener('click', handleCopyEmail);

    // Cleanup function
    return () => {
      document.removeEventListener("visibilitychange", syncFavicon);
      window.removeEventListener("focus", syncFavicon);
      window.removeEventListener("blur", syncFavicon);
      imageObserver.disconnect();
      cardMutationObserver.disconnect();
      headerObserver.disconnect();
      backToTopObserver.disconnect();
      document.removeEventListener('keydown', onKeyDown);
      backToTop?.removeEventListener('click', handleBackToTop);
      hamburger?.removeEventListener('click', toggleMenu);
      copyBtn?.removeEventListener('click', handleCopyEmail);
      document.querySelectorAll('a[href^="#"], a[href^="/#"]').forEach((a) => {
        a.removeEventListener('click', handleAnchorClick);
      });
    };
  }, [pathname]);

  return null;
}
