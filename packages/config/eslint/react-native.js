/** @type {import('eslint').Linter.Config} */
module.exports = {
  extends: [require.resolve('./base')],
  globals: {
    __DEV__: 'readonly',
  },
  rules: {
    'no-console': 'warn',
  },
};
