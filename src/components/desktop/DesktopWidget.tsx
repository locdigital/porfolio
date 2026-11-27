import React, { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Maximize2, Camera } from "lucide-react";
import type { AppId } from "../dock/dock.config";
import { SpotifyDesktopPlayer } from "./SpotifyDesktopPlayer";
import { NetflixDesktopWidget } from "./NetflixDesktopWidget";
import { PhotosDesktopWidget } from "./PhotosDesktopWidget";
import { NIKON_RECIPES } from "../../data/nikon-recipes";

interface DesktopWidgetProps {
  id: AppId;
  title: string;
  zIndex: number;
  index: number;
  /** Pin Mode column slot (0 = top). When set, a plain click moves the app to the centre. */
  slot?: number;
  onFocus: () => void;
  onUnpin: () => void;
  onClose: () => void;
}

function getWidgetSlotPos(id: AppId, index: number, measuredWidth?: number, slot?: number) {
  const gap = 16;
  if (typeof window === "undefined") return { x: gap, y: gap };
  const width = measuredWidth ?? Math.min(480, window.innerWidth - 32);
  const slotH = Math.max(210, (window.innerHeight - gap * 4) / 3);
  const x = Math.max(gap, window.innerWidth - gap - width);

  let y = gap;
  if (slot !== undefined && slot >= 0) {
    y = gap + (slotH + gap) * Math.min(slot, 2);
  } else if (id === "netflix") {
    y = gap;
  } else if (id === "spotify") {
    y = gap + slotH + gap;
  } else if (id === "photos" || id === "workspace") {
    y = gap + (slotH + gap) * 2;
  } else {
    const size = 320;
    const rows = Math.max(1, Math.floor((window.innerHeight - 40) / (size + gap)));
    y = gap + (index % rows) * (size + gap);
  }

  return {
    x,
    y: Math.min(y, Math.max(gap, window.innerHeight - slotH - gap)),
  };
}

export function DesktopWidget({ id, title, zIndex, index, slot, onFocus, onUnpin }: DesktopWidgetProps) {
  const [pos, setPos] = useState(() => getWidgetSlotPos(id, index, undefined, slot));
  const [itemIndex, setItemIndex] = useState(0);
  const widgetRef = useRef<HTMLElement>(null);

  const computePos = useCallback(() => {
    const measuredWidth = widgetRef.current?.getBoundingClientRect().width;
    setPos(getWidgetSlotPos(id, index, measuredWidth, slot));
  }, [id, index, slot]);

  useEffect(() => {
    computePos();
    window.addEventListener("resize", computePos);
    return () => window.removeEventListener("resize", computePos);
  }, [computePos]);

  const handlePointerDown = () => {
    onFocus();
  };
  const renderBody = () => {
    if (id === "spotify") return <SpotifyDesktopPlayer />;
    if (id === "netflix") return <NetflixDesktopWidget onOpen={onUnpin} />;
    if (id === "photos") return <PhotosDesktopWidget onOpen={onUnpin} />;
    if (id === "photoshop") {
      const recipe = NIKON_RECIPES[itemIndex % NIKON_RECIPES.length];
      return (
        <div className="dw-card dw-card--recipe">
          <div className="dw-topline"><span><Camera size={16} /> Color Lab</span><span className="dw-counter">Nikon recipes</span></div>
          <button className="dw-recipe-preview" style={{ background: recipe.accentGradient }} onClick={onUnpin} aria-label={`Open ${recipe.name} in Color Lab`}><span className="dw-recipe-orb" /><span className="dw-recipe-tag">{recipe.editorialTags.join(" · ")}</span></button>
          <div className="dw-bottomline"><div className="dw-caption"><div className="dw-title">{recipe.name}</div><div className="dw-sub">By {recipe.creator}</div></div><div className="dw-nav"><button className="dw-control" aria-label="Previous recipe" onClick={() => setItemIndex(i => (i - 1 + NIKON_RECIPES.length) % NIKON_RECIPES.length)}><ChevronLeft size={20} /></button><button className="dw-control" aria-label="Next recipe" onClick={() => setItemIndex(i => (i + 1) % NIKON_RECIPES.length)}><ChevronRight size={20} /></button></div></div>
        </div>
      );
    }
    return <div className="dw-card dw-card--recipe"><div className="dw-title">{title}</div><button className="dw-text-link" onClick={onUnpin}>Open window <Maximize2 size={14} /></button></div>;
  };

  return (
    <aside ref={widgetRef} className={`desktop-widget desktop-widget--${id}`} style={{ zIndex, transform: `translate3d(${pos.x}px, ${pos.y}px, 0)` }} onPointerDown={handlePointerDown} onFocus={onFocus} onClick={slot !== undefined ? e => { if (!(e.target as HTMLElement).closest("button, a, input, [data-widget-scroll]")) onUnpin(); } : undefined} onDoubleClick={slot === undefined ? e => { if (!(e.target as HTMLElement).closest("button, a, [data-widget-scroll]")) onUnpin(); } : undefined} data-pin-slot={slot} aria-label={`${title} widget`}>
      <div
        className="dw-widget-motion"
        style={{ animationDelay: `${index * 45}ms` }}
      >
        {renderBody()}
      </div>
    </aside>
  );
}
