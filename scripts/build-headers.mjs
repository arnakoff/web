// Fills the Content-Security-Policy of dist/_headers with the SHA-256 hash of
// every inline script of the built pages, so that the CSP allows them and no
// other. Runs after `astro build` in `npm run build`.
import { readFileSync, writeFileSync } from 'node:fs';
import {
  DIST,
  HASHES_PLACEHOLDER,
  HEADERS_FILE,
  htmlFiles,
  inlineScriptHashes,
  requireDist,
} from './dist.mjs';

requireDist();

const template = readFileSync(HEADERS_FILE, 'utf8');
if (!template.includes(HASHES_PLACEHOLDER)) {
  console.error(`${HEADERS_FILE}: ${HASHES_PLACEHOLDER} is missing.`);
  process.exit(1);
}

// Sorted so that the same pages always give the same file.
const hashes = [
  ...new Set(htmlFiles(DIST).flatMap((file) => inlineScriptHashes(readFileSync(file, 'utf8')))),
].sort();
writeFileSync(HEADERS_FILE, template.replaceAll(HASHES_PLACEHOLDER, hashes.join(' ')));
console.log(`dist/_headers: ${String(hashes.length)} inline script hashes in the CSP.`);
