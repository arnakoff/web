// robots.txt: every page may be crawled, and the sitemap lists them.
import type { APIRoute } from 'astro';
import { SITEMAP_PATH } from '../lib/meta';

export const GET: APIRoute = ({ site }) => {
  const sitemap = new URL(SITEMAP_PATH, site).href;
  return new Response(`User-agent: *\nAllow: /\n\nSitemap: ${sitemap}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
