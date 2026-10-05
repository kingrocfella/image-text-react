import * as SecureStore from "expo-secure-store";

import { clearSession, loadSession, saveSession } from "../sessionStorage";
import { SESSION_STORAGE } from "../../constants";

const SESSION = {
  accessToken: "a",
  refreshToken: "r",
  tokenType: "bearer",
  user: { id: "1", name: "Ada", email: "ada@example.com" },
};

beforeEach(() => (SecureStore as unknown as { __reset: () => void }).__reset());

it("round-trips a session through the keystore", async () => {
  await saveSession(SESSION);
  expect(await loadSession()).toEqual(SESSION);
});

it("uses a dedicated, device-only keychain entry", async () => {
  await saveSession(SESSION);
  expect(SecureStore.setItemAsync).toHaveBeenLastCalledWith(
    SESSION_STORAGE.key,
    expect.any(String),
    {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      keychainService: SESSION_STORAGE.keychainService,
    },
  );
});

it("returns null and clears a malformed value", async () => {
  await SecureStore.setItemAsync(SESSION_STORAGE.key, JSON.stringify({ accessToken: "" }));
  expect(await loadSession()).toBeNull();
  expect(await SecureStore.getItemAsync(SESSION_STORAGE.key)).toBeNull();
});

it("clearSession removes it and never throws", async () => {
  await saveSession(SESSION);
  await clearSession();
  expect(await loadSession()).toBeNull();
  (SecureStore.deleteItemAsync as jest.Mock).mockRejectedValueOnce(new Error("keystore"));
  await expect(clearSession()).resolves.toBeUndefined();
});
