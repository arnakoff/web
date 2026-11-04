// The errors the API answers, in the RFC 9457 format: one per `code` of the
// `Problem…` examples of its OpenAPI contract, each with the page that
// explains it. Every claim of the guides below comes from arnakoff/api:
// internal/adapter/httpapi (catalog.go, check.go, batch.go, demo.go, auth.go,
// handler.go, ratelimit.go, observe.go), internal/adapter/turnstile and
// api/openapi.yaml. The build
// fails when a code of the contract has no guide, a guide has no code, or a
// `type` is not the page of its code. Plain TypeScript, so that the scripts
// checking dist/ list the same pages as the build.
import { parse } from 'yaml';
import {
  API_ISSUES_URL,
  AUTH_PATH,
  CHECKER_PATH,
  ERRORS_PATH,
  REFERENCE_PATH,
  SITE_URL,
} from './site.ts';

/** When the API answers an error and what to do, as inline Markdown. */
interface Guide {
  when: string[];
  fix: string;
  /** A page that helps to fix it. */
  link?: { href: string; label: string };
  /** An item of `POST /v1/check/batch` can get it in its result. */
  item?: true;
}

export interface Problem extends Guide {
  code: string;
  title: string;
  status: number;
  /** URI of the error's page, as the API sends it. */
  type: string;
  /** Every `detail` the contract's examples give, the first one first. */
  details: string[];
  /** The first example of the code, as the API answers it. */
  example: Record<string, unknown>;
}

const GUIDES: Record<string, Guide> = {
  invalid_parameter: {
    when: [
      'Le paramètre `type` de `GET /v1/check` a une valeur inconnue.',
      "Le champ `type` d'un élément de `POST /v1/check/batch`, ou du corps de `POST /v1/demo/check`, a une valeur inconnue.",
    ],
    fix: "Donne à `type` l'une des valeurs `domain`, `email`, `phone`, `iban`, `siren` ou `siret`. Ou retire-le : l'API détecte alors le type de l'entrée.",
    item: true,
  },
  missing_parameter: {
    when: [
      '`GET /v1/check` est appelé sans paramètre `q`, ou avec un `q` vide.',
      "Un élément de `POST /v1/check/batch`, ou le corps de `POST /v1/demo/check`, n'a pas de champ `q`, ou un `q` vide.",
    ],
    fix: 'Envoie l\'entrée à vérifier dans `q`. Dans une URL, encode-la : avec curl, `--data-urlencode "q=…"`.',
    item: true,
  },
  invalid_body: {
    when: [
      "Le corps de `POST /v1/check/batch` ou de `POST /v1/demo/check` n'est pas un objet JSON, ou contient autre chose après lui.",
      "Le corps de `POST /v1/check/batch` n'a pas de liste `items`, ou cette liste est vide.",
    ],
    fix: 'Pour `POST /v1/check/batch`, envoie un objet JSON avec une liste `items` d\'au moins un élément : `{"items": [{"q": "armen.ltd"}]}`. Pour `POST /v1/demo/check`, un objet JSON avec `q` et `turnstile_token`.',
  },
  missing_api_key: {
    when: [
      '`GET /v1/check` ou `POST /v1/check/batch` est appelé sans en-tête `Authorization` au schéma `Bearer`.',
      'La réponse porte l\'en-tête `WWW-Authenticate: Bearer realm="arnakoff"`.',
    ],
    fix: "Ajoute l'en-tête `Authorization: Bearer <ta clé>` à la requête.",
    link: { href: AUTH_PATH, label: 'Authentification et quotas' },
  },
  invalid_api_key: {
    when: [
      "La clé de l'en-tête `Authorization` est mal formée, inconnue ou révoquée.",
      'La requête porte plusieurs en-têtes `Authorization`.',
      'La réponse porte l\'en-tête `WWW-Authenticate: Bearer realm="arnakoff", error="invalid_token"`.',
    ],
    fix: 'Vérifie que tu envoies la clé entière, dans un seul en-tête `Authorization`. Une clé révoquée ne sert plus : utilises-en une autre.',
    link: { href: AUTH_PATH, label: 'Authentification et quotas' },
  },
  not_found: {
    when: [
      'Aucune ressource ne correspond au chemin demandé.',
      "Le chemin n'est pas sous sa forme exacte, par exemple avec une barre oblique finale (`/v1/check/`) ou double. L'API ne redirige jamais.",
    ],
    fix: "Vérifie le chemin dans la référence de l'API : il commence par la version (`/v1`) et ne finit pas par `/`.",
    link: { href: REFERENCE_PATH, label: "Référence de l'API" },
  },
  method_not_allowed: {
    when: [
      'La ressource existe, mais pas avec cette méthode, par exemple `POST /v1/check`.',
      "L'en-tête `Allow` de la réponse donne les méthodes qu'elle accepte.",
    ],
    fix: "Utilise la méthode de la référence de l'API : `GET` pour `/v1/check`, `POST` pour `/v1/check/batch`.",
    link: { href: REFERENCE_PATH, label: "Référence de l'API" },
  },
  content_too_large: {
    when: [
      "Le corps de `POST /v1/check/batch` dépasse la taille autorisée, qui dépend du nombre maximal d'éléments d'un lot.",
      'Le corps de `POST /v1/demo/check` dépasse 8 Kio.',
    ],
    fix: "Découpe le lot en plusieurs requêtes. Pour `POST /v1/demo/check`, envoie seulement l'entrée et le jeton anti-abus.",
  },
  unsupported_media_type: {
    when: [
      "Le corps de `POST /v1/check/batch` ou de `POST /v1/demo/check` n'est pas annoncé en `application/json`.",
    ],
    fix: "Ajoute l'en-tête `Content-Type: application/json` à la requête.",
  },
  invalid_input: {
    when: [
      "Sans `type`, l'entrée n'est d'aucun type reconnu : ni un domaine, ni une URL, ni une adresse e-mail, ni un numéro de téléphone, ni un IBAN, ni un SIREN, ni un SIRET.",
      "Avec `type`, l'entrée n'est pas valide pour ce type. Le `detail` nomme alors le type.",
    ],
    fix: "Vérifie que l'entrée est complète. Si tu imposes `type`, vérifie qu'il correspond à l'entrée, ou retire-le pour que l'API détecte le type.",
    item: true,
  },
  too_many_items: {
    when: [
      "Le lot de `POST /v1/check/batch` compte plus d'éléments que le maximum fixé par le serveur. Le `detail` donne ce maximum.",
    ],
    fix: "Découpe le lot en plusieurs requêtes d'au plus ce maximum.",
  },
  too_many_requests: {
    when: [
      'Le quota est atteint : celui de ta clé pour `/v1/check` et `/v1/check/batch`, celui de ton adresse IP pour `/v1/sources` et `/v1/signals`.',
      "Un lot `POST /v1/check/batch` compte une requête par élément : il est refusé en entier, sans rien dépenser, quand il reste moins de requêtes que d'éléments.",
      'Trop de clés refusées sont venues de ton adresse IP : `/v1/check` et `/v1/check/batch` lui sont alors fermés un temps.',
      '`POST /v1/demo/check` a deux quotas : celui de ton adresse IP et celui de tous les visiteurs ensemble. Seule une requête au jeton anti-abus accepté entame le second.',
      'La réponse porte les en-têtes `RateLimit`, `RateLimit-Policy` et `Retry-After`. `RateLimit-Policy` nomme le quota atteint : `key`, `ip`, `auth`, `demo` ou `demo_global`.',
    ],
    fix: "Attends le nombre de secondes de l'en-tête `Retry-After` avant de réessayer. Pour un lot, tu peux aussi envoyer moins d'éléments.",
    link: { href: AUTH_PATH, label: 'Authentification et quotas' },
  },
  internal_error: {
    when: ['Le serveur a rencontré une erreur imprévue en traitant la requête.'],
    fix: "Réessaie plus tard. Si l'erreur se répète, signale-la en citant le champ `instance` de la réponse.",
    link: { href: API_ISSUES_URL, label: "Formulaire de bogue du dépôt de l'API" },
  },
  authentication_unavailable: {
    when: [
      "La clé ne peut pas être vérifiée pour le moment. L'API refuse alors la requête plutôt que de la servir sans contrôle.",
    ],
    fix: "Réessaie plus tard. Ta clé n'est pas en cause.",
  },
  challenge_failed: {
    when: [
      "Le corps de `POST /v1/demo/check` n'a pas de `turnstile_token`, ou un jeton vide ou de plus de 2048 caractères.",
      "Cloudflare Turnstile refuse le jeton : il est invalide, a expiré (300 secondes) ou a déjà servi. Un jeton ne sert qu'une fois.",
      "Le jeton n'a pas été obtenu sur le site d'Arnakoff.",
    ],
    fix: 'Demande un nouveau jeton au widget Turnstile du vérificateur, puis renvoie la requête. Pour vérifier sans widget, utilise `GET /v1/check` avec ta clé.',
    link: { href: CHECKER_PATH, label: 'Vérificateur en ligne' },
  },
  challenge_unavailable: {
    when: [
      "Le jeton de `POST /v1/demo/check` ne peut pas être vérifié pour le moment : Cloudflare Turnstile n'a pas répondu, ou pas clairement. L'API refuse alors la requête plutôt que de la servir sans contrôle.",
      "L'accès de démonstration n'est pas activé sur ce serveur.",
    ],
    fix: "Réessaie plus tard. Ton jeton n'est pas en cause.",
  },
  service_unavailable: {
    when: ["Le service n'est pas encore prêt à répondre."],
    fix: 'Réessaie plus tard.',
  },
};

/** The part of the OpenAPI contract the site reads. */
export interface Contract {
  components: { examples: Record<string, { value: Record<string, unknown> }> };
}

/** The fields of a `Problem…` example, which the API's tests validate against the schema. */
interface ProblemExample {
  code: string;
  title: string;
  status: number;
  type: string;
  detail: string;
}

/** Base of every `type`: the absolute URL of the error pages. */
const TYPE_BASE = new URL(ERRORS_PATH, SITE_URL).href;

/**
 * Returns the errors of a copy of the OpenAPI contract, read from its
 * `Problem…` examples, by HTTP status then code, with their guide.
 */
export function problemsOf(contract: string): Problem[] {
  const { examples } = (parse(contract) as Contract).components;
  const byCode = new Map<string, Problem>();
  for (const [name, { value }] of Object.entries(examples)) {
    if (!name.startsWith('Problem')) continue;
    const { code, title, status, type, detail } = value as unknown as ProblemExample;
    if (type !== `${TYPE_BASE}${code}`) {
      throw new Error(`openapi.yaml: ${name} has type ${type}, not the page of ${code}.`);
    }
    const known = byCode.get(code);
    if (known) {
      if (known.title !== title || known.status !== status) {
        throw new Error(`openapi.yaml: ${name} disagrees with the other ${code} examples.`);
      }
      known.details.push(detail);
      continue;
    }
    const guide = GUIDES[code];
    if (!guide) throw new Error(`src/lib/problems.ts has no guide for the error ${code}.`);
    byCode.set(code, { ...guide, code, title, status, type, details: [detail], example: value });
  }
  const stale = Object.keys(GUIDES).filter((code) => !byCode.has(code));
  if (stale.length > 0) {
    throw new Error(`src/lib/problems.ts guides errors the contract lacks: ${stale.join(', ')}.`);
  }
  return [...byCode.values()].sort((a, b) => a.status - b.status || a.code.localeCompare(b.code));
}

/** Path of the page of an error. */
export const problemPath = (code: string) => `${ERRORS_PATH}${code}/`;
