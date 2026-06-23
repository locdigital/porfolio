import type { APIRoute } from "astro";
import { promises as fs } from "node:fs";
import path from "node:path";
import { existsSync } from "node:fs";
import { isCmsDisabledInProduction, isCmsRequestAuthorized } from "../../../../lib/cms-auth";

export const prerender = false;

export const GET: APIRoute = async ({ params, request }) => {
  if (isCmsDisabledInProduction()) {
    return new Response("Not found", { status: 404 });
  }

  if (!isCmsRequestAuthorized(request)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const filePathParam = params.path;
  if (!filePathParam) {
    return new Response("Not found", { status: 404 });
  }

  const rootDir = process.cwd();
  // Safe path normalization to prevent directory traversal
  const safePath = path.normalize(filePathParam).replace(/^(\.\.(\/|\\|$))+/, '');

  // GitHub configuration
  const githubConfig = {
    token: process.env.GITHUB_TOKEN,
    owner: process.env.GITHUB_OWNER || process.env.VERCEL_GIT_REPO_OWNER,
    repo: process.env.GITHUB_REPO || process.env.VERCEL_GIT_REPO_SLUG,
    branch: process.env.GITHUB_BRANCH || process.env.VERCEL_GIT_COMMIT_REF || "main",
  };
  const isGithubEnabled = !!(githubConfig.token && githubConfig.owner && githubConfig.repo);
  const useGithub = (process.env.NODE_ENV === "production" || process.env.VERCEL === "1") && isGithubEnabled;

  let fileBuffer: ArrayBuffer | Buffer;
  let ext = path.extname(safePath).toLowerCase();

  if (useGithub) {
    try {
      const gitPath = `src/assets/photos/${safePath}`;
      const url = `https://api.github.com/repos/${githubConfig.owner}/${githubConfig.repo}/contents/${gitPath}?ref=${githubConfig.branch}`;
      const response = await fetch(url, {
        headers: {
          Authorization: `token ${githubConfig.token}`,
          Accept: "application/vnd.github.v3.raw",
          "User-Agent": "Astro-CMS-Agent",
        },
      });

      if (!response.ok) {
        return new Response(`GitHub Asset not found: ${response.status}`, { status: response.status });
      }

      fileBuffer = await response.arrayBuffer();
    } catch (error) {
      return new Response("Error fetching asset from GitHub", { status: 500 });
    }
  } else {
    const absolutePath = path.join(rootDir, "src", "assets", "photos", safePath);

    if (!existsSync(absolutePath)) {
      return new Response("Not found", { status: 404 });
    }

    try {
      fileBuffer = await fs.readFile(absolutePath);
    } catch (error) {
      return new Response("Error reading file", { status: 500 });
    }
  }

  let contentType = "application/octet-stream";
  if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
  else if (ext === ".png") contentType = "image/png";
  else if (ext === ".webp") contentType = "image/webp";
  else if (ext === ".gif") contentType = "image/gif";
  else if (ext === ".svg") contentType = "image/svg+xml";
  else if (ext === ".avif") contentType = "image/avif";

  return new Response(fileBuffer, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "no-store, no-cache, max-age=0, must-revalidate, proxy-revalidate",
    },
  });
};
