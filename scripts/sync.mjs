// Copies the factual content of the API repository into src/content/api/:
// sources, signals, the OpenAPI contract and the release notes. These copies
// are never edited by hand; change the file in arnakoff/api, then run
// `npm run sync`. The API clone is ../arnakoff unless ARNAKOFF_API_DIR names
// another directory (the daily sync workflow checks it out elsewhere).
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const API = resolve(ROOT, process.env.ARNAKOFF_API_DIR ?? '../arnakoff');
const OUT = join(ROOT, 'src/content/api');

/**
 * Files to copy, from the API repository to src/content/api/. An optional
 * file is not published by the API yet; its copy is removed when it is absent.
 * @type {{ from: string, to: string, optional?: boolean }[]}
 */
const FILES = [
  { from: 'docs/sources.md', to: 'sources.md' },
  { from: 'docs/signals.md', to: 'signals.md' },
  { from: 'api/openapi.yaml', to: 'openapi.yaml', optional: true },
  { from: 'CHANGELOG.md', to: 'changelog.md', optional: true },
];

// A wrong directory would empty the copies instead of updating them.
const goMod = join(API, 'go.mod');
if (
  !existsSync(goMod) ||
  !/^module github\.com\/arnakoff\/api\b/m.test(readFileSync(goMod, 'utf8'))
) {
  console.error(`${API} is not a clone of arnakoff/api: clone it there or set ARNAKOFF_API_DIR.`);
  process.exit(1);
}

mkdirSync(OUT, { recursive: true });
let failed = false;

for (const { from, to, optional } of FILES) {
  const source = join(API, from);
  const copy = join(OUT, to);
  if (!existsSync(source)) {
    if (optional) {
      rmSync(copy, { force: true });
      console.log(`- ${from}: not published by the API yet, skipped`);
    } else {
      console.error(`✗ ${from}: missing from ${API}`);
      failed = true;
    }
    continue;
  }
  // LF everywhere, whatever the line endings of the clone.
  const content = readFileSync(source, 'utf8').replace(/\r\n/g, '\n');
  const changed = !existsSync(copy) || readFileSync(copy, 'utf8') !== content;
  if (changed) writeFileSync(copy, content);
  console.log(`${changed ? '✓ updated' : '  unchanged'} ${from} → src/content/api/${to}`);
}

if (failed) process.exit(1);
