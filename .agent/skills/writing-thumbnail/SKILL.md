---
name: writing-thumbnail
description: Generate and automatically attach a Writing article thumbnail from a random people-free scenery image in the published Photography collection. Use whenever creating a new article in src/content/writing or when asked to regenerate an article cover.
---

# Writing thumbnail

Every new Writing article must finish with a generated cover derived from the site's Photography collection.

## Workflow

1. Finish the article slug, title, and Markdown file first.
2. From the repository root, prepare a random source photo:

   ```bash
   node .agent/skills/writing-thumbnail/scripts/generate-thumbnail.mjs \
     --prepare --fresh --slug "<article-slug>" --title "<article-title>"
   ```

   The script chooses randomly from unused landscape images in published Photography albums and filters obvious people-related metadata. Keep the returned `sourceAbsPath`, `prompt`, and suggested alt text together.
3. Inspect the selected source image before generation. It must be scenery only, with no person, face, body part, portrait, crowd, or recognizable human silhouette anywhere in the frame, including tiny background figures. Metadata filtering is not sufficient. If a person is visible, prepare again while excluding every rejected source:

   ```bash
   node .agent/skills/writing-thumbnail/scripts/generate-thumbnail.mjs \
     --prepare --fresh --slug "<article-slug>" --title "<article-title>" \
     --exclude "<rejected-source-1>,<rejected-source-2>"
   ```

4. Generate one image with the image-generation tool. Pass the accepted `sourceAbsPath` as the referenced image, use the returned `prompt` exactly, and keep transparency disabled. Do not redesign, crop, add people, or add elements beyond what that prompt permits.
5. Finalize the generated image:

   ```bash
   node .agent/skills/writing-thumbnail/scripts/generate-thumbnail.mjs \
     --finalize --slug "<article-slug>" --title "<article-title>" \
     --photo "<sourceAbsPath-from-prepare>" \
     --input "<generated-image-path>"
   ```

   Passing the prepared `sourceAbsPath` back through `--photo` keeps the source record tied to the image that was actually transformed. Finalization writes `public/images/writing/<article-slug>.webp` at 1920×1080, records its Photography source in `data/writing-thumbnails.json`, and automatically inserts or replaces `coverImage` in the matching article frontmatter. Use `--no-attach` only when the user explicitly requests an image without changing an article.
6. Confirm the generated WebP exists, the frontmatter points to it, and `pnpm check` passes.

## Invariants

- Use a photo from the site's published Photography collection unless the user explicitly supplies another source.
- Use scenery only. Reject any source containing a person or recognizable human presence, even if the person is small or in the background.
- The generated thumbnail must also contain no people; reject and regenerate it if the model adds one.
- Avoid reusing a source photo while unused landscape photos remain.
- Re-running preparation for an existing slug reuses its recorded source unless `--fresh` is passed.
- Never finish a newly created Writing article with a missing cover or the raw Photography image.
