// Fills the Content-Security-Policy of dist/_headers with the SHA-256 hash of
// every inline script of the built pages, so that the CSP allows them and no
// other, with the origin of the API the online checker calls, and with the
// CSP of the checker: the same policy, Cloudflare Turnstile let in. Runs after
// `astro build` in `npm run build`.
import { readFileSync, writeFileSync } from 'node:fs';
import { API_ORIGIN, TURNSTILE_ORIGIN } from '../src/lib/site.ts';
import {
  API_ORIGIN_PLACEHOLDER,
  CHECKER_CSP_PLACEHOLDER,
  DIST,
  HASHES_PLACEHOLDER,
  HEADERS_FILE,
  htmlFiles,
  inlineScriptHashes,
  requireDist,
} from './dist.mjs';

requireDist();

const template = readFileSync(HEADERS_FILE, 'utf8');
for (const placeholder of [HASHES_PLACEHOLDER, API_ORIGIN_PLACEHOLDER, CHECKER_CSP_PLACEHOLDER]) {
  if (!template.includes(placeholder)) {
    console.error(`${HEADERS_FILE}: ${placeholder} is missing.`);
    process.exit(1);
  }
}

// Sorted so that the same pages always give the same file.
const hashes = [
  ...new Set(htmlFiles(DIST).flatMap((file) => inlineScriptHashes(readFileSync(file, 'utf8')))),
].sort();
const filled = template
  .replaceAll(HASHES_PLACEHOLDER, hashes.join(' '))
  .replaceAll(API_ORIGIN_PLACEHOLDER, API_ORIGIN);

// The policy of every page, the first one of the file, with Turnstile's
// script and frame allowed.
const csp = /^\s*Content-Security-Policy:\s*(.+)$/m.exec(filled)?.[1] ?? '';
const directives = csp.split(/;\s*/).filter((directive) => directive !== '');
if (!directives.some((directive) => directive.startsWith('script-src '))) {
  console.error(`${HEADERS_FILE}: no script-src in the Content-Security-Policy of every page.`);
  process.exit(1);
}
const checkerCsp = [
  ...directives.map((directive) =>
    directive.startsWith('script-src ') ? `${directive} ${TURNSTILE_ORIGIN}` : directive,
  ),
  `frame-src ${TURNSTILE_ORIGIN}`,
].join('; ');
writeFileSync(HEADERS_FILE, filled.replaceAll(CHECKER_CSP_PLACEHOLDER, checkerCsp));
console.log(`dist/_headers: ${String(hashes.length)} inline script hashes in the CSP.`);
