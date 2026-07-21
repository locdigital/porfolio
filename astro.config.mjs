import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';
import vercel from '@astrojs/vercel/serverless';

export default defineConfig({
  site: 'https://loc.digital',
  output: 'server',
  adapter: vercel({
    imageService: true,
    imagesConfig: {
      sizes: [16, 32, 48, 56, 64, 80, 96, 112, 128, 240, 256, 320, 360, 384, 400, 480, 520, 640, 720, 750, 760, 828, 960, 1080, 1200, 1280, 1920, 2048, 3840],
      domains: [],
      formats: ["image/avif", "image/webp"],
      minimumCacheTTL: 60,
    },
  }),
  integrations: [tailwind(), sitemap(), react()],
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'viewport',
  },
  image: {
    // Sharp: use AVIF as primary format (≈30% smaller than WebP)
    // Falls back to original format for unsupported browsers
    domains: [],
    remotePatterns: [],
    service: {
      config: {
        // Allow processing large raw images (e.g. 26MB PNGs from camera)
        limitInputPixels: false,
      },
    },
  },
  vite: {
    build: {
      // Increase chunk size hint to avoid too-many-chunks warnings with photo assets
      chunkSizeWarningLimit: 1024,
      rollupOptions: {
        output: {
          // Split vendor chunks for better long-term caching
          manualChunks: {}
        },
      },
    },
    // Optimize deps
    optimizeDeps: {},
  },
});
