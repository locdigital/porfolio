const sharp = require('sharp');
const path = require('path');

const mappings = {
  "a_clean_white_light_gray_minimalist_graphic_scene_1_batch_1.png": "logo-playah.webp",
  "a_simple_graphic_logo_scene_a_mostly_black_minim_2_batch_2.png": "logo-workflow.webp",
  "a_clean_graphic_logo_on_a_solid_dark_navy_blue_bac_3_batch_3.png": "logo-pnj.webp",
  "a_minimalist_graphic_logo_scene_a_dark_moody_bac_4_batch_4.png": "logo-sony.webp",
  "a_clean_graphic_logo_wallpaper_overall_scene_is_a_5_batch_5.png": "logo-pops.webp"
};

async function run() {
  for (const [src, dest] of Object.entries(mappings)) {
    const srcPath = path.join('extracted_logos', src);
    const destPath = path.join('public', 'assets', 'logos', dest);
    await sharp(srcPath).webp().toFile(destPath);
    console.log(`Converted ${src} to ${dest}`);
  }
}

run().catch(console.error);
