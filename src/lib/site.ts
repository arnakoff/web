// Every outside or absolute URL of the site is defined here, once.

/** Public origin of the website. */
export const SITE_URL = 'https://arnakoff.com';

/** Path of the page that explains how Arnakoff works and its limits. */
export const HOW_IT_WORKS_PATH = '/comment-ca-marche/';

/** Path of the page that lists the data sources, their licences and freshness. */
export const SOURCES_PATH = '/sources/';

/** Path of the page that lists the signals a check can give, with examples. */
export const SIGNALS_PATH = '/signaux/';

/** Path of the online checker. */
export const CHECKER_PATH = '/verifier/';

/** Path of the status page: whether the API answers and the state of each source's data. */
export const STATUS_PATH = '/etat/';

/** Path of the privacy policy: what each part of Arnakoff keeps, for how long, and the rights. */
export const PRIVACY_PATH = '/confidentialite/';
/** Path of the legal notice: publisher, contact and host. */
export const LEGAL_NOTICE_PATH = '/mentions-legales/';

/** Path where Starlight serves the API documentation. */
export const DOCS_PATH = '/docs/';

/** Route base and path of the API reference generated from the OpenAPI contract. */
export const REFERENCE_BASE = 'docs/reference';
export const REFERENCE_PATH = `/${REFERENCE_BASE}/`;

/**
 * Path of the error pages: the `type` of each error the API answers is this
 * page followed by its `code` (`ARNAKOFF_PROBLEM_BASE_URL` in `arnakoff/api`).
 */
export const ERRORS_PATH = '/docs/erreurs/';

/** Path of the docs page on getting, sending and rotating a key, and on quotas. */
export const AUTH_PATH = '/docs/authentification/';

/** Path of the docs page on the MCP server, for AI assistants. */
export const MCP_PATH = '/docs/mcp/';

/** Path of the terms of use of the site, the online checker and the API. */
export const TERMS_PATH = '/conditions-utilisation/';

/** Absolute URL of the API documentation. */
export const DOCS_URL = new URL(DOCS_PATH, SITE_URL).href;

/**
 * Base URL of the public API, versioned by path (`/v1`, see `arnakoff/api`
 * docs/standards.md). Its origin is the `servers` of the API contract, which
 * the request examples of the reference call (checked by `npm test`).
 */
export const API_URL = 'https://api.arnakoff.com/v1';

/** Origin of the API, the only outside origin the CSP lets the checker and the status page call. */
export const API_ORIGIN = new URL(API_URL).origin;

/** Keyless check of the online checker (`POST /v1/demo/check`). */
export const DEMO_CHECK_URL = `${API_URL}/demo/check`;

/** Sources and the state of their data (`GET /v1/sources`), read by the status page. */
export const SOURCES_ENDPOINT_URL = `${API_URL}/sources`;

/**
 * Remote MCP endpoint (`POST /mcp`, outside `/v1`), and the entry of the
 * server in the official MCP registry (`server.json` of `arnakoff/api`).
 */
export const MCP_URL = `${API_ORIGIN}/mcp`;
export const MCP_REGISTRY_URL =
  'https://registry.modelcontextprotocol.io/v0/servers?search=com.arnakoff/api';

/**
 * Cloudflare Turnstile, the anti-abuse check of the online checker: its script,
 * in explicit rendering, and the public site key of the arnakoff.com widget,
 * whose secret key is `ARNAKOFF_TURNSTILE_SECRET` of arnakoff/api. Only
 * `/verifier/` lets its origin in (public/_headers).
 */
export const TURNSTILE_SCRIPT_URL =
  'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
export const TURNSTILE_ORIGIN = new URL(TURNSTILE_SCRIPT_URL).origin;
export const TURNSTILE_SITE_KEY = '0x4AAAAAAFxr6UA4T-FbNb5I';

/** GitHub organization of Arnakoff, and its source repositories. */
export const ORG_GITHUB_URL = 'https://github.com/arnakoff';
export const REPO_WEB_URL = `${ORG_GITHUB_URL}/web`;
export const REPO_API_URL = `${ORG_GITHUB_URL}/api`;

/** Public history of the terms of use, the source file of their page. */
export const TERMS_HISTORY_URL = `${REPO_WEB_URL}/commits/main/src/pages/conditions-utilisation.astro`;

/** Security policy of the organization (SECURITY.md of arnakoff/.github). */
export const SECURITY_POLICY_URL = `${ORG_GITHUB_URL}/.github/blob/main/SECURITY.md`;

/** Roadmap of the Arnakoff organization, linked from the API README. */
export const ROADMAP_URL = 'https://github.com/orgs/arnakoff/projects/1';

/** Public lists of the API: its sources with their licences, and its signals. */
export const API_SOURCES_URL = `${REPO_API_URL}/blob/main/docs/sources.md`;
export const API_SIGNALS_URL = `${REPO_API_URL}/blob/main/docs/signals.md`;

/** Standards of the API (versioning, deprecation) and its published releases. */
export const API_STANDARDS_URL = `${REPO_API_URL}/blob/main/docs/standards.md`;
export const API_RELEASES_URL = `${REPO_API_URL}/releases`;

/** Issue forms of the API repository, where a bug is reported (SUPPORT.md of arnakoff/.github). */
export const API_ISSUES_URL = `${REPO_API_URL}/issues/new/choose`;

/** Standards the API follows, at their official source. */
export const STANDARD_URLS = {
  semver: 'https://semver.org/lang/fr/',
  problemDetails: 'https://www.rfc-editor.org/rfc/rfc9457',
  deprecation: 'https://www.rfc-editor.org/rfc/rfc9745',
  sunset: 'https://www.rfc-editor.org/rfc/rfc8594',
  mcp: 'https://modelcontextprotocol.io',
} as const;

/** Contact address of Arnakoff (arnakoff/.github#3), also used for the code of conduct. */
export const CONTACT_EMAIL = 'contact@arnakoff.com';
export const CONTACT_MAILTO = `mailto:${CONTACT_EMAIL}`;

/**
 * Outside pages the privacy policy relies on, each read on 06/11/2026: the
 * Turnstile addendum (last updated 18/06/2025), the Cloudflare privacy policy
 * (effective 04/11/2025), the Web Analytics page that says what the beacon
 * collects, and the CNIL complaint form.
 */
export const PRIVACY_URLS = {
  turnstile: 'https://www.cloudflare.com/turnstile-privacy-policy/',
  cloudflare: 'https://www.cloudflare.com/privacypolicy/',
  webAnalytics: 'https://developers.cloudflare.com/web-analytics/about/',
  cnilComplaint: 'https://www.cnil.fr/fr/adresser-une-plainte',
} as const;

/**
 * Host of the website (Cloudflare Pages), as Cloudflare gives it on
 * https://www.cloudflare.com/website-terms/, checked on 06/11/2026.
 */
export const SITE_HOST = {
  name: 'Cloudflare, Inc.',
  address: '101 Townsend St, San Francisco, CA 94107, États-Unis',
  phone: '+1 650 319 8930',
  tel: 'tel:+16503198930',
} as const;

/**
 * Article 1-1 of the LCEN (loi n° 2004-575 du 21 juin 2004), whose II lets a
 * non-professional publisher stay anonymous. Checked on Légifrance on 06/11/2026.
 */
export const LCEN_PUBLISHER_URL =
  'https://www.legifrance.gouv.fr/loda/article_lc/LEGIARTI000049568614';

/** Official services for a scam victim, each checked on its own site on 29/10/2026. */
export const HELP_URLS = {
  cyber17: 'https://www.17cyber.gouv.fr/',
  signalConso: 'https://signal.conso.gouv.fr/',
  spam33700: 'https://www.33700.fr/',
  amfBlacklists:
    'https://www.amf-france.org/fr/espace-epargnants/proteger-son-epargne/listes-noires-et-mises-en-garde',
  abeInfoService: 'https://www.abe-infoservice.fr/',
} as const;
