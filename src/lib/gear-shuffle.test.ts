import { describe, expect, it } from "vitest";
import { buildShuffledGearOrder, GEAR_MEDIA_RATIOS } from "./gear-shuffle";

describe("gear randomization helpers", () => {
  it("preserves every item as a valid permutation and varies order", () => {
    const items = Array.from({ length: 36 }, (_, i) => ({ slug: `item-${i}` }));
    const seenOrders = new Set<string>();

    for (let run = 0; run < 5; run += 1) {
      const shuffled = buildShuffledGearOrder(items, (x) => x.slug);
      expect(shuffled).toHaveLength(items.length);
      expect(new Set(shuffled.map((x) => x.slug))).toEqual(new Set(items.map((x) => x.slug)));
      seenOrders.add(shuffled.map((x) => x.slug).join(","));
    }

    expect(seenOrders.size).toBeGreaterThan(1);
    expect(GEAR_MEDIA_RATIOS.length).toBeGreaterThan(0);
  });

  it("never repeats the previous leading product slug when multiple items exist", () => {
    const items = [{ slug: "alpha" }, { slug: "beta" }, { slug: "gamma" }];
    for (let i = 0; i < 20; i += 1) {
      const shuffled = buildShuffledGearOrder(items, (x) => x.slug, "alpha");
      expect(shuffled[0].slug).not.toBe("alpha");
    }
  });
});
