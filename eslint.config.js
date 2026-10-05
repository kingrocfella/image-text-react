// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  // Bundles react/react-hooks/@typescript-eslint recommended rules for Expo + React Native.
  expoConfig,
  {
    ignores: ['dist/*', 'src/api/routes.generated.ts'],
  },
  {
    // jest.mock factories must use require() and return anonymous components.
    files: ['**/__tests__/**', 'src/testing/**', 'jest.setup.js'],
    languageOptions: {
      globals: { jest: 'readonly', beforeAll: 'readonly', afterAll: 'readonly' },
    },
    rules: {
      'react/display-name': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      'import/first': 'off',
    },
  },
]);
