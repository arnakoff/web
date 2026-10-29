// Tracker and CSP checks shared by check-a11y.mjs (the build in dist/) and
// check-deployed.mjs (a deployment on Cloudflare Pages).
// Callbacks given to page.evaluate run in the browser.
import { THEME_KEY } from '../src/lib/theme.ts';

/**
 * Browser storage the site may write: interface state that never leaves the
 * browser. Session storage keys carry a `session:` prefix.
 */
const ALLOWED_STORAGE = new Set([
  // The theme choice, shared with Starlight (src/lib/theme.ts).
  THEME_KEY,
  // Starlight's docs sidebar: which groups are open and its scroll position.
  'session:sl-sidebar-state',
]);

/**
 * Origins of Cloudflare Web Analytics, the audience measurement Cloudflare
 * adds at deploy time: its script and where it sends page views, as allowed
 * by the CSP in public/_headers. It sets no cookie and stores nothing.
 */
export const ANALYTICS_ORIGINS = [
  'https://static.cloudflareinsights.com',
  'https://cloudflareinsights.com',
];

/**
 * Reports each CSP violation of a page, which Chromium logs as a console error,
 * and each request that leaves the site for an origin not in `allowed`.
 * @param {import('playwright').Page} page
 * @param {string} where
 * @param {string} origin the site's own origin
 * @param {string[]} errors
 * @param {readonly string[]} [allowed]
 */
export function watchPage(page, where, origin, errors, allowed = []) {
  page.on('console', (message) => {
    if (message.type() === 'error' && message.text().includes('Content Security Policy')) {
      errors.push(`${where}: ${message.text()}`);
    }
  });
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.protocol.startsWith('http') && url.origin !== origin && !allowed.includes(url.origin)) {
      errors.push(`${where}: request to an outside origin ${url.origin}`);
    }
  });
}

/**
 * Reports any cookie, and any browser storage outside ALLOWED_STORAGE.
 * @param {import('playwright').Page} page
 * @param {string} where
 * @param {string[]} errors
 */
export async function checkTrackers(page, where, errors) {
  for (const cookie of await page.context().cookies()) {
    errors.push(`${where}: sets the cookie ${cookie.name}`);
  }
  const keys = await page.evaluate(() => [
    ...Object.keys(localStorage),
    ...Object.keys(sessionStorage).map((key) => `session:${key}`),
  ]);
  for (const key of keys.filter((key) => !ALLOWED_STORAGE.has(key))) {
    errors.push(`${where}: stores ${key} in the browser`);
  }
}
