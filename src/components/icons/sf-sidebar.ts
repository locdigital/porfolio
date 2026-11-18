export type SidebarIconName =
  | 'house'
  | 'user'
  | 'briefcase'
  | 'squares-four'
  | 'article'
  | 'image'
  | 'desktop'
  | 'envelope-simple';

/**
 * Apple SF Symbols / macOS Finder-inspired rounded outline SVG paths (24x24 viewBox).
 */
export const SF_SIDEBAR_ICONS: Record<SidebarIconName, string> = {
  house:
    '<path d="M3.2 10.6 11.36 3.96a1 1 0 0 1 1.28 0L20.8 10.6" /><path d="M5.5 9.2V19a1.8 1.8 0 0 0 1.8 1.8h9.4a1.8 1.8 0 0 0 1.8-1.8V9.2" /><path d="M9.8 20.8v-5.3a1.5 1.5 0 0 1 1.5-1.5h1.4a1.5 1.5 0 0 1 1.5 1.5v5.3" />',
  user:
    '<circle cx="12" cy="7.5" r="3.4" /><path d="M5 19c0-2.9 3.1-4.8 7-4.8s7 1.9 7 4.8a1.4 1.4 0 0 1-1.4 1.4H6.4A1.4 1.4 0 0 1 5 19Z" />',
  briefcase:
    '<rect x="3.2" y="7" width="17.6" height="13.2" rx="2.6" /><path d="M8.5 7V5.2a1.8 1.8 0 0 1 1.8-1.8h3.4a1.8 1.8 0 0 1 1.8 1.8V7" /><path d="M3.5 11.8c2.6 1.2 5.5 1.7 8.5 1.7s5.9-.5 8.5-1.7" />',
  'squares-four':
    '<rect x="3.8" y="3.8" width="6.8" height="6.8" rx="1.8" /><rect x="13.4" y="3.8" width="6.8" height="6.8" rx="1.8" /><rect x="3.8" y="13.4" width="6.8" height="6.8" rx="1.8" /><rect x="13.4" y="13.4" width="6.8" height="6.8" rx="1.8" />',
  article:
    '<path d="M13.5 3.2H7A2 2 0 0 0 5 5.2v13.6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8.7a1.5 1.5 0 0 0-.44-1.06l-4-4a1.5 1.5 0 0 0-1.06-.44Z" /><path d="M13.5 3.4V7.2a1.5 1.5 0 0 0 1.5 1.5h3.8" /><path d="M8.5 13h7M8.5 16.5h4.5" />',
  image:
    '<rect x="3.2" y="4.5" width="17.6" height="15" rx="2.6" /><circle cx="8.2" cy="9.4" r="1.4" /><path d="M3.8 17.5l4.1-3.9a1.4 1.4 0 0 1 1.95 0l2.15 2.05 2.65-2.75a1.4 1.4 0 0 1 2.02.02L20.5 17" />',
  desktop:
    '<rect x="3.2" y="4.2" width="17.6" height="12.8" rx="2.5" /><path d="M12 17v3.4M8.5 20.4h7" />',
  'envelope-simple':
    '<rect x="3.2" y="5" width="17.6" height="14" rx="2.6" /><path d="M4.2 6.8l6.9 5.3a1.5 1.5 0 0 0 1.8 0l6.9-5.3" />',
};
