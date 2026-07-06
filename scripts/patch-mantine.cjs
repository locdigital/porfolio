const fs = require('fs');
const path = require('path');

const rootDir = process.cwd();
const coreEsmDir = path.join(rootDir, 'node_modules', '@mantine', 'core', 'esm');
const hooksEsmDir = path.join(rootDir, 'node_modules', '@mantine', 'hooks', 'esm');

function walkDir(dir, callback) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walkDir(filePath, callback);
    } else if (file.endsWith('.mjs')) {
      callback(filePath);
    }
  }
}

let patchedCount = 0;

function patchTargetDir(dir) {
  walkDir(dir, (filePath) => {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // 1. Match and replace 'Activity' named imports from 'react'
    const activityImportRegex = /import\s*\{([^}]*)\bActivity\b([^}]*)\}\s*from\s*["']react["'];?/g;
    if (activityImportRegex.test(content)) {
      content = content.replace(activityImportRegex, (match, before, after) => {
        const cleanImports = `${before}${after}`.replace(/,\s*,/g, ',').replace(/^\s*,\s*|\s*,\s*$/g, '').trim();
        const importStatement = cleanImports ? `import { ${cleanImports} } from "react";` : '';
        return `${importStatement}\nconst Activity = ({ children }) => children;`;
      });
    }

    // 2. Match and replace 'useEffectEvent' named imports from 'react'
    const useEffectEventRegex = /import\s*\{([^}]*)\buseEffectEvent\b([^}]*)\}\s*from\s*["']react["'];?/g;
    if (useEffectEventRegex.test(content)) {
      content = content.replace(useEffectEventRegex, (match, before, after) => {
        const cleanImports = `${before}${after}`.replace(/,\s*,/g, ',').replace(/^\s*,\s*|\s*,\s*$/g, '').trim();
        const importStatement = cleanImports ? `import { ${cleanImports} } from "react";` : '';
        
        return `${importStatement}\nimport { useRef as _useRef, useCallback as _useCallback } from "react";\nconst useEffectEvent = (fn) => {\n  const ref = _useRef(fn);\n  ref.current = fn;\n  return _useCallback((...args) => ref.current(...args), []);\n};`;
      });
    }

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      patchedCount++;
    }
  });
}

patchTargetDir(coreEsmDir);
patchTargetDir(hooksEsmDir);

console.log(`Mantine Core & Hooks compatibility patch applied! Patched ${patchedCount} files.`);
