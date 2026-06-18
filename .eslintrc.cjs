module.exports = {
  root: true,
  ignorePatterns: [
    'android/**',
    'dist/**',
    'node_modules/**',
    'patches/**',
  ],
  env: {
    browser: true,
    es2022: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  rules: {
    'react/prop-types': 'off',
    'react/no-unescaped-entities': 'off',
    'no-empty': ['warn', { allowEmptyCatch: true }],
  },
};
