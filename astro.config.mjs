// @ts-check
import { defineConfig } from 'astro/config';
import yaml from '@rollup/plugin-yaml';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://marcelolbert.com',
  integrations: [sitemap()],
  // Old WordPress URLs → new pages (keeps existing backlinks alive)
  redirects: {
    '/media-and-insights/': '/media/',
    '/hosted-events/': '/events/',
    '/data-and-code/': '/data/',
    '/blog-resources/': '/data/',
  },
  vite: {
    plugins: [yaml()],
  },
});
