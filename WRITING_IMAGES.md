# Writing illustrations

Created on 9 November 2026 using the built-in imagegen tool. Three distinct prompts generated one editorial illustration per sample article. The images are illustrative scenes, not photographs of Loc’s office, client dashboards, or measured campaign results.

## Project assets

- `public/images/writing/find-the-bottleneck.webp`
- `public/images/writing/questions-before-dashboards.webp`
- `public/images/writing/the-page-after-the-click.webp`

Final assets are 1600 × 900 WebP files, encoded with Sharp at quality 82. The existing Astro image pipeline creates hashed responsive WebP variants at quality 75 for thumbnails, article covers, and related posts. Original generated PNG files remain in the Codex generated-images directory.

The cover metadata lives in the three Markdown files under `src/content/writing/`. Each entry includes its source, meaningful alternative text, dimensions, and caption. The same image is used consistently on its article, Writing archive, topic archive, related links, and social preview.

## Prompt set

### find-the-bottleneck

Create one premium editorial photograph for a minimalist personal writing website, landscape 16:9 composition. Topic: planning the customer journey before scaling marketing spend. A quiet warm ivory desk viewed from a high three-quarter angle, an open cream notebook, five unlabelled small paper storyboard cards laid out in a thoughtful sequence, a graphite mechanical pencil, a matte black smartphone with a single muted orange rectangle on its otherwise neutral screen. Real paper texture, soft natural window light from the left, restrained off-white, stone, graphite and a tiny burnt-orange accent. Sophisticated magazine still-life photography, realistic materials, clean intentional composition with breathing room. No text, no letters, no numbers, no chart labels, no logos, no people, no watermark. The scene must remain understandable when cropped to a small landscape thumbnail. It is an illustrative editorial scene, not evidence of a real client project. Render one image only.

### questions-before-dashboards

Create one premium editorial photograph for a minimalist personal writing website, landscape 16:9 composition. Topic: asking useful measurement questions rather than filling a dashboard. Close, slightly elevated view of a warm ivory table holding two beautifully tactile cream report sheets with very simple abstract thin charcoal line plots and small muted blue bars, a graphite pencil resting across the papers, a small transparent glass paperweight near one corner. Sparse marks only, no readable data. Natural side light, long soft shadows, crisp paper texture, subdued warm-white, stone and graphite palette, small muted blue accent. Sophisticated magazine still-life photography, realistic materials and depth, calm, clean, intentional negative space. No text, no letters, no numbers, no chart labels, no logos, no people, no watermark. Composition must read clearly at thumbnail size. These are fictional illustrative reports, not a real dashboard or client results. Render one image only.

### the-page-after-the-click

Create one premium editorial photograph for a minimalist personal writing website, landscape 16:9 composition. Topic: a clear fast web experience across devices. An anonymous slim matte graphite laptop and a black smartphone on a warm ivory desk, viewed at a gentle front three-quarter angle. Both screens show the same extremely clean fictional website layout made of cream space, charcoal horizontal text-like rules, a warm amber photographic image block and one small dark rounded action button. Elegant, restrained responsive composition, no readable words. Soft natural window light, realistic device proportions and screen reflections, off-white and stone surroundings, quietly premium editorial technology photography. No text, no letters, no numbers, no brand logos, no people, no watermark. All important devices fully inside the frame with generous margins so a landscape thumbnail crop still works. This is an illustrative website mockup, not a screenshot of a real product or client. Render one image only.

