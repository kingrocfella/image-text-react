/**
 * Structured mobile logging (AGENTS.md §4). Every app event goes through
 * `createMobileLogger(scope)`; records are redacted here, printed to the
 * console in development, and handed to a sink (the server log shipper).
 */
import { MOBILE_LOGGING } from "../constants";

declare const __DEV__: boolean;

export type MobileLogLevel = "debug" | "info" | "warn" | "error";
export type MobileLogFields = Record<string, unknown>;

export interface MobileLogRecord {
  timestamp: string;
  level: MobileLogLevel;
  scope: string;
  event: string;
  message: string;
  runtimeId: string;
  fields?: MobileLogFields;
}

type MobileLogSink = (record: MobileLogRecord) => void;

const LEVEL_WEIGHT: Record<MobileLogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};
const EMAIL_RE = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const JWT_RE = /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g;
const BEARER_RE = /\bBearer\s+[A-Za-z0-9._~+/-]+=*/gi;
const TOKEN_PARAM_RE = /(token=)[^\s&]+/gi;
// Credentials, contact details, and the user's own documents and questions.
const SENSITIVE_KEY_RE =
  /(authorization|cookie|password|secret|token|email|query|filename|content|body|text|uri)/i;
const MAX_STRING = 500;
const MAX_ITEMS = 25;
const MAX_DEPTH = 4;
const MAX_RECENT = 200;

const runtimeId = `mobile-${Date.now().toString(36)}`;
const recent: MobileLogRecord[] = [];
let sink: MobileLogSink | null = null;

export function sanitizeLogText(value: string): string {
  return value
    .replace(EMAIL_RE, "[REDACTED_EMAIL]")
    .replace(JWT_RE, "[REDACTED_TOKEN]")
    .replace(BEARER_RE, "Bearer [REDACTED_TOKEN]")
    .replace(TOKEN_PARAM_RE, "$1[REDACTED_TOKEN]");
}

function cleanString(value: string, limit: number = MAX_STRING): string {
  const printable = value.replace(/[\u0000-\u001f\u007f]+/g, " ");
  const redacted = sanitizeLogText(printable);
  return redacted.length > limit ? `${redacted.slice(0, limit)}…` : redacted;
}

function sanitize(value: unknown, depth: number): unknown {
  if (
    value === null ||
    value === undefined ||
    typeof value === "boolean" ||
    typeof value === "number"
  ) {
    return value;
  }
  if (typeof value === "string") return cleanString(value);
  if (value instanceof Error) {
    return { name: value.name, message: cleanString(value.message) };
  }
  if (typeof value !== "object") return cleanString(String(value));
  if (depth >= MAX_DEPTH) return "[Truncated]";
  if (Array.isArray(value)) {
    return value.slice(0, MAX_ITEMS).map((item) => sanitize(item, depth + 1));
  }
  const output: MobileLogFields = {};
  for (const [key, item] of Object.entries(value).slice(0, MAX_ITEMS)) {
    output[key] = SENSITIVE_KEY_RE.test(key)
      ? "[REDACTED]"
      : sanitize(item, depth + 1);
  }
  return output;
}

export function sanitizeLogFields(fields: MobileLogFields): MobileLogFields {
  return sanitize(fields, 0) as MobileLogFields;
}

function emit(
  level: MobileLogLevel,
  scope: string,
  event: string,
  message: string,
  fields?: MobileLogFields,
): void {
  if (LEVEL_WEIGHT[level] < LEVEL_WEIGHT[MOBILE_LOGGING.level]) return;

  const record: MobileLogRecord = {
    timestamp: new Date().toISOString(),
    level,
    scope,
    event,
    message: cleanString(message, 1000),
    runtimeId,
    ...(fields ? { fields: sanitizeLogFields(fields) } : {}),
  };
  recent.push(record);
  if (recent.length > MAX_RECENT) recent.splice(0, recent.length - MAX_RECENT);

  if (typeof __DEV__ !== "undefined" && __DEV__) {
    const rendered = `[${scope}] ${event}: ${record.message}`;
    const write =
      level === "error"
        ? console.error
        : level === "warn"
          ? console.warn
          : console.info;
    write(rendered, record.fields ?? "");
  }

  try {
    sink?.(record);
  } catch {
    // A diagnostic sink must never affect the application.
  }
}

export function createMobileLogger(scope: string) {
  return {
    debug: (event: string, message: string, fields?: MobileLogFields) =>
      emit("debug", scope, event, message, fields),
    info: (event: string, message: string, fields?: MobileLogFields) =>
      emit("info", scope, event, message, fields),
    warn: (event: string, message: string, fields?: MobileLogFields) =>
      emit("warn", scope, event, message, fields),
    error: (event: string, message: string, fields?: MobileLogFields) =>
      emit("error", scope, event, message, fields),
  };
}

/** Records emitted so far this run (newest last), for the shipper's backlog. */
export function getRecentMobileLogs(): MobileLogRecord[] {
  return recent.map((record) => ({ ...record }));
}

export function setMobileLogSink(next: MobileLogSink | null): void {
  sink = next;
}
