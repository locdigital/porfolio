import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { parse } from "parse5";

const SITE_ORIGIN = "https://loc.digital";
const STATIC_DIR = path.resolve(".vercel/output/static");
const CONFIG_FILE = path.resolve(".vercel/output/config.json");
const PHOTOS_DIR = path.resolve("src/content/photos");
const PROJECTS_DIR = path.resolve("src/content/projects");

const failures = [];
const warnings = [];
let checksPassed = 0;

function check(condition, message) {
  if (condition) {
    checksPassed++;
  } else {
    failures.push(message);
  }
}

function warn(condition, message) {
  if (!condition) warnings.push(message);
}

function children(node) {
  return node?.childNodes ?? [];
}

function attr(node, name) {
  return node?.attrs?.find((a) => a.name === name)?.value;
}

function findAll(node, predicate, acc = []) {
  if (predicate(node)) acc.push(node);
  for (const child of children(node)) findAll(child, predicate, acc);
  return acc;
}

function textOf(node) {
  if (!node) return "";
  if (node.nodeName === "#text") return node.value;
  return children(node).map(textOf).join("");
}

function visibleTextOf(node) {
  if (!node) return "";
  if (node.nodeName === "#text") return node.value;
  if (["script", "style", "noscript", "template"].includes(node.tagName)) return "";
  if (attr(node, "hidden") !== undefined) return "";
  return children(node).map(visibleTextOf).join(" ");
}

async function fileExists(targetPath) {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
}

function isVerificationHtmlFile(name) {
  return /^(google[0-9a-f]+|BingSiteAuth)\.html$/i.test(name);
}

async function collectHtmlFiles(dir) {
  const results = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name === "_astro") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...(await collectHtmlFiles(full)));
    } else if (entry.name.endsWith(".html") && !isVerificationHtmlFile(entry.name)) {
      results.push(full);
    }
  }
  return results.sort();
}

function routeFromHtmlFile(filePath) {
  const rel = path.relative(STATIC_DIR, filePath).split(path.sep).join("/");
  if (rel === "index.html") return "/";
  if (rel === "404.html") return "/404";
  return `/${rel.replace(/(?:^|\/)index\.html$/, "").replace(/\.html$/, "").replace(/\/$/, "")}`;
}

function mdFileForRoute(route) {
  if (route === "/") return path.join(STATIC_DIR, "index.md");
  return path.join(STATIC_DIR, `${route.slice(1)}.md`);
}

async function runAudit() {
  check(await fileExists(STATIC_DIR), `Missing build directory: ${STATIC_DIR}. Run pnpm build first.`);
  if (failures.length > 0) return;

  // 1. robots.txt & llms.txt & Vercel config
  const robotsTxt = await readFile(path.join(STATIC_DIR, "robots.txt"), "utf8");
  check(robotsTxt.includes("User-agent: *"), "robots.txt missing User-agent: *");
  check(robotsTxt.includes("Allow: /"), "robots.txt missing Allow: /");
  check(
    robotsTxt.includes("Sitemap: https://loc.digital/sitemap-index.xml"),
    "robots.txt missing exact Sitemap: https://loc.digital/sitemap-index.xml",
  );

  const llmsTxt = await readFile(path.join(STATIC_DIR, "llms.txt"), "utf8");
  check(llmsTxt.includes("https://loc.digital/growth"), "llms.txt missing /growth hub link");
  check(llmsTxt.includes("https://loc.digital/growth/metrics"), "llms.txt missing /growth/metrics link");
  check(!llmsTxt.includes("current three articles"), "llms.txt still contains outdated 'three articles' text");

  const vercelConfig = JSON.parse(await readFile(CONFIG_FILE, "utf8"));
  const redirectSources = new Set((vercelConfig.routes || []).filter((r) => r.status === 301 || r.status === 308 || r.status === 302).map((r) => r.src));
  check(redirectSources.has("/service"), "Vercel config missing /service redirect");
  check(redirectSources.has("/experience"), "Vercel config missing /experience redirect");
  check(
    (vercelConfig.routes || []).some((r) => r.dest === "/_agent-content"),
    "Vercel config missing /_agent-content Markdown negotiation route",
  );

  // 2. Load CMS ground truth (unpublished albums + project passwords)
  const unpublishedSlugs = new Set();
  const samplePhotoStories = new Map();
  const photoFiles = (await readdir(PHOTOS_DIR)).filter((f) => f.endsWith(".json")).sort();
  for (const file of photoFiles) {
    const data = JSON.parse(await readFile(path.join(PHOTOS_DIR, file), "utf8"));
    const slug = data.slug || file.slice(0, -5);
    if (data.published === false) {
      unpublishedSlugs.add(slug);
    } else if (data.images?.[0]?.story) {
      samplePhotoStories.set(slug, {
        title: data.images[0].title,
        story: data.images[0].story,
      });
    }
  }
  const publishedPhotoCount = photoFiles.length - unpublishedSlugs.size;
  const llmsGalleryMatch = llmsTxt.match(/(\d+)\s+published destination galleries/i);
  check(
    Boolean(llmsGalleryMatch && Number(llmsGalleryMatch[1]) === publishedPhotoCount),
    `llms.txt gallery count (${llmsGalleryMatch?.[1] ?? "missing"}) != actual published count (${publishedPhotoCount})`,
  );

  const protectedPasswords = [];
  for (const file of (await readdir(PROJECTS_DIR)).filter((f) => f.endsWith(".json")).sort()) {
    const data = JSON.parse(await readFile(path.join(PROJECTS_DIR, file), "utf8"));
    if (data.password) protectedPasswords.push(data.password);
  }

  // 3. Sitemap checks
  const sitemapIndex = await readFile(path.join(STATIC_DIR, "sitemap-index.xml"), "utf8");
  check(sitemapIndex.includes("https://loc.digital/sitemap-0.xml"), "sitemap-index.xml missing sitemap-0.xml");

  const sitemapXml = await readFile(path.join(STATIC_DIR, "sitemap-0.xml"), "utf8");
  const sitemapUrls = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  check(sitemapUrls.length > 0, "sitemap-0.xml contains zero URLs");

  const sitemapPathSet = new Set();
  for (const loc of sitemapUrls) {
    check(loc.startsWith(SITE_ORIGIN), `Sitemap URL outside canonical origin: ${loc}`);
    const parsed = new URL(loc);
    check(
      parsed.pathname === "/" || !parsed.pathname.endsWith("/"),
      `Sitemap URL has unexpected trailing slash: ${loc}`,
    );
    check(parsed.pathname !== "/404", "Sitemap must exclude /404");
    check(
      !isVerificationHtmlFile(path.posix.basename(parsed.pathname)),
      `Sitemap must exclude verification file: ${parsed.pathname}`,
    );
    for (const draftSlug of unpublishedSlugs) {
      check(
        parsed.pathname !== `/photos/${draftSlug}`,
        `Sitemap includes unpublished draft gallery: ${parsed.pathname}`,
      );
    }
    sitemapPathSet.add(parsed.pathname);
  }

  for (const expectedRoute of [
    "/",
    "/about",
    "/work",
    "/services",
    "/growth",
    "/growth/metrics",
    "/photos",
    "/writing",
    "/gear",
    "/resume",
    "/certificates",
    "/privacy",
  ]) {
    check(sitemapPathSet.has(expectedRoute), `Sitemap missing expected core route: ${expectedRoute}`);
  }

  // 4. Inspect every built HTML file
  const htmlFiles = await collectHtmlFiles(STATIC_DIR);
  const builtRoutes = new Set(htmlFiles.map(routeFromHtmlFile));
  const inboundLinks = new Map();

  for (const draftSlug of unpublishedSlugs) {
    check(
      !builtRoutes.has(`/photos/${draftSlug}`),
      `Unpublished draft album should not be publicly generated: /photos/${draftSlug}`,
    );
  }

  const pageReports = new Map();

  for (const filePath of htmlFiles) {
    const route = routeFromHtmlFile(filePath);
    const html = await readFile(filePath, "utf8");
    const doc = parse(html);

    // Check secrets/passwords never leaked
    for (const secret of protectedPasswords) {
      check(!html.includes(secret), `${route}: leaked private showcase password in HTML`);
    }
    check(!html.includes("+84777779459"), `${route}: stale phone +84777779459 found in HTML`);

    const htmlEl = findAll(doc, (n) => n.tagName === "html")[0];
    const lang = attr(htmlEl, "lang");
    check(Boolean(lang && lang === "en"), `${route}: invalid or missing <html lang>`);

    const titles = findAll(doc, (n) => n.tagName === "title");
    check(titles.length === 1 && textOf(titles[0]).trim().length > 0, `${route}: expected exactly 1 non-empty <title>`);

    const metas = findAll(doc, (n) => n.tagName === "meta");
    const descMetas = metas.filter((m) => attr(m, "name") === "description");
    check(descMetas.length === 1 && Boolean(attr(descMetas[0], "content")?.trim()), `${route}: expected exactly 1 meta description`);

    const robotMetas = metas.filter((m) => attr(m, "name") === "robots");
    check(robotMetas.length === 1, `${route}: expected exactly 1 meta robots tag`);
    const robotsContent = attr(robotMetas[0], "content") || "";

    const canonicals = findAll(doc, (n) => n.tagName === "link" && attr(n, "rel") === "canonical");
    const ldScripts = findAll(doc, (n) => n.tagName === "script" && attr(n, "type") === "application/ld+json");

    const isAppWindow = ["/music/spotify", "/entertainment/netflix", "/color-lab/nikon-recipes"].includes(route);
    if (isAppWindow) {
      check(robotsContent.includes("noindex"), `${route}: application window must remain noindex`);
      check(!sitemapPathSet.has(route), `${route}: noindex application window listed in sitemap`);
      check(html.includes('component-export="DesktopShell"'), `${route}: missing desktop application shell`);
    } else if (route === "/404") {
      check(robotsContent.includes("noindex"), "/404 must contain noindex in meta robots");
      check(canonicals.length === 0, "/404 must not emit a <link rel='canonical'>");
      check(ldScripts.length === 0, "/404 should not emit misleading page/service JSON-LD");
    } else {
      check(robotsContent === "index, follow", `${route}: unexpected robots directive "${robotsContent}"`);
      check(canonicals.length === 1, `${route}: expected exactly 1 <link rel="canonical">`);
      const expectedCanonical = route === "/" ? `${SITE_ORIGIN}/` : `${SITE_ORIGIN}${route}`;
      check(
        attr(canonicals[0], "href") === expectedCanonical,
        `${route}: canonical "${attr(canonicals[0], "href")}" != "${expectedCanonical}"`,
      );

      const mdAlternate = findAll(doc, (n) => n.tagName === "link" && attr(n, "type") === "text/markdown");
      check(mdAlternate.length === 1, `${route}: missing Markdown alternate link`);
      check(await fileExists(mdFileForRoute(route)), `${route}: missing generated Markdown file`);

      const ogTitle = metas.find((m) => attr(m, "property") === "og:title");
      const ogDesc = metas.find((m) => attr(m, "property") === "og:description");
      const ogImage = metas.find((m) => attr(m, "property") === "og:image");
      const ogUrl = metas.find((m) => attr(m, "property") === "og:url");
      check(Boolean(attr(ogTitle, "content")), `${route}: missing og:title`);
      check(Boolean(attr(ogDesc, "content")), `${route}: missing og:description`);
      check(Boolean(attr(ogImage, "content")?.startsWith("https://")), `${route}: og:image must be absolute https URL`);
      check(attr(ogUrl, "content") === expectedCanonical, `${route}: og:url mismatch`);

      // JSON-LD assertions
      check(ldScripts.length === 1, `${route}: expected exactly 1 JSON-LD block`);
      let parsedLd;
      try {
        parsedLd = JSON.parse(textOf(ldScripts[0]));
        check(true, `${route}: JSON-LD parsed`);
      } catch (err) {
        check(false, `${route}: invalid JSON-LD (${err.message})`);
      }

      if (parsedLd) {
        const rawLdString = JSON.stringify(parsedLd);
        check(!rawLdString.includes('"undefined"'), `${route}: JSON-LD contains string "undefined"`);
        check(parsedLd["@context"] === "https://schema.org", `${route}: JSON-LD missing schema.org context`);
        const graph = Array.isArray(parsedLd["@graph"]) ? parsedLd["@graph"] : [];
        const types = new Set();
        const collectTypes = (val) => {
          if (Array.isArray(val)) {
            val.forEach(collectTypes);
          } else if (val && typeof val === "object") {
            const t = val["@type"];
            if (Array.isArray(t)) t.forEach((x) => types.add(x));
            else if (typeof t === "string") types.add(t);
            Object.values(val).forEach(collectTypes);
          }
        };
        collectTypes(graph);
        const ids = new Set(graph.map((n) => n["@id"]).filter(Boolean));
        check(ids.has("https://loc.digital/#person"), `${route}: JSON-LD missing #person entity`);
        check(ids.has("https://loc.digital/#website"), `${route}: JSON-LD missing #website entity`);
        if (route !== "/services") {
          check(!types.has("ProfessionalService"), `${route}: should not emit ProfessionalService outside /services`);
        }
        pageReports.set(route, { types, graph });
      }
    }

    // Main landmark & single H1 & visible text
    if (!isAppWindow) {
      const mains = findAll(doc, (n) => n.tagName === "main");
      check(mains.length === 1, `${route}: expected exactly 1 <main> element`);
      const h1s = findAll(doc, (n) => n.tagName === "h1");
      check(h1s.length === 1 && textOf(h1s[0]).trim().length > 0, `${route}: expected exactly 1 non-empty <h1>`);
      const mainText = mains[0] ? visibleTextOf(mains[0]).replace(/\s+/g, " ").trim() : "";
      check(mainText.length >= 120, `${route}: initial HTML <main> text too short (${mainText.length} chars)`);
    }

    // Check internal links resolve & track inbound links
    const anchors = findAll(doc, (n) => n.tagName === "a" && Boolean(attr(n, "href")));
    for (const a of anchors) {
      const href = attr(a, "href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("http://") || href.startsWith("https://")) {
        continue;
      }
      const cleanHref = href.split("#")[0].split("?")[0];
      const normHref = cleanHref === "/" ? "/" : cleanHref.replace(/\/+$/, "");
      if (normHref.startsWith("/_astro/") || normHref.startsWith("/assets/") || normHref.endsWith(".pdf")) continue;
      const targetExists = builtRoutes.has(normHref) || redirectSources.has(normHref);
      check(targetExists, `${route}: broken internal link "${href}"`);
      if (route !== "/404" && normHref !== route) {
        inboundLinks.set(normHref, (inboundLinks.get(normHref) || 0) + 1);
      }
    }

    // Img alt check
    const imgs = findAll(doc, (n) => n.tagName === "img");
    for (const img of imgs) {
      const alt = attr(img, "alt");
      check(alt !== undefined, `${route}: <img> missing alt attribute`);
      if (route.startsWith("/photos/") && alt) {
        check(
          !/^.*(?:—|---|-)\s*(?:DSC_|IMG_|photo\s+\d+)/i.test(alt),
          `${route}: generic camera-filename alt found: "${alt}"`,
        );
      }
    }
  }

  // 5. Orphan page check (every sitemap route except / must have >= 1 inbound link)
  for (const locPath of sitemapPathSet) {
    if (locPath === "/") continue;
    check(
      (inboundLinks.get(locPath) || 0) > 0,
      `Orphaned sitemap page (0 inbound internal links): ${locPath}`,
    );
  }

  // 6. Representative page-type schema & content checks
  check(pageReports.get("/")?.types.has("WebPage"), "Homepage missing WebPage schema");
  check(pageReports.get("/about")?.types.has("ProfilePage"), "/about missing ProfilePage schema");
  check(pageReports.get("/resume")?.types.has("ProfilePage"), "/resume missing ProfilePage schema");
  check(pageReports.get("/services")?.types.has("Service"), "/services missing Service schema");
  check(pageReports.get("/work")?.types.has("CollectionPage"), "/work missing CollectionPage schema");
  check(pageReports.get("/work/playah")?.types.has("CreativeWork"), "/work/playah missing CreativeWork schema");
  check(pageReports.get("/growth")?.types.has("CollectionPage"), "/growth missing CollectionPage schema");
  check(pageReports.get("/growth/metrics")?.types.has("TechArticle"), "/growth/metrics missing TechArticle schema");
  check(pageReports.get("/photos")?.types.has("CollectionPage"), "/photos missing CollectionPage schema");
  check(pageReports.get("/photos/trang-an")?.types.has("ImageGallery"), "/photos/trang-an missing ImageGallery schema");
  check(pageReports.get("/photos/trang-an")?.types.has("Place"), "/photos/trang-an missing Place schema");
  check(pageReports.get("/photos/trang-an")?.types.has("ImageObject"), "/photos/trang-an missing ImageObject schema");
  check(vercelConfig.routes.some((route) => route.src === "/contact" && route.status === 301 && route.headers?.Location === "/about"), "/contact must redirect to /about");

  // 7. Photo-flip Markdown + HTML discoverability check
  for (const [slug, sample] of samplePhotoStories.entries()) {
    const photoHtml = await readFile(path.join(STATIC_DIR, "photos", slug, "index.html"), "utf8");
    const photoMd = await readFile(path.join(STATIC_DIR, "photos", `${slug}.md`), "utf8");
    check(photoHtml.includes(sample.story.slice(0, 40)), `/photos/${slug} HTML missing photo story text`);
    check(photoMd.includes(sample.title), `/photos/${slug}.md missing photo title "${sample.title}"`);
    check(photoMd.includes(sample.story.slice(0, 40)), `/photos/${slug}.md missing photo story text`);
  }

  // 8. /gear visibility without JS
  const gearHtml = await readFile(path.join(STATIC_DIR, "gear/index.html"), "utf8");
  check(
    !gearHtml.includes(".gear-masonry:not([data-gear-shuffled=\"1\"]){visibility:hidden}"),
    "/gear CSS hides catalog when html.js is absent",
  );
  warn(gearHtml.includes("MacBook Pro M4 Pro"), "/gear missing expected item in initial HTML");
}

await runAudit();

console.log(`[geo:audit] Passed ${checksPassed} checks; ${warnings.length} warnings; ${failures.length} failures.`);
for (const w of warnings) console.warn(`  WARN: ${w}`);
for (const f of failures) console.error(`  FAIL: ${f}`);

assert.equal(failures.length, 0, `GEO audit failed with ${failures.length} issue(s).`);
