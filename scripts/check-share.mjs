// Checks the share links of the online checker (src/lib/share.ts): only a
// site or a domain gets a link, never an e-mail, a phone number, an IBAN, a
// SIREN or a SIRET, and what a link carries is a bare host name in the
// fragment, never in the path or the query.
// Run by `npm test`.
import { shareUrl, sharedSite } from '../src/lib/share.ts';
import { CHECKER_PATH, SITE_URL } from '../src/lib/site.ts';

/** Inputs that can name a person, as the API normalizes them, by type. */
const PERSONAL = [
  { type: 'email', input: 'jean.dupont@exemple.fr' },
  { type: 'phone', input: '+33612345678' },
  { type: 'iban', input: 'FR7630006000011234567890189' },
  { type: 'siren', input: '552100554' },
  { type: 'siret', input: '55210055400013' },
];

/** `domain` inputs that are not a bare host name and so never go into a URL. */
const NOT_HOSTS = [
  'jean.dupont@exemple.fr',
  'exemple.fr/compte?id=42',
  'exemple.fr#site=x',
  '192.168.1.10',
  'localhost',
  'exemple .fr',
  `${'a'.repeat(64)}.fr`,
  '',
];

const errors = [];
const fail = (message) => errors.push(message);

for (const report of PERSONAL) {
  const url = shareUrl(report);
  if (url !== undefined) fail(`${report.type}: a share link was made (${url})`);
}

for (const input of NOT_HOSTS) {
  const url = shareUrl({ type: 'domain', input });
  if (url !== undefined) fail(`domain ${JSON.stringify(input)}: a share link was made (${url})`);
  if (sharedSite(`#site=${encodeURIComponent(input)}`) !== undefined)
    fail(`#site=${JSON.stringify(input)}: read back as a site`);
}

for (const input of ['exemple.fr', 'www.service-public.fr', 'xn--meli-7ve.fr']) {
  const href = shareUrl({ type: 'domain', input });
  if (href === undefined) {
    fail(`domain ${input}: no share link`);
    continue;
  }
  const url = new URL(href);
  if (url.origin !== SITE_URL || url.pathname !== CHECKER_PATH)
    fail(`domain ${input}: ${href} is not the checker page`);
  if (url.search !== '') fail(`domain ${input}: ${href} has a query`);
  if (url.hash !== `#site=${input}`) fail(`domain ${input}: ${href} carries more than the host`);
  if (sharedSite(url.hash) !== input) fail(`domain ${input}: ${href} does not read back`);
}

if (sharedSite('#site=%20Exemple.FR%20') !== 'exemple.fr')
  fail('a shared host is not trimmed and lowercased');
for (const hash of ['', '#', '#resultat', '#q=exemple.fr'])
  if (sharedSite(hash) !== undefined) fail(`${JSON.stringify(hash)}: read as a site`);

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('Share links: only bare domains, in the fragment.');
