// Callout levels, shared by the Callout component and the online checker.

/**
 * Visible name of each level, so a level never rests on color alone.
 * `attention` and `alerte` are the signal levels of arnakoff/api
 * docs/signals.md; `info` is neutral.
 */
export const CALLOUT_LABELS = {
  info: 'Info',
  attention: 'Attention',
  alerte: 'Alerte',
} as const;

export type CalloutLevel = keyof typeof CALLOUT_LABELS;
