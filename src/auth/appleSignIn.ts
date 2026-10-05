import * as AppleAuthentication from "expo-apple-authentication";
import { Platform } from "react-native";

export type AppleFullNamePayload = {
  givenName?: string | null;
  familyName?: string | null;
  middleName?: string | null;
  namePrefix?: string | null;
  nameSuffix?: string | null;
  nickname?: string | null;
};

export type AppleSignInResult = {
  identityToken: string;
  fullName: AppleFullNamePayload | null;
};

export async function isAppleAuthAvailable(): Promise<boolean> {
  if (Platform.OS !== "ios") return false;
  return AppleAuthentication.isAvailableAsync();
}

export async function signInWithAppleNative(): Promise<AppleSignInResult> {
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
    ],
  });

  if (!credential.identityToken) {
    throw new Error("Apple sign-in did not return an identity token.");
  }

  return {
    identityToken: credential.identityToken,
    fullName: credential.fullName,
  };
}

export function isAppleSignInCancelledError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "ERR_REQUEST_CANCELED"
  );
}

export { AppleAuthentication };
