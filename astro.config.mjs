import fs from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';
import vercel from '@astrojs/vercel/serverless';

const SITE_ORIGIN = 'https://loc.digital';

function loadUnpublishedPhotoPaths() {
  const blocked = new Set();
  const photosDir = path.resolve('./src/content/photos');
  try {
    for (const file of fs.readdirSync(photosDir)) {
      if (!file.endsWith('.json')) continue;
      const data = JSON.parse(fs.readFileSync(path.join(photosDir, file), 'utf8'));
      if (data.published === false) {
        const slug = data.slug || file.slice(0, -5);
        blocked.add(`/photos/${slug}`);
        blocked.add(`/photos/${slug}/`);
      }
    }
  } catch {
    // Allow build config evaluation if content directory is absent in isolated tests.
  }
  return blocked;
}

function loadPhotoLastMod() {
  const map = new Map();
  try {
    const raw = JSON.parse(fs.readFileSync(path.resolve('./data/photo-updates.json'), 'utf8'));
    for (const [slug, meta] of Object.entries(raw)) {
      if (meta && typeof meta.updatedAt === 'string' && !Number.isNaN(Date.parse(meta.updatedAt))) {
        map.set(`/photos/${slug}`, new Date(meta.updatedAt).toISOString());
      }
    }
  } catch {
    // Optional timestamp index.
  }
  return map;
}

const unpublishedPhotoPaths = loadUnpublishedPhotoPaths();
const photoLastMod = loadPhotoLastMod();

function normalizeCanonicalUrl(rawUrl) {
  const parsed = new URL(rawUrl, SITE_ORIGIN);
  if (parsed.pathname !== '/' && parsed.pathname.endsWith('/')) {
    parsed.pathname = parsed.pathname.slice(0, -1);
  }
  return parsed.toString();
}

export default defineConfig({
  site: SITE_ORIGIN,
  trailingSlash: 'never',
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'vi'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  // Public content is generated once at build time; only explicit API routes use SSR.
  output: 'hybrid',
  // Emit permanent HTTP redirects at the edge for legacy alias routes.
  redirects: {
    '/service': { destination: '/services', status: 301 },
    '/experience': { destination: '/about', status: 301 },
  },
  adapter: vercel({
    // Generate responsive WebP files at build time instead of transforming on first visit.
    imageService: false,
    imagesConfig: {
      sizes: [16, 32, 48, 56, 64, 80, 96, 112, 128, 240, 256, 320, 360, 384, 400, 480, 520, 640, 720, 750, 760, 828, 960, 1080, 1200, 1280, 1920, 2048, 3840],
      domains: ['65wv0vnolo.ufs.sh'],
      // Keep existing image URLs working for tabs opened before this deployment.
      formats: ['image/webp'],
      minimumCacheTTL: 86400,
    },
  }),
  // global.css already emits Tailwind, so do not inject a second copy on every page.
  integrations: [
    tailwind({ applyBaseStyles: false }),
    sitemap({
      filter: (page) => {
        const pathname = new URL(page, SITE_ORIGIN).pathname;
        const normalized = pathname !== '/' ? pathname.replace(/\/+$/, '') : '/';
        if (normalized === '/404' || normalized.startsWith('/assets/')) return false;
        if (unpublishedPhotoPaths.has(pathname) || unpublishedPhotoPaths.has(normalized)) return false;
        return true;
      },
      serialize: (item) => {
        const canonical = normalizeCanonicalUrl(item.url);
        const pathname = new URL(canonical).pathname;
        const lastmod = photoLastMod.get(pathname);
        return {
          ...item,
          url: canonical,
          ...(lastmod ? { lastmod } : {}),
        };
      },
    }),
    react(),
  ],
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
          manualChunks: {},
        },
      },
    },
    optimizeDeps: {},
  },
});
