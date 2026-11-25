import { execFileSync } from "node:child_process";
import { mkdir, mkdtemp, rename, rm } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const [input, destination, ...flags] = process.argv.slice(2);
if (!input || !destination || flags.some((flag) => !["--silent", "--webm"].includes(flag))) {
  throw new Error("Usage: node scripts/optimize-video.mjs source.mov new-directory [--silent] [--webm]");
}
const source = path.resolve(input);
const probe = JSON.parse(execFileSync("ffprobe", ["-v", "error", "-show_streams", "-of", "json", source]));
const video = probe.streams.find((stream) => stream.codec_type === "video" && !stream.disposition?.attached_pic);
if (!video) throw new Error("No video stream found.");
const rotation = video.side_data_list?.find((side) => side.rotation !== undefined)?.rotation ?? video.tags?.rotate ?? 0;
const height = Math.abs(Number(rotation)) % 180 === 90 ? video.width : video.height;
const directory = path.resolve(destination);
await mkdir(path.dirname(directory), { recursive: true });
const stage = await mkdtemp(directory + ".tmp-");
const encode = (args, filename) => execFileSync("ffmpeg", [
  "-v", "error", "-nostdin", "-n", "-i", source, "-map", "0:" + video.index, ...args, path.join(stage, filename),
], { stdio: "inherit" });
try {
  const frame = execFileSync("ffmpeg", ["-v", "error", "-nostdin", "-i", source, "-map", "0:" + video.index,
    "-frames:v", "1", "-vf", "scale='min(iw,1280)':-2", "-f", "image2pipe", "-c:v", "png", "pipe:1"],
    { maxBuffer: 64 * 1024 * 1024 });
  await sharp(frame).webp({ quality: 82 }).toFile(path.join(stage, "poster.webp"));
  for (const size of new Set([720, 1080].map((target) => 2 * Math.floor(Math.min(target, height) / 2)))) {
    const scale = ["-vf", "scale=-2:" + size, "-pix_fmt", "yuv420p"];
    const audio = flags.includes("--silent") ? ["-an"] : ["-map", "0:a:0?", "-c:a", "aac", "-b:a", "128k"];
    encode([...scale, "-c:v", "libx264", "-crf", "22", "-preset", "medium", "-movflags", "+faststart", ...audio], size + "p.mp4");
    if (flags.includes("--webm")) {
      const opus = flags.includes("--silent") ? ["-an"] : ["-map", "0:a:0?", "-c:a", "libopus", "-b:a", "96k"];
      encode([...scale, "-c:v", "libvpx-vp9", "-crf", "33", "-b:v", "0", ...opus], size + "p.webm");
    }
  }
  await rename(stage, directory);
} finally {
  await rm(stage, { recursive: true, force: true });
}
