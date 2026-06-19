import fs from 'node:fs/promises';
import path from 'node:path';
import type { APIRoute } from 'astro';

export const prerender = false;

const getUploadDir = () => {
  return path.join(process.cwd(), 'public', 'uploads');
};

const sanitizeFilename = (name: string) => {
  const ext = path.extname(name);
  const base = path.basename(name, ext);
  const cleanBase = base
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/-+/g, '-');
  return `${cleanBase}${ext}`;
};

export const GET: APIRoute = async () => {
  try {
    const dir = getUploadDir();
    await fs.mkdir(dir, { recursive: true });
    const files = await fs.readdir(dir);
    const uploads = [];

    for (const filename of files) {
      if (filename === '.DS_Store') continue;
      const filePath = path.join(dir, filename);
      const stat = await fs.stat(filePath);
      if (stat.isFile()) {
        uploads.push({
          name: filename,
          url: `/uploads/${filename}`,
          size: stat.size,
          mtime: stat.mtime
        });
      }
    }

    // Sort by modified time descending (newest first)
    uploads.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

    return new Response(JSON.stringify({ success: true, uploads }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const rawBody = await request.text();
    console.log("Raw body length:", rawBody.length);
    console.log("Raw body content preview:", rawBody.slice(0, 100));

    if (!rawBody) {
      throw new Error("Request body is completely empty!");
    }

    const { name, type, data } = JSON.parse(rawBody);

    if (!name || !data) {
      return new Response(JSON.stringify({ success: false, error: 'File name and base64 data are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const dir = getUploadDir();
    await fs.mkdir(dir, { recursive: true });

    const sanitizedName = sanitizeFilename(name);
    const filePath = path.join(dir, sanitizedName);

    // Extract base64 content
    const base64Data = data.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, 'base64');

    await fs.writeFile(filePath, buffer);

    return new Response(
      JSON.stringify({
        success: true,
        url: `/uploads/${sanitizedName}`,
        name: sanitizedName
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
