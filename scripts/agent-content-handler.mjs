// This module runs at the edge only for content requests containing text/markdown.
// Ordinary HTML pages and image/font assets keep their existing static CDN path.
export function preferredRepresentation(accept = "*/*") {
  const ranges = accept.toLowerCase().split(",").map((value) => {
    const [type, ...params] = value.trim().split(";");
    const rawQuality = params.find(param => param.trim().startsWith("q="))?.trim().slice(2);
    const quality = rawQuality === undefined ? 1 : /^(?:0(?:\.\d{0,3})?|1(?:\.0{0,3})?)$/.test(rawQuality) ? Number(rawQuality) : 0;
    return { type: type.trim(), quality };
  });
  function preference(type) {
    const candidates = ranges.map(range => ({
      quality: range.quality,
      specificity: range.type === type ? 2 : range.type === "text/*" ? 1 : range.type === "*/*" ? 0 : -1,
    })).filter(range => range.specificity >= 0).sort((a, b) => b.specificity - a.specificity || b.quality - a.quality);
    return candidates[0] ?? { quality: 0, specificity: -1 };
  }
  const html = preference("text/html");
  const markdown = preference("text/markdown");
  if (!html.quality && !markdown.quality) return null;
  return markdown.quality > html.quality || (markdown.quality === html.quality && markdown.specificity > html.specificity) ? "markdown" : "html";
}

export function createContentHandler(documents, fetchHtml = fetch) {
  return async function handler(request) {
    const url = new URL(request.url);
    let pathname;
    try { pathname = decodeURIComponent(url.pathname).replace(/\/+$/, "") || "/"; }
    catch { pathname = "/__invalid_path"; }
    const headers = new Headers({
      "Content-Type": "text/markdown; charset=utf-8",
      "Vary": "Accept",
      // Vercel does not use arbitrary Vary values as CDN cache keys.
      // Never allow a negotiated response to replace a cached browser page.
      "Cache-Control": "private, no-store",
      "Vercel-CDN-Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    });
    if (!["GET", "HEAD"].includes(request.method)) {
      headers.set("Allow", "GET, HEAD");
      return new Response("# Method not allowed\n\nUse GET or HEAD to read this public page.\n", { status: 405, headers });
    }
    const representation = preferredRepresentation(request.headers.get("accept") ?? "*/*");
    if (!representation) return new Response(request.method === "HEAD" ? null : "# Not acceptable\n\nRequest text/html or text/markdown.\n", { status: 406, headers });
    if (representation === "html") {
      const response = await fetchHtml(url, { method: request.method, headers: { Accept: "text/html" }, redirect: "manual" });
      const htmlHeaders = new Headers(response.headers);
      htmlHeaders.delete("content-encoding");
      htmlHeaders.delete("content-length");
      htmlHeaders.set("Vary", "Accept");
      htmlHeaders.set("Cache-Control", "private, no-store");
      htmlHeaders.set("Vercel-CDN-Cache-Control", "no-store");
      return new Response(response.body, { status: response.status, headers: htmlHeaders });
    }
    const document = Object.hasOwn(documents, pathname) ? documents[pathname] : undefined;
    const missing = "# Page not found\n\nThe requested page does not exist or has moved. Browse the [site guide](https://loc.digital/llms.txt), [sitemap](https://loc.digital/sitemap-index.xml), or [home page](https://loc.digital/).\n";
    if (document) headers.set("Content-Location", new URL(pathname, "https://loc.digital").href);
    return new Response(request.method === "HEAD" ? null : document ?? missing, { status: document && pathname !== "/404" ? 200 : 404, headers });
  };
}
