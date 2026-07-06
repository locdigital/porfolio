"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

type ClickBlurGroupProps = {
  children: React.ReactNode;
  className?: string;
  itemSelector?: string;
};

export default function ClickBlurGroup({
  children,
  className,
  itemSelector = ".click-blur-item",
}: ClickBlurGroupProps) {
  const groupRef = useRef<HTMLDivElement>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;

    group.querySelectorAll<HTMLElement>(itemSelector).forEach((item, index) => {
      item.dataset.clickBlurSelected = hoveredIndex === index ? "true" : "false";
    });
  }, [itemSelector, hoveredIndex]);

  const updateHoveredItem = useCallback((target: EventTarget | null) => {
    const group = groupRef.current;
    if (!group || !(target instanceof Element)) return;

    const item = target.closest(itemSelector);
    if (!item || !group.contains(item)) {
      setHoveredIndex(null);
      return;
    }

    const items = Array.from(group.querySelectorAll(itemSelector));
    const nextIndex = items.indexOf(item);
    setHoveredIndex(nextIndex >= 0 ? nextIndex : null);
  }, [itemSelector]);

  return (
    <div
      ref={groupRef}
      className={["click-blur-group", className].filter(Boolean).join(" ")}
      data-click-blur-active={hoveredIndex !== null ? "true" : "false"}
      onPointerMove={(event) => updateHoveredItem(event.target)}
      onPointerLeave={() => setHoveredIndex(null)}
      onFocus={(event) => updateHoveredItem(event.target)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setHoveredIndex(null);
        }
      }}
    >
      {children}
    </div>
  );
}
