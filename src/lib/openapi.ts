// Reads the copy of the API's OpenAPI contract (api/openapi.yaml, copied by
// `npm run sync`), so a page quotes the contract instead of a hand-written copy.
import { parse } from 'yaml';
import { problemsOf, type Contract } from './problems';
import contract from '../content/api/openapi.yaml?raw';

const { components } = parse(contract) as Contract;

/** The errors the API answers, each with its page (lib/problems.ts). */
export const PROBLEMS = problemsOf(contract);

/**
 * Returns a named example of `components.examples`. A name the contract no
 * longer has fails the build rather than the page.
 */
export function contractExample(name: string) {
  const example = components.examples[name];
  if (!example) throw new Error(`openapi.yaml has no example named ${name}.`);
  return example;
}

/** Longest line `compactJson` gives a flat object. */
const COMPACT_WIDTH = 60;

/**
 * Formats a value as indented JSON, with each flat object that fits in
 * `COMPACT_WIDTH` characters on one line, as in `{ "source": "AMF", "status": "ok" }`.
 */
export function compactJson(value: unknown) {
  return JSON.stringify(value, null, 2).replace(
    /\{\n\s+([^{}[\]]*?)\n\s*\}/g,
    (block, body: string) => {
      const line = `{ ${body.split(/,\n\s+/).join(', ')} }`;
      return line.length <= COMPACT_WIDTH ? line : block;
    },
  );
}
