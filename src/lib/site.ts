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

/** Absolute URL of the API documentation. */
export const DOCS_URL = new URL(DOCS_PATH, SITE_URL).href;

/**
 * Base URL of the public API, versioned by path (`/v1`, see `arnakoff/api`
 * docs/standards.md). The host is not published yet: confirm it before any
 * page displays or calls it.
 */
export const API_URL = 'https://api.arnakoff.com/v1';

/** Origin of the API, the only outside origin the CSP lets the checker call. */
export const API_ORIGIN = new URL(API_URL).origin;

/** Keyless check of the online checker (`POST /v1/demo/check`). */
export const DEMO_CHECK_URL = `${API_URL}/demo/check`;

/** GitHub organization of Arnakoff, and its source repositories. */
export const ORG_GITHUB_URL = 'https://github.com/arnakoff';
export const REPO_WEB_URL = `${ORG_GITHUB_URL}/web`;
export const REPO_API_URL = `${ORG_GITHUB_URL}/api`;

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
} as const;

/** Official services for a scam victim, each checked on its own site on 29/10/2026. */
export const HELP_URLS = {
  cyber17: 'https://www.17cyber.gouv.fr/',
  signalConso: 'https://signal.conso.gouv.fr/',
  spam33700: 'https://www.33700.fr/',
  amfBlacklists:
    'https://www.amf-france.org/fr/espace-epargnants/proteger-son-epargne/listes-noires-et-mises-en-garde',
  abeInfoService: 'https://www.abe-infoservice.fr/',
} as const;
