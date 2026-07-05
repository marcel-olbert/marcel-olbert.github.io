// Generates /robots.txt at build time, pointing crawlers at the sitemap.
// Uses the `site` URL from astro.config.mjs, so it updates itself at domain cutover.
import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) => {
  const body = `User-agent: *\nAllow: /\n\nSitemap: ${new URL('sitemap-index.xml', site)}\n`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain' } });
};
