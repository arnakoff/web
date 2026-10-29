// @ts-check
import js from '@eslint/js';
import astro from 'eslint-plugin-astro';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig(
  // Local agent files are never committed.
  { ignores: ['dist/', '.astro/', '.claude/'] },
  js.configs.recommended,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      globals: { ...globals.node },
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    linterOptions: { reportUnusedDisableDirectives: 'error' },
  },
  astro.configs.recommended,
  {
    // Type-aware rules need TypeScript's view of the file; the Astro parser
    // does not give it for every template expression.
    files: ['**/*.astro'],
    extends: [tseslint.configs.disableTypeChecked],
  },
);
