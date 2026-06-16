import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directories to process for images
const imgDirs = [
  path.join(__dirname, 'src/assets'),
  path.join(__dirname, 'public/assets/logos')
];

// Directories to search for string replacement
const codeDirs = [
  path.join(__dirname, 'src')
];

async function findFiles(dir, exts) {
  let results = [];
  const list = await fs.promises.readdir(dir, { withFileTypes: true });
  for (const file of list) {
    const filePath = path.join(dir, file.name);
    if (file.isDirectory()) {
      results = results.concat(await findFiles(filePath, exts));
    } else {
      if (exts.some(ext => filePath.toLowerCase().endsWith(ext))) {
        results.push(filePath);
      }
    }
  }
  return results;
}

async function processImages() {
  const imageExts = ['.jpg', '.jpeg', '.png'];
  let allImages = [];
  
  for (const dir of imgDirs) {
    if (fs.existsSync(dir)) {
      allImages = allImages.concat(await findFiles(dir, imageExts));
    }
  }

  console.log(`Found ${allImages.length} images to convert.`);

  for (const imgPath of allImages) {
    const ext = path.extname(imgPath);
    const newPath = imgPath.substring(0, imgPath.length - ext.length) + '.webp';
    
    try {
      await sharp(imgPath)
        .webp({ quality: 80 })
        .toFile(newPath);
      
      console.log(`Converted: ${path.basename(imgPath)} -> ${path.basename(newPath)}`);
      
      // Delete old file
      await fs.promises.unlink(imgPath);
    } catch (err) {
      console.error(`Error processing ${imgPath}:`, err);
    }
  }
}

async function updateCodeReferences() {
  const codeExts = ['.astro', '.ts', '.tsx', '.js', '.jsx', '.md', '.mdx', '.html', '.css', '.json'];
  let allCodeFiles = [];
  
  for (const dir of codeDirs) {
    if (fs.existsSync(dir)) {
      allCodeFiles = allCodeFiles.concat(await findFiles(dir, codeExts));
    }
  }

  // Also include files in public that might reference images? Wait, let's stick to src
  let updatedCount = 0;

  for (const filePath of allCodeFiles) {
    const content = await fs.promises.readFile(filePath, 'utf-8');
    
    // Replace .jpg, .jpeg, .png with .webp but ONLY in the specific paths we modified
    // We modified /assets/photos/* and /assets/logos/*
    // It's safer to use a regex that matches these paths.
    // Or just generally replace any .jpg, .jpeg, .png that has 'assets/' in the string.
    
    // General replacement for any .jpg, .jpeg, .png in string literals containing /assets/
    // Since we know all images in src/assets and public/assets/logos were converted.
    
    let newContent = content;
    
    // Replace specific strings we found in our search:
    // e.g. /assets/photos/img-portfolio/photo-1.jpg -> .webp
    // src/assets/...
    
    // Regex to find things like .jpg, .jpeg, .png
    // We want to replace it only if it's related to assets
    const regex = /([^"'\s]+?\/(?:assets|photos)\/[^"'\s]+?)\.(jpg|jpeg|png)/gi;
    
    let hasChanges = false;
    newContent = newContent.replace(regex, (match, p1, p2) => {
      // Avoid replacing if it's not our target folders? 
      // Everything in src/assets and public/assets/logos was converted.
      hasChanges = true;
      return p1 + '.webp';
    });

    if (hasChanges) {
      await fs.promises.writeFile(filePath, newContent, 'utf-8');
      console.log(`Updated references in: ${path.relative(__dirname, filePath)}`);
      updatedCount++;
    }
  }
  
  console.log(`Updated ${updatedCount} code files.`);
}

async function main() {
  await processImages();
  await updateCodeReferences();
}

main().catch(console.error);
