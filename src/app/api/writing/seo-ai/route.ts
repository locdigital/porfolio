import { NextRequest, NextResponse } from "next/server";
import { isCmsRequestAuthorized } from "@/lib/cms-auth";
import type { Post } from "@/lib/writing/posts";
import {
  applySeoAutofill,
  sanitizeSeoText,
  suggestSeoAutofill,
  type SeoAutofillSuggestion,
} from "@/lib/writing/seo-autofill";
import { computeSeoChecklist, computeSeoScore } from "@/lib/writing/seo";

type SeoAiPayload = {
  post?: Partial<Post>;
};

function readEnv(name: string) {
  return process.env[name];
}

function extractJson(text: string) {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
  const candidate = fenced ?? trimmed.match(/\{[\s\S]*\}/)?.[0] ?? trimmed;
  return JSON.parse(candidate);
}

async function geminiSeoFill(
  post: Partial<Post>,
  fallback: SeoAutofillSuggestion,
  apiKey: string
): Promise<SeoAutofillSuggestion> {
  const content = sanitizeSeoText(`${post.contentMarkdown ?? ""} ${post.contentHtml ?? ""}`, 2400);
  const prompt = [
    "You are writing SEO metadata for a personal Vietnamese blog.",
    "Return ONLY compact JSON with these string keys: seoTitle, seoDescription, focusKeyword, ogTitle, ogDescription.",
    "Rules:",
    "- Vietnamese natural language, warm and editorial, no clickbait.",
    "- Never include markdown syntax such as #, ##, bullets, links, or code fences.",
    "- seoTitle: 45-60 characters when possible.",
    "- seoDescription: 120-160 characters, one sentence or two short clauses.",
    "- focusKeyword: 2-7 words, readable Vietnamese phrase.",
    "- ogTitle can match seoTitle.",
    "- ogDescription can match seoDescription.",
    `Post title: ${post.title || "Untitled"}`,
    `Existing focus keyword: ${post.focusKeyword || ""}`,
    `Article excerpt/content: ${content}`,
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
          maxOutputTokens: 360,
          responseMimeType: "application/json",
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini request failed: ${response.status}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini returned an empty response.");

  const parsed = extractJson(text);
  const seoTitle = sanitizeSeoText(String(parsed.seoTitle || fallback.seoTitle), 60);
  const seoDescription = sanitizeSeoText(String(parsed.seoDescription || fallback.seoDescription), 160);
  const focusKeyword = sanitizeSeoText(String(parsed.focusKeyword || fallback.focusKeyword), 60);
  const ogTitle = sanitizeSeoText(String(parsed.ogTitle || seoTitle), 60);
  const ogDescription = sanitizeSeoText(String(parsed.ogDescription || seoDescription), 160);

  return {
    ...fallback,
    seoTitle: seoTitle || fallback.seoTitle,
    seoDescription: seoDescription || fallback.seoDescription,
    focusKeyword: focusKeyword || fallback.focusKeyword,
    ogTitle: ogTitle || seoTitle || fallback.ogTitle,
    ogDescription: ogDescription || seoDescription || fallback.ogDescription,
  };
}

export async function POST(request: NextRequest) {
  if (!isCmsRequestAuthorized(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  let payload: SeoAiPayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON payload." }, { status: 400 });
  }

  const post = payload.post ?? {};
  const localPreview = suggestSeoAutofill(post);
  const apiKey = readEnv("GEMINI_API_KEY") || readEnv("PUBLIC_GEMINI_API_KEY");

  if (!apiKey) {
    return NextResponse.json({ success: true, source: "fallback", preview: localPreview });
  }

  try {
    const suggestions = await geminiSeoFill(
      post,
      localPreview.suggestions as SeoAutofillSuggestion,
      apiKey
    );
    const projectedPost = { ...post, ...applySeoAutofill(post, suggestions) };

    return NextResponse.json({
      success: true,
      source: "gemini",
      preview: {
        ...localPreview,
        suggestions,
        projectedScore: computeSeoScore(computeSeoChecklist(projectedPost)),
      },
    });
  } catch {
    return NextResponse.json({ success: true, source: "fallback", preview: localPreview });
  }
}
