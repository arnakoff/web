// Metadata of every page, showcase and docs alike: name, locale, icons, share
// image and structured data. The PNG files in public/ are generated from
// public/favicon.svg by scripts/build-icons.mjs.
import { ORG_GITHUB_URL } from './site.ts';

/** Name of the site, as social networks show it. */
export const SITE_NAME = 'Arnakoff';

/** What Arnakoff is, in one sentence: home page and structured data. */
export const SITE_DESCRIPTION = "Arnakoff, l'API française de signaux sourcés contre les arnaques.";

/** Open Graph locale, in the `language_TERRITORY` form the protocol asks for. */
export const OG_LOCALE = 'fr_FR';

/** Sitemap index, built by @astrojs/sitemap, which Starlight adds when `site` is set. */
export const SITEMAP_PATH = '/sitemap-index.xml';

/** Logo copied from arnakoff/.github (profile/assets/logo.svg). */
export const FAVICON_SVG = '/favicon.svg';

/** Raster icons, each rendered from the logo at its size. */
export const ICONS = [
  { rel: 'icon', path: '/favicon-32.png', size: 32 },
  { rel: 'apple-touch-icon', path: '/apple-touch-icon.png', size: 180 },
] as const;

/** Open Graph image shown when a page is shared, light theme. */
export const SHARE_IMAGE = {
  path: '/og.png',
  width: 1200,
  height: 630,
  alt: 'Arnakoff. Des signaux sourcés pour repérer les arnaques, en France.',
} as const;

/** The `<link>` attributes of the raster icons; the SVG one is set apart. */
export const ICON_LINKS = ICONS.map(({ rel, path, size }) => ({
  rel,
  href: path,
  type: 'image/png',
  sizes: `${String(size)}x${String(size)}`,
}));

/**
 * The `<meta>` attributes that point social networks at the share image.
 * @param site Public origin, to make the image URL absolute.
 */
export function shareImageMeta(site: string | URL) {
  const url = new URL(SHARE_IMAGE.path, site).href;
  return [
    { property: 'og:image', content: url },
    { property: 'og:image:width', content: String(SHARE_IMAGE.width) },
    { property: 'og:image:height', content: String(SHARE_IMAGE.height) },
    { property: 'og:image:alt', content: SHARE_IMAGE.alt },
    { name: 'twitter:image', content: url },
  ];
}

/**
 * The schema.org `Organization` of Arnakoff, as JSON-LD for the home page.
 * Only facts the site already states: name, URL, logo, description, GitHub.
 * @param site Public origin, to make the URLs absolute.
 */
export function organizationJsonLd(site: string | URL) {
  const logo = ICONS.find(({ rel }) => rel === 'apple-touch-icon') ?? ICONS[0];
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: new URL('/', site).href,
    logo: new URL(logo.path, site).href,
    description: SITE_DESCRIPTION,
    sameAs: [ORG_GITHUB_URL],
  };
}

/**
 * Serializes JSON-LD for an inline `<script type="application/ld+json">`.
 * `<` is escaped so that no value can close the script element.
 */
export function jsonLdScript(data: unknown) {
  return JSON.stringify(data).replaceAll('<', '\\u003c');
}
