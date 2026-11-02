// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightOpenAPI, { openAPISidebarGroups } from 'starlight-openapi';
import { FAVICON_SVG, ICON_LINKS, OG_LOCALE, SITE_NAME, shareImageMeta } from './src/lib/meta.ts';
import { REFERENCE_BASE, REPO_WEB_URL, SITE_URL } from './src/lib/site.ts';

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
      plugins: [
        // The reference is generated from the copy of the API contract
        // (`npm run sync`), never written by hand.
        starlightOpenAPI([
          {
            base: REFERENCE_BASE,
            schema: './src/content/api/openapi.yaml',
            sidebar: { label: "Référence de l'API", collapsed: false },
            // The contract declares no `servers`: generated request snippets
            // would call https://example.com. Enable them once it does.
            snippets: { operation: false },
          },
        ]),
      ],
      routeMiddleware: './src/routeData.ts',
      sidebar: [{ slug: 'docs' }, { slug: 'docs/versions' }, ...openAPISidebarGroups],
      favicon: FAVICON_SVG,
      head: [
        ...ICON_LINKS.map((attrs) => ({ tag: /** @type {const} */ ('link'), attrs })),
        ...shareImageMeta(SITE_URL).map((attrs) => ({ tag: /** @type {const} */ ('meta'), attrs })),
        // Replace Starlight's defaults so that docs and showcase pages agree.
        ...[
          { property: 'og:locale', content: OG_LOCALE },
          { property: 'og:site_name', content: SITE_NAME },
        ].map((attrs) => ({ tag: /** @type {const} */ ('meta'), attrs })),
      ],
      social: [{ icon: 'github', label: 'GitHub', href: REPO_WEB_URL }],
      customCss: ['./src/styles/tokens.css', './src/styles/starlight.css'],
    }),
  ],
});
