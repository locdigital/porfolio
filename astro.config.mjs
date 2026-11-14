import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';
import vercel from '@astrojs/vercel/serverless';

export default defineConfig({
  site: 'https://loc.digital',
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'vi'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  // Public content is generated once at build time; only explicit API routes use SSR.
  output: 'hybrid',
  // Emit HTTP redirects at the edge instead of static HTML with a refresh delay.
  redirects: {
    '/service': { destination: '/services', status: 302 },
    '/experience': { destination: '/about', status: 302 },
  },
  adapter: vercel({
    // Generate responsive WebP files at build time instead of transforming on first visit.
    imageService: false,
    imagesConfig: {
      sizes: [16, 32, 48, 56, 64, 80, 96, 112, 128, 240, 256, 320, 360, 384, 400, 480, 520, 640, 720, 750, 760, 828, 960, 1080, 1200, 1280, 1920, 2048, 3840],
      domains: ['65wv0vnolo.ufs.sh'],
      // Keep existing image URLs working for tabs opened before this deployment.
      formats: ["image/webp"],
      minimumCacheTTL: 86400,
    },
  }),
  // global.css already emits Tailwind, so do not inject a second copy on every page.
  integrations: [tailwind({ applyBaseStyles: false }), sitemap(), react()],
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'hover',
  },
  image: {
    domains: ['65wv0vnolo.ufs.sh'],
    remotePatterns: [],
    service: {
      entrypoint: 'astro/assets/services/sharp',
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
