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
  extends: [],
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
  rules: {},
};
