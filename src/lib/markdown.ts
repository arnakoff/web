// Inline Markdown of the copies written by `npm run sync`, turned into safe
// HTML for `set:html`.
import { REPO_API_URL } from './site';

/** @param text Markdown text, escaped before any tag is added. */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const API_LINK = new RegExp(
  `\\[([^\\]]+)\\]\\((${`${REPO_API_URL}/`.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^)\\s]*)\\)`,
  'g',
);

/**
 * Turns one line of inline Markdown into HTML. The text is escaped first; then
 * only bold, code and links into the API repository become tags, so the copy
 * cannot inject markup or send the reader to another site.
 */
export function inlineHtml(markdown: string): string {
  return escapeHtml(markdown)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(API_LINK, '<a href="$2">$1</a>');
}
