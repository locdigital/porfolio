import fs from 'node:fs/promises';
import path from 'node:path';
import type { APIRoute } from 'astro';

// Ensure the writing directory exists
const getWritingDir = () => {
  const dir = path.join(process.cwd(), 'src', 'content', 'writing');
  return dir;
};

// Simple Markdown frontmatter parser
function parseMarkdown(fileContent: string) {
  const match = fileContent.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) {
    return { data: {}, content: fileContent };
  }
  const fmText = match[1];
  const body = match[2];
  const data: any = {};
  fmText.split('\n').forEach(line => {
    const idx = line.indexOf(':');
    if (idx !== -1) {
      const key = line.slice(0, idx).trim();
      let val = line.slice(idx + 1).trim();
      
      // Parse arrays
      if (val.startsWith('[') && val.endsWith(']')) {
        try {
          data[key] = JSON.parse(val.replace(/'/g, '"'));
        } catch {
          data[key] = val.slice(1, -1).split(',').map(s => s.trim().replace(/^['"]|['"]$/g, ''));
        }
      } else if (val === 'true') {
        data[key] = true;
      } else if (val === 'false') {
        data[key] = false;
      } else {
        // Strip quotes if wrapped
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        data[key] = val;
      }
    }
  });
  return { data, content: body };
}

// Simple Markdown frontmatter serializer
function stringifyMarkdown(data: any, content: string) {
  let fm = '---\n';
  for (const [key, val] of Object.entries(data)) {
    if (val === undefined || val === null) continue;
    if (Array.isArray(val)) {
      fm += `${key}: [${val.map(v => `"${v}"`).join(', ')}]\n`;
    } else if (typeof val === 'boolean') {
      fm += `${key}: ${val}\n`;
    } else if (key === 'publishedAt') {
      const d = val instanceof Date ? val : new Date(val);
      fm += `${key}: "${d.toISOString()}"\n`;
    } else {
      fm += `${key}: "${String(val).replace(/"/g, '\\"')}"\n`;
    }
  }
  fm += '---\n';
  return fm + content;
}

export const GET: APIRoute = async () => {
  try {
    const dir = getWritingDir();
    await fs.mkdir(dir, { recursive: true });
    const files = await fs.readdir(dir);
    const posts = [];

    for (const filename of files) {
      if (filename.endsWith('.md') || filename.endsWith('.mdx')) {
        const filePath = path.join(dir, filename);
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const { data, content } = parseMarkdown(fileContent);
        
        posts.push({
          slug: path.basename(filename, path.extname(filename)),
          data: {
            title: data.title || '',
            headline: data.headline || '',
            summary: data.summary || '',
            keyword: data.keyword || '',
            metaDescription: data.metaDescription || '',
            coverImage: data.coverImage || '',
            publishedAt: data.publishedAt ? new Date(data.publishedAt) : new Date(),
            tags: data.tags || [],
            draft: data.draft ?? false,
          },
          content: content.trim()
        });
      }
    }

    // Sort by publication date descending
    posts.sort((a, b) => b.data.publishedAt.getTime() - a.data.publishedAt.getTime());

    return new Response(JSON.stringify({ success: true, posts }), {
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
    const { slug, data, content } = await request.json();
    if (!slug) {
      return new Response(JSON.stringify({ success: false, error: 'Slug is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const dir = getWritingDir();
    await fs.mkdir(dir, { recursive: true });
    
    // Ensure date is formatted properly
    const postData = {
      ...data,
      publishedAt: data.publishedAt || new Date().toISOString()
    };

    const filePath = path.join(dir, `${slug}.md`);
    const fileContent = stringifyMarkdown(postData, content || '');
    await fs.writeFile(filePath, fileContent, 'utf-8');

    return new Response(JSON.stringify({ success: true, message: 'Article created successfully' }), {
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

export const PUT: APIRoute = async ({ request }) => {
  try {
    const { originalSlug, slug, data, content } = await request.json();
    if (!originalSlug || !slug) {
      return new Response(JSON.stringify({ success: false, error: 'originalSlug and slug are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const dir = getWritingDir();
    const oldPath = path.join(dir, `${originalSlug}.md`);
    const newPath = path.join(dir, `${slug}.md`);

    // Delete old file if slug changed
    if (originalSlug !== slug) {
      if (await fs.stat(oldPath).catch(() => false)) {
        await fs.unlink(oldPath);
      }
    }

    const postData = {
      ...data,
      publishedAt: data.publishedAt || new Date().toISOString()
    };

    const fileContent = stringifyMarkdown(postData, content || '');
    await fs.writeFile(newPath, fileContent, 'utf-8');

    return new Response(JSON.stringify({ success: true, message: 'Article updated successfully' }), {
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

export const DELETE: APIRoute = async ({ request }) => {
  try {
    const { slug } = await request.json();
    if (!slug) {
      return new Response(JSON.stringify({ success: false, error: 'Slug is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const dir = getWritingDir();
    const filePath = path.join(dir, `${slug}.md`);

    if (await fs.stat(filePath).catch(() => false)) {
      await fs.unlink(filePath);
      return new Response(JSON.stringify({ success: true, message: 'Article deleted successfully' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      return new Response(JSON.stringify({ success: false, error: 'Article not found' }), {
        status: 444,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
