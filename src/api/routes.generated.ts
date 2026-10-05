// GENERATED from image-to-text-app/app/paths.py by scripts/generate_routes.py.
// Do not edit. Change app/paths.py, then run `make generate-routes` there.

const encode = (value: string | number): string =>
  encodeURIComponent(String(value));

export const API_PREFIX = "/v1";

/** JSON API paths, already under API_PREFIX. */
export const API_ROUTES = {
  authRegister: "/v1/auth/register",
  authResendVerification: "/v1/auth/resend-verification",
  authLogin: "/v1/auth/login",
  authGoogle: "/v1/auth/google",
  authApple: "/v1/auth/apple",
  authRefresh: "/v1/auth/refresh",
  authLogout: "/v1/auth/logout",
  authForgotPassword: "/v1/auth/forgot-password",
  authAccount: "/v1/auth/account",
  me: "/v1/me",
  imageToText: "/v1/convert/image/text",
  soundToText: "/v1/convert/sound/text",
  pdfResponse: "/v1/pdf/get/response",
  job: (messageId: string | number) => `/v1/job/${encode(messageId)}`,
  clientLogs: "/v1/client-logs",
  billingVerify: "/v1/billing/purchases/verify",
  billingRecover: "/v1/billing/purchases/recover",
} as const;

/** Browser and email-link paths. Never versioned. */
export const WEB_ROUTES = {
  health: "/health",
  ready: "/ready",
  verifyEmail: "/auth/verify-email",
  resetPasswordPage: "/auth/reset-password",
  resetPasswordForm: "/auth/reset-password/form",
  appleNotifications: "/webhooks/apple",
  docs: "/docs",
  docsOauthRedirect: "/docs/oauth2-redirect",
  redoc: "/redoc",
  openapi: "/openapi.json",
} as const;
