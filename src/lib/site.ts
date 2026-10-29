// Every outside or absolute URL of the site is defined here, once.

/** Public origin of the website. */
export const SITE_URL = 'https://arnakoff.com';

/** Path where Starlight serves the API documentation. */
export const DOCS_PATH = '/docs/';

/** Absolute URL of the API documentation. */
export const DOCS_URL = new URL(DOCS_PATH, SITE_URL).href;

/**
 * Base URL of the public API, versioned by path (`/v1`, see `arnakoff/api`
 * docs/standards.md). The host is not published yet: confirm it before any
 * page displays or calls it.
 */
export const API_URL = 'https://api.arnakoff.com/v1';

/** Source repositories. */
export const REPO_WEB_URL = 'https://github.com/arnakoff/web';
export const REPO_API_URL = 'https://github.com/arnakoff/api';
