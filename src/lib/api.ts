// What the site's browser clients share to read arnakoff/api: one JSON request
// without cookie or cache, with a time limit, and the RFC 9457 `Problem` the
// API answers on an error (api/openapi.yaml). Runs in the browser.

export interface Problem {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
  code: string;
}

/** Longest wait for an answer, in milliseconds. */
const TIMEOUT = 15_000;

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function isProblem(value: unknown): value is Problem {
  return (
    isObject(value) &&
    typeof value.title === 'string' &&
    typeof value.detail === 'string' &&
    typeof value.code === 'string'
  );
}

/**
 * Sends `init` to `url` and reads the JSON body of the answer, whatever its
 * status. `undefined` when there is no readable answer: network failure,
 * CORS refusal, timeout or a body that is not JSON.
 */
export async function requestJson(
  url: string,
  init: RequestInit = {},
): Promise<{ ok: boolean; body: unknown } | undefined> {
  try {
    const response = await fetch(url, {
      ...init,
      credentials: 'omit',
      cache: 'no-store',
      signal: AbortSignal.timeout(TIMEOUT),
    });
    return { ok: response.ok, body: (await response.json()) as unknown };
  } catch {
    return undefined;
  }
}
