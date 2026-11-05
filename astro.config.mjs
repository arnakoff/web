// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightOpenAPI, { openAPISidebarGroups } from 'starlight-openapi';
import { FAVICON_SVG, ICON_LINKS, OG_LOCALE, SITE_NAME, shareImageMeta } from './src/lib/meta.ts';
import { ERRORS_PATH, REFERENCE_BASE, REPO_WEB_URL, SITE_URL } from './src/lib/site.ts';

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
          },
        ]),
      ],
      // Long lines wrap instead of scrolling: a scrolling code block is a
      // region that keyboard users cannot reach (axe scrollable-region-focusable).
      expressiveCode: { defaultProps: { wrap: true } },
      routeMiddleware: './src/routeData.ts',
      sidebar: [
        { slug: 'docs' },
        { slug: 'docs/demarrage-rapide' },
        { slug: 'docs/authentification' },
        { slug: 'docs/mcp' },
        { slug: 'docs/versions' },
        // Plain Astro pages generated from the contract's errors (src/pages/docs/erreurs/).
        { label: 'Erreurs', link: ERRORS_PATH },
        ...openAPISidebarGroups,
      ],
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
