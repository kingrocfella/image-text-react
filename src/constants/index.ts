/**
 * Every app-wide constant lives here, imported as `../constants`.
 *
 * This module is **committed on purpose**. It used to be a gitignored
 * `config.ts` at the repository root, which bought nothing — everything in a
 * mobile bundle ships to the device and is therefore public — while costing
 * reproducibility: a fresh clone could not build, and `src/api/__tests__/
 * client.test.ts` failed to run at all with "Cannot find module '../../config'".
 *
 * Because it is bundled, it is public. **No secret ever belongs here.** Secrets
 * live in the API's own `server`-side `.env`, which is exactly why this app has
 * no environment file of its own and reads no environment variables.
 */

export const API_CONFIG = {
  /**
   * The ScanGenAI API's origin. The default is the loopback address the API's
   * docker-compose publishes (`API_HOST_PORT`, default 8000) for local work;
   * set the production origin here before a release build.
   */
  BASE_URL: "http://127.0.0.1:8000",
} as const;

/**
 * Server paths, in one place rather than as literals at each call site.
 *
 * The server is the owner of these strings. Letterbolt generates its client
 * mirror from the Go route constants so the two cannot drift; this app has no
 * generator yet, so these are hand-maintained — keep them in step with
 * `image-to-text-app/app/routes/`.
 */
export const API_ROUTES = {
  authLogin: "/auth/login",
  authRegister: "/auth/register",
  authRefresh: "/auth/refresh",
  authLogout: "/auth/logout",
  imageToText: "/convert/image/text",
  soundToText: "/convert/sound/text",
  pdfResponse: "/pdf/get/response",
  job: (messageId: string) => `/job/${encodeURIComponent(messageId)}`,
} as const;
