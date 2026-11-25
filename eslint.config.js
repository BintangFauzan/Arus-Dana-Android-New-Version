const globals = require('globals');
module.exports = [
  { ignores: ['node_modules/**', '.expo/**', 'coverage/**'] },
  {
    files: ['**/*.js'],
    languageOptions: { ecmaVersion: 'latest', sourceType: 'module', parserOptions: { ecmaFeatures: { jsx: true } }, globals: { ...globals.browser, ...globals.node, ...globals.jest, __DEV__: 'readonly', fetch: 'readonly' } },
    rules: { 'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^(React|Modal|ScrollView|StatusBar|Text|TextInput|TouchableOpacity|View|_error)$' }], 'no-undef': 'error' },
  },
];
