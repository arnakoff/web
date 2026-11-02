// Reads the copy of the API's docs/sources.md, copied by `npm run sync`, into
// the sources the sources page renders. Each `## <name>` section is a source;
// its `- **<label>** : <text>` lines are its facts. Only the facts a reader
// needs are kept: technical ones (access, format, fields) stay in the API
// repository, linked from the page.
import { inlineHtml, slug } from './markdown';
import COPY from '../content/api/sources.md?raw';

export interface SourceFact {
  label: string;
  /** Safe HTML, from `inlineHtml`. */
  html: string;
}

export interface Source {
  /** Fragment identifier of the source on the page. */
  id: string;
  name: string;
  /** Paragraph before the facts, as safe HTML, when the section has one. */
  intro?: string;
  facts: SourceFact[];
}

/** Facts shown, in this order; `Éditeurs` and `Origine` stand for `Éditeur`. */
const SHOWN = [
  'Éditeur',
  'Éditeurs',
  'Origine',
  'Licence',
  'Fraîcheur',
  'Usage',
  'Limites',
  'Données personnelles',
];

/** Sections that describe the API rather than one source. */
const NOT_SOURCES = new Set(['Synchronisation', 'Description dans `GET /v1/sources`']);

/** Section listing the sources that were refused, each as a fact. */
const REFUSED = 'Refusées';

/** `- **A** : x. **B** : y.` holds two facts: a label starts at the line or after a sentence. */
const FACT = /(?:^|(?<=\. ))\*\*([^*]+)\*\* : /g;

/** @param line A top-level list item, without its `- `. */
function parseFacts(line: string): { label: string; markdown: string }[] {
  const starts = [...line.matchAll(FACT)];
  return starts.map((match, i) => ({
    label: match[1] ?? '',
    markdown: line.slice(match.index + match[0].length, starts[i + 1]?.index).trim(),
  }));
}

interface Section {
  name: string;
  paragraphs: string[];
  facts: { label: string; markdown: string }[];
}

/** Splits the copy into its `##` sections. Nested list items are details: skipped. */
function sections(markdown: string): Section[] {
  const out: Section[] = [];
  for (const line of markdown.replace(/\r\n/g, '\n').split('\n')) {
    if (line.startsWith('## ')) {
      out.push({ name: line.slice(3).trim(), paragraphs: [], facts: [] });
      continue;
    }
    const current = out.at(-1);
    if (!current || line.trim() === '' || /^\s/.test(line)) continue;
    if (line.startsWith('- ')) current.facts.push(...parseFacts(line.slice(2)));
    else if (!line.startsWith('|')) current.paragraphs.push(line.trim());
  }
  return out;
}

/**
 * Parses the sources inventory. Throws when a source has neither a publisher
 * and a licence nor an origin (no data downloaded), so a change of format in
 * the API repository fails the build instead of publishing a page with missing
 * facts.
 */
export function parseSources(markdown: string): { sources: Source[]; refused: SourceFact[] } {
  const all = sections(markdown);
  const sources = all
    .filter(({ name }) => !NOT_SOURCES.has(name) && name !== REFUSED)
    .map(({ name, paragraphs, facts }): Source => {
      const kept = SHOWN.flatMap((label) =>
        facts
          .filter((fact) => fact.label === label)
          .map((fact) => ({ label: fact.label, html: inlineHtml(fact.markdown) })),
      );
      const labels = new Set(kept.map(({ label }) => label));
      const published = (labels.has('Éditeur') || labels.has('Éditeurs')) && labels.has('Licence');
      if (!published && !labels.has('Origine')) {
        throw new Error(`sources.md: « ${name} » has neither Éditeur and Licence nor Origine`);
      }
      return {
        id: slug(name),
        name,
        ...(paragraphs.length > 0 && { intro: inlineHtml(paragraphs.join(' ')) }),
        facts: kept,
      };
    });
  if (sources.length === 0) throw new Error('sources.md: no source found');

  const refused = (all.find(({ name }) => name === REFUSED)?.facts ?? []).map((fact) => ({
    label: fact.label,
    html: inlineHtml(fact.markdown),
  }));
  return { sources, refused };
}

/** Sources of the API and the refused ones, from the copy of docs/sources.md. */
export const { sources: SOURCES, refused: REFUSED_SOURCES } = parseSources(COPY);
