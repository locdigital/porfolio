# Media management

Photography masters belong in the local archive, `_local/photo-originals/`. Keep an independent backup of irreplaceable originals. Public photographs use `public/assets/photos/<album>/<name>.webp`. Icons, logos, favicons and fonts can be served locally. Licensed music and movie artwork stays with its existing provider unless redistribution rights are established.

## Images

Astro's Sharp service generates responsive, content-hashed WebP URLs during the build. Use `ResponsiveImage.astro` or `responsiveImageAttributes` to supply layout dimensions and sizes. Grid previews and widget thumbnails have separate display budgets. Full-size photographs remain available to the viewer.

For a new JPEG, PNG or TIFF master, run `node scripts/optimize-image.mjs source.jpg _local/derivatives/photo-name --avif`. Use a new destination directory. The script applies orientation, keeps transparency, converts to sRGB and caps output widths at the master width. WebP quality ranges from 78 to 90. An optional AVIF survives only when it saves at least 15% over WebP. Compare the candidates visually before selecting the delivery format. The application already generates variants for its own responsive components.

Run `node scripts/optimize-dock-images.mjs` after replacing the master Netflix or Spotify Dock PNG. Article covers follow the repository's writing-thumbnail workflow.

## Video

With FFmpeg and ffprobe on PATH, run `node scripts/optimize-video.mjs master.mov _local/derivatives/clip --webm`. This generates a WebP poster and fast-start H.264 MP4 at up to 720p and 1080p. The optional VP9 output is useful when comparative encode tests justify it. Audio is retained by default. Add `--silent` for intentionally silent decoration. The current public and source asset trees contain no video files.

## UploadThing

Use the server-side `UPLOADTHING_TOKEN` from the matching UploadThing application. See `.env.example`. Existing deployments can build and render using local assets and the committed manifest. The exact public file origin is configured in `src/config/site.ts`. The SDK is used by administrative tooling. No public upload or deletion route is required.

`data/uploadthing-images.json` maps repository paths to CDN URLs under `images`. The `unique` dictionary maps SHA-256 digests to file keys, URLs and source paths. Types live in `src/types/media.ts`. Use `getMediaAsset` for typed lookups. Missing mappings retain the local path. Replacing a photo under an existing name causes the uploader to check its new bytes.

1. Run `node scripts/upload-photo-assets.mjs --dry-run`. It reports published photo sources, mapped files, reused digests and additional storage in bytes. For an additional public cover, append a path such as `--cover=/images/writing/just-keep-buying.webp`. Repeat the flag for multiple covers.
2. Verify the projected storage against the account plan. If capacity or billing would change, obtain approval before uploading. With credentials configured, run the same command without `--dry-run`. The script checks provider usage before new uploads, uses batches of twelve with at most six concurrent transfers and checks the returned CDN origin. Keep the terminal output for the migration log.
3. If interrupted, rerun the command. Existing hashes and provider custom IDs recover completed entries. Each batch updates the manifest through atomic rename. Run one migration at a time.
4. Run `node scripts/validate-media.mjs` to check each distinct mapped URL by HTTPS HEAD. Then rebuild and test affected routes. Local files remain recoverable.
5. To roll back a migration, copy the specific pre-migration manifest reported by the uploader back to `data/uploadthing-images.json`, e.g. `cp _local/media-migration/manifest-<timestamp>.json data/uploadthing-images.json`, then rebuild. This changes delivery mappings and preserves both copies of the media.

## Validation

`node scripts/audit-media.mjs` inventories the public and source trees by format, bytes and SHA-256 duplicates. `node scripts/validate-built-assets.mjs` checks local image candidates, stylesheets, styles, scripts, posters and fonts referenced by production HTML and CSS. The CDN validator checks mapped images separately.
