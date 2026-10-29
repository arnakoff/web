// Renders the raster icons and the share image from public/favicon.svg, the
// logo copied from arnakoff/.github. Run with `npm run icons` after the logo
// changes, then commit the PNG files: the output depends on the fonts of the
// machine, so it is not rebuilt in CI.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { FAVICON_SVG, ICONS, SHARE_IMAGE } from '../src/lib/meta.ts';

const PUBLIC = new URL('../public/', import.meta.url);
/** @param {string} path */
const publicFile = (path) => fileURLToPath(new URL(path.slice(1), PUBLIC));

const logo = readFileSync(publicFile(FAVICON_SVG), 'utf8');

for (const { path, size } of ICONS) {
  await sharp(Buffer.from(logo), { density: (72 * size) / 512 })
    .resize(size, size)
    .png()
    .toFile(publicFile(path));
}

// The logo drawing, centred on (0, 0) at scale 1, without its white square.
const mark = /<g\b[^>]*>[\s\S]*<\/g>/.exec(logo)?.[0];
if (!mark) throw new Error(`${FAVICON_SVG}: no <g> drawing found`);

// Light theme: the values of --color-bg, --color-text, --color-text-muted and
// --color-alert in src/styles/tokens.css.
const { width, height } = SHARE_IMAGE;
const share = `<svg xmlns="http://www.w3.org/2000/svg" width="${String(width)}" height="${String(height)}">
  <rect width="100%" height="100%" fill="#ffffff"/>
  <rect y="${String(height - 16)}" width="100%" height="16" fill="#cf222e"/>
  ${mark.replace(/transform="[^"]*"/, 'transform="translate(290 307) scale(1.6)"')}
  <g font-family="'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif">
    <text x="490" y="262" font-size="104" font-weight="700" fill="#1f2328" letter-spacing="-1">Arnakoff</text>
    <text x="494" y="340" font-size="38" fill="#59636e">Des signaux sourcés pour repérer</text>
    <text x="494" y="390" font-size="38" fill="#59636e">les arnaques, en France.</text>
  </g>
</svg>`;

await sharp(Buffer.from(share)).png().toFile(publicFile(SHARE_IMAGE.path));
console.log(`Rendered ${[...ICONS.map(({ path }) => path), SHARE_IMAGE.path].join(', ')}.`);
