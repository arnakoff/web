// Client of the online checker: sends one input to `POST /v1/demo/check` of
// arnakoff/api and reads its answer, a `Report` or an RFC 9457 `Problem` (the
// schemas of api/openapi.yaml). The input travels in the request body, never
// in a URL, and the request carries no cookie. Runs in the browser.
import type { CalloutLevel } from './callout';
import { DEMO_CHECK_URL, ERRORS_PATH, SITE_URL } from './site';

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

export interface Problem {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
  code: string;
}

export type CheckResult =
  | { kind: 'report'; report: Report }
  | { kind: 'problem'; problem: Problem }
  /** No answer the checker can read: network failure, timeout or unexpected body. */
  | { kind: 'unreachable' };

/** Longest wait for an answer, in milliseconds. */
const TIMEOUT = 15_000;

/** Prefix of a Problem's `instance`, before the request identifier. */
const INSTANCE_PREFIX = 'tag:arnakoff.com,2026:request:';

/** The `summary` of a report without signals (`Report` in openapi.yaml). */
export const NO_SIGNAL = 'Aucun signal connu dans nos sources';

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isReport(value: unknown): value is Report {
  return (
    isObject(value) &&
    typeof value.input === 'string' &&
    Array.isArray(value.signals) &&
    Array.isArray(value.sources)
  );
}

function isProblem(value: unknown): value is Problem {
  return (
    isObject(value) &&
    typeof value.title === 'string' &&
    typeof value.detail === 'string' &&
    typeof value.code === 'string'
  );
}

/** Checks `q` with the anti-abuse token of the page. */
export async function demoCheck(q: string, token: string): Promise<CheckResult> {
  let body: unknown;
  try {
    const response = await fetch(DEMO_CHECK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q, turnstile_token: token }),
      credentials: 'omit',
      cache: 'no-store',
      signal: AbortSignal.timeout(TIMEOUT),
    });
    body = await response.json();
    if (response.ok && isReport(body)) return { kind: 'report', report: body };
  } catch {
    return { kind: 'unreachable' };
  }
  return isProblem(body) ? { kind: 'problem', problem: body } : { kind: 'unreachable' };
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
