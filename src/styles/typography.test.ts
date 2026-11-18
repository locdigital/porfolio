import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

function getAllFiles(dir: string, ext: string[]): string[] {
  const files: string[] = [];
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      files.push(...getAllFiles(fullPath, ext));
    } else if (ext.some((e) => fullPath.endsWith(e))) {
      files.push(fullPath);
    }
  }
  return files;
}

describe("Typography Design System Standards", () => {
  const dashboardCss = readFileSync("src/styles/dashboard.css", "utf-8");
  const globalCss = readFileSync("src/styles/global.css", "utf-8");

  describe("Core Typography Tokens in dashboard.css", () => {
    it("defines the primary font families", () => {
      expect(dashboardCss).toContain("--font-family-base:");
      expect(dashboardCss).toContain("--font-family-mono:");
      expect(dashboardCss).toContain("--font-family-headline:");
    });

    it("defines the complete fluid and body type scales", () => {
      const requiredTypeTokens = [
        "--text-display-xl:",
        "--text-display:",
        "--text-h1:",
        "--text-h2:",
        "--text-h3:",
        "--text-h4:",
        "--text-body-lg:",
        "--text-body:",
        "--text-body-sm:",
        "--text-caption:",
        "--text-micro:",
      ];
      for (const token of requiredTypeTokens) {
        expect(dashboardCss).toContain(token);
      }
    });

    it("defines line height tokens", () => {
      const requiredLeadingTokens = [
        "--leading-display:",
        "--leading-heading:",
        "--leading-snug:",
        "--leading-compact:",
        "--leading-body:",
        "--leading-loose:",
      ];
      for (const token of requiredLeadingTokens) {
        expect(dashboardCss).toContain(token);
      }
    });

    it("defines letter spacing tracking tokens", () => {
      const requiredTrackingTokens = [
        "--tracking-display:",
        "--tracking-heading:",
        "--tracking-subheading:",
        "--tracking-body:",
        "--tracking-label:",
        "--tracking-caps:",
      ];
      for (const token of requiredTrackingTokens) {
        expect(dashboardCss).toContain(token);
      }
    });

    it("defines font weight tokens", () => {
      expect(dashboardCss).toContain("--font-weight-regular: 400");
      expect(dashboardCss).toContain("--font-weight-medium: 500");
      expect(dashboardCss).toContain("--font-weight-semibold: 600");
      expect(dashboardCss).toContain("--font-weight-bold: 700");
    });

    it("verifies the compact minimalism typography scale tokens", () => {
      expect(dashboardCss).toContain("--text-body: 0.875rem;");
      expect(dashboardCss).toContain("--text-body-sm: max(var(--text-min), 0.8125rem);");
      expect(dashboardCss).toContain("--text-caption: max(var(--text-min), 0.75rem);");
      expect(dashboardCss).toContain("--text-micro: max(var(--text-min), 0.6875rem);");
      expect(globalCss).toContain("--type-body: var(--text-body, 14px);");
      expect(globalCss).toContain("--button-font-size: var(--text-body, 14px);");
    });
  });

  describe("Zero Destructive CSS Overrides", () => {
    it("does not force a global 14px size onto span elements", () => {
      expect(dashboardCss).not.toMatch(/span\s*\{[^}]*font-size:\s*14px/);
      expect(globalCss).not.toMatch(/span\s*\{[^}]*font-size:\s*14px/);
    });

    it("ensures spans inherit font size by default", () => {
      expect(dashboardCss).toMatch(/span\s*\{[^}]*font-size:\s*inherit/);
      expect(globalCss).toMatch(/span\s*\{[^}]*font-size:\s*inherit/);
    });
  });

  describe("No Hardcoded Pixel or Rem Font Sizes in Astro Pages & Components", () => {
    const filesToCheck = [
      ...getAllFiles("src/pages", [".astro"]),
      ...getAllFiles("src/components", [".astro"]),
    ];

    it("ensures no hardcoded pixel font sizes are used in style tags or inline styles", () => {
      const violations: { file: string; match: string }[] = [];
      const pxRegex = /font-size:\s*([0-9]+px)/g;

      for (const file of filesToCheck) {
        const content = readFileSync(file, "utf-8");
        let match;
        while ((match = pxRegex.exec(content)) !== null) {
          violations.push({ file, match: match[0] });
        }
      }

      expect(violations).toEqual([]);
    });

    it("ensures no hardcoded rem font sizes are used in style tags or inline styles", () => {
      const violations: { file: string; match: string }[] = [];
      const remRegex = /font-size:\s*([0-9\.]+rem)/g;

      for (const file of filesToCheck) {
        const content = readFileSync(file, "utf-8");
        let match;
        while ((match = remRegex.exec(content)) !== null) {
          violations.push({ file, match: match[0] });
        }
      }

      expect(violations).toEqual([]);
    });
  });
});
