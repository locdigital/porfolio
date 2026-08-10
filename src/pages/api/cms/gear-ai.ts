import type { APIRoute } from "astro";
import { isCmsDisabledInProduction, isCmsRequestAuthorized } from "../../../lib/cms-auth";
import { json, readJsonBody } from "../../../lib/http";

export const prerender = false;

type GearAiPayload = {
  name?: string;
  sectionTitle?: string;
};

type GearAiResult = {
  headline: string;
  tag: string;
  description: string;
  source: "gemini" | "fallback";
};

function readEnv(name: string) {
  return process.env[name] || import.meta.env[name];
}

function titleCase(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function inferTag(name: string, sectionTitle: string) {
  const haystack = `${name} ${sectionTitle}`.toLowerCase();
  if (/monitor|display|screen/.test(haystack)) return "Display";
  if (/arm|mount|stand/.test(haystack)) return "Monitor Arm";
  if (/keyboard|keycap|switch/.test(haystack)) return "Keyboard";
  if (/mouse|trackpad/.test(haystack)) return "Mouse";
  if (/camera|nikon|sony|canon|fujifilm/.test(haystack)) return "Camera";
  if (/lens|nikkor|voigtlander|sigma|tamron/.test(haystack)) return "Lens";
  if (/chair|desk|ergonomic/.test(haystack)) return "Ergonomics";
  if (/bike|cycling|canyon|giant/.test(haystack)) return "Bike";
  if (/shoe|run|trail|hiking/.test(haystack)) return "Outdoor";
  if (/phone|iphone|ipad|macbook|mac mini|laptop|desktop/.test(haystack)) return "Device";
  return sectionTitle ? titleCase(sectionTitle) : "Gear";
}

function fallbackFill(name: string, sectionTitle: string): GearAiResult {
  const cleanName = name.trim() || "New Product";
  const tag = inferTag(cleanName, sectionTitle);

  return {
    headline: `${tag} for daily work`,
    tag,
    description: `${cleanName} is part of my ${sectionTitle || "everyday"} setup. I use it for reliable day-to-day work, cleaner desk organization, and a smoother creative workflow.`,
    source: "fallback",
  };
}

function extractJson(text: string) {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
  const candidate = fenced ?? trimmed.match(/\{[\s\S]*\}/)?.[0] ?? trimmed;
  return JSON.parse(candidate);
}

async function geminiFill(name: string, sectionTitle: string, apiKey: string): Promise<GearAiResult> {
  const prompt = [
    "You are filling a personal portfolio gear library.",
    "Return ONLY compact JSON with these string keys: headline, tag, description.",
    "Rules:",
    "- headline: 2-5 words, product role, no hype.",
    "- tag: short product category, 1-3 words.",
    "- description: one plain sentence, 18-28 words, first-person compatible, no fake specs.",
    `Product name: ${name}`,
    `Section: ${sectionTitle || "Gear"}`,
  ].join("\n");

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.35,
          maxOutputTokens: 220,
          responseMimeType: "application/json",
        },
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Gemini request failed: ${response.status}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini returned an empty response.");

  const parsed = extractJson(text);
  const fallback = fallbackFill(name, sectionTitle);

  return {
    headline: String(parsed.headline || fallback.headline).slice(0, 90),
    tag: String(parsed.tag || fallback.tag).slice(0, 40),
    description: String(parsed.description || fallback.description).slice(0, 260),
    source: "gemini",
  };
}

export const POST: APIRoute = async ({ request }) => {
  if (isCmsDisabledInProduction()) {
    return new Response("Not found", { status: 404 });
  }

  if (!isCmsRequestAuthorized(request)) {
    return json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  let payload: GearAiPayload;
  try {
    payload = await readJsonBody<GearAiPayload>(request);
  } catch {
    return json({ success: false, error: "Invalid JSON payload." }, { status: 400 });
  }

  const name = String(payload.name ?? "").trim();
  const sectionTitle = String(payload.sectionTitle ?? "").trim();

  if (!name) {
    return json({ success: false, error: "Enter a product name first." }, { status: 400 });
  }

  const apiKey = readEnv("GEMINI_API_KEY") || readEnv("PUBLIC_GEMINI_API_KEY");

  try {
    const result = apiKey
      ? await geminiFill(name, sectionTitle, apiKey)
      : fallbackFill(name, sectionTitle);

    return json({ success: true, item: result });
  } catch {
    return json({ success: true, item: fallbackFill(name, sectionTitle) });
  }
};
