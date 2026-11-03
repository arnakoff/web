// Share links of the online checker. Only a site or a domain can be shared:
// an e-mail, a phone number, an IBAN, a SIREN or a SIRET can name a person,
// so it never goes into a URL. The domain travels in the fragment
// (`/verifier/#site=exemple.fr`), which the browser sends neither to the
// server nor in a `Referer`. Opening the link checks the domain again.
import type { Report } from './checker.ts';
import { CHECKER_PATH, SITE_URL } from './site.ts';

/** Name of the fragment parameter that carries the shared domain. */
const KEY = 'site';

/**
 * A normalized host name as the API returns a `domain` input: lowercase
 * A-labels, at least two labels, a top-level label of letters or an `xn--`
 * A-label (so never an IPv4 address), 253 characters at most.
 */
const HOST =
  /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:[a-z]{2,63}|xn--[a-z0-9-]{1,59})$/;

/** Absolute link that checks the report's domain again, for a domain report only. */
export function shareUrl(report: Pick<Report, 'type' | 'input'>): string | undefined {
  if (report.type !== 'domain' || !HOST.test(report.input)) return undefined;
  // HOST leaves nothing to encode.
  return new URL(`${CHECKER_PATH}#${KEY}=${report.input}`, SITE_URL).href;
}

/** The domain of a share link's fragment (`location.hash`), if it is one. */
export function sharedSite(hash: string): string | undefined {
  const site = new URLSearchParams(hash.replace(/^#/, '')).get(KEY)?.trim().toLowerCase();
  return site && HOST.test(site) ? site : undefined;
}
