import fs from 'node:fs/promises';
import path from 'node:path';
import type { APIRoute } from 'astro';

const getGearFilePath = () => {
  return path.join(process.cwd(), 'src', 'content', 'gear', 'setup.json');
};

const defaultGearData = {
  title: "My Gear",
  headline: "Tools I actually use to work, shoot, write, and build.",
  description: "A living list of the products in my everyday setup.",
  sections: []
};

export const GET: APIRoute = async () => {
  try {
    const filePath = getGearFilePath();
    let gearData = defaultGearData;

    try {
      const fileContent = await fs.readFile(filePath, 'utf-8');
      gearData = JSON.parse(fileContent);
    } catch (e) {
      // If it doesn't exist, we will create the directory and write default data
      const dir = path.dirname(filePath);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(defaultGearData, null, 2), 'utf-8');
    }

    return new Response(JSON.stringify({ success: true, gear: gearData }), {
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
    const gearData = await request.json();
    const filePath = getGearFilePath();
    const dir = path.dirname(filePath);
    
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(gearData, null, 2), 'utf-8');

    return new Response(JSON.stringify({ success: true, message: 'Gear setup updated successfully' }), {
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
