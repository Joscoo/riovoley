module.exports = {
  extends: [
    'react-app',
    'react-app/jest'
  ],
  env: {
    browser: true,
    es2020: true,
    node: true
  },
  globals: {
    globalThis: 'readonly',
    confirm: 'readonly',
    alert: 'readonly'
  },
  rules: {
    'no-restricted-globals': 'off',
    'no-undef': 'off'
  },
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module'
  }
};