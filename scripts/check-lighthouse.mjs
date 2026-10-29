// Checks the Lighthouse budgets of the built site in dist/, served with the
// headers of dist/_headers, with the mobile and desktop presets: each page
// scores at least BUDGETS in every category. Lighthouse simulates a slow
// network and CPU, so the scores barely depend on the machine.
// Run with `npm test` after `npm run build`. Chromium comes from
// `npx playwright install --only-shell chromium`.
import { createServer } from 'node:net';
import lighthouse from 'lighthouse';
import desktopConfig from 'lighthouse/core/config/desktop-config.js';
import { chromium } from 'playwright';
import { DIST, PAGES, requireDist, serveDist } from './dist.mjs';

/**
 * Lowest score of each category, from 0 to 1. Performance keeps a small
 * margin for the variance of simulated throttling; the others have none.
 */
const BUDGETS = {
  performance: 0.95,
  accessibility: 1,
  'best-practices': 1,
  seo: 1,
};

/** Every page but the 404 one, which Lighthouse marks as not indexable. */
const CHECKED = PAGES.filter((path) => path !== '/404');

/** @type {{ name: string, config: import('lighthouse').Config | undefined }[]} */
const PRESETS = [
  { name: 'mobile', config: undefined },
  { name: 'desktop', config: desktopConfig },
];

/**
 * Returns a free local TCP port for Chromium's debugging protocol.
 * @returns {Promise<number>}
 */
function freePort() {
  return new Promise((done, fail) => {
    const probe = createServer();
    probe.once('error', fail);
    probe.listen(0, '127.0.0.1', () => {
      const address = probe.address();
      probe.close(() => {
        if (address === null || typeof address === 'string') fail(new Error('no free port'));
        else done(address.port);
      });
    });
  });
}

/** @type {string[]} */
const errors = [];
/** @type {string[]} */
const scores = [];

requireDist();
const { origin, close } = await serveDist();
const port = await freePort();
const browser = await chromium.launch({ args: [`--remote-debugging-port=${String(port)}`] });
try {
  for (const path of CHECKED) {
    for (const preset of PRESETS) {
      const where = `${path} ${preset.name}`;
      const result = await lighthouse(
        origin + path,
        { port, logLevel: 'error', onlyCategories: Object.keys(BUDGETS) },
        preset.config,
      );
      if (!result) throw new Error(`${where}: Lighthouse returned no result`);
      const { categories, runtimeError } = result.lhr;
      if (runtimeError) {
        errors.push(`${where}: ${runtimeError.code} ${runtimeError.message}`);
        continue;
      }
      /** @type {string[]} */
      const line = [];
      for (const [id, budget] of Object.entries(BUDGETS)) {
        const category = categories[id];
        const score = category?.score ?? 0;
        line.push(`${id} ${String(Math.round(score * 100))}`);
        if (score >= budget) continue;
        // The audits that cost points, so the failure says what to fix.
        const failing = (category?.auditRefs ?? [])
          .filter((ref) => ref.weight > 0)
          .map((ref) => result.lhr.audits[ref.id])
          .filter((audit) => audit && audit.score !== null && audit.score < 1)
          .map((audit) => `${audit?.id ?? ''} (${String(audit?.score ?? '')})`);
        errors.push(
          `${where}: ${id} ${String(score)} < ${String(budget)}${failing.length > 0 ? ` — ${failing.join(', ')}` : ''}`,
        );
      }
      scores.push(`${where}: ${line.join(', ')}`);
    }
  }
} finally {
  await browser.close();
  await close();
}

console.log(scores.join('\n'));
if (errors.length > 0) {
  console.error(`\n${errors.join('\n')}`);
  console.error(`\n${String(errors.length)} Lighthouse budget(s) missed in ${DIST}.`);
  process.exit(1);
}
console.log(
  `dist/ within the Lighthouse budgets: ${String(CHECKED.length)} pages, mobile and desktop, ${Object.entries(
    BUDGETS,
  )
    .map(([id, budget]) => `${id} ≥ ${String(budget * 100)}`)
    .join(', ')}.`,
);
