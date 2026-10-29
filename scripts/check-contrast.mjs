// Measures the WCAG 2.2 contrast ratio of every text and control color pair in
// src/styles/tokens.css, in light and in dark, and fails under the AA minimum.
// Run by `npm test`; its table is the record of the measured contrasts.
import { readFileSync } from 'node:fs';

const CSS = readFileSync(new URL('../src/styles/tokens.css', import.meta.url), 'utf8');

/** AA minimums: 4.5 for normal text, 3 for control borders and focus (1.4.11). */
const TEXT = 4.5;
const UI = 3;

/**
 * Pairs to measure.
 * @type {{ fg: string, bg: string, min: number }[]}
 */
const PAIRS = [
  { fg: 'text', bg: 'bg', min: TEXT },
  { fg: 'text', bg: 'bg-subtle', min: TEXT },
  { fg: 'text', bg: 'bg-muted', min: TEXT },
  { fg: 'text-muted', bg: 'bg', min: TEXT },
  { fg: 'text-muted', bg: 'bg-subtle', min: TEXT },
  { fg: 'text-muted', bg: 'bg-muted', min: TEXT },
  { fg: 'text-invert', bg: 'text', min: TEXT },
  { fg: 'alert', bg: 'bg', min: TEXT },
  { fg: 'alert', bg: 'bg-subtle', min: TEXT },
  { fg: 'alert', bg: 'alert-bg', min: TEXT },
  { fg: 'border-strong', bg: 'bg', min: UI },
  { fg: 'border-strong', bg: 'bg-subtle', min: UI },
  { fg: 'focus', bg: 'bg', min: UI },
  { fg: 'focus', bg: 'bg-subtle', min: UI },
  { fg: 'focus', bg: 'bg-muted', min: UI },
];

/**
 * Reads every `--color-*` token: a `light-dark()` pair or a `var()` alias.
 * @returns {Map<string, { light: string, dark: string }>}
 */
function readTokens() {
  /** @type {Map<string, { light: string, dark: string }>} */
  const tokens = new Map();
  for (const [, name = '', value = ''] of CSS.matchAll(/--color-([\w-]+):\s*([^;]+);/g)) {
    const pair = /^light-dark\(\s*(#[0-9a-f]{6})\s*,\s*(#[0-9a-f]{6})\s*\)$/i.exec(value);
    const alias = /^var\(--color-([\w-]+)\)$/.exec(value);
    const target = alias?.[1] && tokens.get(alias[1]);
    if (pair?.[1] && pair[2]) tokens.set(name, { light: pair[1], dark: pair[2] });
    else if (target) tokens.set(name, target);
    else throw new Error(`--color-${name}: unsupported value ${value}`);
  }
  return tokens;
}

/** @param {string} hex */
function luminance(hex) {
  /** @param {number} i */
  const channel = (i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
}

/** @param {string} a @param {string} b */
function ratio(a, b) {
  const [la, lb] = [luminance(a), luminance(b)];
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

const tokens = readTokens();
/** @type {string[]} */
const errors = [];
/** @type {{ pair: string, min: number, light: string, dark: string }[]} */
const rows = [];
for (const { fg, bg, min } of PAIRS) {
  const f = tokens.get(fg);
  const b = tokens.get(bg);
  if (!f || !b) {
    errors.push(`unknown token in pair ${fg} / ${bg}`);
    continue;
  }
  /** @param {'light' | 'dark'} theme */
  const measure = (theme) => {
    const value = ratio(f[theme], b[theme]);
    if (value < min) {
      errors.push(`${theme}: ${fg} on ${bg} is ${value.toFixed(2)}, under ${String(min)}`);
    }
    return value.toFixed(2);
  };
  rows.push({ pair: `${fg} / ${bg}`, min, light: measure('light'), dark: measure('dark') });
}

console.table(rows);
if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`Contrasts OK: ${String(PAIRS.length)} pairs, light and dark.`);
