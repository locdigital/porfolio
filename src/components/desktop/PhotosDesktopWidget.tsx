import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Maximize2 } from "lucide-react";
import type { PhotosApiDestination } from "../../pages/api/photos.json";
import { Photo, type PhotoDirection } from "../ui/gallery";

interface PhotosDesktopWidgetProps {
  onOpen: () => void;
}

interface WidgetPhotoCard {
  id: string;
  order: number;
  x: string;
  y: string;
  zIndex: number;
  direction: PhotoDirection;
  src: string;
  alt: string;
}

const SLOTS: { x: string; y: string; zIndex: number; direction: PhotoDirection }[] = [
  { x: "-136px", y: "6px", zIndex: 50, direction: "left" },
  { x: "-68px", y: "14px", zIndex: 40, direction: "left" },
  { x: "0px", y: "2px", zIndex: 30, direction: "right" },
  { x: "68px", y: "12px", zIndex: 20, direction: "right" },
  { x: "136px", y: "20px", zIndex: 10, direction: "left" },
];

export function PhotosDesktopWidget({ onOpen }: PhotosDesktopWidgetProps) {
  const [photos, setPhotos] = useState<WidgetPhotoCard[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/photos.json")
      .then((res) => (res.ok ? res.json() : null))
      .then((payload: { destinations?: PhotosApiDestination[] } | null) => {
        if (!active || !payload?.destinations?.length) return;
        const picked: WidgetPhotoCard[] = [];
        for (const dest of payload.destinations) {
          if (picked.length >= SLOTS.length) break;
          const src = dest.heroSrc || dest.previewImages?.[0] || dest.photos?.[0]?.src;
          if (!src) continue;
          const slot = SLOTS[picked.length];
          picked.push({
            id: dest.slug,
            order: picked.length,
            x: slot.x,
            y: slot.y,
            zIndex: slot.zIndex,
            direction: slot.direction,
            src,
            alt: dest.name,
          });
        }
        setPhotos(picked);
        window.setTimeout(() => {
          if (active) setIsLoaded(true);
        }, 120);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const photoVariants = {
    hidden: () => ({
      x: 0,
      y: 0,
      rotate: 0,
      scale: 0.92,
      opacity: 0,
    }),
    visible: (custom: { x: string; y: string; order: number }) => ({
      x: custom.x,
      y: custom.y,
      rotate: 0,
      scale: 1,
      opacity: 1,
      transition: {
        type: "spring" as const,
        stiffness: 78,
        damping: 13,
        mass: 0.95,
        delay: custom.order * 0.1,
      },
    }),
  };

  return (
    <div className="dw-card dw-card--photos">
      <div className="dw-topline" style={{ justifyContent: "flex-end" }}>
        <button
          type="button"
          className="dw-photos-open"
          onClick={onOpen}
          aria-label="Open Photos window"
        >
          <span>View All Stories</span>
          <Maximize2 size={12} />
        </button>
      </div>

      <div className="dw-photos-stage" data-widget-scroll>
        <motion.div
          className="relative flex w-full items-center justify-center"
          initial="hidden"
          animate={isLoaded ? "visible" : "hidden"}
        >
          <div className="relative h-[116px] w-[116px]">
            {[...photos].reverse().map((photo) => (
              <motion.div
                key={photo.id}
                className="absolute left-0 top-0"
                style={{ zIndex: photo.zIndex }}
                variants={photoVariants}
                custom={{
                  x: photo.x,
                  y: photo.y,
                  order: photo.order,
                }}
              >
                <Photo
                  width={116}
                  height={116}
                  src={photo.src}
                  alt={photo.alt}
                  direction={photo.direction}
                />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
