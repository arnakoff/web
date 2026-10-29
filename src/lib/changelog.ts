// Reads the copy of the API's CHANGELOG.md, written by release-please (see
// arnakoff/api CONTRIBUTING.md) and copied by `npm run sync`, into releases the
// versions page can render. Only the release-please format is understood:
// `## <version or [version](compare URL)> (YYYY-MM-DD)`, `### <section>` and
// `* <entry>` lines.
import { REPO_API_URL } from './site';

export interface ChangelogSection {
  /** French title, or the English one when release-please adds a new section. */
  title: string;
  /** False when `title` was kept in English. */
  translated: boolean;
  /** Entries as safe HTML: escaped text, `<strong>`, `<code>` and API links. */
  entries: string[];
}

export interface Release {
  version: string;
  /** Release date, `YYYY-MM-DD`. */
  date: string;
  sections: ChangelogSection[];
}

/** French titles of the release-please changelog sections. */
const SECTION_TITLES: Record<string, string> = {
  '⚠ BREAKING CHANGES': 'Changements cassants',
  Features: 'Nouveautés',
  'Bug Fixes': 'Corrections',
  'Performance Improvements': 'Performances',
  Reverts: 'Annulations',
  Documentation: 'Documentation',
  'Miscellaneous Chores': 'Maintenance',
  'Code Refactoring': 'Refactorisation',
  Tests: 'Tests',
  'Build System': 'Construction',
  'Continuous Integration': 'Intégration continue',
  Styles: 'Style du code',
};

const RELEASE = /^## (?:\[([^\]]+)\]\([^)]*\)|(\S+)) \((\d{4}-\d{2}-\d{2})\)\s*$/;

/** @param text Markdown text, escaped before any tag is added. */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Turns one entry into HTML. The text is escaped first; then only bold, code
 * and links into the API repository become tags, so the copy cannot inject
 * markup or send the reader to another site.
 */
function entryHtml(markdown: string): string {
  const api = `${REPO_API_URL}/`.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return escapeHtml(markdown)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(new RegExp(`\\[([^\\]]+)\\]\\((${api}[^)\\s]*)\\)`, 'g'), '<a href="$2">$1</a>');
}

/** Parses a release-please changelog, newest release first. */
export function parseChangelog(markdown: string): Release[] {
  const releases: Release[] = [];
  let section: ChangelogSection | undefined;

  for (const line of markdown.replace(/\r\n/g, '\n').split('\n')) {
    const release = RELEASE.exec(line);
    if (release) {
      releases.push({
        version: release[1] ?? release[2] ?? '',
        date: release[3] ?? '',
        sections: [],
      });
      section = undefined;
      continue;
    }
    const current = releases.at(-1);
    if (!current) continue;
    if (line.startsWith('### ')) {
      const english = line.slice(4).trim();
      const french = SECTION_TITLES[english];
      section = { title: french ?? english, translated: french !== undefined, entries: [] };
      current.sections.push(section);
    } else if (/^[*-] /.test(line) && section) {
      section.entries.push(entryHtml(line.slice(2).trim()));
    }
  }
  return releases;
}

/** Copy written by `npm run sync`; absent until the API publishes a release. */
const COPY = import.meta.glob<string>('../content/api/changelog.md', {
  query: '?raw',
  import: 'default',
  eager: true,
});

/** Releases of the API, newest first; empty when no release is published. */
export const RELEASES: Release[] = parseChangelog(Object.values(COPY)[0] ?? '');
