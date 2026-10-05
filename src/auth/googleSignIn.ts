import {
  GoogleSignin,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import { Platform } from "react-native";

import { GOOGLE_SIGN_IN_ENABLED, GOOGLE_WEB_CLIENT_ID } from "../constants";

// Hermes provides atob; this project's tsconfig has no DOM lib to declare it.
declare const atob: (data: string) => string;

let configured = false;

export function configureGoogleSignIn(): void {
  if (configured) return;
  if (!GOOGLE_SIGN_IN_ENABLED) {
    throw new Error("Google sign-in is not configured for this build.");
  }
  if (Platform.OS !== "android") {
    throw new Error(
      "Google sign-in is only available on Android.",
    );
  }
  GoogleSignin.configure({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    offlineAccess: false,
  });
  configured = true;
}

function base64UrlDecode(input: string): string {
  // Polyfill-free decoder: Google ID tokens use standard base64url without
  // padding.  We only need the payload for validation, so we tolerate invalid
  // characters by letting `atob` throw and treating that as a bad token.
  const pad = input.length % 4;
  const normalized =
    input.replace(/-/g, "+").replace(/_/g, "/") +
    (pad === 0 ? "" : "=".repeat(4 - pad));
  // `atob` is available in Hermes and JSC via react-native 0.72+.
  // eslint-disable-next-line no-undef
  return atob(normalized);
}

function audienceFromToken(idToken: string): string | null {
  const parts = idToken.split(".");
  if (parts.length !== 3) return null;
  try {
    const payloadJson = base64UrlDecode(parts[1]);
    const payload = JSON.parse(payloadJson) as { aud?: unknown; iss?: unknown };
    // L-6: reject tokens issued by anyone other than Google.  Google rotates
    // the signing keys, and the backend is the authoritative verifier, but
    // this guard keeps a misconfigured client from sending a non-Google
    // token at all — fail fast with a clear error.
    const iss = typeof payload.iss === "string" ? payload.iss : "";
    if (
      iss !== "https://accounts.google.com" &&
      iss !== "accounts.google.com"
    ) {
      return null;
    }
    return typeof payload.aud === "string" ? payload.aud : null;
  } catch {
    return null;
  }
}

/**
 * Returns a Google OpenID Connect ID token for the ScanGenAI API, or null if cancelled.
 *
 * L-6: before handing the token to the backend we also verify (client-side)
 * that its ``aud`` claim matches our configured web client id.  This is not
 * a security control — the backend still validates the signature — but it
 * surfaces misconfiguration (e.g. the wrong client id in src/constants) immediately and
 * prevents the app from wasting a backend exchange that will 401.
 */
export async function getGoogleIdToken(): Promise<string | null> {
  configureGoogleSignIn();

  if (Platform.OS === "android") {
    await GoogleSignin.hasPlayServices({
      showPlayServicesUpdateDialog: true,
    });
  }

  const response = await GoogleSignin.signIn();
  if (response.type !== "success") {
    return null;
  }

  let idToken = response.data.idToken;
  if (!idToken) {
    const tokens = await GoogleSignin.getTokens();
    idToken = tokens.idToken;
  }

  if (idToken) {
    const aud = audienceFromToken(idToken);
    if (!aud || aud !== GOOGLE_WEB_CLIENT_ID) {
      throw new Error(
        "Google sign-in returned an unexpected token. Please try again.",
      );
    }
  }

  return idToken;
}

export function isGoogleSignInCancelledError(error: unknown): boolean {
  const code =
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as { code: unknown }).code === "string"
      ? (error as { code: string }).code
      : null;
  return code === statusCodes.SIGN_IN_CANCELLED;
}

export async function signOutGoogle(): Promise<void> {
  try {
    await GoogleSignin.signOut();
  } catch {
    // ignore
  }
}
