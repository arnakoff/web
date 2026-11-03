// Checks a deployment on Cloudflare Pages for trackers, in a headless Chromium.
// Cloudflare adds its Web Analytics script at deploy time, so it is not in
// dist/ and check-a11y.mjs never sees it. On each page of PAGES:
// - no CSP violation;
// - no request leaves the site, except to Cloudflare Web Analytics, and to
//   Cloudflare Turnstile on the online checker, which alone lets it in;
// - no cookie is set and browser storage holds nothing but interface state.
// Run by the Deploy job of CI: `node scripts/check-deployed.mjs <url>`.
import { chromium } from 'playwright';
import { CHECKER_PATH, TURNSTILE_ORIGIN } from '../src/lib/site.ts';
import { PAGES } from './dist.mjs';
import { ANALYTICS_ORIGINS, checkTrackers, watchPage } from './trackers.mjs';

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
    watchPage(
      page,
      path,
      origin,
      errors,
      path === CHECKER_PATH ? [...ANALYTICS_ORIGINS, TURNSTILE_ORIGIN] : ANALYTICS_ORIGINS,
    );
    page.on('request', (request) => {
      const url = new URL(request.url());
      if (ANALYTICS_ORIGINS.includes(url.origin)) analytics.add(url.origin);
    });
    // Waits for the network to go quiet, so the analytics script has run. The
    // Turnstile widget of the checker may never go quiet: it retries outside
    // arnakoff.com, the only hostname of its site key.
    const response = await page.goto(origin + path, { waitUntil: 'load' });
    await page
      .waitForLoadState('networkidle', { timeout: 15_000 })
      .catch((/** @type {unknown} */ error) => {
        if (path !== CHECKER_PATH) throw error;
      });
    // Cloudflare Pages must drop the policy of /* on the checker, not join it.
    const csp = (await response?.allHeaders())?.['content-security-policy'] ?? '';
    if (csp.includes(TURNSTILE_ORIGIN) !== (path === CHECKER_PATH) || csp.includes(',')) {
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
