import type { APIRoute } from "astro";
import { getProjects } from "../../lib/cms";

export const prerender = false;

type QuestionPayload = {
  question?: string;
};

const REFUSAL =
  "Mình chỉ trả lời các câu hỏi về Loc, công việc/ngành nghề của Loc, portfolio, kỹ năng, kinh nghiệm, availability và thông tin liên hệ thôi nha.";

function json(data: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  return new Response(JSON.stringify(data), { ...init, headers });
}

function readEnv(name: string) {
  return process.env[name] || import.meta.env[name];
}

function usableApiKey(value: string | undefined) {
  if (!value) return "";
  if (/your_.*key/i.test(value)) return "";
  return value;
}

function compactText(value: string, maxLength = 5000) {
  return value.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function isInScope(question: string) {
  const q = question.toLowerCase();
  const inScopePatterns = [
    /\bloc\b/,
    /phuc loc|phúc lộc|nguyen phuc loc|nguyễn phúc lộc/,
    /portfolio|project|campaign|case study|work|experience|background|resume|cv/,
    /marketing|performance|paid media|meta ads|facebook ads|google ads|tiktok|tiktok shop|seo|sem|growth|funnel|automation|analytics|ga4|gtm|looker|roas|cpa|cpl|lead|revenue|gmv|ecommerce|e-commerce|digital/,
    /skill|expertise|tool|ngành|nghe|nghề|kinh nghiệm|dự án|chiến dịch|công việc|kỹ năng|chuyên môn/,
    /contact|email|linkedin|hire|available|freelance|full-time|opportunity|reach|connect|liên hệ|tuyển|hợp tác/,
    /\b(?:hi|hello|hey)\b|xin chào|chào/,
  ];
  const outOfScopePatterns = [
    /weather|stock|crypto|football|movie|recipe|math homework|translate|dịch|thời tiết|chứng khoán|bóng đá|nấu ăn/,
    /write code|debug|lập trình|code giúp|giải bài|làm bài tập/,
  ];

  if (outOfScopePatterns.some((pattern) => pattern.test(q)) && !inScopePatterns.some((pattern) => pattern.test(q))) {
    return false;
  }

  return inScopePatterns.some((pattern) => pattern.test(q));
}

async function buildPortfolioContext() {
  const projects = await getProjects();
  const projectContext = projects
    .map((project) => {
      const tags = Array.isArray(project.tags) ? project.tags.join(", ") : "";
      return [
        `Project: ${project.title}`,
        `Client: ${project.client}`,
        `Year: ${project.year}`,
        `Role: ${project.role}`,
        `Summary: ${project.summary}`,
        `Details: ${project.description}`,
        `Tools and skills: ${tags}`,
        project.link ? `Link: ${project.link}` : "",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n");

  return compactText(
    [
      "Profile:",
      "Name: Nguyen Phuc Loc / Phuc Loc Nguyen / Loc.",
      "Location: Ho Chi Minh City, Vietnam.",
      "Positioning: Senior Performance Marketing Executive focused on paid media, TikTok Shop GMV, SEO, automation, analytics, and revenue systems.",
      "Contact: email hi@loc.digital. LinkedIn: https://www.linkedin.com/in/phucloc. Resume: https://phucloc.digital/resume.",
      "Education: FPT University, Bachelor of Digital Marketing, graduated with Honors, GPA 9.4/10. Google Digital Marketing Specialization issued 2022.",
      "Core tools: Meta Ads, Google Ads, TikTok Ads, TikTok Shop, Google Analytics/GA4, GTM, Looker Studio, Ahrefs, SEMrush, Figma, n8n, email automation.",
      "",
      "Portfolio projects:",
      projectContext,
    ].join("\n"),
    9000
  );
}

function fallbackAnswer(question: string) {
  const q = question.toLowerCase();
  if (!isInScope(question)) return REFUSAL;
  if (/contact|email|linkedin|reach|connect|liên hệ/.test(q)) {
    return "Bạn có thể liên hệ Loc qua email hi@loc.digital hoặc LinkedIn: https://www.linkedin.com/in/phucloc.";
  }
  if (/hire|available|freelance|full-time|opportunity|tuyển|hợp tác/.test(q)) {
    return "Loc đang mở với các cơ hội performance marketing, growth, SEO, TikTok Shop, automation hoặc full-time phù hợp. Cách nhanh nhất là email hi@loc.digital.";
  }
  if (/skill|expertise|tool|kỹ năng|chuyên môn/.test(q)) {
    return "Loc mạnh về Performance Marketing trên Meta, Google và TikTok; TikTok Shop growth; SEO/SEM; GA4/GTM/Looker Studio; n8n và email automation; tối ưu ROAS, CPA, CPL, lead và revenue.";
  }
  if (/project|campaign|work|portfolio|dự án|chiến dịch/.test(q)) {
    return "Loc từng làm các dự án tăng trưởng cho PlayAh!, WorkFlow Space, POPS Worldwide, TOMATO Children's Home và các cộng đồng giáo dục, với trọng tâm là paid media, SEO, lead generation, TikTok Shop và automation.";
  }
  return "Loc là Senior Performance Marketing Executive ở TP.HCM, tập trung vào paid media, TikTok Shop, SEO, automation và revenue systems. Bạn có thể hỏi cụ thể về project, kỹ năng, kinh nghiệm hoặc cách liên hệ.";
}

async function askGemini(question: string, context: string, apiKey: string) {
  const prompt = [
    "You are the Ask Loc assistant on Nguyen Phuc Loc's personal portfolio website.",
    "Answer only questions about Loc, Loc's work/career/industry, portfolio projects, skills, experience, availability, and contact information.",
    `If the user asks anything outside that scope, reply exactly: "${REFUSAL}"`,
    "Use only the portfolio context below. Do not invent employers, metrics, credentials, availability terms, phone numbers, or private information.",
    "Answer in the same language as the user when possible. Keep it concise, warm, and specific. Prefer 2-5 short sentences.",
    "",
    "PORTFOLIO CONTEXT:",
    context,
    "",
    `USER QUESTION: ${question}`,
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
          maxOutputTokens: 420,
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini request failed: ${response.status}`);
  }

  const data = await response.json();
  return compactText(data?.candidates?.[0]?.content?.parts?.[0]?.text || "", 1600);
}

export const POST: APIRoute = async ({ request }) => {
  let payload: QuestionPayload;
  try {
    payload = await request.json();
  } catch {
    return json({ success: false, answer: "Invalid JSON payload." }, { status: 400 });
  }

  const question = compactText(String(payload.question ?? ""), 500);
  if (!question) {
    return json({ success: false, answer: "Bạn nhập câu hỏi trước nha." }, { status: 400 });
  }

  if (!isInScope(question)) {
    return json({ success: true, source: "scope-guard", answer: REFUSAL });
  }

  const apiKey = usableApiKey(readEnv("GEMINI_API_KEY")) || usableApiKey(readEnv("PUBLIC_GEMINI_API_KEY"));
  if (!apiKey) {
    return json({ success: true, source: "fallback", answer: fallbackAnswer(question) });
  }

  try {
    const answer = await askGemini(question, await buildPortfolioContext(), apiKey);
    return json({ success: true, source: "gemini", answer: answer || fallbackAnswer(question) });
  } catch {
    return json({ success: true, source: "fallback", answer: fallbackAnswer(question) });
  }
};
