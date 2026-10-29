// Checks the accessibility of the built site in dist/, in a headless Chromium,
// at 375 and 1440 px, in light and dark:
// - axe-core finds no serious or critical violation of WCAG 2.2 A and AA;
// - the page does not scroll sideways;
// - Tab reaches every control in turn, starting with a working skip link,
//   shows a visible focus on each one and never gets stuck;
// - served with the headers of dist/_headers, nothing breaks the CSP, the
//   docs search included.
// Run with `npm test` after `npm run build`. Chromium comes from
// `npx playwright install --only-shell chromium`.
// Callbacks given to page.evaluate run in the browser.
/* global document, getComputedStyle, HTMLAnchorElement, location, Node, window */
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname } from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { chromium } from 'playwright';
import { DIST, PAGES, headersFor, requireDist, resolve } from './dist.mjs';

/** Viewports every page is checked at, in CSS pixels. */
const VIEWPORTS = [
  { width: 375, height: 812 },
  { width: 1440, height: 900 },
];

/** @type {readonly ('light' | 'dark')[]} */
const SCHEMES = ['light', 'dark'];

/** axe-core rule tags: WCAG 2.2 levels A and AA, earlier versions included. */
const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

/** Impacts that fail the check; lower ones are only listed. */
const FAILING_IMPACTS = new Set(['serious', 'critical']);

/**
 * axe findings on markup the site does not own, each with why it is not a
 * barrier. One entry matches one rule on one axe target selector.
 */
const ACCEPTED = [
  {
    rule: 'label-content-name-mismatch',
    target: 'button[data-open-modal=""]',
    reason:
      'Starlight search button: its name « Rechercher » is its visible label; the « Ctrl K » next to it is a shortcut hint, also given by aria-keyshortcuts',
  },
];

/** Page where the docs search is run, and a word it must find. */
const SEARCH = { path: '/docs/', query: 'API' };

/** More tab stops than this on one page means focus never cycles back. */
const MAX_TAB_STOPS = 200;

/** @type {Record<string, string>} */
const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml',
};

/** @type {string[]} */
const errors = [];
/** @type {string[]} */
const notes = [];

requireDist();

// Serves dist/ the way Cloudflare Pages does, 404 page and headers included.
const server = createServer((request, response) => {
  const { pathname } = new URL(request.url ?? '/', 'http://localhost');
  const file = resolve(pathname);
  const status = file ? 200 : 404;
  const served = file ?? resolve('/404');
  if (!served) {
    response.writeHead(404).end();
    return;
  }
  readFile(served).then(
    (body) => {
      response
        .writeHead(status, {
          ...headersFor(pathname),
          'Content-Type': CONTENT_TYPES[extname(served)] ?? 'application/octet-stream',
        })
        .end(body);
    },
    () => {
      response.writeHead(500).end();
    },
  );
});
await new Promise((done) => {
  server.listen(0, '127.0.0.1', () => {
    done(undefined);
  });
});
const address = server.address();
if (address === null || typeof address === 'string') throw new Error('no server port');
const origin = `http://127.0.0.1:${String(address.port)}`;

/**
 * Describes the focused element, as seen by a keyboard user.
 * @param {import('playwright').Page} page
 */
function focused(page) {
  return page.evaluate(() => {
    const element = document.activeElement;
    if (!element || element === document.body) return null;
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    const outlined = style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) > 0;
    return {
      label: `<${element.tagName.toLowerCase()}> « ${(element.getAttribute('aria-label') ?? element.textContent).trim().slice(0, 40)} »`,
      visible: rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden',
      indicated: outlined || style.boxShadow !== 'none',
      skipTarget:
        element instanceof HTMLAnchorElement && element.hash
          ? document.getElementById(decodeURIComponent(element.hash.slice(1))) !== null
          : false,
    };
  });
}

/**
 * Tabs through a freshly loaded page and returns its problems.
 * @param {import('playwright').Page} page
 * @param {string} url the page's URL, to load it again without the skip link's hash
 * @returns {Promise<string[]>}
 */
async function checkKeyboard(page, url) {
  /** @type {string[]} */
  const problems = [];
  await page.keyboard.press('Tab');
  const first = await focused(page);
  if (!first) return ['Tab focuses nothing'];
  if (!first.skipTarget) problems.push(`first tab stop ${first.label} is not a skip link`);

  // The skip link moves the next tab stop past the header: into its target,
  // after it or, when nothing focusable follows the target, out of the page
  // and back round to the skip link itself.
  await page.keyboard.press('Enter');
  await page.keyboard.press('Tab');
  const landed = await page.evaluate(() => {
    const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    const element = document.activeElement;
    if (!target) return false;
    if (!element || element === document.body) return true;
    if (element instanceof HTMLAnchorElement && element.hash === location.hash) return true;
    return (
      target.contains(element) ||
      Boolean(target.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING)
    );
  });
  if (!landed) problems.push('the skip link does not move focus past the header');

  // From the top again, every tab stop until focus leaves the page.
  await page.goto(url);
  for (let stop = 0; ; stop += 1) {
    if (stop === MAX_TAB_STOPS) {
      problems.push(`focus is still in the page after ${String(MAX_TAB_STOPS)} tab stops`);
      break;
    }
    await page.keyboard.press('Tab');
    const element = await focused(page);
    if (!element) break;
    if (!element.visible) problems.push(`tab stop ${element.label} is not visible`);
    else if (!element.indicated) problems.push(`tab stop ${element.label} shows no focus`);
  }
  return problems;
}

/**
 * Reports each CSP violation of a page, which Chromium logs as a console error.
 * @param {import('playwright').Page} page
 * @param {string} where
 */
function watchCsp(page, where) {
  page.on('console', (message) => {
    if (message.type() === 'error' && message.text().includes('Content Security Policy')) {
      errors.push(`${where}: ${message.text()}`);
    }
  });
}

/**
 * Runs the docs search, which loads Pagefind's worker and WebAssembly.
 * @param {import('playwright').Browser} browser
 */
async function checkSearch(browser) {
  const where = `${SEARCH.path} search`;
  const page = await browser.newPage();
  watchCsp(page, where);
  await page.goto(origin + SEARCH.path);
  await page.click('button[data-open-modal]');
  await page.fill('.pagefind-ui__search-input', SEARCH.query);
  try {
    await page.waitForSelector('.pagefind-ui__result', { timeout: 10_000 });
  } catch {
    errors.push(`${where}: « ${SEARCH.query} » gives no result`);
  }
  await page.close();
}

const browser = await chromium.launch();
try {
  await checkSearch(browser);
  for (const path of PAGES) {
    for (const viewport of VIEWPORTS) {
      for (const colorScheme of SCHEMES) {
        const where = `${path} ${String(viewport.width)}px ${colorScheme}`;
        const context = await browser.newContext({ viewport, colorScheme });
        const page = await context.newPage();
        watchCsp(page, where);
        const url = origin + path;
        await page.goto(url);

        const results = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
        for (const violation of results.violations) {
          const failing = violation.impact && FAILING_IMPACTS.has(violation.impact);
          for (const node of violation.nodes) {
            const target = node.target.join(' ');
            const accepted = ACCEPTED.find(
              (entry) => entry.rule === violation.id && entry.target === target,
            );
            const finding = `${where}: ${violation.id} (${violation.impact ?? 'unknown'}): ${violation.help} — ${target}`;
            if (accepted) notes.push(`${finding} — accepted: ${accepted.reason}`);
            else (failing ? errors : notes).push(finding);
          }
        }

        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - window.innerWidth,
        );
        if (overflow > 0) errors.push(`${where}: scrolls sideways by ${String(overflow)} px`);

        for (const problem of await checkKeyboard(page, url)) errors.push(`${where}: ${problem}`);
        await context.close();
      }
    }
  }
} finally {
  await browser.close();
  server.close();
}

if (notes.length > 0)
  console.warn(`Accepted, minor or moderate axe findings:\n${notes.join('\n')}\n`);
if (errors.length > 0) {
  console.error(errors.join('\n'));
  console.error(`\n${String(errors.length)} accessibility problem(s) in ${DIST}.`);
  process.exit(1);
}
console.log(
  `dist/ accessible: ${String(PAGES.length)} pages at ${VIEWPORTS.map(({ width }) => `${String(width)}px`).join(' and ')}, ${SCHEMES.join(' and ')}: axe WCAG 2.2 AA, overflow, keyboard and CSP checked, docs search included.`,
);
