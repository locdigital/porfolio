import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { htmlToMarkdown } from "./html-to-markdown.mjs";

const output = path.resolve(".vercel/output");
const staticDir = path.join(output, "static");
const documents = {};

async function collect(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name === "_astro") continue;
    const filename = path.join(dir, entry.name);
    if (entry.isDirectory()) await collect(filename);
    else if (entry.name.endsWith(".html")) {
      const relative = path.relative(staticDir, filename).split(path.sep).join("/");
      const pathname = `/${relative.replace(/(?:^|\/)index\.html$/, "").replace(/\.html$/, "").replace(/\/$/, "")}`;
      const html = await readFile(filename, "utf8");
      if (!html.includes('id="main-content"')) continue;
      documents[pathname] = htmlToMarkdown(html, new URL(pathname, "https://loc.digital").href);
      const markdownFile = path.join(staticDir, pathname === "/" ? "index.md" : `${pathname.slice(1)}.md`);
      await mkdir(path.dirname(markdownFile), { recursive: true });
      await writeFile(markdownFile, documents[pathname]);
    }
  }
}
await collect(staticDir);
if (!documents["/"] || !documents["/privacy"]) throw new Error("Missing core pages in agent content build.");

const functionDir = path.join(output, "functions/_agent-content.func");
await mkdir(functionDir, { recursive: true });
await writeFile(path.join(functionDir, ".vc-config.json"), JSON.stringify({ runtime: "edge", entrypoint: "index.js" }, null, 2));
await writeFile(path.join(functionDir, "handler.js"), await readFile(new URL("./agent-content-handler.mjs", import.meta.url), "utf8"));
await writeFile(path.join(functionDir, "index.js"), `import { createContentHandler } from './handler.js';\nconst documents = ${JSON.stringify(documents)};\nexport default createContentHandler(documents);\n`);

const configFile = path.join(output, "config.json");
const config = JSON.parse(await readFile(configFile, "utf8"));
// Insert before the filesystem handler, but after existing redirects.
const insertAt = config.routes.findIndex(route => route.handle);
const contentPath = "^/(?!_astro/|assets/|api/|_vercel/)[^.]*$";
const markdownType = ".*[tT][eE][xX][tT]/[mM][aA][rR][kK][dD][oO][wW][nN].*";
config.routes.splice(insertAt, 0,
  { src: "^/api/(photos|photos-widget|search-index)\\.json$", headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400" }, continue: true },
  { src: "^/.*\\.md$", headers: { "Content-Type": "text/markdown; charset=utf-8", "X-Content-Type-Options": "nosniff" }, continue: true },
  { src: contentPath, headers: { Vary: "Accept" }, continue: true },
  { src: contentPath, has: [{ type: "header", key: "accept", value: markdownType }], dest: "/_agent-content" },
);
await writeFile(configFile, JSON.stringify(config, null, 2) + "\n");
console.log(`[agent-content] ${Object.keys(documents).length} Markdown pages; browser pages remain static.`);
