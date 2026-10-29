// Icons and share image of every page, showcase and docs alike. The PNG files
// in public/ are generated from public/favicon.svg by scripts/build-icons.mjs.

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
