# ScanGenAI Mobile App

An Expo React Native app (iOS and Android) that turns images, audio and PDFs into text, and
answers questions about an uploaded PDF. Its server is `../image-to-text-app`.

**Read [../AGENTS.md](../AGENTS.md) before changing anything.** It is the enforceable rule set;
[../memory.md](../memory.md) records decisions, traps and what has actually been verified.
Releasing: [docs/release.md](docs/release.md). Store listing: [docs/STORE_LISTING.md](docs/STORE_LISTING.md).

## Features

- **Image to text** from the camera or the photo library.
- **Audio to text** from an in-app recording or an audio file.
- **PDF questions and answers**, with follow-up questions on the same document. The server decides
  which models are offered.
- **Accounts**: register, verify by email (with resend), sign in, reset a forgotten password, and
  delete the account from the Account tab.
- **Stays signed in**: the session is kept in the device keystore and refreshed automatically.
- **Monthly usage** for each kind of work, shown on the Account tab.
- Light, dark and system themes; markdown rendering; copy to clipboard.

## How it is put together

- `src/constants/index.ts` — every app-wide constant. The app reads no environment variables.
- `src/api/routes.generated.ts` — generated from the server's `app/paths.py`. Never edit it.
- `src/api/http.ts`, `src/api/client.ts` — the only code that calls `fetch`: version header,
  timeouts, one shared token refresh, bounded job polling.
- `src/auth/sessionStorage.ts` — the session in the platform keystore, device-only.
- `src/logging/` — the redacting logger and the batch uploader to the server.
- `src/store/` — Redux Toolkit (auth, theme). `src/hooks/` — React Query jobs and the account.

## Checks

```bash
npm run check     # typecheck, lint, no-env / no-console / no-route-literal guards, tests, audit
npx expo-doctor
```

There is no CI; `npm run check` is the gate. Its final step, the dependency audit, is currently
red for a reason explained in [docs/release.md](docs/release.md).

## Getting Started

### Prerequisites

- Node.js 22 or newer
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
- **Physical Device**: use a development build (`eas build --profile development`); the app
  uses native modules (secure storage, updates) that Expo Go does not include
