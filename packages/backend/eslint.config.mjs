import rootConfig from '../../eslint.config.mjs'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['drizzle.config.ts', 'eslint.config.mjs'] },
  rootConfig,
  tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      globals: {
        ...globals.jest,
      },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
    },
  },
)
