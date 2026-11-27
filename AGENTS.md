# Workspace Guidelines

## Writing Article Thumbnails (Required)

For every new or updated article in `src/content/writing/*.md`, always generate the cover thumbnail in the **Photo + Staggered Headline Text** style (never chibi/pixel art):

- **Background**: Real landscape photograph from `public/assets/photos/<album>/` (prefer an unused photo matching the essay mood).
- **Overlay**: Two-line uppercase bold sans-serif headline at the bottom-left (`1920×1080` WebP):
  - Line 1: Black bar (`#070707`) with Amber Yellow text (`#FFC400`).
  - Line 2: Amber Yellow bar (`#FFC400`) with Black text (`#070707`).
- **Workflow**: Follow `.agents/skills/writing-thumbnail/SKILL.md` — add the entry to `scripts/generate-writing-thumbnails.mjs`, run `node scripts/generate-writing-thumbnails.mjs --slug=<slug>`, update `coverImage` in `src/content/writing/<slug>.md`, then run `node scripts/optimize-assets.mjs --scope=images --filter=images/writing/` and `node scripts/migrate-assets-to-r2.mjs`.
