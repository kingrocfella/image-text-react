module.exports = {
  preset: 'jest-expo',
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': require.resolve('babel-jest'),
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native|react-native-button|react-native-gesture-handler|react-native-reanimated|expo(nent)?|@expo|@expo-google-fonts|@react-navigation|@unimodules|unimodules|sentry-expo|native-base|@expo/vector-icons|expo-modules-core|expo-clipboard|expo-image-picker|immer|@reduxjs/toolkit|redux)/)',
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js', '@testing-library/jest-native/extend-expect'],
};
