import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const coreAssetsDir = path.join(rootDir, 'node_modules/@phosphor-icons/core/assets');
const phosphorOutDir = path.join(rootDir, 'src/components/icons/phosphor');
const legacyOutDir = path.join(rootDir, 'src/components/icons/majesticons');

for (const dir of [phosphorOutDir, legacyOutDir]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function cleanPhosphorSvg(raw) {
  return raw
    .replace(/^<svg[^>]*>/i, '')
    .replace(/<\/svg>\s*$/i, '')
    .trim();
}

// Curated Phosphor icons used across the portfolio + common UI icons
const coreIcons = [
  'house',
  'house-line',
  'user',
  'user-circle',
  'briefcase',
  'squares-four',
  'stack',
  'article',
  'notebook',
  'note-pencil',
  'file-text',
  'image',
  'images',
  'images-square',
  'camera',
  'desktop',
  'monitor',
  'laptop',
  'devices',
  'envelope-simple',
  'address-book',
  'folder',
  'folder-simple',
  'folder-open',
  'cpu',
  'certificate',
  'graduation-cap',
  'gear-six',
  'caret-right',
  'caret-left',
  'caret-down',
  'caret-up',
  'x',
  'list',
  'clock',
  'calendar',
  'calendar-plus',
  'paper-plane-tilt',
  'arrow-right',
  'arrow-left',
  'arrow-up',
  'arrow-down',
  'arrow-square-out',
  'arrow-up-right',
  'check-circle',
  'check',
  'clipboard-text',
  'lock',
  'eye',
  'eye-slash',
  'key',
  'shield',
  'shield-check',
  'sparkle',
  'shooting-star',
  'heart',
  'chat-circle',
  'chat-text',
  'globe',
  'map-pin',
  'chart-bar',
  'bookmark',
  'book-open',
  'music-notes',
  'play-circle',
  'skip-back-circle',
  'skip-forward-circle',
  'pulse',
  'barbell',
  'leaf',
  'coffee',
  'fork-knife',
  'dots-three',
  'dots-six',
  'code',
  'compass',
  'brain',
  'git-branch',
  'plug',
  'credit-card',
  'trend-up',
  'lightning',
  'flask',
  'copy',
  'copy-simple',
  'translate',
  'linkedin-logo',
  'instagram-logo',
  'github-logo',
  'magnifying-glass',
  'plus',
  'minus',
  'info',
  'warning-circle',
  'warning',
  'star',
  'share',
  'download-simple',
  'upload-simple',
  'link',
  'funnel',
  'sliders-horizontal',
  'sun',
  'moon',
  'terminal-window',
  'database',
  'cloud',
  'phone',
  'buildings',
  'fingerprint',
  'atom',
  'robot',
  'cube-focus',
  'rocket-launch',
  'mailbox',
  'scroll',
  'bank',
  'clock-counter-clockwise',
];

// Alias mapping -> Phosphor icon name for backwards compatibility
const aliases = {
  home: 'house',
  'home-simple': 'house',
  suitcase: 'briefcase',
  'layout-grid': 'squares-four',
  'layout-grid-2': 'squares-four',
  'stack-2': 'stack',
  'layers-2-vertical': 'stack',
  notes: 'article',
  'note-text': 'article',
  photo: 'image',
  'library-photo': 'images',
  'device-desktop': 'desktop',
  'device-laptop': 'laptop',
  mail: 'envelope-simple',
  award: 'certificate',
  'document-award': 'graduation-cap',
  school: 'graduation-cap',
  settings: 'gear-six',
  'chevron-right': 'caret-right',
  'chevron-left': 'caret-left',
  'chevron-down': 'caret-down',
  'chevron-up': 'caret-up',
  close: 'x',
  menu: 'list',
  'menu-2': 'list',
  send: 'paper-plane-tilt',
  open: 'arrow-square-out',
  'external-link': 'arrow-square-out',
  'circle-check': 'check-circle',
  'clipboard-check': 'clipboard-text',
  sparkles: 'sparkle',
  comet: 'shooting-star',
  chat: 'chat-circle',
  'message-circle': 'chat-circle',
  message: 'chat-text',
  'eye-off': 'eye-slash',
  world: 'globe',
  'globe-earth': 'globe',
  'map-marker': 'map-pin',
  analytics: 'chart-bar',
  'book-open': 'book-open',
  book: 'book-open',
  music: 'music-notes',
  'player-play': 'play-circle',
  'player-skip-back': 'skip-back-circle',
  'player-skip-forward': 'skip-forward-circle',
  activity: 'pulse',
  barbell: 'barbell',
  trees: 'leaf',
  cup: 'coffee',
  'tools-kitchen-2': 'fork-knife',
  dots: 'dots-three',
  'more-menu': 'dots-three',
  'grip-horizontal': 'dots-six',
  'compass-2': 'compass',
  usb: 'plug',
  creditcard: 'credit-card',
  'trending-up': 'trend-up',
  bolt: 'lightning',
  'lightning-bolt': 'lightning',
  language: 'translate',
  'brand-linkedin': 'linkedin-logo',
  linkedin: 'linkedin-logo',
  'brand-instagram': 'instagram-logo',
  instagram: 'instagram-logo',
  'brand-github': 'github-logo',
  github: 'github-logo',
  pexels: 'camera',
  'carousel-horizontal': 'images-square',
  search: 'magnifying-glass',
  'info-circle': 'info',
  'alert-circle': 'warning-circle',
  'alert-triangle': 'warning',
  download: 'download-simple',
  upload: 'upload-simple',
  filter: 'funnel',
  'adjustments-horizontal': 'sliders-horizontal',
  'terminal-2': 'terminal-window',
  building: 'buildings',
};

const icons = {};
const missing = [];

function loadPhosphorIcon(phosphorName) {
  const paths = {
    thin: path.join(coreAssetsDir, 'thin', `${phosphorName}-thin.svg`),
    light: path.join(coreAssetsDir, 'light', `${phosphorName}-light.svg`),
    regular: path.join(coreAssetsDir, 'regular', `${phosphorName}.svg`),
    duotone: path.join(coreAssetsDir, 'duotone', `${phosphorName}-duotone.svg`),
    fill: path.join(coreAssetsDir, 'fill', `${phosphorName}-fill.svg`),
    bold: path.join(coreAssetsDir, 'bold', `${phosphorName}-bold.svg`),
  };

  const def = {};
  for (const [weight, filePath] of Object.entries(paths)) {
    if (fs.existsSync(filePath)) {
      def[weight] = cleanPhosphorSvg(fs.readFileSync(filePath, 'utf8'));
    }
  }

  return def.light || def.thin || def.regular || def.duotone || def.fill || def.bold ? def : null;
}

for (const name of coreIcons) {
  const def = loadPhosphorIcon(name);
  if (def) {
    icons[name] = def;
  } else {
    missing.push(name);
  }
}

for (const [aliasName, targetName] of Object.entries(aliases)) {
  const def = icons[targetName] || loadPhosphorIcon(targetName);
  if (def) {
    icons[aliasName] = def;
  } else {
    missing.push(`${aliasName} -> ${targetName}`);
  }
}

if (missing.length > 0) {
  console.warn(`Warning: Missing Phosphor assets: ${missing.join(', ')}`);
}

const names = Object.keys(icons).sort();

const registryContent = `// Auto-generated by scripts/generate-phosphor-icons.mjs from @phosphor-icons/core
export type PhosphorWeight = 'thin' | 'light' | 'regular' | 'duotone' | 'fill' | 'bold';

export type PhosphorIconName =
${names.map((n) => `  | ${JSON.stringify(n)}`).join('\n')};

export type MajesticonName = PhosphorIconName;

export interface IconDefinition {
  thin?: string;
  light?: string;
  regular?: string;
  duotone?: string;
  fill?: string;
  bold?: string;
}

export const iconDefinitions: Record<string, IconDefinition> = ${JSON.stringify(icons, null, 2)};

export function resolvePhosphorWeight(
  weightOrType: PhosphorWeight | 'line' | 'solid' | 'outline' | 'filled' = 'light'
): PhosphorWeight {
  if (weightOrType === 'solid' || weightOrType === 'filled') return 'fill';
  if (
    weightOrType === 'thin' ||
    weightOrType === 'light' ||
    weightOrType === 'regular' ||
    weightOrType === 'duotone' ||
    weightOrType === 'fill' ||
    weightOrType === 'bold'
  ) {
    return weightOrType;
  }
  return 'light';
}

export function getIconSvg(
  name: string,
  weight: PhosphorWeight | 'line' | 'solid' | 'outline' | 'filled' = 'light'
): string {
  const def = iconDefinitions[name];
  if (!def) return '';
  const resolved = resolvePhosphorWeight(weight);
  return def[resolved] || def.light || def.thin || def.regular || def.duotone || def.fill || def.bold || '';
}
`;

fs.writeFileSync(path.join(phosphorOutDir, 'registry.ts'), registryContent, 'utf8');

const legacyRegistryContent = `// Re-exported from Phosphor Icons registry
export * from '../phosphor/registry';
`;
fs.writeFileSync(path.join(legacyOutDir, 'registry.ts'), legacyRegistryContent, 'utf8');

console.log(`Generated Phosphor Icons registry with ${names.length} entries.`);
