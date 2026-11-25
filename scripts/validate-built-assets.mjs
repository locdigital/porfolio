import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { parse } from "parse5";

const root = path.resolve(".vercel/output/static");
const origin = "https://loc.digital";
const references = new Map();
function add(value, base) {
  if (!value || value.startsWith("#")) return;
  const url = new URL(value, base);
  if (url.origin === origin && !references.has(url.pathname)) references.set(url.pathname, base.pathname);
}
function cssReferences(css, base) {
  for (const match of css.matchAll(/url\(\s*["']?([^'")]+)["']?\s*\)/g)) add(match[1].trim(), base);
}
function walk(node, base) {
  const attrs = Object.fromEntries((node.attrs || []).map(({ name, value }) => [name, value]));
  if (["img", "source", "video", "audio", "script"].includes(node.tagName)) add(attrs.src, base);
  if (node.tagName === "video") add(attrs.poster, base);
  if (attrs.srcset && !attrs.srcset.startsWith("data:")) {
    for (const candidate of attrs.srcset.split(",")) add(candidate.trim().split(/\s+/)[0], base);
  }
  if (node.tagName === "link" && /^(?:stylesheet|preload|modulepreload|icon|apple-touch-icon)$/.test(attrs.rel)) add(attrs.href, base);
  if (attrs.style) cssReferences(attrs.style, base);
  if (node.tagName === "style") for (const child of node.childNodes || []) cssReferences(child.value || "", base);
  for (const child of node.childNodes || []) walk(child, base);
}

async function scan(dir) {
  for (const item of await readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, item.name);
    if (item.isDirectory()) await scan(file);
    else if (/\.(html|css)$/.test(item.name)) {
      const base = new URL(path.relative(root, file).split(path.sep).join("/"), origin);
      const data = await readFile(file, "utf8");
      if (item.name.endsWith(".css")) cssReferences(data, base);
      else walk(parse(data), base);
    }
  }
}

await scan(root);
let missing = 0;
for (const [url, page] of references) {
  try { await access(path.join(root, decodeURIComponent(url))); }
  catch { missing++; console.error("Missing", url, "referenced by", page); }
}
console.log(JSON.stringify({ localReferences: references.size, missing }));
if (missing) process.exitCode = 1;
