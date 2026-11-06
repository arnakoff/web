// Client of the status page: reads `GET /v1/sources` of arnakoff/api, the
// sources and the state of their data in service (`SourceList` of
// api/openapi.yaml), and says it in French. Runs in the browser.
import { isObject, isProblem, requestJson, type Problem } from './api';
import { SOURCES_ENDPOINT_URL } from './site';

/** A source as `GET /v1/sources` describes it (`Source`). */
export interface ApiSource {
  name: string;
  status: 'ok' | 'indisponible';
  /** Download of the data in service; `null` when nothing is downloaded or nothing is in service. */
  updated_at: string | null;
  /** Entries in service; `null` for a registry queried on demand. */
  entries: number | null;
}

export type StatusResult =
  | { kind: 'sources'; sources: ApiSource[] }
  | { kind: 'problem'; problem: Problem }
  /** No answer the page can read: network failure, CORS refusal, timeout or unexpected body. */
  | { kind: 'unreachable' };

function isSource(value: unknown): value is ApiSource {
  return (
    isObject(value) &&
    typeof value.name === 'string' &&
    (value.status === 'ok' || value.status === 'indisponible') &&
    (value.updated_at === null || typeof value.updated_at === 'string') &&
    (value.entries === null || typeof value.entries === 'number')
  );
}

/** Reads the sources and the state of their data. */
export async function readSources(): Promise<StatusResult> {
  const answer = await requestJson(SOURCES_ENDPOINT_URL);
  const sources = isObject(answer?.body) ? answer.body.sources : undefined;
  if (answer?.ok && Array.isArray(sources) && sources.every(isSource)) {
    return { kind: 'sources', sources };
  }
  return isProblem(answer?.body)
    ? { kind: 'problem', problem: answer.body }
    : { kind: 'unreachable' };
}

/** French punctuation between a name and its text: a no-break space before the colon. */
export const COLON = '\u00a0: ';

/** A moment as the site writes it, in Paris time: « 06/11/2026 à 06:18 ». */
export function frenchDateTime(date: Date): string {
  const zone = { timeZone: 'Europe/Paris' } as const;
  const day = date.toLocaleDateString('fr-FR', zone);
  const time = date.toLocaleTimeString('fr-FR', { ...zone, hour: '2-digit', minute: '2-digit' });
  return `${day} à ${time}`;
}

/** What the state of `source` means for a reader, in one sentence. */
export function sourceState(source: ApiSource): string {
  if (source.status === 'indisponible') {
    return "Indisponible : l'API ne la consulte pas en ce moment. L'absence de signal de cette source ne prouve rien.";
  }
  if (source.updated_at === null) {
    return "En service. Rien à dater : un registre interrogé à la demande ou une liste intégrée à l'API.";
  }
  const at = frenchDateTime(new Date(source.updated_at));
  if (source.entries === null) return `En service, données téléchargées le ${at}.`;
  const entries = source.entries.toLocaleString('fr-FR');
  return `En service, données téléchargées le ${at} : ${entries} entrée${source.entries > 1 ? 's' : ''}.`;
}
