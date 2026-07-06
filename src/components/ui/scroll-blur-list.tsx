"use client";

import React, { useEffect, useRef } from "react";

/**
 * ScrollBlurList
 * Wraps children with a scroll-observer that blurs/dims
 * list items that are far from the viewport centre.
 *
 * Usage: wrap the <ul> (or any container) whose direct
 * children you want to apply the effect to.
 */
export default function ScrollBlurList({
  children,
  className,
  itemSelector = "li",
}: {
  children: React.ReactNode;
  className?: string;
  itemSelector?: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    // Respect user's motion preference
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Set transition once on all items (not on every scroll tick)
    const initItems = wrap.querySelectorAll<HTMLElement>(itemSelector);
    initItems.forEach((el) => {
      el.style.transition = "filter 0.18s ease, opacity 0.18s ease, transform 0.18s ease";
      el.style.willChange = "filter, opacity, transform";
    });

    const update = () => {
      const items = wrap.querySelectorAll<HTMLElement>(itemSelector);
      const vhMid = window.innerHeight / 2;

      items.forEach((el) => {
        const rect = el.getBoundingClientRect();
        const elMid = rect.top + rect.height / 2;

        // Distance from viewport centre, normalised 0-1
        const dist = Math.abs(elMid - vhMid);
        const norm = Math.min(dist / (window.innerHeight * 0.55), 1);

        const blur = norm * 3.5;          // max 3.5 px blur
        const opacity = 1 - norm * 0.55;  // min ~0.45 opacity
        const scale = 1 - norm * 0.015;   // subtle scale shrink

        el.style.filter = `blur(${blur.toFixed(2)}px)`;
        el.style.opacity = opacity.toFixed(3);
        el.style.transform = `scale(${scale.toFixed(4)})`;
      });
    };

    // Run immediately and on scroll
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });

    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [itemSelector]);

  return (
    <div ref={wrapRef} className={className}>
      {children}
    </div>
  );
}
