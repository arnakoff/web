// Theme choice shared by the showcase pages and Starlight (/docs): same
// `localStorage` key and values, so a choice made on one side holds on the
// other. No cookie: the choice never leaves the browser.

export type Theme = 'auto' | 'light' | 'dark';

/** Starlight's `localStorage` key; `''` or no entry means `auto`. */
export const THEME_KEY = 'starlight-theme';

/** Coerces any stored value to a theme, `auto` when unknown. */
export const parseTheme = (value: unknown): Theme =>
  value === 'light' || value === 'dark' ? value : 'auto';

/** Reads the stored choice; `auto` when storage is missing or blocked. */
export function loadTheme(): Theme {
  try {
    return parseTheme(localStorage.getItem(THEME_KEY));
  } catch {
    return 'auto';
  }
}

/**
 * Applies a choice to <html> and stores it. `auto` removes `data-theme`, so the
 * tokens follow `prefers-color-scheme`.
 */
export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  if (theme === 'auto') delete root.dataset.theme;
  else root.dataset.theme = theme;
  try {
    localStorage.setItem(THEME_KEY, theme === 'auto' ? '' : theme);
  } catch {
    // Blocked storage: the choice holds for this page only.
  }
}
