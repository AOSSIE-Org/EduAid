import globals from 'globals'
import pluginJs from '@eslint/js'
import pluginReact from 'eslint-plugin-react'
import eslintPluginPrettier from 'eslint-plugin-prettier/recommended'

/** @type {import('eslint').Linter.Config[]} */
export default [
  { files: ['**/*.{js,mjs,cjs,jsx}'] },
  { languageOptions: { globals: globals.browser } },
  pluginJs.configs.recommended,
  pluginReact.configs.flat.recommended,
  eslintPluginPrettier,
  {
    rules: {
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'no-extra-boolean-cast': 'off',
      'no-prototype-builtins': 'off',
      'react/display-name': 'off',
      'no-unused-vars': 'off',
      'no-constant-binary-expression': 'off',
    },
  },
]
