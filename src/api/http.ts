/**
 * The one place the app talks to the network.
 *
 * Every request carries X-App-Version, has a timeout, and reports HTTP 426
 * ("this build is too old") to a single handler. `path` always comes from
 * `API_ROUTES` (routes.generated.ts); never a literal.
 */
import {
  API_BASE_URL,
  APP_VERSION,
  APP_VERSION_HEADER,
  REQUEST_TIMEOUT_MS,
} from "../constants";

export class RequestTimeoutError extends Error {
  constructor() {
    super("The request timed out. Check your connection and try again.");
    this.name = "RequestTimeoutError";
  }
}

/**
 * A request the server refused. `needsPro` is true when upgrading would help:
 * HTTP 402 (a Pro-only model) or a free allowance that has run out.
 */
export class ApiRequestError extends Error {
  readonly status: number;
  readonly needsPro: boolean;

  constructor(message: string, response: Response) {
    super(message);
    this.name = "ApiRequestError";
    this.status = response.status;
    this.needsPro =
      response.status === 402 ||
      (response.status === 429 &&
        response.headers?.get?.("x-upgrade-available") === "true");
  }
}

export interface RequestOptions {
  timeoutMs?: number;
  /** Lets a caller cancel (leaving a screen, a newer request). */
  signal?: AbortSignal;
}

let onUpdateRequired: (() => void) | null = null;

/** Called on every 426: this build is older than the server's minimum. */
export function setUpdateRequiredHandler(handler: (() => void) | null): void {
  onUpdateRequired = handler;
}

function withApiHeaders(init: RequestInit): Record<string, string> {
  const headers: Record<string, string> = {
    ...(init.headers as Record<string, string> | undefined),
    [APP_VERSION_HEADER]: APP_VERSION,
  };
  // Leave Content-Type alone for FormData so React Native can set the
  // multipart boundary itself.
  const isFormData =
    typeof FormData !== "undefined" && init.body instanceof FormData;
  if (typeof init.body === "string" && !isFormData && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }
  return headers;
}

/** Send one API request. Throws RequestTimeoutError on a timeout. */
export async function apiFetch(
  path: string,
  init: RequestInit = {},
  options: RequestOptions = {},
): Promise<Response> {
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, options.timeoutMs ?? REQUEST_TIMEOUT_MS);
  const onAbort = () => controller.abort();
  if (options.signal?.aborted) controller.abort();
  options.signal?.addEventListener("abort", onAbort);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: withApiHeaders(init),
      signal: controller.signal,
    });
    if (response.status === 426) onUpdateRequired?.();
    return response;
  } catch (error) {
    if (timedOut) throw new RequestTimeoutError();
    throw error;
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener("abort", onAbort);
  }
}

/** Parse a JSON body; an empty or non-JSON body becomes `{}`. */
export async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return {};
  }
}
