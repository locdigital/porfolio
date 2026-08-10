import path from "node:path";

const rootDir = process.cwd();

type GithubContentConfig = {
  token?: string;
  owner?: string;
  repo?: string;
  branch: string;
};

type GithubContentItem = {
  name: string;
  sha: string;
  type: "file" | "dir";
  content?: string;
};

export function getGithubContentConfig(): GithubContentConfig {
  return {
    token: process.env.GITHUB_TOKEN,
    owner: process.env.GITHUB_OWNER || process.env.VERCEL_GIT_REPO_OWNER,
    repo: process.env.GITHUB_REPO || process.env.VERCEL_GIT_REPO_SLUG,
    branch: process.env.GITHUB_BRANCH || process.env.VERCEL_GIT_COMMIT_REF || "main",
  };
}

export function isGithubContentConfigured(config = getGithubContentConfig()) {
  return Boolean(config.token && config.owner && config.repo);
}

export function shouldUseGithubContent(config = getGithubContentConfig()) {
  return (process.env.NODE_ENV === "production" || process.env.VERCEL === "1") && isGithubContentConfigured(config);
}

function toGitPath(fullPath: string): string {
  return path.relative(rootDir, fullPath).replace(/\\/g, "/");
}

async function fetchGithub<T>(urlPath: string, options: RequestInit = {}): Promise<T> {
  const config = getGithubContentConfig();
  if (!isGithubContentConfigured(config)) {
    throw new Error("GitHub Content API is not configured.");
  }

  const url = `https://api.github.com/repos/${config.owner}/${config.repo}/${urlPath}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `token ${config.token}`,
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "Astro-CMS-Agent",
      "Cache-Control": "no-cache",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`GitHub API error (${response.status}): ${errorText}`);
  }

  return response.json() as Promise<T>;
}

async function getGithubFileSha(filePath: string): Promise<string | undefined> {
  try {
    const config = getGithubContentConfig();
    const gitPath = toGitPath(filePath);
    const response = await fetchGithub<GithubContentItem>(`contents/${gitPath}?ref=${config.branch}`);
    return response.sha;
  } catch (error) {
    if (error instanceof Error && error.message.includes("404")) return undefined;
    throw error;
  }
}

export async function readGithubFile(filePath: string): Promise<string> {
  const config = getGithubContentConfig();
  const gitPath = toGitPath(filePath);
  const response = await fetchGithub<GithubContentItem>(`contents/${gitPath}?ref=${config.branch}`);
  if (response.content) {
    return Buffer.from(response.content.replace(/\n/g, ""), "base64").toString("utf8");
  }
  throw new Error(`File ${gitPath} has no content from GitHub API.`);
}

export async function readGithubDir(dirPath: string): Promise<string[]> {
  try {
    const config = getGithubContentConfig();
    const gitPath = toGitPath(dirPath);
    const items = await fetchGithub<GithubContentItem[]>(`contents/${gitPath}?ref=${config.branch}`);
    return items.filter((item) => item.type === "file").map((item) => item.name);
  } catch (error) {
    if (error instanceof Error && error.message.includes("404")) return [];
    throw error;
  }
}

export async function readGithubRawFile(gitPath: string): Promise<ArrayBuffer> {
  const config = getGithubContentConfig();
  if (!isGithubContentConfigured(config)) {
    throw new Error("GitHub Content API is not configured.");
  }

  const response = await fetch(
    `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${gitPath}?ref=${config.branch}`,
    {
      headers: {
        Authorization: `token ${config.token}`,
        Accept: "application/vnd.github.v3.raw",
        "User-Agent": "Astro-CMS-Agent",
      },
    },
  );

  if (!response.ok) {
    throw new Error(`GitHub asset not found: ${response.status}`);
  }

  return response.arrayBuffer();
}

export async function writeGithubFile(filePath: string, content: string | Buffer) {
  const config = getGithubContentConfig();
  const gitPath = toGitPath(filePath);
  const sha = await getGithubFileSha(filePath);
  const base64Content = typeof content === "string"
    ? Buffer.from(content).toString("base64")
    : content.toString("base64");

  await fetchGithub(`contents/${gitPath}`, {
    method: "PUT",
    body: JSON.stringify({
      message: `cms: update ${gitPath}`,
      content: base64Content,
      branch: config.branch,
      ...(sha ? { sha } : {}),
    }),
  });
}

export async function deleteGithubFile(filePath: string) {
  const config = getGithubContentConfig();
  const gitPath = toGitPath(filePath);
  const sha = await getGithubFileSha(filePath);
  if (!sha) return;

  await fetchGithub(`contents/${gitPath}`, {
    method: "DELETE",
    body: JSON.stringify({
      message: `cms: delete ${gitPath}`,
      sha,
      branch: config.branch,
    }),
  });
}
