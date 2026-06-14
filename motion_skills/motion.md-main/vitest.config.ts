import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    deps: {
      inline: [
        '@mdx-js/mdx',
        'unified',
        'remark-parse',
        'remark-mdx',
        'remark-frontmatter',
        'remark-gfm',
        'puppeteer',
        'axios',
        'unsplash-js'
      ]
    }
  }
})
