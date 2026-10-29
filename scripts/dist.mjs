// Shared by the scripts that check the built site: where it is, which pages
// it must have and how Cloudflare Pages maps a URL path to one of its files.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const DIST = fileURLToPath(new URL('../dist/', import.meta.url));

/** Every page the site must build, as its URL path. */
export const PAGES = ['/', '/comment-ca-marche/', '/docs/', '/docs/versions/', '/404'];

/** Stops the calling script when there is no build to check. */
export function requireDist() {
  if (!existsSync(DIST)) {
    console.error('dist/ is missing: run `npm run build` first.');
    process.exit(1);
  }
}

/**
 * Lists every HTML file under a directory.
 * @param {string} dir
 * @returns {string[]}
 */
export function htmlFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return htmlFiles(path);
    return entry.name.endsWith('.html') ? [path] : [];
  });
}

/** Where `public/_headers` lands, with its placeholder replaced. */
export const HEADERS_FILE = join(DIST, '_headers');

/** Placeholder of `public/_headers` for the inline script hashes. */
export const HASHES_PLACEHOLDER = '{inline-script-hashes}';

/**
 * Returns the CSP source of every inline script a page runs, such as
 * `'sha256-…'`. JSON-LD is data, not a script: the CSP does not apply to it.
 * @param {string} html
 * @returns {string[]}
 */
export function inlineScriptHashes(html) {
  return Array.from(html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\b[^>]*>/gi))
    .filter(([, attributes = '']) => !/\ssrc\s*=|application\/ld\+json/i.test(attributes))
    .map(([, , body = '']) => `'sha256-${createHash('sha256').update(body).digest('base64')}'`);
}

/**
 * Returns the headers dist/_headers gives a URL path. Supports the rules the
 * site uses: an exact path or a path ending in `*`.
 * @param {string} pathname
 * @returns {Record<string, string>}
 */
export function headersFor(pathname) {
  /** @type {Record<string, string>} */
  const headers = {};
  let matches = false;
  for (const line of readFileSync(HEADERS_FILE, 'utf8').split('\n')) {
    if (line.trim() === '' || line.trimStart().startsWith('#')) continue;
    if (!/^\s/.test(line)) {
      const rule = line.trim();
      matches = rule.endsWith('*') ? pathname.startsWith(rule.slice(0, -1)) : pathname === rule;
    } else if (matches) {
      const colon = line.indexOf(':');
      headers[line.slice(0, colon).trim()] = line.slice(colon + 1).trim();
    }
  }
  return headers;
}

/**
 * Maps a URL path to the file Cloudflare Pages would serve, or null.
 * @param {string} pathname
 */
export function resolve(pathname) {
  const clean = decodeURIComponent(pathname).replace(/^\/+|\/+$/g, '');
  const candidates = [clean, join(clean, 'index.html'), `${clean}.html`];
  return (
    candidates
      .map((candidate) => join(DIST, candidate))
      // An encoded `..%2F` must not reach a file outside dist/.
      .filter((file) => file.startsWith(DIST))
      .find((file) => existsSync(file) && statSync(file).isFile()) ?? null
  );
}
