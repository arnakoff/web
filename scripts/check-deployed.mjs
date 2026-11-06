// Checks a deployment on Cloudflare Pages for trackers, in a headless Chromium.
// Cloudflare adds its Web Analytics script at deploy time, so it is not in
// dist/ and check-a11y.mjs never sees it. On each page of PAGES:
// - no CSP violation;
// - no request leaves the site, except to Cloudflare Web Analytics, to
//   Cloudflare Turnstile on the online checker and the key page, which alone
//   let it in, and
//   to the API on the status page (PAGE_ORIGINS);
// - no cookie is set and browser storage holds nothing but interface state.
// Run by the Deploy job of CI: `node scripts/check-deployed.mjs <url>`.
import { chromium } from 'playwright';
import { CHECKER_PATH, KEY_PATH, TURNSTILE_ORIGIN } from '../src/lib/site.ts';
import { PAGES } from './dist.mjs';
import { ANALYTICS_ORIGINS, PAGE_ORIGINS, checkTrackers, watchPage } from './trackers.mjs';

/** The pages whose Turnstile widget lets it in, and may keep the network busy. */
const TURNSTILE_PATHS = [CHECKER_PATH, KEY_PATH];

const [base] = process.argv.slice(2);
if (!base) {
  console.error('Usage: node scripts/check-deployed.mjs <url>');
  process.exit(1);
}
const { origin } = new URL(base);

/** @type {string[]} */
const errors = [];
/** Analytics origins the pages requested. @type {Set<string>} */
const analytics = new Set();

const browser = await chromium.launch();
try {
  for (const path of PAGES) {
    const page = await browser.newPage();
    watchPage(page, path, origin, errors, [
      ...ANALYTICS_ORIGINS,
      ...(PAGE_ORIGINS.get(path) ?? []),
    ]);
    page.on('request', (request) => {
      const url = new URL(request.url());
      if (ANALYTICS_ORIGINS.includes(url.origin)) analytics.add(url.origin);
    });
    // Waits for the network to go quiet, so the analytics script has run. The
    // Turnstile widget of the checker and the key page may never go quiet: it
    // retries outside arnakoff.com, the only hostname of its site key.
    const response = await page.goto(origin + path, { waitUntil: 'load' });
    await page
      .waitForLoadState('networkidle', { timeout: 15_000 })
      .catch((/** @type {unknown} */ error) => {
        if (!TURNSTILE_PATHS.includes(path)) throw error;
      });
    // Cloudflare Pages must drop the policy of /* on these pages, not join it.
    const csp = (await response?.allHeaders())?.['content-security-policy'] ?? '';
    if (csp.includes(TURNSTILE_ORIGIN) !== TURNSTILE_PATHS.includes(path) || csp.includes(',')) {
      errors.push(`${path}: unexpected Content-Security-Policy: ${csp}`);
    }
    await checkTrackers(page, path, errors);
    await page.close();
  }
} finally {
  await browser.close();
}

if (errors.length > 0) {
  console.error(errors.join('\n'));
  console.error(`\n${String(errors.length)} tracker or CSP problem(s) on ${origin}.`);
  process.exit(1);
}
console.log(
  `${origin}: ${String(PAGES.length)} pages, no cookie, no outside request, no CSP violation; Cloudflare Web Analytics ${analytics.size > 0 ? 'loaded' : 'not loaded (not enabled on the Pages project)'}.`,
);
