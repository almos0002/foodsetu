//  @ts-check

import { tanstackConfig } from '@tanstack/eslint-config'

export default [
  ...tanstackConfig,
  {
    rules: {
      'import/no-cycle': 'off',
      'import/order': 'off',
      'sort-imports': 'off',
      '@typescript-eslint/array-type': 'off',
      '@typescript-eslint/require-await': 'off',
      'pnpm/json-enforce-catalog': 'off',
      // Defensive `?.` / `??` against values typed non-null are a useful
      // belt-and-braces against runtime/database surprises in this MVP — don't
      // demand we strip them. Re-enable once the type surface is tightened.
      '@typescript-eslint/no-unnecessary-condition': 'off',
    },
  },
  {
    ignores: [
      'eslint.config.js',
      'prettier.config.js',
      '.agents/**',
      '.local/**',
      'drizzle/**',
      'dist/**',
      '.nitro/**',
      '.output/**',
      '.tanstack/**',
      'src/routeTree.gen.ts',
    ],
  },
]
