export type AppId = "netflix" | "spotify" | "photos" | "workspace" | "photoshop";

export interface DockApplication {
  id: AppId;
  name: string;
  windowTitle: string;
  icon: string;
  enabled: boolean;
  /** Optional subtle surface fill behind transparent icons. */
  iconBackground?: string;
  /** Use contain fit for icons with padding/geometry that must not be cropped. */
  iconFit?: "cover" | "contain";
}

export type DockPosition = "left" | "bottom";

export interface DockMotionConfig {
  stiffness: number;
  damping: number;
  mass: number;
  maxScale: number;
  influenceRadius: number;
}

export const DEFAULT_DOCK_MOTION: DockMotionConfig = {
  stiffness: 320,
  damping: 26,
  mass: 0.75,
  maxScale: 1.32,
  influenceRadius: 96,
};

/**
 * Strictly 5 applications in the required order:
 * Netflix -> Spotify -> Photos -> Workspace -> Photoshop
 */
export const DEFAULT_DOCK_APPS: DockApplication[] = [
  {
    id: "netflix",
    name: "Netflix",
    windowTitle: "Netflix — Personal Library",
    icon: "/assets/dock/netflix.png",
    enabled: true,
  },
  {
    id: "spotify",
    name: "Spotify",
    windowTitle: "Spotify — My Music",
    icon: "/assets/dock/spotify.png",
    enabled: true,
  },
  {
    id: "photos",
    name: "Photos",
    windowTitle: "Photos — Photography",
    icon: "/assets/dock/photos.svg",
    enabled: true,
    iconBackground: "#FFFFFF",
  },
  {
    id: "workspace",
    name: "Workspace",
    windowTitle: "Phuc Loc Nguyen — Workspace",
    icon: "/apple-touch-icon.png",
    enabled: true,
    iconBackground: "#121214",
    iconFit: "contain",
  },
  {
    id: "photoshop",
    name: "Photoshop",
    windowTitle: "Color Lab — Nikon Imaging Recipes",
    icon: "/assets/dock/photoshop.png",
    enabled: true,
  },
];
