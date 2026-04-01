import rootConfig from '../../eslint.config.mjs'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['drizzle.config.ts', 'eslint.config.mjs'] },
  rootConfig,
  {
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
  },
)
