import fs from 'node:fs/promises';
import path from 'node:path';
import type { APIRoute } from 'astro';

const getProjectsDir = () => {
  return path.join(process.cwd(), 'src', 'content', 'projects');
};

export const GET: APIRoute = async () => {
  try {
    const dir = getProjectsDir();
    await fs.mkdir(dir, { recursive: true });
    const files = await fs.readdir(dir);
    const projects = [];

    for (const filename of files) {
      if (filename.endsWith('.json')) {
        const filePath = path.join(dir, filename);
        const fileContent = await fs.readFile(filePath, 'utf-8');
        try {
          const project = JSON.parse(fileContent);
          projects.push(project);
        } catch (e) {
          console.error(`Error parsing JSON file ${filename}:`, e);
        }
      }
    }

    // Sort by order ascending
    projects.sort((a, b) => (a.order || 0) - (b.order || 0));

    return new Response(JSON.stringify({ success: true, projects }), {
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
    const project = await request.json();
    if (!project.slug) {
      return new Response(JSON.stringify({ success: false, error: 'Slug is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const dir = getProjectsDir();
    await fs.mkdir(dir, { recursive: true });

    const filePath = path.join(dir, `${project.slug}.json`);
    await fs.writeFile(filePath, JSON.stringify(project, null, 2), 'utf-8');

    return new Response(JSON.stringify({ success: true, message: 'Project created successfully' }), {
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
    const { originalSlug, project } = await request.json();
    if (!originalSlug || !project || !project.slug) {
      return new Response(JSON.stringify({ success: false, error: 'originalSlug and project with slug are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const dir = getProjectsDir();
    const oldPath = path.join(dir, `${originalSlug}.json`);
    const newPath = path.join(dir, `${project.slug}.json`);

    // Delete old file if slug changed
    if (originalSlug !== project.slug) {
      if (await fs.stat(oldPath).catch(() => false)) {
        await fs.unlink(oldPath);
      }
    }

    await fs.writeFile(newPath, JSON.stringify(project, null, 2), 'utf-8');

    return new Response(JSON.stringify({ success: true, message: 'Project updated successfully' }), {
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

    const dir = getProjectsDir();
    const filePath = path.join(dir, `${slug}.json`);

    if (await fs.stat(filePath).catch(() => false)) {
      await fs.unlink(filePath);
      return new Response(JSON.stringify({ success: true, message: 'Project deleted successfully' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      return new Response(JSON.stringify({ success: false, error: 'Project not found' }), {
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
