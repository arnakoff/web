// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import { FAVICON_SVG, ICON_LINKS, shareImageMeta } from './src/lib/meta.ts';
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
      favicon: FAVICON_SVG,
      head: [
        ...ICON_LINKS.map((attrs) => ({ tag: /** @type {const} */ ('link'), attrs })),
        ...shareImageMeta(SITE_URL).map((attrs) => ({ tag: /** @type {const} */ ('meta'), attrs })),
      ],
      social: [{ icon: 'github', label: 'GitHub', href: REPO_WEB_URL }],
      customCss: ['./src/styles/tokens.css', './src/styles/starlight.css'],
    }),
  ],
});
