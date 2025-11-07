# Image to Text Mobile App

A React Native app built with Expo that allows users to extract text from images using OCR technology. The app includes user authentication, camera functionality, and seamless text extraction with copy-to-clipboard features.

## Features

- 🔐 **Authentication**: Login and Register screens with form validation
- 📸 **Camera**: Take pictures using the device camera
- 🖼️ **Gallery**: Select images from the photo library
- 🔍 **Text Extraction**: Extract text from images using OCR API
- 📋 **Copy to Clipboard**: Copy extracted text with a single tap
- 🔄 **Extract Another**: Quick workflow to extract text from multiple images
- 🗂️ **State Management**: Redux with Redux Thunk for API calls
- 🧭 **Navigation**: React Navigation with authentication guards
- 🔒 **Permissions**: Proper permission handling for camera and photo library access
- 🎨 **Toast Notifications**: Non-intrusive feedback for user actions

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

2. Configure your API endpoint:
   - Create a `.env` file in the root directory (if it doesn't exist)
   - Add your API base URL:
     ```
     API_BASE_URL=http://your-api.com
     ```
   - The `.env` file is already in `.gitignore` to keep your credentials safe
   - **Note**: The backend APIs are hosted on a private server. If you want to fully test out this application, please contact me via my Twitter (X) page: [@KingRocfella](https://x.com/KingRocfella) to request API access.

3. Start the Expo development server:
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
├── App.tsx                 # Main app entry point with Redux Provider and Toast
├── config.ts               # API configuration (reads from .env)
├── env.d.ts                # TypeScript declarations for environment variables
├── .env                    # Environment variables (API_BASE_URL)
├── babel.config.js         # Babel configuration with dotenv plugin
├── src/
│   ├── components/
│   │   └── ImagePickerComponent.tsx  # Reusable camera/gallery picker
│   ├── navigation/
│   │   └── AppNavigator.tsx          # Navigation setup with auth guards
│   ├── screens/
│   │   ├── LoginScreen.tsx           # Login screen with validation
│   │   ├── RegisterScreen.tsx       # Register screen with validation
│   │   └── HomeScreen.tsx           # Home screen with text extraction
│   ├── store/
│   │   ├── index.ts                 # Redux store configuration
│   │   ├── actions/
│   │   │   ├── authActions.ts       # Auth actions with thunks
│   │   │   └── imageActions.ts      # Image/text extraction actions
│   │   ├── reducers/
│   │   │   ├── index.ts             # Root reducer
│   │   │   ├── authReducer.ts       # Auth reducer
│   │   │   └── imageReducer.ts      # Image/text extraction reducer
│   │   └── types/
│   │       ├── authTypes.ts         # TypeScript types for auth
│   │       └── imageTypes.ts        # TypeScript types for image extraction
│   └── utils/
│       └── validation.ts            # Form validation utilities
├── app.json                # Expo configuration with permissions
├── package.json            # Dependencies and scripts
└── tsconfig.json           # TypeScript configuration
```

## API Configuration

The app makes API calls using `API_BASE_URL` from `.env`:

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

1. **Registration/Login**: User creates account or logs in
2. **Image Selection**: User takes a picture or selects from gallery
3. **Text Extraction**: User clicks "Extract Text from Picture"
4. **View Results**: Extracted text is displayed with copy icon
5. **Copy Text**: User can copy text to clipboard with toast notification
6. **Extract Another**: User can extract text from another image

## State Management

The app uses Redux with Redux Thunk for:
- **Authentication state**: user, tokens, isAuthenticated, loading, error
- **Image extraction state**: extractedText, extracting, error
- **API call management**: All API calls handled through thunk actions
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
- `expo-clipboard` - Clipboard functionality
- `react-native-toast-message` - Toast notifications
- `expo-status-bar` - Status bar component

### Development
- `typescript` - TypeScript compiler
- `@types/react` - React TypeScript types
- `@babel/core` - Babel compiler
- `react-native-dotenv` - Environment variable support

## Technology Stack

- **Framework**: React Native with Expo SDK 54
- **Language**: TypeScript
- **State Management**: Redux + Redux Thunk
- **Navigation**: React Navigation v6
- **UI Components**: React Native core components + Expo vector icons
- **API Communication**: Fetch API with FormData support

## Development

### TypeScript
The project is fully typed with TypeScript. All components, actions, and reducers are typed for better development experience and error prevention.

### Code Structure
- **Components**: Reusable UI components
- **Screens**: Full-screen components for navigation
- **Store**: Redux store with actions, reducers, and types
- **Utils**: Utility functions for validation and helpers

