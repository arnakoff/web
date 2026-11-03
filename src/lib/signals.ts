// Reads the copy of the API's docs/signals.md, copied by `npm run sync`, into
// the signals the signals page renders. The catalog comes from the table the
// API generates from its code (between the « Début du tableau généré » and
// « Fin du tableau généré » comments). The example sentences are picked here,
// and the build fails unless each one is quoted word for word in the copy, so
// a wording change in the API repository cannot leave a stale example.
import { CALLOUT_LABELS, type CalloutLevel } from './callout';
import { INPUT_NAMES } from './inputs';
import { slug } from './markdown';
import COPY from '../content/api/signals.md?raw';

/** A sentence the API gives for a signal, with its advice when it has one. */
export interface SignalExample {
  message: string;
  advice?: string;
}

export interface Signal {
  code: string;
  level: CalloutLevel;
  /** Kinds of input that can give the signal, as French names. */
  inputs: string[];
  /** Sources the signal cites: one per catalog row of the code. */
  sources: string[];
  condition: string;
  examples: SignalExample[];
}

export interface SignalGroup {
  /** Fragment identifier of the group on the page. */
  id: string;
  /** `##` heading of the copy that details the group's conditions. */
  title: string;
  signals: Signal[];
}

/** Advice the copy gives, shared by several signals. */
const ADVICE = {
  registered:
    "Des sites imitent des acteurs enregistrés : vérifie l'adresse exacte sur le site de l'AMF avant de verser de l'argent.",
  recent:
    "Un site créé il y a quelques jours n'a pas d'historique : vérifie qui l'exploite avant de verser de l'argent.",
  lookalike: "Tape toi-même l'adresse officielle plutôt que de suivre un lien reçu.",
  phone:
    "Un numéro affiché peut être usurpé : rappelle l'organisme au numéro que tu trouves toi-même sur son site officiel.",
  company: "Vérifie que l'entreprise exerce encore avant de lui verser de l'argent.",
};

/**
 * Groups of the page, in the order of the copy's table: each names the `##`
 * section of the copy and the examples of its signals. A code without an
 * example here has none in the copy.
 */
const GROUPS: { title: string; examples: Record<string, SignalExample[]> }[] = [
  {
    title: 'Listes noires',
    examples: {
      amf_blacklist: [
        { message: "Figure sur la liste noire de l'AMF (catégorie Forex) depuis le 08/10/2026." },
      ],
      acpr_blacklist: [],
    },
  },
  {
    title: 'Listes blanches',
    examples: {
      amf_registered: [
        {
          message:
            "Figure sur la liste des prestataires sur actifs numériques de l'AMF : COINHOUSE SAS (Agrément MICA) depuis le 07/05/2026.",
          advice: ADVICE.registered,
        },
        {
          message:
            "Figure sur la liste des offres de biens divers enregistrées par l'AMF : ECOTREE (n° D-18-01) depuis le 26/02/2018.",
          advice: ADVICE.registered,
        },
      ],
      amf_registration_ended: [
        {
          message:
            "A figuré sur la liste des prestataires sur actifs numériques de l'AMF : COINHOUSE SAS (Enregistrement) du 17/03/2020 au 07/05/2026.",
        },
      ],
    },
  },
  {
    title: 'Âge du domaine',
    examples: {
      domain_recent: [
        {
          message:
            'Le domaine exemple.fr a été créé le 18/10/2026, il y a 12 jours (registre RDAP).',
          advice: ADVICE.recent,
        },
      ],
    },
  },
  {
    title: "Imitation d'un domaine officiel",
    examples: {
      domain_lookalike: [
        {
          message:
            "Le domaine ameli-remboursement.com ressemble à ameli.fr, site officiel de l'Assurance Maladie, mais n'en fait pas partie.",
          advice: ADVICE.lookalike,
        },
      ],
    },
  },
  {
    title: 'Numérotation téléphonique',
    examples: {
      phone_operator: [
        {
          message:
            'Le numéro appartient à une tranche attribuée à Société française du radiotéléphone (SFR0) le 08/12/2011 (numérotation ARCEP). Le numéro a pu être porté chez un autre opérateur.',
          advice: ADVICE.phone,
        },
      ],
      phone_unassigned: [
        {
          message:
            "Le numéro n'appartient à aucune tranche attribuée par l'ARCEP : il ne peut pas être en service.",
          advice: ADVICE.phone,
        },
      ],
    },
  },
  {
    title: 'Entreprises',
    examples: {
      company_closed: [
        {
          message: 'Le siège de PAYTOP est fermé depuis le 12/03/2024 (répertoire SIRENE).',
          advice: ADVICE.company,
        },
      ],
      company_procedure: [
        {
          message:
            'Le BODACC a publié le 05/02/2026 un avis de la famille « Procédures collectives » sur cette entreprise.',
          advice: ADVICE.company,
        },
      ],
    },
  },
  {
    title: 'IBAN',
    examples: {
      iban_country: [{ message: "Pays de tenue du compte : Lituanie (code LT de l'IBAN)." }],
    },
  },
];

const TABLE_START = '<!-- Début du tableau généré';
const TABLE_END = '<!-- Fin du tableau généré';

/** @param line A table row, `| a | b |`, made into its trimmed cells. */
function cells(line: string): string[] {
  return line
    .trim()
    .replace(/^\||\|$/g, '')
    .split('|')
    .map((cell) => cell.trim());
}

interface Row {
  code: string;
  inputs: string[];
  level: CalloutLevel;
  source: string;
  condition: string;
}

/** Reads the generated catalog table, one row per code and source. */
function catalogRows(markdown: string): Row[] {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const start = lines.findIndex((line) => line.startsWith(TABLE_START));
  const end = lines.findIndex((line) => line.startsWith(TABLE_END));
  if (start < 0 || end < start) throw new Error('signals.md: generated table not found');

  const [header, , ...rows] = lines.slice(start + 1, end);
  if (cells(header ?? '').join('|') !== 'Code|Entrées|Niveau|Source|Condition') {
    throw new Error(`signals.md: unexpected table header « ${header ?? ''} »`);
  }
  return rows.map((line) => {
    const [code = '', inputs = '', level = '', source = '', condition = ''] = cells(line);
    if (!(level in CALLOUT_LABELS)) throw new Error(`signals.md: unknown level « ${level} »`);
    return {
      code: code.replace(/^`|`$/g, ''),
      inputs: inputs.split(',').map((input) => {
        const name = INPUT_NAMES[input.trim()];
        if (!name) throw new Error(`signals.md: unknown input « ${input.trim()} »`);
        return name;
      }),
      level: level as CalloutLevel,
      source,
      condition,
    };
  });
}

/**
 * Parses the signals catalog. Throws when a group or an example is missing
 * from the copy, or when a code of the table is in no group, so a change in
 * the API repository fails the build instead of publishing a wrong page.
 */
export function parseSignals(markdown: string): SignalGroup[] {
  const rows = catalogRows(markdown);
  const text = markdown.replace(/\s+/g, ' ');
  const quoted = (sentence: string) => {
    if (!text.includes(`« ${sentence} »`)) {
      throw new Error(`signals.md: example « ${sentence} » is not quoted in the copy`);
    }
  };

  const grouped = new Set<string>();
  const groups = GROUPS.map(({ title, examples }): SignalGroup => {
    if (!markdown.includes(`\n## ${title}\n`)) throw new Error(`signals.md: no « ## ${title} »`);
    const signals = Object.entries(examples).map(([code, list]): Signal => {
      const own = rows.filter((row) => row.code === code);
      const [first] = own;
      if (!first) throw new Error(`signals.md: « ${code} » is not in the table`);
      if (
        own.some(
          (row) =>
            row.level !== first.level ||
            row.condition !== first.condition ||
            row.inputs.join() !== first.inputs.join(),
        )
      ) {
        throw new Error(`signals.md: the rows of « ${code} » differ by more than their source`);
      }
      for (const { message, advice } of list) {
        quoted(message);
        if (advice) quoted(advice);
      }
      grouped.add(code);
      const { level, inputs, condition } = first;
      const sources = own.map(({ source }) => source);
      return { code, level, inputs, sources, condition, examples: list };
    });
    return { id: slug(title), title, signals };
  });

  const missing = rows.filter(({ code }) => !grouped.has(code)).map(({ code }) => code);
  if (missing.length > 0) throw new Error(`signals.md: no group for ${missing.join(', ')}`);
  return groups;
}

/** Signals of the API, by group, from the copy of docs/signals.md. */
export const SIGNAL_GROUPS = parseSignals(COPY);
