// Fills the Content-Security-Policy of dist/_headers with the SHA-256 hash of
// every inline script of the built pages, so that the CSP allows them and no
// other, and with the origin of the API the online checker calls. Runs after
// `astro build` in `npm run build`.
import { readFileSync, writeFileSync } from 'node:fs';
import { API_ORIGIN } from '../src/lib/site.ts';
import {
  API_ORIGIN_PLACEHOLDER,
  DIST,
  HASHES_PLACEHOLDER,
  HEADERS_FILE,
  htmlFiles,
  inlineScriptHashes,
  requireDist,
} from './dist.mjs';

requireDist();

const template = readFileSync(HEADERS_FILE, 'utf8');
for (const placeholder of [HASHES_PLACEHOLDER, API_ORIGIN_PLACEHOLDER]) {
  if (!template.includes(placeholder)) {
    console.error(`${HEADERS_FILE}: ${placeholder} is missing.`);
    process.exit(1);
  }
}

// Sorted so that the same pages always give the same file.
const hashes = [
  ...new Set(htmlFiles(DIST).flatMap((file) => inlineScriptHashes(readFileSync(file, 'utf8')))),
].sort();
writeFileSync(
  HEADERS_FILE,
  template
    .replaceAll(HASHES_PLACEHOLDER, hashes.join(' '))
    .replaceAll(API_ORIGIN_PLACEHOLDER, API_ORIGIN),
);
console.log(`dist/_headers: ${String(hashes.length)} inline script hashes in the CSP.`);
