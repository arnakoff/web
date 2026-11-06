// Client of the online checker: sends one input to `POST /v1/demo/check` of
// arnakoff/api and reads its answer, a `Report` or an RFC 9457 `Problem` (the
// schemas of api/openapi.yaml). The input travels in the request body, never
// in a URL, and the request carries no cookie. Runs in the browser.
import { isObject, isProblem, requestJson, type Problem } from './api';
import type { CalloutLevel } from './callout';
import { parseTheme, type Theme } from './theme';
import {
  DEMO_CHECK_URL,
  ERRORS_PATH,
  SITE_URL,
  TURNSTILE_SCRIPT_URL,
  TURNSTILE_SITE_KEY,
} from './site';

/** Absolute address of the error pages, which starts the `type` of each Problem. */
const ERRORS_URL = new URL(ERRORS_PATH, SITE_URL).href;

/** Role of a source in a check (`SourceStatus`). */
export type SourceStatus = 'ok' | 'indisponible' | 'non_applicable';

export interface Signal {
  code: string;
  level: CalloutLevel;
  message: string;
  advice?: string;
  source: string;
  source_url: string;
  observed_at: string;
}

export interface Report {
  input: string;
  type: string;
  checked_at: string;
  summary: string | null;
  signals: Signal[];
  sources: { source: string; status: SourceStatus }[];
}

export type { Problem } from './api';

export type CheckResult =
  | { kind: 'report'; report: Report }
  | { kind: 'problem'; problem: Problem }
  /** No answer the checker can read: network failure, timeout or unexpected body. */
  | { kind: 'unreachable' };

/** Prefix of a Problem's `instance`, before the request identifier. */
const INSTANCE_PREFIX = 'tag:arnakoff.com,2026:request:';

/** The `summary` of a report without signals (`Report` in openapi.yaml). */
export const NO_SIGNAL = 'Aucun signal connu dans nos sources';

function isReport(value: unknown): value is Report {
  return (
    isObject(value) &&
    typeof value.input === 'string' &&
    Array.isArray(value.signals) &&
    Array.isArray(value.sources)
  );
}

/** Checks `q` with the anti-abuse token of the page. */
export async function demoCheck(q: string, token: string): Promise<CheckResult> {
  const answer = await requestJson(DEMO_CHECK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ q, turnstile_token: token }),
  });
  if (answer?.ok && isReport(answer.body)) return { kind: 'report', report: answer.body };
  return isProblem(answer?.body)
    ? { kind: 'problem', problem: answer.body }
    : { kind: 'unreachable' };
}

/** The part of Cloudflare Turnstile's explicit rendering API the checker uses. */
interface Turnstile {
  render(
    container: HTMLElement,
    options: {
      sitekey: string;
      callback: (token: string) => void;
      'expired-callback': () => void;
      'error-callback': () => void;
      language: string;
      theme: Theme;
      size: 'flexible';
    },
  ): string | null | undefined;
  reset(widgetId: string): void;
}

declare global {
  interface Window {
    turnstile?: Turnstile;
  }
}

/**
 * Loads Cloudflare Turnstile and renders its widget in `container`, in the
 * page's theme. `onToken` receives each new token, and `''` when the current
 * one expires or the widget fails. Returns what asks for a new token, once the
 * current one is spent: the API accepts each token once.
 */
export function renderAntiAbuse(
  container: HTMLElement,
  onToken: (token: string) => void,
): () => void {
  let reset = () => undefined;
  const script = document.createElement('script');
  script.src = TURNSTILE_SCRIPT_URL;
  script.addEventListener('load', () => {
    const { turnstile } = window;
    const id = turnstile?.render(container, {
      sitekey: TURNSTILE_SITE_KEY,
      callback: onToken,
      'expired-callback': () => {
        onToken('');
      },
      'error-callback': () => {
        onToken('');
      },
      language: 'fr',
      theme: parseTheme(document.documentElement.dataset.theme),
      size: 'flexible',
    });
    if (turnstile && id) {
      reset = () => {
        turnstile.reset(id);
      };
    }
  });
  document.head.append(script);
  return () => {
    reset();
  };
}

/** The request identifier of a Problem, to quote in a bug report. */
export function requestId(problem: Problem): string | undefined {
  return problem.instance?.startsWith(INSTANCE_PREFIX)
    ? problem.instance.slice(INSTANCE_PREFIX.length)
    : undefined;
}

/** Path of the site's page about a Problem, when its `type` is one of them. */
export function problemPage(problem: Problem): string | undefined {
  // The API's `type` has no final slash; the site's pages have one.
  return problem.type.startsWith(ERRORS_URL)
    ? `${new URL(problem.type).pathname.replace(/\/$/, '')}/`
    : undefined;
}

/** `url` if it is an https address, so an answer can never link a script. */
export function httpsUrl(url: string): string | undefined {
  try {
    return new URL(url).protocol === 'https:' ? url : undefined;
  } catch {
    return undefined;
  }
}

/** A date of the answer as the site writes dates: 02/11/2026. */
export function frenchDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris' });
}
