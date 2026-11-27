import { describe, expect, it } from "vitest";
import { resolveActiveTocId, type TocHeadingPosition } from "./toc-spy";

describe("resolveActiveTocId", () => {
  const layout = (scrollTop: number): TocHeadingPosition[] => [
    { id: "busyness", relativeTop: 780 - scrollTop },
    { id: "leverage", relativeTop: 1160 - scrollTop },
    { id: "depth", relativeTop: 1580 - scrollTop },
  ];

  it("highlights the first heading at the top of the article", () => {
    expect(
      resolveActiveTocId(layout(0), {
        scrollTop: 0,
        maxScroll: 1200,
        containerHeight: 820,
      }),
    ).toBe("busyness");
  });

  it("moves highlight to middle heading as the user reads past it", () => {
    expect(
      resolveActiveTocId(layout(980), {
        scrollTop: 980,
        maxScroll: 1200,
        containerHeight: 820,
      }),
    ).toBe("leverage");
  });

  it("highlights the last heading when scrolled to the bottom even if its section is short", () => {
    expect(
      resolveActiveTocId(layout(1195), {
        scrollTop: 1195,
        maxScroll: 1200,
        containerHeight: 820,
      }),
    ).toBe("depth");
  });

  it("activates every heading in order on tall viewports without skipping the middle heading", () => {
    const metrics = { maxScroll: 1050, containerHeight: 960 };
    expect(resolveActiveTocId(layout(0), { ...metrics, scrollTop: 0 })).toBe("busyness");
    expect(resolveActiveTocId(layout(850), { ...metrics, scrollTop: 850 })).toBe("leverage");
    expect(resolveActiveTocId(layout(1045), { ...metrics, scrollTop: 1045 })).toBe("depth");
  });
});
