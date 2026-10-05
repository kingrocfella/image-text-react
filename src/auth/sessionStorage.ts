/**
 * The signed-in session, kept in the platform keystore (Keychain / Keystore).
 *
 * Tokens used to live only in Redux memory, so every cold start signed the
 * user out. They are stored with device-only accessibility: readable while the
 * device is unlocked, never included in an iCloud Keychain sync or a backup.
 * Nothing here ever goes to AsyncStorage, which is unencrypted.
 */
import * as SecureStore from "expo-secure-store";
import { z } from "zod";

import { SESSION_STORAGE } from "../constants";

const StoredSessionSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  tokenType: z.string().min(1),
  user: z.object({
    id: z.string().optional(),
    name: z.string(),
    email: z.string(),
  }),
});

export type StoredSession = z.infer<typeof StoredSessionSchema>;

const OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  keychainService: SESSION_STORAGE.keychainService,
};

export async function saveSession(session: StoredSession): Promise<void> {
  await SecureStore.setItemAsync(
    SESSION_STORAGE.key,
    JSON.stringify(session),
    OPTIONS,
  );
}

/** The stored session, or null when there is none or it cannot be read. */
export async function loadSession(): Promise<StoredSession | null> {
  try {
    const raw = await SecureStore.getItemAsync(SESSION_STORAGE.key, OPTIONS);
    if (!raw) return null;
    const parsed = StoredSessionSchema.safeParse(JSON.parse(raw));
    if (parsed.success) return parsed.data;
  } catch {
    // Unreadable (restored to a new device, corrupted): treat as signed out.
  }
  await clearSession();
  return null;
}

export async function clearSession(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(SESSION_STORAGE.key, OPTIONS);
  } catch {
    // Nothing stored, or the keystore is unavailable; either way it is gone.
  }
}
