import { describe, expect, it } from "vitest";
import { hostWindowStorageKey, readHostWindowState } from "./host-window-state";

describe("Photos and Workspace window state", () => {
  it("keeps window controls isolated between apps", () => {
    const saved = new Map([
      [hostWindowStorageKey("workspace"), JSON.stringify({ closed: true, minimized: false, maximized: false })],
      [hostWindowStorageKey("photos"), JSON.stringify({ closed: false, minimized: false, maximized: true })],
    ]);
    const storage = { getItem: (key: string) => saved.get(key) ?? null };
    expect(readHostWindowState(storage, "workspace").closed).toBe(true);
    expect(readHostWindowState(storage, "photos")).toEqual({
      closed: false, minimized: false, maximized: true,
    });
    saved.set(hostWindowStorageKey("photos"), JSON.stringify({ minimized: true }));
    expect(readHostWindowState(storage, "workspace").minimized).toBe(false);
    expect(readHostWindowState(storage, "photos").minimized).toBe(true);
  });

  it("opens Photos normally for visitors with a previously closed Workspace", () => {
    const storage = { getItem: (key: string) => key === "workspace-window-state" ? '{"closed":true}' : null };
    expect(readHostWindowState(storage, "photos")).toEqual({
      closed: false, minimized: false, maximized: false,
    });
  });

  it("uses a visible window when saved state is corrupt or storage is blocked", () => {
    for (const storage of [
      { getItem: () => "invalid JSON" },
      { getItem: () => { throw new Error("Storage blocked"); } },
    ]) {
      expect(readHostWindowState(storage, "photos")).toEqual({
        closed: false, minimized: false, maximized: false,
      });
    }
  });
});
