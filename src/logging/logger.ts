/**
 * Redacting mobile logger.
 *
 * Direct `console.*` on an app event is forbidden: the values reaching these
 * call sites are auth errors and API response objects, which routinely carry
 * bearer tokens and the user's email address. Everything goes through
 * `createMobileLogger(scope)`, which sanitises the message and refuses to
 * render an arbitrary object at all.
 *
 * Output is development-only. A release build logs nothing, so nothing can be
 * read off a device log.
 */

declare const __DEV__: boolean;

const EMAIL_RE = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const JWT_RE = /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g;
const BEARER_RE = /\bBearer\s+[A-Za-z0-9._~+/-]+=*/gi;
const TOKEN_PARAM_RE = /((?:access_|refresh_)?token=)[^\s&]+/gi;

export function sanitizeLogText(value: string): string {
  return value
    .replace(EMAIL_RE, "[REDACTED_EMAIL]")
    .replace(JWT_RE, "[REDACTED_TOKEN]")
    .replace(BEARER_RE, "Bearer [REDACTED_TOKEN]")
    .replace(TOKEN_PARAM_RE, "$1[REDACTED_TOKEN]");
}

/**
 * Render a caught value. Only an Error's name/message and a plain string are
 * rendered — an arbitrary object is reduced to its type, because stringifying
 * an API response is how tokens end up in a log in the first place.
 */
function normalizeDetail(detail: unknown): string | undefined {
  if (detail instanceof Error) {
    return `${detail.name}: ${sanitizeLogText(detail.message)}`;
  }
  if (typeof detail === "string") return sanitizeLogText(detail);
  if (detail === undefined || detail === null) return undefined;
  return `[${typeof detail}]`;
}

export function createMobileLogger(scope: string) {
  const emit = (
    level: "warn" | "error",
    message: string,
    detail?: unknown
  ): void => {
    if (!__DEV__) return;
    const rendered = `[${scope}] ${sanitizeLogText(message)}`;
    const safeDetail = normalizeDetail(detail);
    if (level === "error") console.error(rendered, safeDetail ?? "");
    else console.warn(rendered, safeDetail ?? "");
  };

  return {
    warn: (message: string, detail?: unknown) => emit("warn", message, detail),
    error: (message: string, detail?: unknown) => emit("error", message, detail),
  };
}
