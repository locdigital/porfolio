import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const WIDTH = 1920;
const HEIGHT = 1080;

const POSTS = [
  {
    slug: "believe-in-yourself",
    source: "public/assets/photos/ta-chi-nhu/DSC_4558.webp",
    line1: "BELIEVE IN",
    line2: "YOURSELF",
    alt: "Cinematic thumbnail for Believe in Yourself featuring mountain ridges at Ta Chi Nhu",
  },
  {
    slug: "my-first-100k",
    source: "public/assets/photos/singapore/singapore-12.webp",
    line1: "MY FIRST",
    line2: "$100K",
    alt: "Cinematic thumbnail for My First $100K featuring the Singapore skyline",
  },
  {
    slug: "youth-without-regrets",
    source: "public/assets/photos/ha-giang/DSC_5496.webp",
    line1: "YOUTH WITHOUT",
    line2: "REGRETS",
    alt: "Cinematic thumbnail for A Youth Without Regrets featuring mountain roads in Ha Giang",
  },
  {
    slug: "sa-pa",
    source: "public/assets/photos/sa-pa/DSC_6545.webp",
    line1: "QUIET MORNINGS",
    line2: "IN SA PA",
    alt: "Cinematic thumbnail for Sa Pa featuring misty mountain valleys in Northern Vietnam",
  },
  {
    slug: "phoenix",
    source: "public/assets/photos/bali/DSC_0010.webp",
    line1: "RISING",
    line2: "STRONGER",
    alt: "Cinematic thumbnail for Phoenix featuring coastal cliffs in Bali",
  },
  {
    slug: "bullshit-jobs",
    source: "public/assets/photos/kuala-lumpur/kuala-lumpur-28.webp",
    line1: "OUTCOMES OVER",
    line2: "BUSYWORK",
    alt: "Cinematic thumbnail for Bullshit Jobs featuring city architecture in Kuala Lumpur",
  },
  {
    slug: "from-curiosity-to-creation",
    source: "public/assets/photos/phu-quy/phu-quy-06.webp",
    line1: "FROM CURIOSITY",
    line2: "TO CREATION",
    alt: "Cinematic thumbnail for From Curiosity to Creation featuring Phu Quy island",
  },
];

function escapeXml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Estimate text width for bold uppercase sans-serif so the staggered banner
 * tightly wraps the headline without overflowing or clipping.
 */
function estimateTextWidth(text, fontSize) {
  let units = 0;
  for (const ch of text) {
    if (ch === " ") units += 0.34;
    else if ("IJLT1$".includes(ch)) units += 0.62;
    else if ("MWQGOD".includes(ch)) units += 0.86;
    else units += 0.74;
  }
  return Math.round(units * fontSize);
}

function buildOverlaySvg({ line1, line2 }) {
  const fontSize = 90;
  const padX = 34;
  const padY = 18;
  const boxHeight = Math.round(fontSize * 0.92 + padY * 2);
  const gap = 4;
  const startX = 72;
  const bottomY = HEIGHT - 72;
  const box2Y = bottomY - boxHeight;
  const box1Y = box2Y - gap - boxHeight;

  const w1 = estimateTextWidth(line1, fontSize) + padX * 2;
  const w2 = estimateTextWidth(line2, fontSize) + padX * 2;

  const text1Y = box1Y + Math.round(boxHeight * 0.72);
  const text2Y = box2Y + Math.round(boxHeight * 0.72);

  return `
<svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bottomScrim" x1="0" y1="0.45" x2="0" y2="1">
      <stop offset="0%" stop-color="#070707" stop-opacity="0" />
      <stop offset="100%" stop-color="#070707" stop-opacity="0.52" />
    </linearGradient>
    <linearGradient id="leftScrim" x1="0" y1="0" x2="0.65" y2="0">
      <stop offset="0%" stop-color="#070707" stop-opacity="0.34" />
      <stop offset="100%" stop-color="#070707" stop-opacity="0" />
    </linearGradient>
  </defs>

  <!-- Subtle editorial scrims to guarantee contrast -->
  <rect x="0" y="0" width="${WIDTH}" height="${HEIGHT}" fill="url(#bottomScrim)" />
  <rect x="0" y="0" width="${WIDTH}" height="${HEIGHT}" fill="url(#leftScrim)" />

  <!-- Block 1: Black background (#070707), Amber Yellow text (#FFC400) -->
  <rect x="${startX}" y="${box1Y}" width="${w1}" height="${boxHeight}" fill="#070707" />
  <text
    x="${startX + padX}"
    y="${text1Y}"
    fill="#FFC400"
    font-family="Arial Black, Montserrat, Helvetica Neue, sans-serif"
    font-size="${fontSize}"
    font-weight="900"
    letter-spacing="-1.5"
  >${escapeXml(line1)}</text>

  <!-- Block 2: Amber Yellow background (#FFC400), Black text (#070707) -->
  <rect x="${startX}" y="${box2Y}" width="${w2}" height="${boxHeight}" fill="#FFC400" />
  <text
    x="${startX + padX}"
    y="${text2Y}"
    fill="#070707"
    font-family="Arial Black, Montserrat, Helvetica Neue, sans-serif"
    font-size="${fontSize}"
    font-weight="900"
    letter-spacing="-1.5"
  >${escapeXml(line2)}</text>
</svg>`.trim();
}

async function main() {
  const outDir = path.resolve("public/images/writing");
  fs.mkdirSync(outDir, { recursive: true });

  for (const post of POSTS) {
    const srcPath = path.resolve(post.source);
    const outPath = path.join(outDir, `${post.slug}.webp`);
    const svgBuffer = Buffer.from(buildOverlaySvg(post));

    await sharp(srcPath)
      .resize(WIDTH, HEIGHT, { fit: "cover", position: "attention" })
      .modulate({ brightness: 0.96, saturation: 1.06 })
      .linear(1.06, -6)
      .composite([{ input: svgBuffer, top: 0, left: 0 }])
      .webp({ quality: 90 })
      .toFile(outPath);

    console.log(`Generated ${path.relative(process.cwd(), outPath)}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
