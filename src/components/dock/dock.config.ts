export type AppId = "netflix" | "spotify" | "photos" | "workspace" | "photoshop";

export interface DockApplication {
  id: AppId;
  name: string;
  windowTitle: string;
  /** Canonical route for opening this app from the Dock. */
  route: string;
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
    route: "/entertainment/netflix",
    icon: "/assets/dock/netflix.webp",
    enabled: true,
  },
  {
    id: "spotify",
    name: "Spotify",
    windowTitle: "Spotify — My Music",
    route: "/music/spotify",
    icon: "/assets/dock/spotify.webp",
    enabled: true,
  },
  {
    id: "photos",
    name: "Photos",
    windowTitle: "Photos — Photography",
    route: "/photos",
    icon: "/assets/dock/photos.svg",
    enabled: true,
    iconBackground: "#FFFFFF",
  },
  {
    id: "workspace",
    name: "Workspace",
    windowTitle: "Phuc Loc Nguyen — Workspace",
    route: "/",
    icon: "/apple-touch-icon.png",
    enabled: true,
    iconBackground: "#121214",
    iconFit: "contain",
  },
  {
    id: "photoshop",
    name: "Photoshop",
    windowTitle: "Color Lab — Nikon Imaging Recipes",
    route: "/color-lab/nikon-recipes",
    icon: "/assets/dock/photoshop.png",
    enabled: false,
  },
];

export function getAppRoute(id: AppId): string {
  return DEFAULT_DOCK_APPS.find((app) => app.id === id)?.route ?? "/";
}
