import React from 'react';
import { Provider } from 'react-redux';
import Toast from 'react-native-toast-message';
import { store } from './src/store';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <Provider store={store}>
      <AppNavigator />
      <Toast />
    </Provider>
  );
}
