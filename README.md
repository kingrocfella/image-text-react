# ScanGenAI Mobile App

A React Native app built with Expo that allows users to extract text from images, PDFs, and audio using AI-powered OCR and transcription technology. The app features a queue-based job processing system with automatic polling, markdown rendering for rich text display, user authentication, camera functionality, PDF document Q&A with multiple AI models (OpenAI, Ollama, DeepSeek, Gemini), audio recording/upload, and seamless text extraction with copy-to-clipboard features.

## Features

- 🔐 **Authentication**: Login and Register screens with form validation
- 🔄 **Automatic Token Refresh**: Automatically refreshes access tokens on 401 errors and logs out if refresh fails
- 📸 **Camera**: Take pictures using the device camera
- 🖼️ **Gallery**: Select images from the photo gallery
- 📄 **PDF Support**: Upload and process PDF documents
- 🎤 **Audio Recording**: Record audio directly in the app using expo-audio
- 🎵 **Audio Upload**: Upload audio files from device storage
- 🔍 **Text Extraction**: Extract text from images using OCR API
- 🎙️ **Audio Transcription**: Transcribe audio recordings and files to text
- 🤖 **AI-Powered PDF Q&A**: Ask questions about uploaded PDFs using AI models (OpenAI, Ollama, DeepSeek, Gemini)
- 💬 **Follow-up Questions**: Continue conversations with PDFs using request_id
- 📋 **Copy to Clipboard**: Copy extracted text with a single tap
- 🔄 **Extract Another**: Quick workflow to extract text from multiple images/PDFs/audio files
- 🌓 **Theme Toggle**: Switch between Light, Dark, and System theme modes
- 💾 **Theme Persistence**: Theme preference saved and restored on app launch
- 🗂️ **State Management**: Redux Toolkit with createSlice and createAsyncThunk for type-safe, modern state management
- 🧭 **Navigation**: React Navigation with authentication guards
- 🔒 **Permissions**: Proper permission handling for camera, photo library, microphone, and document access
- 🎨 **Toast Notifications**: Non-intrusive feedback for user actions
- ⏳ **Job Queue Polling**: Background job processing with automatic status polling for long-running operations
- 📝 **Markdown Rendering**: Rich markdown display for PDF extraction results

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
│   │   ├── MarkdownRenderer.tsx  # Reusable markdown display component
│   │   ├── OpenaiPassModal.tsx   # Modal for OpenAI pass input
│   │   └── ThemeToggle.tsx       # Theme toggle component
│   ├── navigation/
│   │   └── AppNavigator.tsx
│   ├── screens/
│   │   ├── __tests__/
│   │   │   ├── HomeScreen.test.tsx
│   │   │   ├── LoginScreen.test.tsx
│   │   │   ├── PdfScreen.test.tsx
│   │   │   ├── RegisterScreen.test.tsx
│   │   │   └── SoundScreen.test.tsx
│   │   ├── HomeScreen.tsx        # Image to text screen
│   │   ├── PdfScreen.tsx         # PDF to text screen
│   │   ├── SoundScreen.tsx       # Audio to text screen
│   │   ├── LoginScreen.tsx
│   │   └── RegisterScreen.tsx
│   ├── store/
│   │   ├── actions/
│   │   │   └── helpers/
│   │   │       └── pollJobStatus.ts  # Job polling helper for queue-based APIs
│   │   ├── slices/               # Redux Toolkit slices (createSlice + createAsyncThunk)
│   │   │   ├── authSlice.ts      # Authentication state & async thunks
│   │   │   ├── imageSlice.ts     # Image extraction state & async thunks
│   │   │   ├── pdfSlice.ts       # PDF extraction and Q&A state & async thunks
│   │   │   ├── audioSlice.ts     # Audio transcription state & async thunks
│   │   │   └── themeSlice.ts     # Theme management state & async thunks
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

### PDF to Text Flow
1. **PDF Upload**: User uploads a PDF document
2. **Model Selection**: User selects an AI model (OpenAI, Ollama, DeepSeek, or Gemini)
3. **OpenAI Pass Entry** (if OpenAI selected): Modal appears for secure OpenAI pass input with visibility toggle
4. **Question Input**: User enters a question about the PDF
5. **Job Queuing**: System queues the job and returns a message_id
6. **Background Polling**: App polls job status every 10 seconds until completion
7. **View Results**: Extracted text (rendered as markdown) and description are displayed
8. **Follow-up Questions**: User can ask additional questions using the same PDF (request_id persists)
9. **Fresh PDF**: User can upload a new PDF to start a new session

### Audio to Text Flow
1. **Audio Input**: User chooses to record audio or upload an audio file
   - **Record**: Tap "Record Audio" to start recording, tap "Stop Recording" when done
   - **Upload**: Tap "Upload Audio" to select an audio file from device storage
2. **Audio Preview**: Recording duration or file name is displayed
3. **Transcription**: User clicks "Transcribe Audio"
4. **Job Queuing**: System queues the transcription job and returns a message_id
5. **Background Polling**: App polls job status every 10 seconds until completion
6. **View Results**: Transcribed text is displayed with copy icon
7. **Copy Text**: User can copy text to clipboard with toast notification
8. **Transcribe Another**: User can transcribe another audio recording or file

### Image to Text Flow (with Job Queue)
1. **Image Selection**: User takes a picture or selects from gallery
2. **Text Extraction**: User clicks "Extract Text from Picture"
3. **Job Queuing**: System queues the extraction job and returns a message_id
4. **Background Polling**: App polls job status every 10 seconds until completion
5. **View Results**: Extracted text is displayed with copy icon
6. **Copy Text**: User can copy text to clipboard with toast notification
7. **Extract Another**: User can extract text from another image

## State Management

The app uses **Redux Toolkit (RTK)** with `createSlice` and `createAsyncThunk` for modern, type-safe state management:

### Architecture
- **Slices**: Each feature has its own slice (`authSlice`, `imageSlice`, `pdfSlice`, `audioSlice`, `themeSlice`) that combines state, reducers, and async thunks in a single file
- **createAsyncThunk**: All async operations (API calls) use `createAsyncThunk` for automatic pending/fulfilled/rejected action dispatching
- **Type Safety**: Full TypeScript support with inferred action types and typed hooks (`useAppDispatch`, `useAppSelector`)

### State Slices
- **authSlice**: user, tokens (accessToken, refreshToken), isAuthenticated, loading, error
- **imageSlice**: extractedText, extracting, error
- **pdfSlice**: extractedText, description, requestId, extracting, error
- **audioSlice**: transcribedText, transcribing, error
- **themeSlice**: mode (light/dark/system), persisted with AsyncStorage

### Features
- **Automatic Token Refresh**: API client automatically refreshes tokens on 401 errors using the `refreshToken` async thunk
- **Job Queue Polling**: Automatic polling every 10 seconds for long-running jobs (PDF, audio, image extraction)
- **Navigation Guards**: Automatically redirects based on authentication state

## Navigation Flow

1. **Unauthenticated**: Shows Login and Register screens
2. **After Login**: Automatically navigates to Home screen
3. **After Register**: Shows success message and navigates to Login screen
4. **After Logout**: Returns to Login screen

## Permissions

The app requests the following permissions:
- **iOS**: Camera, Photo Library, and Microphone access
- **Android**: Camera, Read/Write External Storage, and Record Audio

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
- `@reduxjs/toolkit` - Redux Toolkit (includes Redux core and Thunk middleware)
- `react-redux` - React bindings for Redux

### Features
- `expo-image-picker` - Camera and gallery access
- `expo-document-picker` - PDF and document file selection
- `expo-audio` - Audio recording and playback
- `expo-clipboard` - Clipboard functionality
- `react-native-toast-message` - Toast notifications
- `expo-status-bar` - Status bar component
- `@react-native-async-storage/async-storage` - Persistent storage for theme preferences
- `react-native-paper` - Material Design 3 components with theme support
- `react-native-markdown-display` - Markdown rendering for extracted text

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

- **Screens**: HomeScreen, PdfScreen, SoundScreen, LoginScreen, RegisterScreen

**Test Results**: 48 tests passing across 5 test suites

Run individual suites with:

```bash
npx jest src/screens/__tests__/HomeScreen.test.tsx
npx jest src/screens/__tests__/PdfScreen.test.tsx
npx jest src/screens/__tests__/SoundScreen.test.tsx
npx jest src/screens/__tests__/LoginScreen.test.tsx
npx jest src/screens/__tests__/RegisterScreen.test.tsx
```

The Jest configuration is located in `jest.config.js` and is preconfigured for Expo SDK 54. Tests include mocks for AsyncStorage, SafeAreaContext, expo-audio, and icon libraries.

## Deployment

Local EAS preview build:

```bash
eas build -p android --profile preview --local --output=app.apk
```

Set any required environment variables in your shell or CI before running the build.

## Technology Stack

- **Framework**: React Native with Expo SDK 54
- **Language**: TypeScript
- **State Management**: Redux Toolkit with createSlice and createAsyncThunk
- **Navigation**: React Navigation v6
- **UI Components**: React Native Paper (Material Design 3) with theme support
- **API Communication**: Fetch API with FormData support and automatic token refresh
- **Storage**: AsyncStorage for persistent theme preferences
- **Theme System**: Custom light/dark themes with system preference support

## Development

### TypeScript
The project is fully typed with TypeScript. All components, slices, and utilities are typed for better development experience and error prevention. RTK's `createSlice` and `createAsyncThunk` provide automatic type inference for actions and state.

### Code Structure
- **Components**: Reusable UI components
  - **AppHeader**: Consistent header with title, subtitle, theme toggle, and optional logout
  - **ImagePickerComponent**: Camera and gallery image selection
  - **MarkdownRenderer**: Themed markdown display component for rich text rendering
  - **OpenaiPassModal**: Secure modal for OpenAI pass input with visibility toggle
  - **ThemeToggle**: Theme mode selector (light/dark/system)
- **Screens**: Full-screen components for navigation (Home, PDF, Sound, Login, Register)
- **Store**: Redux store with actions, reducers, and types
  - **Actions**: Async thunk actions for API calls with automatic token refresh
  - **Reducers**: State reducers for auth (including refresh token), image, PDF, audio, and theme
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
- **Response Display**: Shows both extracted content (with markdown rendering) and description from API responses
- **Markdown Support**: Extracted text is rendered with full markdown support (headings, lists, code blocks, tables, etc.)

### Job Queue System
The app implements a queue-based system for long-running operations:
- **Queue Submission**: API calls return immediately with a `message_id`
- **Status Polling**: App polls `/job/{message_id}` every 10 seconds
- **Pending State**: Jobs with `status: "pending"` continue polling
- **Completion**: Jobs return `content`, `description`, and `request_id` when complete
- **Shared Helper**: `pollJobStatus` helper function used across image, PDF, and audio actions

### Authentication & Security
- **Token Management**: Access tokens and refresh tokens stored in Redux state
- **Automatic Token Refresh**: API client automatically refreshes tokens on 401 errors
- **Session Expiration**: User is automatically logged out if token refresh fails
- **Secure API Calls**: All API calls include authorization headers when authenticated
- **OpenAI Pass Handling**: OpenAI pass is securely sent with requests when OpenAI model is selected
