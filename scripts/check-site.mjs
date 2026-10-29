// Checks the built site in dist/: expected pages exist, every internal link
// resolves to a built file, and every page carries its required metadata.
// Run with `npm test` after `npm run build`.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITE_URL } from '../src/lib/site.ts';

const DIST = fileURLToPath(new URL('../dist/', import.meta.url));

/** Every page the site must build, as its URL path. */
const PAGES = ['/', '/docs/', '/404'];

/**
 * Files that pages link to before they exist, each with the issue that adds
 * it. Remove an entry when its issue lands.
 */
const PENDING = new Map([['/favicon.svg', '#10']]);

/** @type {string[]} */
const errors = [];
/** @param {string} file @param {string} message */
const fail = (file, message) => errors.push(`${file}: ${message}`);

/**
 * Lists every HTML file under a directory.
 * @param {string} dir
 * @returns {string[]}
 */
function htmlFiles(dir) {
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
function resolve(pathname) {
  const clean = decodeURIComponent(pathname).replace(/^\/+|\/+$/g, '');
  const candidates = [clean, join(clean, 'index.html'), `${clean}.html`];
  return (
    candidates
      .map((candidate) => join(DIST, candidate))
      .find((file) => existsSync(file) && statSync(file).isFile()) ?? null
  );
}

/**
 * Returns the value of an attribute inside one tag, or null.
 * @param {string} tag
 * @param {string} name
 */
function attribute(tag, name) {
  const match = new RegExp(`\\s${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i').exec(tag);
  return match ? (match[2] ?? match[3] ?? match[4] ?? '') : null;
}

/**
 * Returns the first tag matching a pattern, or null.
 * @param {string} html
 * @param {string} pattern
 */
function findTag(html, pattern) {
  return new RegExp(pattern, 'i').exec(html)?.[0] ?? null;
}

if (!existsSync(DIST)) {
  console.error('dist/ is missing: run `npm run build` first.');
  process.exit(1);
}

for (const page of PAGES) {
  if (!resolve(page)) fail(page, 'expected page is not built');
}

for (const file of htmlFiles(DIST)) {
  const name = relative(DIST, file).split(sep).join('/');
  const html = readFileSync(file, 'utf8');
  const pageUrl = new URL(`/${name.replace(/(^|\/)index\.html$/, '$1')}`, SITE_URL);

  // Metadata.
  if (attribute(findTag(html, '<html\\b[^>]*>') ?? '', 'lang') !== 'fr')
    fail(name, '<html lang="fr"> is missing');
  if (!/<title>[^<]+<\/title>/i.test(html)) fail(name, '<title> is missing or empty');
  if (
    !attribute(findTag(html, '<meta\\b[^>]*name=["\']?description["\']?[^>]*>') ?? '', 'content')
  ) {
    fail(name, '<meta name="description"> is missing or empty');
  }
  if (!findTag(html, '<meta\\b[^>]*name=["\']?viewport["\']?[^>]*>'))
    fail(name, '<meta name="viewport"> is missing');
  if (!attribute(findTag(html, '<link\\b[^>]*rel=["\']?canonical["\']?[^>]*>') ?? '', 'href')) {
    fail(name, '<link rel="canonical"> is missing');
  }
  if (!/<h1\b/i.test(html)) fail(name, '<h1> is missing');

  // Internal links and assets.
  for (const [tag] of html.matchAll(/<(?:a|link|script|img|source)\b[^>]*>/gi)) {
    const target = attribute(tag, 'href') ?? attribute(tag, 'src');
    if (target === null || target === '' || target.startsWith('#')) continue;
    const url = new URL(target, pageUrl);
    if (url.origin !== pageUrl.origin) continue;
    if (PENDING.has(url.pathname)) continue;
    if (!resolve(url.pathname)) fail(name, `broken internal link ${target}`);
  }
}

if (errors.length > 0) {
  console.error(errors.join('\n'));
  console.error(`\n${String(errors.length)} problem(s) in dist/.`);
  process.exit(1);
}
console.log(
  `dist/ OK: ${String(PAGES.length)} expected pages, internal links and metadata checked.`,
);
