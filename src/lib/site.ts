// Every outside or absolute URL of the site is defined here, once.

/** Public origin of the website. */
export const SITE_URL = 'https://arnakoff.com';

/** Path of the page that explains how Arnakoff works and its limits. */
export const HOW_IT_WORKS_PATH = '/comment-ca-marche/';

/** Path where Starlight serves the API documentation. */
export const DOCS_PATH = '/docs/';

/** Absolute URL of the API documentation. */
export const DOCS_URL = new URL(DOCS_PATH, SITE_URL).href;

/**
 * Base URL of the public API, versioned by path (`/v1`, see `arnakoff/api`
 * docs/standards.md). The host is not published yet: confirm it before any
 * page displays or calls it.
 */
export const API_URL = 'https://api.arnakoff.com/v1';

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

/** Standards the API follows, at their official source. */
export const STANDARD_URLS = {
  semver: 'https://semver.org/lang/fr/',
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
