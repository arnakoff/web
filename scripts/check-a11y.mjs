// Checks the accessibility of the built site in dist/, in a headless Chromium,
// at 375 and 1440 px, in light and dark:
// - axe-core finds no serious or critical violation of WCAG 2.2 A and AA;
// - the page does not scroll sideways;
// - Tab reaches every control in turn, starting with a working skip link,
//   shows a visible focus on each one and never gets stuck;
// - served with the headers of dist/_headers, nothing breaks the CSP, the
//   docs search included;
// - no tracker: no request leaves the site, no cookie is set and browser
//   storage holds nothing but interface state;
// - the online checker, with the API's answers taken from the examples of the
//   contract, shows each one readably and sends the input in the body only,
//   with the token of a stand-in for Cloudflare Turnstile; a domain alone gets
//   a share link, and opening it checks the domain and leaves a bare URL;
// - the status page, with the same kind of answers to GET /v1/sources, shows
//   the state of each source, an error or that the API does not answer.
// Run with `npm test` after `npm run build`. Chromium comes from
// `npx playwright install --only-shell chromium`.
// Callbacks given to page.evaluate run in the browser.
/* global document, getComputedStyle, HTMLAnchorElement, location, Node, window */
import { readFileSync } from 'node:fs';
import AxeBuilder from '@axe-core/playwright';
import { chromium } from 'playwright';
import { parse } from 'yaml';
import {
  API_ORIGIN,
  CHECKER_PATH,
  DEMO_CHECK_URL,
  KEY_PATH,
  KEY_REDEEM_URL,
  KEY_REQUEST_URL,
  SITE_URL,
  SOURCES_ENDPOINT_URL,
  STATUS_PATH,
  TURNSTILE_ORIGIN,
  TURNSTILE_SCRIPT_URL,
} from '../src/lib/site.ts';
import { DIST, PAGES, requireDist, serveDist } from './dist.mjs';
import { PAGE_ORIGINS, checkTrackers, watchPage } from './trackers.mjs';

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

/** The copy of the API contract, whose examples are the checker's simulated answers. */
const CONTRACT = /** @type {unknown} */ (
  parse(readFileSync(new URL('../src/content/api/openapi.yaml', import.meta.url), 'utf8'))
);
const EXAMPLES = /** @type {import('../src/lib/problems.ts').Contract} */ (CONTRACT).components
  .examples;

/** The source page of the contract's example signal. */
const SIGNAL_SOURCE_URL = /** @type {{ signals: { source_url: string }[] }} */ (
  /** @type {unknown} */ (EXAMPLES.ReportBlacklisted.value)
).signals[0].source_url;

/** The share link of the checked domain, armen.ltd: its host in the fragment, nothing else. */
const SHARE_URL = `${SITE_URL}${CHECKER_PATH}#site=armen.ltd`;

/**
 * Answers the checker is given, and a text and a link it must then show:
 * each `example` is a contract example; without one, the request fails.
 * `share` is true when the answer is a domain's, the only one with a share
 * link; `opened` checks armen.ltd by opening that link instead of typing it.
 */
const CHECKER_CASES = [
  {
    example: 'ReportBlacklisted',
    status: 200,
    text: 'Figure sur la liste noire',
    link: SIGNAL_SOURCE_URL,
    share: true,
  },
  {
    example: 'ReportBlacklisted',
    status: 200,
    text: 'Figure sur la liste noire',
    link: SIGNAL_SOURCE_URL,
    share: true,
    opened: true,
  },
  {
    example: 'ReportNoSignal',
    status: 200,
    text: 'Aucun signal connu dans nos sources',
    link: '/comment-ca-marche/',
  },
  {
    example: 'ProblemInvalidInput',
    status: 422,
    text: '7NQJ4ZWKX3C5RB2D6HVMTPLE9A',
    link: '/docs/erreurs/invalid_input/',
  },
  { text: "L'API ne répond pas" },
];

/** The contract's example source, a downloaded one. */
const EXAMPLE_SOURCE = /** @type {{ sources: Record<string, unknown>[] }} */ (
  /** @type {unknown} */ (EXAMPLES.SourceList.value)
).sources[0];

/**
 * The sources the status page is given: the contract's example, a registry
 * queried on demand and a source without data in service, each as the
 * `Source` schema of the contract describes it.
 */
const STATUS_SOURCES = {
  sources: [
    EXAMPLE_SOURCE,
    { ...EXAMPLE_SOURCE, name: 'SIRENE', updated_at: null, entries: null },
    { ...EXAMPLE_SOURCE, name: 'ARCEP', status: 'indisponible', updated_at: null, entries: 0 },
  ],
};

/**
 * Answers the status page is given, and a text it must then show: `body`
 * is the answer; when it is null, the request fails.
 */
const STATUS_CASES = [
  { status: 200, body: STATUS_SOURCES, text: "L'API répond. 2 sources en service sur 3." },
  { status: 200, body: STATUS_SOURCES, text: 'Indisponible' },
  {
    status: 429,
    body: EXAMPLES.ProblemTooManyRequests?.value,
    text: 'Le quota de requêtes est atteint.',
  },
  { status: 0, body: null, text: "L'API ne répond pas." },
];

/**
 * Answers GET /v1/sources of `page` with `body`, as the API lets the site
 * read it, or fails the request when `body` is null.
 * @param {import('playwright').Page} page
 * @param {number} [status]
 * @param {unknown} [body]
 */
function stubSources(page, status = 200, body = STATUS_SOURCES) {
  return page.route(SOURCES_ENDPOINT_URL, (route) =>
    body === null
      ? route.abort()
      : route.fulfill({
          status,
          contentType: status === 200 ? 'application/json' : 'application/problem+json',
          headers: { 'Access-Control-Allow-Origin': origin },
          body: JSON.stringify(body),
        }),
  );
}

/** The token the stand-in for Turnstile gives. */
const TURNSTILE_TOKEN = 'test-token';

/**
 * Stand-in for the script of Cloudflare Turnstile, so that no request leaves
 * the machine: its widget gives a token at once, and a new one on each reset.
 */
const TURNSTILE_STUB = `let options;
window.turnstile = {
  render(container, given) {
    options = given;
    options.callback(${JSON.stringify(TURNSTILE_TOKEN)});
    return 'stub';
  },
  reset() {
    options.callback(${JSON.stringify(TURNSTILE_TOKEN)});
  },
};`;

/**
 * Serves the stand-in for Turnstile to `page`.
 * @param {import('playwright').Page} page
 */
function stubTurnstile(page) {
  return page.route(TURNSTILE_SCRIPT_URL, (route) =>
    route.fulfill({ contentType: 'text/javascript', body: TURNSTILE_STUB }),
  );
}

/**
 * Everything that can take focus. More tab stops than the page has of these
 * means focus never leaves it: a trap.
 */
const FOCUSABLE =
  'a[href], area[href], button, input, select, textarea, summary, iframe, [tabindex], [contenteditable]';

/** @type {string[]} */
const errors = [];
/** @type {string[]} */
const notes = [];

requireDist();

const { origin, close } = await serveDist();

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
  const maxStops = (await page.locator(FOCUSABLE).count()) + 1;
  for (let stop = 0; ; stop += 1) {
    if (stop === maxStops) {
      problems.push(`focus is still in the page after ${String(maxStops)} tab stops`);
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
 * Runs the docs search, which loads Pagefind's worker and WebAssembly.
 * @param {import('playwright').Browser} browser
 */
async function checkSearch(browser) {
  const where = `${SEARCH.path} search`;
  const page = await browser.newPage();
  watchPage(page, where, origin, errors);
  await page.goto(origin + SEARCH.path);
  await page.click('button[data-open-modal]');
  await page.fill('.pagefind-ui__search-input', SEARCH.query);
  try {
    await page.waitForSelector('.pagefind-ui__result', { timeout: 10_000 });
  } catch {
    errors.push(`${where}: « ${SEARCH.query} » gives no result`);
  }
  await checkTrackers(page, where, errors);
  await page.close();
}

/**
 * Runs axe on the page as it is shown and reports its serious and critical violations.
 * @param {import('playwright').Page} page
 * @param {string} where
 */
async function checkAxe(page, where) {
  const results = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
  for (const violation of results.violations) {
    if (violation.impact && FAILING_IMPACTS.has(violation.impact)) {
      errors.push(`${where}: ${violation.id}: ${violation.help}`);
    }
  }
}

/**
 * Runs the online checker against simulated answers of the API, then axe on
 * the shown result.
 * @param {import('playwright').Browser} browser
 */
async function checkChecker(browser) {
  for (const { example, status, text, link, share = false, opened = false } of CHECKER_CASES) {
    const where = `${CHECKER_PATH} checker ${example ?? 'unreachable'}${opened ? ' from its share link' : ''}`;
    const context = await browser.newContext();
    const page = await context.newPage();
    watchPage(page, where, origin, errors, [API_ORIGIN, TURNSTILE_ORIGIN]);
    await stubTurnstile(page);
    /** @type {string[]} */
    const sent = [];
    await page.route(DEMO_CHECK_URL, async (route) => {
      const request = route.request();
      if (request.method() === 'OPTIONS') {
        await route.fulfill({
          status: 204,
          headers: {
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Methods': 'POST',
            'Access-Control-Allow-Headers': 'Content-Type',
          },
        });
        return;
      }
      sent.push(request.postData() ?? '');
      if (!example) {
        await route.abort();
        return;
      }
      await route.fulfill({
        status,
        contentType: status === 200 ? 'application/json' : 'application/problem+json',
        headers: { 'Access-Control-Allow-Origin': origin },
        body: JSON.stringify(EXAMPLES[example]?.value),
      });
    });
    if (opened) {
      await page.goto(SHARE_URL.replace(SITE_URL, origin));
    } else {
      await page.goto(origin + CHECKER_PATH);
      await page.fill('#checker-q', 'armen.ltd');
      await page.press('#checker-q', 'Enter');
    }
    try {
      await page.getByText(text).waitFor({ timeout: 5_000 });
    } catch {
      errors.push(`${where}: « ${text} » is not shown`);
    }
    if (link && (await page.locator(`#checker-output a[href="${link}"]`).count()) === 0) {
      errors.push(`${where}: no link to ${link}`);
    }
    if ((await page.evaluate(() => document.activeElement?.id)) !== 'checker-result-title') {
      errors.push(`${where}: the focus is not on the result`);
    }
    if (new URL(page.url()).search !== '' || page.url().includes('armen')) {
      errors.push(`${where}: the input is in the page's URL`);
    }
    const shareLink = page.locator('#checker-output .share a');
    const shared = (await shareLink.count()) > 0 ? await shareLink.getAttribute('href') : null;
    if (share ? shared !== SHARE_URL : shared !== null) {
      errors.push(`${where}: share link ${String(shared)}, expected ${share ? SHARE_URL : 'none'}`);
    }
    /** @type {unknown} */
    const parsed = JSON.parse(sent[0] ?? '{}');
    const body = /** @type {{ q?: unknown, turnstile_token?: unknown }} */ (parsed);
    if (sent.length !== 1 || body.q !== 'armen.ltd') {
      errors.push(`${where}: the input is not sent once in the request body`);
    }
    if (body.turnstile_token !== TURNSTILE_TOKEN) {
      errors.push(`${where}: the Turnstile token is not sent`);
    }
    await checkAxe(page, where);
    await checkTrackers(page, where, errors);
    await context.close();
  }
}

/**
 * Runs the status page against simulated answers of GET /v1/sources, then
 * axe on the shown state.
 * @param {import('playwright').Browser} browser
 */
async function checkStatus(browser) {
  for (const { status, body, text } of STATUS_CASES) {
    const where = `${STATUS_PATH} ${status === 0 ? 'unreachable' : String(status)} « ${text} »`;
    const context = await browser.newContext();
    const page = await context.newPage();
    watchPage(page, where, origin, errors, [API_ORIGIN]);
    await stubSources(page, status, body);
    await page.goto(origin + STATUS_PATH);
    try {
      await page.getByText(text).first().waitFor({ timeout: 5_000 });
    } catch {
      errors.push(`${where}: « ${text} » is not shown`);
    }
    await checkAxe(page, where);
    await checkTrackers(page, where, errors);
    await context.close();
  }
}

/** A login link's token, as the API mails it: 43 base62 characters. */
const LINK_TOKEN = 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFG';

/**
 * The key page against simulated answers of the API, taken from the
 * contract's examples: a login link gives a key, an expired one an error,
 * and a request a link. The token must leave the address at once.
 * @param {import('playwright').Browser} browser
 */
async function checkKeyPage(browser) {
  const issued = /** @type {{ api_key: string }} */ (EXAMPLES.IssuedKey.value);
  const cases = [
    { name: 'link', status: 201, body: EXAMPLES.IssuedKey.value, text: issued.api_key },
    {
      name: 'expired link',
      status: 422,
      body: EXAMPLES.ProblemInvalidLoginLink.value,
      text: /** @type {{ title: string }} */ (EXAMPLES.ProblemInvalidLoginLink.value).title,
    },
  ];
  for (const { name, status, body, text } of cases) {
    const where = `${KEY_PATH} ${name}`;
    const context = await browser.newContext();
    const page = await context.newPage();
    watchPage(page, where, origin, errors, [API_ORIGIN, TURNSTILE_ORIGIN]);
    await stubTurnstile(page);
    /** @type {unknown} */
    let sent;
    await page.route(KEY_REDEEM_URL, async (route) => {
      sent = route.request().postDataJSON();
      await route.fulfill({
        status,
        contentType: status === 201 ? 'application/json' : 'application/problem+json',
        headers: { 'Access-Control-Allow-Origin': origin },
        body: JSON.stringify(body),
      });
    });
    await page.goto(`${origin}${KEY_PATH}#${LINK_TOKEN}`);
    try {
      await page.getByText(text).first().waitFor({ timeout: 5_000 });
    } catch {
      errors.push(`${where}: « ${text} » is not shown`);
    }
    if (/** @type {{ token?: unknown }} */ (sent)?.token !== LINK_TOKEN)
      errors.push(`${where}: the link's token is not sent to ${KEY_REDEEM_URL}`);
    if (await page.evaluate(() => location.hash !== ''))
      errors.push(`${where}: the link's token stays in the address`);
    await checkAxe(page, where);
    await checkTrackers(page, where, errors);
    await context.close();
  }

  const where = `${KEY_PATH} request`;
  const context = await browser.newContext();
  const page = await context.newPage();
  watchPage(page, where, origin, errors, [API_ORIGIN, TURNSTILE_ORIGIN]);
  await stubTurnstile(page);
  /** @type {unknown} */
  let asked;
  await page.route(KEY_REQUEST_URL, async (route) => {
    asked = route.request().postDataJSON();
    await route.fulfill({ status: 202, headers: { 'Access-Control-Allow-Origin': origin } });
  });
  await page.goto(origin + KEY_PATH);
  await page.getByLabel('Ton adresse e-mail').fill('dev@exemple.fr');
  await page.getByRole('button', { name: 'Recevoir le lien' }).click();
  try {
    await page.getByText('demande reçue').first().waitFor({ timeout: 5_000 });
  } catch {
    errors.push(`${where}: « demande reçue » is not shown`);
  }
  const request = /** @type {{ email?: unknown, turnstile_token?: unknown } | undefined} */ (asked);
  if (request?.email !== 'dev@exemple.fr' || request.turnstile_token !== TURNSTILE_TOKEN)
    errors.push(`${where}: ${KEY_REQUEST_URL} did not get the address and the anti-abuse token`);
  await checkAxe(page, where);
  await checkTrackers(page, where, errors);
  await context.close();
}

const browser = await chromium.launch();
try {
  await checkSearch(browser);
  await checkChecker(browser);
  await checkStatus(browser);
  await checkKeyPage(browser);
  for (const path of PAGES) {
    for (const viewport of VIEWPORTS) {
      for (const colorScheme of SCHEMES) {
        const where = `${path} ${String(viewport.width)}px ${colorScheme}`;
        const context = await browser.newContext({ viewport, colorScheme });
        const page = await context.newPage();
        watchPage(page, where, origin, errors, PAGE_ORIGINS.get(path) ?? []);
        await stubTurnstile(page);
        await stubSources(page);
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
        await checkTrackers(page, where, errors);
        await context.close();
      }
    }
  }
} finally {
  await browser.close();
  await close();
}

if (notes.length > 0)
  console.warn(`Accepted, minor or moderate axe findings:\n${notes.join('\n')}\n`);
if (errors.length > 0) {
  console.error(errors.join('\n'));
  console.error(`\n${String(errors.length)} accessibility problem(s) in ${DIST}.`);
  process.exit(1);
}
console.log(
  `dist/ accessible: ${String(PAGES.length)} pages at ${VIEWPORTS.map(({ width }) => `${String(width)}px`).join(' and ')}, ${SCHEMES.join(' and ')}: axe WCAG 2.2 AA, overflow, keyboard, CSP and trackers checked, docs search, online checker, key page and status page included.`,
);
