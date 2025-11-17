# ScanGenAI Mobile App

A React Native app built with Expo that allows users to extract text from images and PDFs using AI-powered OCR technology. The app includes user authentication, camera functionality, PDF document processing, and seamless text extraction with copy-to-clipboard features.

## Features

- 🔐 **Authentication**: Login and Register screens with form validation
- 🔄 **Automatic Token Refresh**: Automatically refreshes access tokens on 401 errors and logs out if refresh fails
- 📸 **Camera**: Take pictures using the device camera
- 🖼️ **Gallery**: Select images from the photo gallery
- 📄 **PDF Support**: Upload and process PDF documents
- 🔍 **Text Extraction**: Extract text from images using OCR API
- 🤖 **AI-Powered PDF Q&A**: Ask questions about uploaded PDFs using AI models (OpenAI, Ollama, DeepSeek, Gemini)
- 💬 **Follow-up Questions**: Continue conversations with PDFs using request_id
- 📋 **Copy to Clipboard**: Copy extracted text with a single tap
- 🔄 **Extract Another**: Quick workflow to extract text from multiple images/PDFs
- 🌓 **Theme Toggle**: Switch between Light, Dark, and System theme modes
- 💾 **Theme Persistence**: Theme preference saved and restored on app launch
- 🗂️ **State Management**: Redux with Redux Thunk for API calls
- 🧭 **Navigation**: React Navigation with authentication guards
- 🔒 **Permissions**: Proper permission handling for camera, photo library, and document access
- 🎨 **Toast Notifications**: Non-intrusive feedback for user actions
- ⌨️ **Keyboard Handling**: Smart keyboard avoidance for better UX
- 🧩 **Reusable Components**: AppHeader and OpenaiPassModal components for consistent UI

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

Or use Expo's install command to ensure compatible versions:
```bash
npx expo install --fix
```

2. Start the Expo development server:
```bash
npm start
```

### Running the App

- **iOS Simulator**: Press `i` in the terminal or run `npm run ios`
- **Android Emulator**: Press `a` in the terminal or run `npm run android`
- **Web Browser**: Press `w` in the terminal or run `npm run web`
- **Physical Device**: Scan the QR code with the Expo Go app

## Project Structure

```
├── App.tsx                       # App entry point with Redux Provider and Toast
├── app.json                      # Expo configuration with permissions
├── app.apk                       # Android build artifact (optional)
├── assets/                       # Static assets (icons, splash screen)
│   ├── adaptive-icon.png
│   ├── favicon.png
│   ├── icon.png
│   └── splash.png
├── babel.config.js               # Babel configuration
├── config.ts                     # API configuration (hard-coded base URL)
├── eas.json                      # EAS build configuration
├── jest.config.js                # Jest configuration for Expo/React Native
├── package.json                  # Dependencies and scripts
├── package-lock.json             # Lockfile
├── README.md
├── src/
│   ├── components/
│   │   ├── AppHeader.tsx         # Reusable header component
│   │   ├── ImagePickerComponent.tsx
│   │   ├── OpenaiPassModal.tsx   # Modal for OpenAI pass input
│   │   └── ThemeToggle.tsx       # Theme toggle component
│   ├── navigation/
│   │   └── AppNavigator.tsx
│   ├── screens/
│   │   ├── __tests__/
│   │   │   ├── HomeScreen.test.tsx
│   │   │   ├── LoginScreen.test.tsx
│   │   │   ├── PdfScreen.test.tsx
│   │   │   └── RegisterScreen.test.tsx
│   │   ├── HomeScreen.tsx        # Image to text screen
│   │   ├── PdfScreen.tsx         # PDF to text screen
│   │   ├── LoginScreen.tsx
│   │   └── RegisterScreen.tsx
│   ├── store/
│   │   ├── actions/
│   │   │   ├── __tests__/
│   │   │   │   └── authActions.test.ts
│   │   │   ├── authActions.ts
│   │   │   ├── imageActions.ts
│   │   │   ├── pdfActions.ts     # PDF extraction and Q&A actions
│   │   │   └── themeActions.ts   # Theme management actions
│   │   ├── reducers/
│   │   │   ├── __tests__/
│   │   │   │   └── authReducer.test.ts
│   │   │   ├── authReducer.ts
│   │   │   ├── imageReducer.ts
│   │   │   ├── pdfReducer.ts      # PDF state management
│   │   │   ├── themeReducer.ts   # Theme state management
│   │   │   └── index.ts
│   │   ├── types/
│   │   │   ├── authTypes.ts
│   │   │   ├── imageTypes.ts
│   │   │   ├── pdfTypes.ts       # PDF-related types
│   │   │   └── themeTypes.ts     # Theme-related types
│   │   └── index.ts              # Redux store configuration and typed hooks
│   ├── types/                    # Additional shared types (placeholder)
│   └── utils/
│       ├── __tests__/
│       │   └── apiClient.test.ts
│       ├── apiClient.ts          # API client with automatic token refresh
│       └── validation.ts
├── tsconfig.json                 # TypeScript configuration
```

## Form Validation

### Login Screen
- **Email**: Required, must be a valid email format
- **Password**: Required, must be at least 6 characters
- **Password Visibility**: Toggle to show/hide password

### Register Screen
- **Name**: Required, must be at least 2 characters
- **Email**: Required, must be a valid email format
- **Password**: Required, must be at least 6 characters
- **Password Visibility**: Toggle to show/hide password

## User Flow

### Image to Text Flow
1. **Registration/Login**: User creates account or logs in
2. **Image Selection**: User takes a picture or selects from gallery
3. **Text Extraction**: User clicks "Extract Text from Picture"
4. **View Results**: Extracted text is displayed with copy icon
5. **Copy Text**: User can copy text to clipboard with toast notification
6. **Extract Another**: User can extract text from another image

### PDF to Text Flow
1. **PDF Upload**: User uploads a PDF document
2. **Model Selection**: User selects an AI model (OpenAI, Ollama, DeepSeek, or Gemini)
3. **OpenAI Pass Entry** (if OpenAI selected): Modal appears for secure OpenAI pass input with visibility toggle
4. **Question Input**: User enters a question about the PDF
5. **Text Extraction**: System processes PDF and returns content, description, and request_id
6. **View Results**: Extracted text and description are displayed
7. **Follow-up Questions**: User can ask additional questions using the same PDF (request_id persists)
8. **Fresh PDF**: User can upload a new PDF to start a new session

## State Management

The app uses Redux with Redux Thunk for:
- **Authentication state**: user, tokens (accessToken, refreshToken), isAuthenticated, loading, error
- **Image extraction state**: extractedText, extracting, error
- **PDF extraction state**: extractedText, description, requestId, extracting, error
- **Theme state**: mode (light/dark/system), persisted with AsyncStorage
- **API call management**: All API calls handled through thunk actions with automatic token refresh
- **Token refresh**: Automatic token refresh on 401 errors, logout on refresh failure
- **Navigation guards**: Automatically redirects based on auth state

## Navigation Flow

1. **Unauthenticated**: Shows Login and Register screens
2. **After Login**: Automatically navigates to Home screen
3. **After Register**: Shows success message and navigates to Login screen
4. **After Logout**: Returns to Login screen

## Permissions

The app requests the following permissions:
- **iOS**: Camera and Photo Library access
- **Android**: Camera, Read/Write External Storage

These permissions are configured in `app.json` and will be requested at runtime when needed.

## Dependencies

### Core
- `expo` (~54.0.0) - Expo SDK
- `react` (19.1.0) - React library
- `react-native` (0.81.5) - React Native framework

### Navigation
- `@react-navigation/native` - Navigation library
- `@react-navigation/native-stack` - Stack navigator
- `react-native-screens` - Native screen components
- `react-native-safe-area-context` - Safe area handling

### State Management
- `@reduxjs/toolkit` - Redux Toolkit
- `react-redux` - React bindings for Redux
- `redux` - State management
- `redux-thunk` - Async action middleware

### Features
- `expo-image-picker` - Camera and gallery access
- `expo-document-picker` - PDF and document file selection
- `expo-clipboard` - Clipboard functionality
- `react-native-toast-message` - Toast notifications
- `expo-status-bar` - Status bar component
- `@react-native-async-storage/async-storage` - Persistent storage for theme preferences
- `react-native-paper` - Material Design 3 components with theme support

### Development
- `typescript` - TypeScript compiler
- `@types/react` - React TypeScript types
- `@babel/core` - Babel compiler
- `jest` & `jest-expo` - Testing framework for React Native/Expo
- `@testing-library/react-native` - Testing utilities for React Native
- `@testing-library/jest-native` - Extended Jest matchers for React Native
- `redux-mock-store` - Mock store for testing Redux thunks
- `@types/redux-mock-store` - TypeScript types for redux-mock-store

## Testing

Unit tests cover screens, reducers, actions, and utilities using Jest and React Testing Library for React Native.

```bash
npm run test
```

### Test Coverage

- **Screens**: HomeScreen, PdfScreen, LoginScreen, RegisterScreen
- **Reducers**: authReducer (including refresh token actions)
- **Actions**: authActions (including refresh token functionality)
- **Utilities**: apiClient (automatic token refresh on 401 errors)

Run individual suites with:

```bash
npx jest src/screens/__tests__/HomeScreen.test.tsx
npx jest src/screens/__tests__/PdfScreen.test.tsx
npx jest src/screens/__tests__/LoginScreen.test.tsx
npx jest src/screens/__tests__/RegisterScreen.test.tsx
npx jest src/store/reducers/__tests__/authReducer.test.ts
npx jest src/store/actions/__tests__/authActions.test.ts
npx jest src/utils/__tests__/apiClient.test.ts
```

The Jest configuration is located in `jest.config.js` and is preconfigured for Expo SDK 54. Tests include mocks for AsyncStorage, SafeAreaContext, and icon libraries.

## Deployment

Local EAS preview build:

```bash
eas build -p android --profile preview --local --output=app.apk
```

Set any required environment variables in your shell or CI before running the build.

## Technology Stack

- **Framework**: React Native with Expo SDK 54
- **Language**: TypeScript
- **State Management**: Redux + Redux Thunk
- **Navigation**: React Navigation v6
- **UI Components**: React Native Paper (Material Design 3) with theme support
- **API Communication**: Fetch API with FormData support
- **Storage**: AsyncStorage for persistent theme preferences
- **Theme System**: Custom light/dark themes with system preference support

## Development

### TypeScript
The project is fully typed with TypeScript. All components, actions, and reducers are typed for better development experience and error prevention.

### Code Structure
- **Components**: Reusable UI components
  - **AppHeader**: Consistent header with title, subtitle, theme toggle, and optional logout
  - **ImagePickerComponent**: Camera and gallery image selection
  - **OpenaiPassModal**: Secure modal for OpenAI pass input with visibility toggle
  - **ThemeToggle**: Theme mode selector (light/dark/system)
- **Screens**: Full-screen components for navigation (Home, PDF, Login, Register)
- **Store**: Redux store with actions, reducers, and types
  - **Actions**: Async thunk actions for API calls with automatic token refresh
  - **Reducers**: State reducers for auth (including refresh token), image, PDF, and theme
  - **Types**: TypeScript interfaces and types for type safety
- **Utils**: Utility functions
  - **apiClient**: API call wrapper with automatic 401 handling and token refresh
  - **validation**: Form validation helpers

### Theme System
The app supports three theme modes:
- **Light Mode**: Custom light theme with optimized colors
- **Dark Mode**: Custom dark theme with optimized colors
- **System Mode**: Automatically follows device theme preference

Theme preference is persisted using AsyncStorage and restored on app launch. Users can toggle themes using the ThemeToggle component available in the header of Home and PDF screens.

### PDF Features
- **Initial Upload**: Upload PDF and ask first question
- **Follow-up Questions**: Continue asking questions using the `request_id` from previous responses
- **Session Management**: PDF session persists until user uploads a fresh PDF or clears the session
- **Model Selection**: Choose between OpenAI, Ollama, DeepSeek, and Gemini models for processing
- **OpenAI Pass Security**: Secure modal for entering OpenAI pass with password visibility toggle
- **Response Display**: Shows both extracted content and description from API responses

### Authentication & Security
- **Token Management**: Access tokens and refresh tokens stored in Redux state
- **Automatic Token Refresh**: API client automatically refreshes tokens on 401 errors
- **Session Expiration**: User is automatically logged out if token refresh fails
- **Secure API Calls**: All API calls include authorization headers when authenticated
- **OpenAI Pass Handling**: OpenAI pass is securely sent with requests when OpenAI model is selected

