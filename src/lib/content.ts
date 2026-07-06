import fs from 'fs';
import path from 'path';

const contentDir = path.join(process.cwd(), 'src', 'content');

export interface CollectionEntry<T> {
  id: string;
  slug: string;
  data: T;
  body?: string;
}

export function parseFrontmatter(fileContent: string) {
  const match = fileContent.match(/^---\r?\n([\s\S]+?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) {
    return { data: {}, body: fileContent };
  }
  const yamlBlock = match[1];
  const body = match[2];
  const data: Record<string, any> = {};

  yamlBlock.split('\n').forEach((line) => {
    const parts = line.split(':');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      let value = parts.slice(1).join(':').trim();
      // strip surrounding quotes
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (value === 'true') {
        data[key] = true;
      } else if (value === 'false') {
        data[key] = false;
      } else if (!isNaN(Number(value)) && value !== '') {
        data[key] = Number(value);
      } else if (value.startsWith('[') && value.endsWith(']')) {
        // Simple array parsing: ['tag1', 'tag2']
        data[key] = value.slice(1, -1).split(',').map(item => item.trim().replace(/['"]/g, ''));
      } else {
        data[key] = value;
      }
    }
  });

  return { data, body };
}

export async function getCollection<T = any>(
  collectionName: string,
  filterFn?: (entry: CollectionEntry<T>) => boolean
): Promise<CollectionEntry<T>[]> {
  const dirPath = path.join(contentDir, collectionName);
  if (!fs.existsSync(dirPath)) {
    return [];
  }

  const files = fs.readdirSync(dirPath);
  const entries: CollectionEntry<T>[] = [];

  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) continue;

    const ext = path.extname(file);
    const id = path.basename(file, ext);

    if (ext === '.json') {
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const data = JSON.parse(content);
        const slug = data.slug || id;
        const entry = { id, slug, data };
        if (!filterFn || filterFn(entry)) {
          entries.push(entry);
        }
      } catch (err) {
        console.error(`Error parsing JSON file ${file}:`, err);
      }
    } else if (ext === '.md' || ext === '.mdx') {
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const { data, body } = parseFrontmatter(content);
        const slug = data.slug || id;
        
        // Date coercion if date exists
        if (data.publishedAt) {
          data.publishedAt = new Date(data.publishedAt);
        }

        const entry = { id, slug, data: data as T, body };
        if (!filterFn || filterFn(entry)) {
          entries.push(entry);
        }
      } catch (err) {
        console.error(`Error parsing Markdown file ${file}:`, err);
      }
    }
  }

  return entries;
}

export async function getEntry<T = any>(collectionName: string, id: string): Promise<CollectionEntry<T> | null> {
  const dirPath = path.join(contentDir, collectionName);
  const jsonPath = path.join(dirPath, `${id}.json`);
  const mdPath = path.join(dirPath, `${id}.md`);
  const mdxPath = path.join(dirPath, `${id}.mdx`);

  if (fs.existsSync(jsonPath)) {
    const content = fs.readFileSync(jsonPath, 'utf-8');
    const data = JSON.parse(content);
    return { id, slug: data.slug || id, data };
  }

  let matchedPath = '';
  if (fs.existsSync(mdPath)) matchedPath = mdPath;
  else if (fs.existsSync(mdxPath)) matchedPath = mdxPath;

  if (matchedPath) {
    const content = fs.readFileSync(matchedPath, 'utf-8');
    const { data, body } = parseFrontmatter(content);
    if (data.publishedAt) {
      data.publishedAt = new Date(data.publishedAt);
    }
    return { id, slug: data.slug || id, data: data as T, body };
  }

  return null;
}
