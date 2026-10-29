// Shared by the scripts that check the built site: where it is, which pages
// it must have and how Cloudflare Pages maps a URL path to one of its files.
import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const DIST = fileURLToPath(new URL('../dist/', import.meta.url));

/** Every page the site must build, as its URL path. */
export const PAGES = ['/', '/comment-ca-marche/', '/docs/', '/404'];

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
