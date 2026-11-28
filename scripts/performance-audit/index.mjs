#!/usr/bin/env node
/**
 * Production Performance, Bundle & Visual Audit Harness
 *
 * Measures:
 * 1. Static production output (.vercel/output/static) transitive JS/CSS/HTML sizes (raw, gzip, brotli),
 *    serialized Astro island props weight, _astro bundle inventory, and public/ media storage sizes.
 * 2. Real Headless Chromium (Chrome DevTools Protocol) lab metrics across Desktop & Mobile viewports,
 *    Cold Cache & Warm Cache: FCP, LCP, CLS, TBT, DCL, Load, HTTP requests, transferred bytes,
 *    initial video requests, duplicate requests, console/runtime errors, and responsive layout integrity
 *    across 375px, 390px, 768px, 1024px, 1440px, and 1920px.
 * 3. Optional before/after PNG screenshots via CDP Page.captureScreenshot.
 *
 * Usage:
 *   node scripts/performance-audit/index.mjs [--save-baseline] [--save-after] [--compare] [--screenshots <dir>] [--static-only]
 */

import { spawn } from "node:child_process";
import { createReadStream } from "node:fs";
import { access, mkdir, mkdtemp, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { brotliCompressSync, constants as zlibConstants, gzipSync } from "node:zlib";

const ROOT = process.cwd();
const STATIC_DIR = path.join(ROOT, ".vercel/output/static");
const PUBLIC_DIR = path.join(ROOT, "public");
const DOCS_DIR = path.join(ROOT, "docs", "metrics");
const BASELINE_FILE = path.join(DOCS_DIR, "baseline-metrics.json");
const AFTER_FILE = path.join(DOCS_DIR, "after-metrics.json");

const KEY_ROUTES = [
  "/",
  "/about",
  "/work",
  "/services",
  "/photos",
  "/writing",
  "/growth",
  "/gear",
  "/resume",
  "/certificates",
];

const BROWSER_ROUTES = ["/", "/about", "/work", "/services", "/photos", "/writing", "/growth"];
const RESPONSIVE_WIDTHS = [375, 390, 768, 1024, 1440, 1920];

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium-browser",
  "/usr/bin/chromium",
].filter(Boolean);

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".pdf": "application/pdf",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
};

const COMPRESSIBLE_EXTS = new Set([
  ".html",
  ".css",
  ".js",
  ".mjs",
  ".json",
  ".svg",
  ".xml",
  ".txt",
  ".md",
  ".webmanifest",
]);

async function exists(target) {
  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
}

function gzipSize(buf) {
  return gzipSync(buf, { level: 9 }).length;
}

function brotliSize(buf) {
  return brotliCompressSync(buf, {
    params: { [zlibConstants.BROTLI_PARAM_QUALITY]: 6 },
  }).length;
}

async function dirStats(dirPath) {
  let totalBytes = 0;
  let fileCount = 0;
  const byExt = {};

  async function walk(current) {
    let entries;
    try {
      entries = await readdir(current, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (entry.name === ".DS_Store") continue;
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
      } else if (entry.isFile()) {
        const s = await stat(full);
        totalBytes += s.size;
        fileCount += 1;
        const ext = path.extname(entry.name).toLowerCase() || "(none)";
        if (!byExt[ext]) byExt[ext] = { files: 0, bytes: 0 };
        byExt[ext].files += 1;
        byExt[ext].bytes += s.size;
      }
    }
  }

  await walk(dirPath);
  return { totalBytes, fileCount, byExt };
}

function resolveHtmlPath(route) {
  if (route === "/") return path.join(STATIC_DIR, "index.html");
  const asIndex = path.join(STATIC_DIR, route.slice(1), "index.html");
  const asFile = path.join(STATIC_DIR, `${route.slice(1)}.html`);
  return { asIndex, asFile };
}

async function readRouteHtml(route) {
  if (route === "/") {
    const file = path.join(STATIC_DIR, "index.html");
    return { file, buffer: await readFile(file) };
  }
  const { asIndex, asFile } = resolveHtmlPath(route);
  if (await exists(asIndex)) return { file: asIndex, buffer: await readFile(asIndex) };
  if (await exists(asFile)) return { file: asFile, buffer: await readFile(asFile) };
  throw new Error(`Missing built HTML for route ${route}`);
}

/**
 * Recursively collects static ESM imports (`import ... from "./chunk.js"` / `import"./chunk.js"`)
 * Note: dynamic `import("./lazy.js")` is intentionally NOT counted as initial blocking/eager JS!
 */
async function collectTransitiveStaticJs(entryUrls, chunkCache) {
  const visited = new Set();
  const queue = [...entryUrls];

  while (queue.length > 0) {
    const urlPath = queue.shift();
    if (!urlPath || visited.has(urlPath) || !urlPath.startsWith("/_astro/")) continue;
    const diskPath = path.join(STATIC_DIR, urlPath.slice(1));
    if (!(await exists(diskPath))) continue;
    visited.add(urlPath);

    let info = chunkCache.get(urlPath);
    if (!info) {
      const buf = await readFile(diskPath);
      const src = buf.toString("utf8");
      const staticImports = [];
      // Match static ESM imports: `import ... from "./foo.js"` or `import "./foo.js"` (excluding `import("...")`)
      const importRegex = /\bimport\s*(?:[^"'();]*?\bfrom\s*)?["'](\.[^"']+\.m?js)["']/g;
      let match;
      while ((match = importRegex.exec(src)) !== null) {
        const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(urlPath), match[1]));
        staticImports.push(resolved);
      }
      info = {
        urlPath,
        rawBytes: buf.length,
        gzipBytes: gzipSize(buf),
        brotliBytes: brotliSize(buf),
        staticImports,
      };
      chunkCache.set(urlPath, info);
    }

    for (const dep of info.staticImports) {
      if (!visited.has(dep)) queue.push(dep);
    }
  }

  let rawBytes = 0;
  let gzipBytes = 0;
  let brotliBytes = 0;
  for (const urlPath of visited) {
    const info = chunkCache.get(urlPath);
    if (info) {
      rawBytes += info.rawBytes;
      gzipBytes += info.gzipBytes;
      brotliBytes += info.brotliBytes;
    }
  }

  return {
    files: [...visited].sort(),
    count: visited.size,
    rawBytes,
    gzipBytes,
    brotliBytes,
  };
}

async function analyzeStaticBuild() {
  if (!(await exists(STATIC_DIR))) {
    throw new Error(`Missing ${STATIC_DIR}. Run pnpm build first.`);
  }

  const [staticStats, publicStats, publicSubdirs] = await Promise.all([
    dirStats(STATIC_DIR),
    dirStats(PUBLIC_DIR),
    (async () => {
      const entries = await readdir(PUBLIC_DIR, { withFileTypes: true });
      const breakdown = {};
      for (const e of entries) {
        if (e.name.startsWith(".")) continue;
        const full = path.join(PUBLIC_DIR, e.name);
        if (e.isDirectory()) {
          breakdown[e.name] = await dirStats(full);
        } else if (e.isFile()) {
          const s = await stat(full);
          breakdown[e.name] = { totalBytes: s.size, fileCount: 1 };
        }
      }
      return breakdown;
    })(),
  ]);

  const astroDir = path.join(STATIC_DIR, "_astro");
  const astroEntries = (await exists(astroDir)) ? await readdir(astroDir) : [];
  const jsChunks = [];
  const cssChunks = [];

  for (const name of astroEntries) {
    const full = path.join(astroDir, name);
    const s = await stat(full);
    if (!s.isFile()) continue;
    if (name.endsWith(".js") || name.endsWith(".mjs")) {
      const buf = await readFile(full);
      jsChunks.push({
        file: `/_astro/${name}`,
        rawBytes: buf.length,
        gzipBytes: gzipSize(buf),
        brotliBytes: brotliSize(buf),
      });
    } else if (name.endsWith(".css")) {
      const buf = await readFile(full);
      cssChunks.push({
        file: `/_astro/${name}`,
        rawBytes: buf.length,
        gzipBytes: gzipSize(buf),
        brotliBytes: brotliSize(buf),
      });
    }
  }

  jsChunks.sort((a, b) => b.rawBytes - a.rawBytes);
  cssChunks.sort((a, b) => b.rawBytes - a.rawBytes);

  const chunkCache = new Map();
  const routes = {};

  for (const route of KEY_ROUTES) {
    const { buffer } = await readRouteHtml(route);
    const html = buffer.toString("utf8");

    // Extract initial scripts: <script type="module" src="/_astro/..."> + astro-island component-url + renderer-url (for client:load / client:idle)
    const entryScripts = new Set();
    for (const m of html.matchAll(/<script\b[^>]*\bsrc=["'](\/_astro\/[^"']+\.m?js)["'][^>]*>/gi)) {
      entryScripts.add(m[1]);
    }
    for (const m of html.matchAll(/<link\b[^>]*\brel=["']modulepreload["'][^>]*\bhref=["'](\/_astro\/[^"']+\.m?js)["'][^>]*>/gi)) {
      entryScripts.add(m[1]);
    }
    // Check astro-island tags: client="load" or client="idle" loads immediately on initial page load;
    // client="visible" or client="only" only loads if visible or mounted, though client="only" loads immediately.
    const islands = [];
    let serializedPropsBytes = 0;
    for (const m of html.matchAll(/<astro-island\b([^>]*)>/gi)) {
      const attrs = m[1];
      const client = attrs.match(/\bclient=["']([^"']+)["']/)?.[1] || "unknown";
      const componentUrl = attrs.match(/\bcomponent-url=["']([^"']+)["']/)?.[1] || "";
      const rendererUrl = attrs.match(/\brenderer-url=["']([^"']+)["']/)?.[1] || "";
      const propsAttr = attrs.match(/\bprops=["']([^"']*)["']/)?.[1] || "";
      serializedPropsBytes += Buffer.byteLength(propsAttr, "utf8");
      islands.push({
        client,
        componentUrl,
        propsBytes: Buffer.byteLength(propsAttr, "utf8"),
      });
      if (client === "load" || client === "idle" || client === "only") {
        if (componentUrl.startsWith("/_astro/")) entryScripts.add(componentUrl);
        if (rendererUrl.startsWith("/_astro/")) entryScripts.add(rendererUrl);
      }
    }

    const cssLinks = new Set();
    for (const m of html.matchAll(/<link\b[^>]*\brel=["']stylesheet["'][^>]*\bhref=["'](\/[^"']+\.css)["'][^>]*>/gi)) {
      cssLinks.add(m[1]);
    }
    for (const m of html.matchAll(/<link\b[^>]*\bhref=["'](\/[^"']+\.css)["'][^>]*\brel=["']stylesheet["'][^>]*>/gi)) {
      cssLinks.add(m[1]);
    }

    let cssRawBytes = 0;
    let cssGzipBytes = 0;
    let cssBrotliBytes = 0;
    for (const href of cssLinks) {
      const disk = path.join(STATIC_DIR, href.slice(1));
      if (await exists(disk)) {
        const cBuf = await readFile(disk);
        cssRawBytes += cBuf.length;
        cssGzipBytes += gzipSize(cBuf);
        cssBrotliBytes += brotliSize(cBuf);
      }
    }

    const jsGraph = await collectTransitiveStaticJs([...entryScripts], chunkCache);

    routes[route] = {
      html: {
        rawBytes: buffer.length,
        gzipBytes: gzipSize(buffer),
        brotliBytes: brotliSize(buffer),
        serializedPropsBytes,
      },
      initialJs: jsGraph,
      initialCss: {
        files: [...cssLinks].sort(),
        count: cssLinks.size,
        rawBytes: cssRawBytes,
        gzipBytes: cssGzipBytes,
        brotliBytes: cssBrotliBytes,
      },
      islands,
    };
  }

  return {
    staticDir: {
      totalBytes: staticStats.totalBytes,
      fileCount: staticStats.fileCount,
      byExt: staticStats.byExt,
    },
    publicDir: {
      totalBytes: publicStats.totalBytes,
      fileCount: publicStats.fileCount,
      subdirs: publicSubdirs,
    },
    bundles: {
      totalJsFiles: jsChunks.length,
      totalJsRawBytes: jsChunks.reduce((s, c) => s + c.rawBytes, 0),
      totalJsGzipBytes: jsChunks.reduce((s, c) => s + c.gzipBytes, 0),
      totalCssFiles: cssChunks.length,
      totalCssRawBytes: cssChunks.reduce((s, c) => s + c.rawBytes, 0),
      totalCssGzipBytes: cssChunks.reduce((s, c) => s + c.gzipBytes, 0),
      topJsChunks: jsChunks.slice(0, 15),
      cssChunks,
    },
    routes,
  };
}

/**
 * Starts a local HTTP production static server serving `.vercel/output/static`
 * with realistic Cache-Control headers and Brotli/Gzip compression.
 */
async function startStaticServer() {
  const compressedCache = new Map();

  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url || "/", "http://127.0.0.1");
      let pathname = decodeURIComponent(url.pathname);
      if (pathname !== "/" && pathname.endsWith("/")) {
        pathname = pathname.slice(0, -1);
      }

      let targetFile = null;
      if (pathname === "/") {
        targetFile = path.join(STATIC_DIR, "index.html");
      } else {
        const direct = path.resolve(STATIC_DIR, `.${pathname}`);
        if (!direct.startsWith(STATIC_DIR)) {
          res.writeHead(403);
          res.end("Forbidden");
          return;
        }
        if (await exists(direct)) {
          const st = await stat(direct);
          if (st.isFile()) targetFile = direct;
          else if (st.isDirectory() && (await exists(path.join(direct, "index.html")))) {
            targetFile = path.join(direct, "index.html");
          }
        }
        if (!targetFile && (await exists(`${direct}.html`))) {
          targetFile = `${direct}.html`;
        }
      }

      if (!targetFile) {
        const fallback404 = path.join(STATIC_DIR, "404.html");
        res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
        res.end((await exists(fallback404)) ? await readFile(fallback404) : "Not found");
        return;
      }

      const ext = path.extname(targetFile).toLowerCase();
      const contentType = MIME_TYPES[ext] || "application/octet-stream";
      const isImmutable =
        pathname.startsWith("/_astro/") || ext === ".woff2" || ext === ".woff";
      const cacheControl = isImmutable
        ? "public, max-age=31536000, immutable"
        : pathname.startsWith("/api/")
          ? "public, max-age=3600, stale-while-revalidate=86400"
          : "public, max-age=0, must-revalidate";

      const acceptEncoding = String(req.headers["accept-encoding"] || "");
      if (COMPRESSIBLE_EXTS.has(ext)) {
        let entry = compressedCache.get(targetFile);
        if (!entry) {
          const raw = await readFile(targetFile);
          entry = {
            raw,
            br: brotliCompressSync(raw, {
              params: { [zlibConstants.BROTLI_PARAM_QUALITY]: 5 },
            }),
            gz: gzipSync(raw, { level: 6 }),
          };
          compressedCache.set(targetFile, entry);
        }

        if (acceptEncoding.includes("br")) {
          res.writeHead(200, {
            "Content-Type": contentType,
            "Content-Encoding": "br",
            "Cache-Control": cacheControl,
            Vary: "Accept-Encoding",
          });
          res.end(entry.br);
          return;
        }
        if (acceptEncoding.includes("gzip")) {
          res.writeHead(200, {
            "Content-Type": contentType,
            "Content-Encoding": "gzip",
            "Cache-Control": cacheControl,
            Vary: "Accept-Encoding",
          });
          res.end(entry.gz);
          return;
        }
        res.writeHead(200, {
          "Content-Type": contentType,
          "Cache-Control": cacheControl,
        });
        res.end(entry.raw);
        return;
      }

      const fileStat = await stat(targetFile);
      res.writeHead(200, {
        "Content-Type": contentType,
        "Content-Length": String(fileStat.size),
        "Cache-Control": cacheControl,
      });
      createReadStream(targetFile).pipe(res);
    } catch (err) {
      res.writeHead(500);
      res.end(String(err));
    }
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const addr = server.address();
  return { server, port: addr.port, origin: `http://127.0.0.1:${addr.port}` };
}

/**
 * Minimal Chrome DevTools Protocol WebSocket client using Node 22 global WebSocket.
 */
class CdpSession {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.nextId = 1;
    this.pending = new Map();
    this.listeners = new Map();
  }

  async connect() {
    this.ws = new WebSocket(this.wsUrl);
    await new Promise((resolve, reject) => {
      this.ws.addEventListener("open", resolve, { once: true });
      this.ws.addEventListener("error", reject, { once: true });
    });
    this.ws.addEventListener("message", (event) => {
      const msg = JSON.parse(String(event.data));
      if (msg.id) {
        const entry = this.pending.get(msg.id);
        if (entry) {
          this.pending.delete(msg.id);
          if (msg.error) entry.reject(new Error(msg.error.message));
          else entry.resolve(msg.result);
        }
      } else if (msg.method) {
        const handlers = this.listeners.get(msg.method);
        if (handlers) {
          for (const fn of handlers) fn(msg.params || {});
        }
      }
    });
  }

  on(method, fn) {
    if (!this.listeners.has(method)) this.listeners.set(method, new Set());
    this.listeners.get(method).add(fn);
    return () => this.listeners.get(method)?.delete(fn);
  }

  send(method, params = {}) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  close() {
    try {
      this.ws?.close();
    } catch {}
  }
}

/**
 * Lighthouse v10/v11 log-normal quantile approximation for reference scoring.
 */
function erf(x) {
  const sign = x >= 0 ? 1 : -1;
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const absX = Math.abs(x);
  const t = 1 / (1 + p * absX);
  const y =
    1 - (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t) * Math.exp(-absX * absX);
  return sign * y;
}

function logNormalScore(value, p10, median) {
  if (value <= 0) return 1;
  const mu = Math.log(median);
  const sigma = Math.abs(Math.log(median) - Math.log(p10)) / (Math.SQRT2 * 0.9061938024368232);
  const z = (Math.log(value) - mu) / (sigma * Math.SQRT2);
  const score = 0.5 * (1 - erf(z));
  return Math.max(0, Math.min(1, score));
}

function computeLabPerformanceScore({ fcpMs, lcpMs, tbtMs, cls, mode }) {
  // Official Lighthouse v10/v11 Desktop vs Mobile control points (p10, median)
  const curves =
    mode === "mobile"
      ? {
          fcp: [1800, 3000],
          lcp: [2500, 4000],
          tbt: [200, 600],
          cls: [0.1, 0.25],
        }
      : {
          fcp: [934, 1600],
          lcp: [1200, 2400],
          tbt: [150, 350],
          cls: [0.1, 0.25],
        };

  const sFcp = logNormalScore(fcpMs, curves.fcp[0], curves.fcp[1]);
  const sLcp = logNormalScore(lcpMs, curves.lcp[0], curves.lcp[1]);
  const sTbt = logNormalScore(tbtMs, curves.tbt[0], curves.tbt[1]);
  const sCls = cls <= 0.001 ? 1 : logNormalScore(cls, curves.cls[0], curves.cls[1]);
  // Weighted average (FCP 15%, LCP 30%, TBT 30%, CLS 25%)
  return Math.round((sFcp * 0.15 + sLcp * 0.3 + sTbt * 0.3 + sCls * 0.25) * 100);
}

const OBSERVER_INIT_SCRIPT = `
(() => {
  window.__perfMetrics = {
    fcp: 0,
    lcp: 0,
    cls: 0,
    tbt: 0,
    longTasks: 0,
    hydrationErrors: [],
  };
  try {
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        if (e.name === 'first-contentful-paint') window.__perfMetrics.fcp = e.startTime;
      }
    }).observe({ type: 'paint', buffered: true });
  } catch {}
  try {
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        window.__perfMetrics.lcp = e.renderTime || e.loadTime || e.startTime;
      }
    }).observe({ type: 'largest-contentful-paint', buffered: true });
  } catch {}
  try {
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        if (!e.hadRecentInput) window.__perfMetrics.cls += e.value;
      }
    }).observe({ type: 'layout-shift', buffered: true });
  } catch {}
  try {
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        if (e.duration > 50) {
          window.__perfMetrics.longTasks += 1;
          window.__perfMetrics.tbt += (e.duration - 50);
        }
      }
    }).observe({ type: 'longtask', buffered: true });
  } catch {}
})();
`;

async function findChromeBinary() {
  for (const candidate of CHROME_CANDIDATES) {
    if (candidate && (await exists(candidate))) return candidate;
  }
  return null;
}

async function launchChrome(chromePath) {
  const userDataDir = await mkdtemp(path.join(os.tmpdir(), "perf-audit-chrome-"));
  const args = [
    "--headless=new",
    "--remote-debugging-port=0",
    `--user-data-dir=${userDataDir}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-background-networking",
    "--disable-sync",
    "--disable-extensions",
    "--mute-audio",
    "--window-size=1440,900",
    "about:blank",
  ];

  const proc = spawn(chromePath, args, { stdio: ["ignore", "pipe", "pipe"] });

  const wsBrowserUrl = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Timed out launching headless Chrome")), 12000);
    let stderr = "";
    proc.stderr.on("data", (chunk) => {
      stderr += chunk.toString("utf8");
      const m = stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (m) {
        clearTimeout(timer);
        resolve(m[1]);
      }
    });
    proc.once("exit", (code) => {
      clearTimeout(timer);
      reject(new Error(`Chrome exited prematurely (${code}): ${stderr}`));
    });
  });

  const debugPort = new URL(wsBrowserUrl).port;

  return {
    debugPort,
    async close() {
      proc.kill("SIGTERM");
      await new Promise((r) => setTimeout(r, 200));
      await rm(userDataDir, { recursive: true, force: true }).catch(() => {});
    },
  };
}

async function measureRouteInChrome({ debugPort, origin, route, mode, warmCache = false, screenshotDir = null }) {
  const newTargetRes = await fetch(`http://127.0.0.1:${debugPort}/json/new?about:blank`, {
    method: "PUT",
  });
  const target = await newTargetRes.json();
  const cdp = new CdpSession(target.webSocketDebuggerUrl);
  await cdp.connect();

  const requests = new Map();
  const urlCounts = new Map();
  const consoleErrors = [];
  const pageExceptions = [];

  cdp.on("Network.requestWillBeSent", (params) => {
    const reqUrl = params.request?.url || "";
    if (reqUrl.startsWith("data:")) return;
    requests.set(params.requestId, {
      url: reqUrl,
      type: params.type || "Other",
      encodedDataLength: 0,
      fromDiskCache: false,
      status: 0,
    });
    urlCounts.set(reqUrl, (urlCounts.get(reqUrl) || 0) + 1);
  });

  cdp.on("Network.responseReceived", (params) => {
    const rec = requests.get(params.requestId);
    if (rec) {
      rec.status = params.response?.status || 0;
      rec.fromDiskCache = Boolean(params.response?.fromDiskCache || params.response?.fromPrefetchCache);
      if (params.type) rec.type = params.type;
    }
  });

  cdp.on("Network.loadingFinished", (params) => {
    const rec = requests.get(params.requestId);
    if (rec) {
      rec.encodedDataLength = params.encodedDataLength || 0;
    }
  });

  cdp.on("Runtime.consoleAPICalled", (params) => {
    if (params.type === "error") {
      const text = (params.args || []).map((a) => a.value ?? a.description ?? "").join(" ");
      consoleErrors.push(text.slice(0, 240));
    }
  });

  cdp.on("Runtime.exceptionThrown", (params) => {
    pageExceptions.push(params.exceptionDetails?.text || "Uncaught exception");
  });

  await cdp.send("Page.enable");
  await cdp.send("Network.enable");
  await cdp.send("Runtime.enable");

  const width = mode === "mobile" ? 390 : 1440;
  const height = mode === "mobile" ? 844 : 900;
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: mode === "mobile" ? 3 : 2,
    mobile: mode === "mobile",
  });

  if (mode === "mobile") {
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  } else {
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });
  }

  await cdp.send("Page.addScriptToEvaluateOnNewDocument", {
    source: OBSERVER_INIT_SCRIPT,
  });

  if (!warmCache) {
    await cdp.send("Network.clearBrowserCache");
    await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
  } else {
    await cdp.send("Network.setCacheDisabled", { cacheDisabled: false });
    // Prime cache first
    const primeLoad = new Promise((resolve) => {
      const off = cdp.on("Page.loadEventFired", () => {
        off();
        resolve();
      });
      setTimeout(() => {
        off();
        resolve();
      }, 6000);
    });
    await cdp.send("Page.navigate", { url: `${origin}${route}` });
    await primeLoad;
    await new Promise((r) => setTimeout(r, 250));
    requests.clear();
    urlCounts.clear();
    consoleErrors.length = 0;
    pageExceptions.length = 0;
  }

  const loadFired = new Promise((resolve) => {
    const off = cdp.on("Page.loadEventFired", () => {
      off();
      resolve();
    });
    setTimeout(() => {
      off();
      resolve();
    }, 8000);
  });

  await cdp.send("Page.navigate", { url: `${origin}${route}` });
  await loadFired;
  // Settle 450ms for buffered LCP / LayoutShift / deferred idle work
  await new Promise((r) => setTimeout(r, 450));

  if (screenshotDir && !warmCache) {
    await mkdir(screenshotDir, { recursive: true });
    const slug = route === "/" ? "home" : route.slice(1).replaceAll("/", "_");
    const shot = await cdp.send("Page.captureScreenshot", { format: "png" });
    await writeFile(path.join(screenshotDir, `${slug}-${mode}.png`), Buffer.from(shot.data, "base64"));
  }

  // Click body slightly to finalize LCP entry if Chrome holds candidate until input/visibility
  const evalResult = await cdp.send("Runtime.evaluate", {
    returnByValue: true,
    expression: `(() => {
      const nav = performance.getEntriesByType('navigation')[0];
      const m = window.__perfMetrics || {};
      const docEl = document.documentElement;
      return {
        fcpMs: Math.round((m.fcp || 0) * 10) / 10,
        lcpMs: Math.round((m.lcp || m.fcp || 0) * 10) / 10,
        cls: Math.round((m.cls || 0) * 10000) / 10000,
        tbtMs: Math.round((m.tbt || 0) * 10) / 10,
        longTasks: m.longTasks || 0,
        dclMs: nav ? Math.round(nav.domContentLoadedEventEnd * 10) / 10 : 0,
        loadMs: nav ? Math.round(nav.loadEventEnd * 10) / 10 : 0,
        domNodes: document.getElementsByTagName('*').length,
        hasHorizontalOverflow: docEl.scrollWidth > docEl.clientWidth + 1,
      };
    })()`,
  });

  const browserPerf = evalResult.result?.value || {};
  const allReqs = [...requests.values()];
  const localReqs = allReqs.filter((r) => r.url.startsWith(origin));
  const videoReqs = allReqs.filter(
    (r) => r.type === "Media" || /\.(mp4|webm|m4v|mov)(\?|$)/i.test(r.url),
  );
  const duplicateUrls = [...urlCounts.entries()]
    .filter(([u, count]) => count > 1 && u.startsWith(origin))
    .map(([u, count]) => ({ url: u.replace(origin, ""), count }));

  const totalTransferredBytes = localReqs.reduce((s, r) => s + r.encodedDataLength, 0);
  const jsTransferredBytes = localReqs
    .filter((r) => r.type === "Script" || r.url.endsWith(".js"))
    .reduce((s, r) => s + r.encodedDataLength, 0);
  const cssTransferredBytes = localReqs
    .filter((r) => r.type === "Stylesheet" || r.url.endsWith(".css"))
    .reduce((s, r) => s + r.encodedDataLength, 0);
  const imgTransferredBytes = localReqs
    .filter((r) => r.type === "Image" || /\.(webp|avif|png|jpe?g|svg)(\?|$)/i.test(r.url))
    .reduce((s, r) => s + r.encodedDataLength, 0);
  const brokenLocalRequests = localReqs
    .filter((r) => r.status >= 400)
    .map((r) => ({ url: r.url.replace(origin, ""), status: r.status }));

  const labScore = computeLabPerformanceScore({
    fcpMs: browserPerf.fcpMs || 0,
    lcpMs: browserPerf.lcpMs || browserPerf.fcpMs || 0,
    tbtMs: browserPerf.tbtMs || 0,
    cls: browserPerf.cls || 0,
    mode,
  });

  cdp.close();
  await fetch(`http://127.0.0.1:${debugPort}/json/close/${target.id}`).catch(() => {});

  return {
    route,
    mode,
    cache: warmCache ? "warm" : "cold",
    labScore,
    ...browserPerf,
    requests: {
      total: allReqs.length,
      local: localReqs.length,
      fromDiskCache: localReqs.filter((r) => r.fromDiskCache).length,
      videoRequests: videoReqs.length,
      duplicateLocalRequests: duplicateUrls,
      brokenLocalRequests,
      totalTransferredBytes,
      jsTransferredBytes,
      cssTransferredBytes,
      imgTransferredBytes,
    },
    consoleErrors,
    pageExceptions,
  };
}

async function checkResponsiveViewports({ debugPort, origin, screenshotDir = null }) {
  const newTargetRes = await fetch(`http://127.0.0.1:${debugPort}/json/new?about:blank`, {
    method: "PUT",
  });
  const target = await newTargetRes.json();
  const cdp = new CdpSession(target.webSocketDebuggerUrl);
  await cdp.connect();
  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");
  await cdp.send("Network.enable");

  const checks = [];
  for (const route of ["/", "/services", "/photos"]) {
    const loadDone = new Promise((resolve) => {
      const off = cdp.on("Page.loadEventFired", () => {
        off();
        resolve();
      });
      setTimeout(() => {
        off();
        resolve();
      }, 6000);
    });
    await cdp.send("Page.navigate", { url: `${origin}${route}` });
    await loadDone;
    await new Promise((r) => setTimeout(r, 250));

    for (const width of RESPONSIVE_WIDTHS) {
      const height = width < 768 ? 844 : 900;
      await cdp.send("Emulation.setDeviceMetricsOverride", {
        width,
        height,
        deviceScaleFactor: width < 768 ? 2 : 1,
        mobile: width < 768,
      });
      await new Promise((r) => setTimeout(r, 120));

      if (screenshotDir && route === "/") {
        await mkdir(screenshotDir, { recursive: true });
        const shot = await cdp.send("Page.captureScreenshot", { format: "png" });
        await writeFile(
          path.join(screenshotDir, `viewport-${width}px.png`),
          Buffer.from(shot.data, "base64"),
        );
      }

      const res = await cdp.send("Runtime.evaluate", {
        returnByValue: true,
        expression: `(() => {
          const docEl = document.documentElement;
          const main = document.getElementById('main-content');
          return {
            scrollWidth: docEl.scrollWidth,
            clientWidth: docEl.clientWidth,
            overflowPx: Math.max(0, docEl.scrollWidth - docEl.clientWidth),
            mainVisible: Boolean(main && main.getBoundingClientRect().width > 0),
          };
        })()`,
      });
      checks.push({
        route,
        width,
        ...(res.result?.value || {}),
      });
    }
  }

  cdp.close();
  await fetch(`http://127.0.0.1:${debugPort}/json/close/${target.id}`).catch(() => {});
  return checks;
}

function fmtKB(bytes) {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function fmtMB(bytes) {
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function printSummary(report) {
  console.log("\n=== STATIC BUILD & STORAGE SUMMARY ===");
  console.log(
    `  .vercel/output/static : ${fmtMB(report.static.staticDir.totalBytes)} (${report.static.staticDir.fileCount} files)`,
  );
  console.log(
    `  public/               : ${fmtMB(report.static.publicDir.totalBytes)} (${report.static.publicDir.fileCount} files)`,
  );
  console.log(
    `  Total _astro JS       : ${fmtKB(report.static.bundles.totalJsRawBytes)} raw / ${fmtKB(report.static.bundles.totalJsGzipBytes)} gz (${report.static.bundles.totalJsFiles} chunks)`,
  );
  console.log(
    `  Total _astro CSS      : ${fmtKB(report.static.bundles.totalCssRawBytes)} raw / ${fmtKB(report.static.bundles.totalCssGzipBytes)} gz (${report.static.bundles.totalCssFiles} chunks)`,
  );

  console.log("\n=== INITIAL PAYLOAD PER ROUTE (TRANSITIVE STATIC GRAPH) ===");
  for (const [route, info] of Object.entries(report.static.routes)) {
    console.log(
      `  ${route.padEnd(14)} | HTML ${fmtKB(info.html.rawBytes).padStart(8)} (${fmtKB(info.html.gzipBytes).padStart(7)} gz, props ${fmtKB(info.html.serializedPropsBytes)}) | JS ${fmtKB(info.initialJs.rawBytes).padStart(9)} (${fmtKB(info.initialJs.gzipBytes).padStart(8)} gz, ${fmtKB(info.initialJs.brotliBytes).padStart(8)} br) | CSS ${fmtKB(info.initialCss.rawBytes).padStart(8)} (${fmtKB(info.initialCss.gzipBytes).padStart(7)} gz)`,
    );
  }

  if (report.browser) {
    console.log("\n=== HEADLESS CHROME CDP LAB METRICS (COLD CACHE) ===");
    for (const m of report.browser.cold) {
      console.log(
        `  [${m.mode.padEnd(7)}] ${m.route.padEnd(10)} | Score ${String(m.labScore).padStart(3)} | FCP ${String(m.fcpMs).padStart(6)}ms | LCP ${String(m.lcpMs).padStart(6)}ms | TBT ${String(m.tbtMs).padStart(5)}ms | CLS ${m.cls.toFixed(4)} | Reqs ${String(m.requests.local).padStart(2)} (${fmtKB(m.requests.totalTransferredBytes).padStart(8)}) | Videos ${m.requests.videoRequests}`,
      );
    }
    console.log("\n=== HEADLESS CHROME CDP LAB METRICS (WARM CACHE) ===");
    for (const m of report.browser.warm) {
      console.log(
        `  [${m.mode.padEnd(7)}] ${m.route.padEnd(10)} | Score ${String(m.labScore).padStart(3)} | FCP ${String(m.fcpMs).padStart(6)}ms | LCP ${String(m.lcpMs).padStart(6)}ms | TBT ${String(m.tbtMs).padStart(5)}ms | CLS ${m.cls.toFixed(4)} | DiskCache ${m.requests.fromDiskCache}/${m.requests.local} (${fmtKB(m.requests.totalTransferredBytes)})`,
      );
    }
  }
}

async function printComparison() {
  if (!(await exists(BASELINE_FILE)) || !(await exists(AFTER_FILE))) {
    console.log("\n[compare] Missing baseline-metrics.json or after-metrics.json.");
    return;
  }
  const before = JSON.parse(await readFile(BASELINE_FILE, "utf8"));
  const after = JSON.parse(await readFile(AFTER_FILE, "utf8"));

  console.log("\n=== BEFORE vs AFTER COMPARISON ===");
  console.log(
    `  Static output : ${fmtMB(before.static.staticDir.totalBytes)} -> ${fmtMB(after.static.staticDir.totalBytes)}`,
  );
  console.log(
    `  Total JS gz   : ${fmtKB(before.static.bundles.totalJsGzipBytes)} -> ${fmtKB(after.static.bundles.totalJsGzipBytes)}`,
  );
  for (const route of ["/", "/about", "/services", "/photos", "/work", "/writing", "/growth"]) {
    const b = before.static.routes[route];
    const a = after.static.routes[route];
    if (!b || !a) continue;
    const jsDelta = (((a.initialJs.gzipBytes - b.initialJs.gzipBytes) / b.initialJs.gzipBytes) * 100).toFixed(1);
    const htmlDelta = (((a.html.rawBytes - b.html.rawBytes) / b.html.rawBytes) * 100).toFixed(1);
    console.log(
      `  ${route.padEnd(10)} | Initial JS gz: ${fmtKB(b.initialJs.gzipBytes)} -> ${fmtKB(a.initialJs.gzipBytes)} (${jsDelta}%) | HTML raw: ${fmtKB(b.html.rawBytes)} -> ${fmtKB(a.html.rawBytes)} (${htmlDelta}%)`,
    );
  }
}

async function main() {
  const args = process.argv.slice(2);
  const saveBaseline = args.includes("--save-baseline");
  const saveAfter = args.includes("--save-after");
  const compare = args.includes("--compare");
  const staticOnly = args.includes("--static-only");
  const shotIdx = args.indexOf("--screenshots");
  const screenshotDir = shotIdx >= 0 && args[shotIdx + 1] ? path.resolve(args[shotIdx + 1]) : null;

  const staticReport = await analyzeStaticBuild();
  let browserReport = null;

  if (!staticOnly) {
    const chromePath = await findChromeBinary();
    if (chromePath) {
      const { server, port, origin } = await startStaticServer();
      let chrome = null;
      try {
        chrome = await launchChrome(chromePath);
        const cold = [];
        for (const route of BROWSER_ROUTES) {
          cold.push(
            await measureRouteInChrome({
              debugPort: chrome.debugPort,
              origin,
              route,
              mode: "desktop",
              warmCache: false,
              screenshotDir,
            }),
          );
          cold.push(
            await measureRouteInChrome({
              debugPort: chrome.debugPort,
              origin,
              route,
              mode: "mobile",
              warmCache: false,
              screenshotDir,
            }),
          );
        }

        const warm = [];
        for (const route of ["/", "/services", "/photos"]) {
          warm.push(
            await measureRouteInChrome({
              debugPort: chrome.debugPort,
              origin,
              route,
              mode: "desktop",
              warmCache: true,
            }),
          );
        }

        const responsiveChecks = await checkResponsiveViewports({
          debugPort: chrome.debugPort,
          origin,
          screenshotDir,
        });

        browserReport = {
          chromeBinary: chromePath,
          measuredAt: new Date().toISOString(),
          port,
          cold,
          warm,
          responsiveChecks,
        };
      } finally {
        await chrome?.close();
        await new Promise((r) => server.close(r));
      }
    } else {
      console.warn("[perf:audit] Chrome binary not found; recorded static bundle metrics only.");
    }
  }

  const report = {
    generatedAt: new Date().toISOString(),
    static: staticReport,
    browser: browserReport,
  };

  printSummary(report);

  if (saveBaseline) {
    await mkdir(DOCS_DIR, { recursive: true });
    await writeFile(BASELINE_FILE, JSON.stringify(report, null, 2) + "\n");
    console.log(`\n[perf:audit] Saved baseline metrics to ${BASELINE_FILE}`);
  }
  if (saveAfter) {
    await mkdir(DOCS_DIR, { recursive: true });
    await writeFile(AFTER_FILE, JSON.stringify(report, null, 2) + "\n");
    console.log(`\n[perf:audit] Saved post-optimization metrics to ${AFTER_FILE}`);
  }
  if (compare) {
    await printComparison();
  }
}

await main();
