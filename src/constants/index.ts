/**
 * Every app-wide constant lives here, imported as `../constants` (AGENTS.md §2).
 *
 * The app reads no environment variables: no `process.env`, no Expo public
 * variables, no `expo-constants` extra. Everything in this module is bundled,
 * and a mobile bundle is public, so **no secret ever belongs here**. Secrets
 * live in the API's own `.env`.
 *
 * `app.json` cannot import this file, so the values the two share (name,
 * version, EAS project) are checked by `src/__tests__/constants.test.ts`;
 * change both together.
 */

declare const __DEV__: boolean;

export const APP_NAME = "ScanGenAI";
/** Sent as X-App-Version on every API call. Must equal app.json `expo.version`. */
export const APP_VERSION = "1.1.0";
export const APP_VERSION_HEADER = "X-App-Version";
export const EAS_PROJECT_ID = "01ff9db2-9e1f-4524-a218-8998eef6a3ee";

/** The public ScanGenAI API origin served by the VPS reverse proxy. */
export const API_BASE_URL = "https://kingsley-api.name.ng";

export const LEGAL_URLS = Object.freeze({
  privacy: "https://leonfrontier.com/scangenai/privacy",
  terms: "https://leonfrontier.com/scangenai/terms",
  support: "https://leonfrontier.com/scangenai/support",
  /** The web route to account deletion that Google Play requires alongside the in-app one. */
  deleteAccount: "https://leonfrontier.com/scangenai/delete-account",
});

/**
 * Store pages, for the "update required" prompt. Null until the app is
 * published; the prompt then has no store button.
 */
export const STORE_URLS = Object.freeze({
  ios: null as string | null,
  android: null as string | null,
});

/**
 * ScanGenAI Pro subscriptions. The IDs must match App Store Connect, the Play
 * Console and the server (app/services/billing/plans.py); the server's
 * tests/test_billing_contract.py fails if they differ.
 */
export const IAP = Object.freeze({
  proMonthlyProductId: "scangenai_pro_monthly",
  proYearlyProductId: "scangenai_pro_yearly",
  androidPackageName: "com.leonfrontier.scangenai",
});

/**
 * Google Web OAuth client ID; must equal the server's GOOGLE_WEB_CLIENT_ID.
 * An empty value hides the Google button. Google sign-in is Android only;
 * Apple sign-in is iOS only.
 */
export const GOOGLE_WEB_CLIENT_ID =
  "1088070828529-i8hjbpvb1q38euivv7s5sr7dti9mtkq4.apps.googleusercontent.com";
export const GOOGLE_SIGN_IN_ENABLED = GOOGLE_WEB_CLIENT_ID.trim().length > 0;

/** Must match the server's PASSWORD_MIN_LENGTH (app/schemas/auth_schemas.py). */
export const PASSWORD_MIN_LENGTH = 8;
/** bcrypt reads at most 72 bytes; the server refuses longer passwords. */
export const PASSWORD_MAX_BYTES = 72;

/** The exact `detail` the API returns when the password is right but the email is unverified. */
export const EMAIL_NOT_VERIFIED_DETAIL = "Email not verified";

export const REQUEST_TIMEOUT_MS = 15_000;
/** Uploads carry a file of up to 20 MB over a phone connection. */
export const UPLOAD_TIMEOUT_MS = 120_000;

/**
 * Job polling. A job that has not finished after `maxDurationMs` is reported
 * as timed out instead of spinning forever; the delay starts short, so quick
 * jobs feel quick, and backs off so slow ones do not hammer the API.
 */
export const JOB_POLLING = Object.freeze({
  initialDelayMs: 2_000,
  maxDelayMs: 10_000,
  backoffFactor: 1.5,
  maxDurationMs: 12 * 60_000,
});

/**
 * The server's upload ceilings (IMAGE_MAX_BYTES, AUDIO_MAX_BYTES,
 * PDF_MAX_BYTES). Checked here first only so the user is told before a long
 * upload rather than after it; the server is the one that enforces them.
 */
export const UPLOAD_LIMITS = Object.freeze({
  imageBytes: 10 * 1024 * 1024,
  audioBytes: 20 * 1024 * 1024,
  pdfBytes: 20 * 1024 * 1024,
});

export const MOBILE_LOGGING = Object.freeze({
  level: (typeof __DEV__ !== "undefined" && __DEV__ ? "debug" : "info") as
    | "debug"
    | "info",
  batchSize: 25,
  queueLimit: 200,
  flushDelayMs: 5_000,
  retryDelayMs: 15_000,
});

/** SecureStore: this device only, never synced to iCloud Keychain or a backup. */
export const SESSION_STORAGE = Object.freeze({
  key: "scangenai_session",
  keychainService: "com.leonfrontier.scangenai.session",
});

