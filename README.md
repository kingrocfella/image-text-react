# React Native Expo App - Camera & Image Upload with Authentication

A React Native app built with Expo that includes user authentication (login/register), camera functionality, and image upload to an API.

## Features

- 🔐 **Authentication**: Login and Register screens with form validation
- 📸 **Camera**: Take pictures using the device camera
- 🖼️ **Gallery**: Select images from the photo library
- ☁️ **API Integration**: Upload images to a remote API endpoint
- 🗂️ **State Management**: Redux with Redux Thunk for API calls
- 🧭 **Navigation**: React Navigation with authentication guards
- 🔒 **Permissions**: Proper permission handling for camera and photo library access

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Expo CLI (optional, but recommended)

### Installation

1. Install dependencies:
```bash
npm install
```

Or use Expo's install command to ensure compatible versions:
```bash
npx expo install --fix
```

2. Configure your API endpoints:
   - Open `config.ts`
   - Replace `BASE_URL` with your actual API base URL (e.g., `'https://api.example.com'`)
   - Replace `ENDPOINT` with your image upload endpoint (e.g., `'https://api.example.com/upload'`)

3. Start the Expo development server:
```bash
npm start
```

### Running the App

- **iOS Simulator**: Press `i` in the terminal or run `npm run ios`
- **Android Emulator**: Press `a` in the terminal or run `npm run android`
- **Web Browser**: Press `w` in the terminal or run `npm run web`
- **Physical Device**: Scan the QR code with the Expo Go app

**Note**: Camera functionality requires a physical device or emulator. It won't work in the web browser.

## Project Structure

```
├── App.tsx                 # Main app entry point with Redux Provider
├── config.ts               # API configuration
├── src/
│   ├── navigation/
│   │   └── AppNavigator.tsx    # Navigation setup with auth guards
│   ├── screens/
│   │   ├── LoginScreen.tsx     # Login screen with validation
│   │   ├── RegisterScreen.tsx  # Register screen with validation
│   │   └── HomeScreen.tsx      # Home screen with camera functionality
│   ├── store/
│   │   ├── index.ts            # Redux store configuration
│   │   ├── actions/
│   │   │   └── authActions.ts  # Auth actions with thunks
│   │   ├── reducers/
│   │   │   ├── index.ts        # Root reducer
│   │   │   └── authReducer.ts  # Auth reducer
│   │   └── types/
│   │       └── authTypes.ts    # TypeScript types for auth
│   └── utils/
│       └── validation.ts       # Form validation utilities
├── app.json              # Expo configuration with permissions
├── package.json          # Dependencies and scripts
└── tsconfig.json         # TypeScript configuration
```

## API Configuration

The app makes API calls to the following endpoints:

### Authentication Endpoints
- **POST** `${BASE_URL}/login` - User login
  - Body: `{ email: string, password: string }`
  - Returns: User object with `id`, `name`, `email`

- **POST** `${BASE_URL}/register` - User registration
  - Body: `{ name: string, email: string, password: string }`
  - Returns: User object with `id`, `name`, `email`

### Image Upload Endpoint
- **POST** `${ENDPOINT}` - Image upload
  - Body: `multipart/form-data` with `image` field
  - Returns: Upload response data

Make sure your API endpoints accept these formats and handle the requests accordingly.

## Form Validation

### Login Screen
- **Email**: Required, must be a valid email format
- **Password**: Required, must be at least 6 characters

### Register Screen
- **Name**: Required, must be at least 2 characters
- **Email**: Required, must be a valid email format
- **Password**: Required, must be at least 6 characters

## State Management

The app uses Redux with Redux Thunk for:
- Authentication state (user, isAuthenticated, loading, error)
- API call management (handled through thunk actions)
- Navigation guards (automatically redirects based on auth state)

## Navigation Flow

1. **Unauthenticated**: Shows Login and Register screens
2. **After Login/Register**: Automatically navigates to Home screen
3. **After Logout**: Returns to Login screen

## Permissions

The app requests the following permissions:
- **iOS**: Camera and Photo Library access
- **Android**: Camera, Read/Write External Storage

These permissions are configured in `app.json` and will be requested at runtime when needed.

## Dependencies

- `expo` - Expo SDK
- `expo-image-picker` - Camera and gallery access
- `@react-navigation/native` - Navigation library
- `@react-navigation/native-stack` - Stack navigator
- `react-redux` - React bindings for Redux
- `redux` - State management
- `redux-thunk` - Async action middleware
- `react-native-screens` - Native screen components
- `react-native-safe-area-context` - Safe area handling
