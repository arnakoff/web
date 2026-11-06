// Client of the key page: asks arnakoff/api to mail a login link
// (`POST /v1/keys/request`) and turns the link's token into a free API key
// (`POST /v1/keys/redeem`), with the schemas of api/openapi.yaml. The address
// and the token travel in request bodies, never in a URL, and the requests
// carry no cookie. The key is only returned: nothing stores it. Runs in the
// browser.
import { isObject, isProblem, requestJson, type Problem } from './api';
import { KEY_REDEEM_URL, KEY_REQUEST_URL } from './site';

/** A key the API just issued (`IssuedKey`): shown once, never stored. */
export interface IssuedKey {
  api_key: string;
  hint: string;
  created_at: string;
}

export type LinkResult =
  /** `202`: a link is mailed if the address may receive one, the same answer either way. */
  { kind: 'sent' } | { kind: 'problem'; problem: Problem } | { kind: 'unreachable' };

export type RedeemResult =
  { kind: 'key'; key: IssuedKey } | { kind: 'problem'; problem: Problem } | { kind: 'unreachable' };

/** A login link's fragment: the token alone, as the API writes it. */
const TOKEN = /^#([0-9A-Za-z]{1,256})$/;

function isIssuedKey(value: unknown): value is IssuedKey {
  return (
    isObject(value) &&
    typeof value.api_key === 'string' &&
    typeof value.hint === 'string' &&
    typeof value.created_at === 'string'
  );
}

/** The token of a login link's fragment (`#<token>`), `undefined` for any other fragment. */
export function linkToken(hash: string): string | undefined {
  return TOKEN.exec(hash)?.[1];
}

/** Asks for a login link mailed to `email`, with the anti-abuse token of the page. */
export async function requestLink(email: string, token: string): Promise<LinkResult> {
  const answer = await requestJson(KEY_REQUEST_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, turnstile_token: token }),
  });
  if (answer?.ok) return { kind: 'sent' };
  return isProblem(answer?.body)
    ? { kind: 'problem', problem: answer.body }
    : { kind: 'unreachable' };
}

/** Turns a login link's token into a key. */
export async function redeemLink(token: string): Promise<RedeemResult> {
  const answer = await requestJson(KEY_REDEEM_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
  if (answer?.ok && isIssuedKey(answer.body)) return { kind: 'key', key: answer.body };
  return isProblem(answer?.body)
    ? { kind: 'problem', problem: answer.body }
    : { kind: 'unreachable' };
}
