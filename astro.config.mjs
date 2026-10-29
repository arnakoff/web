// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import { REPO_WEB_URL, SITE_URL } from './src/lib/site.ts';

export default defineConfig({
  site: SITE_URL,
  trailingSlash: 'ignore',
  integrations: [
    // Starlight serves only /docs: its pages live in src/content/docs/docs/.
    // The showcase pages are plain Astro pages in src/pages/.
    starlight({
      title: 'Documentation Arnakoff',
      locales: {
        root: { label: 'Français', lang: 'fr' },
      },
      social: [{ icon: 'github', label: 'GitHub', href: REPO_WEB_URL }],
    }),
  ],
});
