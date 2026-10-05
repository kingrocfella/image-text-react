// Suppress console warnings for icon libraries in tests
const originalWarn = console.warn;
beforeAll(() => {
  console.warn = (...args) => {
    const message = args[0];
    if (
      typeof message === 'string' &&
      (message.includes('Tried to use the icon') ||
        message.includes('react-native-paper') ||
        message.includes('icon libraries are installed'))
    ) {
      return; // Suppress icon-related warnings
    }
    originalWarn(...args);
  };
});

afterAll(() => {
  console.warn = originalWarn;
});

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(() => Promise.resolve(null)),
    setItem: jest.fn(() => Promise.resolve()),
    removeItem: jest.fn(() => Promise.resolve()),
    clear: jest.fn(() => Promise.resolve()),
    getAllKeys: jest.fn(() => Promise.resolve([])),
    multiGet: jest.fn(() => Promise.resolve([])),
    multiSet: jest.fn(() => Promise.resolve()),
    multiRemove: jest.fn(() => Promise.resolve()),
  },
}));

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    SafeAreaProvider: ({ children }) => children,
    SafeAreaView: ({ children, ...props }) => <View {...props}>{children}</View>,
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});


// In-memory stand-in for the platform keystore.
jest.mock('expo-secure-store', () => {
  const values = new Map();
  return {
    __esModule: true,
    WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY',
    setItemAsync: jest.fn(async (key, value) => {
      values.set(key, value);
    }),
    getItemAsync: jest.fn(async (key) => (values.has(key) ? values.get(key) : null)),
    deleteItemAsync: jest.fn(async (key) => {
      values.delete(key);
    }),
    __reset: () => values.clear(),
  };
});

// Native modules that have no JavaScript implementation in jest.
jest.mock('react-native-iap', () => ({
  initConnection: jest.fn(() => Promise.resolve(true)),
  fetchProducts: jest.fn(() => Promise.resolve([])),
  getAvailablePurchases: jest.fn(() => Promise.resolve([])),
  requestPurchase: jest.fn(() => Promise.resolve()),
  finishTransaction: jest.fn(() => Promise.resolve()),
  deepLinkToSubscriptions: jest.fn(() => Promise.resolve()),
  purchaseUpdatedListener: jest.fn(() => ({ remove: jest.fn() })),
  purchaseErrorListener: jest.fn(() => ({ remove: jest.fn() })),
  isUserCancelledError: jest.fn(() => false),
}));

jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn(() => Promise.resolve(true)),
    signIn: jest.fn(() => Promise.resolve({ type: 'cancelled' })),
    getTokens: jest.fn(() => Promise.resolve({ idToken: null })),
    signOut: jest.fn(() => Promise.resolve()),
  },
  statusCodes: { SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED' },
}));

jest.mock('expo-apple-authentication', () => ({
  isAvailableAsync: jest.fn(() => Promise.resolve(false)),
  signInAsync: jest.fn(),
  AppleAuthenticationScope: { EMAIL: 1, FULL_NAME: 0 },
  AppleAuthenticationButtonType: { SIGN_IN: 0, SIGN_UP: 2 },
  AppleAuthenticationButtonStyle: { BLACK: 2 },
  AppleAuthenticationButton: () => null,
}));

// Screens navigate to the paywall; outside a NavigationContainer the real hook throws.
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn() }),
  useFocusEffect: jest.fn(),
}));
