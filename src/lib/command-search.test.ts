import { describe, expect, it } from "vitest";
import { filterCommandItem, normalizeSearchText } from "./command-search";

describe("command-search filtering", () => {
  it("normalizes Vietnamese diacritics including đ and Đ", () => {
    expect(normalizeSearchText("Đà Lạt")).toBe("da lat");
    expect(normalizeSearchText("Hà Giang")).toBe("ha giang");
    expect(normalizeSearchText("Bù Gia Mập")).toBe("bu gia map");
    expect(normalizeSearchText("Tràng An — Ninh Bình")).toBe("trang an — ninh binh");
    expect(normalizeSearchText("Đà Nẵng")).toBe("da nang");
  });

  it("matches Vietnamese destinations using plain ASCII queries", () => {
    const score = filterCommandItem("Đà Lạt :: /photos/da-lat", "da lat", [
      "Photography",
      "Lam Dong",
    ]);
    expect(score).toBeGreaterThan(0.8);
  });

  it("scores exact and prefix title matches higher than keyword-only matches", () => {
    const exact = filterCommandItem("Work :: /work", "work", ["Pages"]);
    const prefix = filterCommandItem("WorkFlow Space :: /work/workflow-space", "work", [
      "Work",
    ]);
    const keywordOnly = filterCommandItem("About :: /about", "work", [
      "Pages",
      "work experience",
    ]);

    expect(exact).toBeGreaterThan(prefix);
    expect(prefix).toBeGreaterThan(keywordOnly);
    expect(keywordOnly).toBeGreaterThan(0);
  });

  it("supports multi-term matching across title and keywords", () => {
    expect(
      filterCommandItem("Marketing formulas :: /growth/metrics", "roas calculator", [
        "ROAS MER CAC metrics calculator",
      ]),
    ).toBeGreaterThan(0);

    expect(
      filterCommandItem("Marketing formulas :: /growth/metrics", "roas photography", [
        "ROAS MER CAC metrics calculator",
      ]),
    ).toBe(0);
  });

  it("returns 1 when the search query is empty", () => {
    expect(filterCommandItem("Overview :: /", "", ["Pages"])).toBe(1);
    expect(filterCommandItem("Overview :: /", "   ", ["Pages"])).toBe(1);
  });
});
