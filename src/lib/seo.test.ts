import { describe, expect, it } from "vitest";
import {
  PERSON_ID,
  WEBSITE_ID,
  articleSchema,
  breadcrumbListSchema,
  canonicalPath,
  canonicalUrl,
  graphSchema,
  imageGallerySchema,
  personSchema,
  safeJsonLd,
} from "./seo";
import { resolvePhotoAlt } from "./photo-alt";

describe("SEO & JSON-LD schema utilities", () => {
  it("normalizes canonical paths and URLs consistently without trailing slashes on subpages", () => {
    expect(canonicalPath("/")).toBe("/");
    expect(canonicalPath("/about/")).toBe("/about");
    expect(canonicalPath("/photos/trang-an/?utm_source=x")).toBe("/photos/trang-an");
    expect(canonicalUrl("/")).toBe("https://loc.digital/");
    expect(canonicalUrl("/photos/trang-an/")).toBe("https://loc.digital/photos/trang-an");
  });

  it("maintains consistent author identity, verified phone, and dual-pillar expertise", () => {
    const person = personSchema();
    expect(person["@id"]).toBe(PERSON_ID);
    expect(person.telephone).toBe("+84888886038");
    expect(person.alternateName).toContain("Loc");
    expect(person.alternateName).toContain("Henry");
    expect(person.knowsAbout).toContain("Performance Marketing");
    expect(person.knowsAbout).toContain("Travel Photography");
  });

  it("serializes graphs safely without undefined values or raw script closing tags", () => {
    const graph = graphSchema([
      articleSchema({
        url: "https://loc.digital/growth/metrics",
        title: "Break-even <ROAS>",
        description: "Formula breakdown",
        type: "TechArticle",
        datePublished: undefined,
      }),
    ]);
    const serialized = safeJsonLd(graph);
    expect(serialized).not.toContain('"undefined"');
    expect(serialized).not.toContain("<");
    const parsed = JSON.parse(serialized.replace(/\\u003c/g, "<"));
    expect(parsed["@graph"].some((n: { "@id"?: string }) => n["@id"] === PERSON_ID)).toBe(true);
    expect(parsed["@graph"].some((n: { "@id"?: string }) => n["@id"] === WEBSITE_ID)).toBe(true);
  });

  it("emits Place, ImageGallery, and ImageObject nodes without fabricated geo coordinates", () => {
    const nodes = imageGallerySchema({
      url: "https://loc.digital/photos/trang-an",
      title: "Tràng An",
      description: "Limestone karsts and water caves",
      locationName: "Tràng An",
      country: "Vietnam",
      region: "Northern Vietnam",
      latitude: "",
      longitude: "",
      images: [
        {
          url: "/assets/photos/trang-an/DSC_3829.webp",
          name: "Limestone Pinnacle on Still Water",
          width: 1600,
          height: 2400,
        },
      ],
    });
    expect(nodes).toHaveLength(2);
    expect(nodes[0]["@type"]).toBe("Place");
    expect(nodes[0].geo).toBeUndefined();
    expect(nodes[1]["@type"]).toContain("ImageGallery");
    expect((nodes[1].associatedMedia as unknown[])).toHaveLength(1);
  });

  it("builds valid BreadcrumbList items", () => {
    const bc = breadcrumbListSchema(
      [{ label: "Photography", href: "/photos" }, { label: "Tràng An" }],
      "https://loc.digital/photos/trang-an",
    );
    expect(bc?.["@type"]).toBe("BreadcrumbList");
    const items = bc?.itemListElement as { position: number; item: string }[];
    expect(items[0].item).toBe("https://loc.digital/");
    expect(items[1].item).toBe("https://loc.digital/photos");
    expect(items[2].item).toBe("https://loc.digital/photos/trang-an");
  });
});

describe("Photo alt enrichment", () => {
  it("replaces camera-filename placeholders using verified title and location without altering descriptive alts", () => {
    expect(
      resolvePhotoAlt(
        { alt: "Tràng An — DSC_3829", title: "Limestone Pinnacle on Still Water", location: "Tràng An" },
        "Tràng An",
        0,
      ),
    ).toBe("Limestone Pinnacle on Still Water — Tràng An");

    expect(
      resolvePhotoAlt(
        { alt: "Hà Giang --- photo 1", title: "Morning Sun at Pao's House", location: "Pao's House, Hà Giang" },
        "Hà Giang",
        0,
      ),
    ).toBe("Morning Sun at Pao's House — Pao's House, Hà Giang");

    expect(
      resolvePhotoAlt(
        { alt: "Nhà thờ Chánh tòa Mỹ Tho with golden crown", title: "Crown Atop Tower", location: "Mỹ Tho" },
        "Mỹ Tho",
        0,
      ),
    ).toBe("Nhà thờ Chánh tòa Mỹ Tho with golden crown");
  });
});
