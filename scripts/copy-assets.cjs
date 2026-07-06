const fs = require('fs');
const path = require('path');

const src = path.join(process.cwd(), 'src', 'assets', 'photos');
const dest = path.join(process.cwd(), 'public', 'assets', 'photos');

try {
  if (fs.existsSync(src)) {
    // Ensure destination parent directory exists
    const destParent = path.dirname(dest);
    if (!fs.existsSync(destParent)) {
      fs.mkdirSync(destParent, { recursive: true });
    }
    
    // Copy directory recursively (Node 16.7.0+)
    fs.cpSync(src, dest, { recursive: true, force: true });
    console.log(`Successfully copied ${src} to ${dest}`);
  } else {
    console.warn(`Source directory ${src} does not exist. Skipping copy.`);
  }
} catch (err) {
  console.error('Error copying assets:', err);
}
