export interface HostWindowState {
  closed: boolean;
  minimized: boolean;
  maximized: boolean;
}

export function hostWindowStorageKey(app: string | undefined): string {
  return `${app === "photos" ? "photos" : "workspace"}-window-state`;
}

export function readHostWindowState(
  storage: Pick<Storage, "getItem">,
  app: string | undefined,
): HostWindowState {
  try {
    const saved = JSON.parse(storage.getItem(hostWindowStorageKey(app)) ?? "null");
    return {
      closed: saved?.closed === true,
      minimized: saved?.minimized === true,
      maximized: saved?.maximized === true,
    };
  } catch {
    return { closed: false, minimized: false, maximized: false };
  }
}
