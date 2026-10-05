import { API_ROUTES } from "./routes.generated";
import {
  ApiRequestError,
  apiFetch,
  readJson,
  type RequestOptions,
} from "./http";
import { clearSession } from "../auth/sessionStorage";
import { JOB_POLLING, UPLOAD_TIMEOUT_MS } from "../constants";
import { store } from "../store";
import {
  REFRESH_REFUSED,
  clearAuth,
  refreshToken,
} from "../store/slices/authSlice";
import {
  AccountSchema,
  QueuedJobResponseSchema,
  JobPendingResponseSchema,
  JobFailedResponseSchema,
  JobCompletedResponseSchema,
  validateResponse,
  parseApiError,
  type Account,
  type JobCompletedResponse,
} from "./schemas";

interface AuthTokens {
  accessToken: string | null;
  tokenType: string | null;
}

/**
 * Get current auth tokens from Redux store
 */
export const getAuthTokens = (): AuthTokens => {
  const state = store.getState();
  return {
    accessToken: state.auth.accessToken,
    tokenType: state.auth.tokenType,
  };
};

type RefreshOutcome = "refreshed" | "refused" | "unavailable";

// Several requests can hit 401 together (the access token expired while the
// app was closed). A refresh token works once, so they must share one refresh:
// a second concurrent attempt would look like token reuse and revoke the
// whole session.
let refreshInFlight: Promise<RefreshOutcome> | null = null;

const refreshSessionOnce = (): Promise<RefreshOutcome> => {
  if (!refreshInFlight) {
    refreshInFlight = store
      .dispatch(refreshToken())
      .then((result): RefreshOutcome => {
        if (refreshToken.fulfilled.match(result)) return "refreshed";
        return result.payload === REFRESH_REFUSED ? "refused" : "unavailable";
      })
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
};

/**
 * Make an authenticated API call with automatic token refresh.
 *
 * The server rejects an expired token before it reads the body or does any
 * work, so repeating the request after a refresh cannot duplicate a job.
 */
export const authFetch = async (
  path: string,
  init: RequestInit = {},
  options: RequestOptions = {},
): Promise<Response> => {
  const send = () => {
    const { accessToken, tokenType } = getAuthTokens();
    const headers: Record<string, string> = {
      ...(init.headers as Record<string, string> | undefined),
    };
    if (accessToken && tokenType) {
      headers["Authorization"] = `${tokenType} ${accessToken}`;
    }
    return apiFetch(path, { ...init, headers }, options);
  };

  let response = await send();

  if (response.status === 401 && getAuthTokens().accessToken) {
    const outcome = await refreshSessionOnce();
    if (outcome === "refreshed") {
      response = await send();
    } else if (outcome === "refused") {
      await clearSession();
      store.dispatch(clearAuth());
      throw new Error("Session expired. Please login again.");
    } else {
      // Offline or a server error: the session may be perfectly good.
      throw new Error(
        "Could not reach the server. Check your connection and try again.",
      );
    }
  }

  return response;
};

/** Kept for existing callers; prefer `authFetch`. */
export const apiCall = authFetch;

export class JobTimeoutError extends Error {
  constructor() {
    super(
      "This is taking longer than expected. Please try again in a few minutes.",
    );
    this.name = "JobTimeoutError";
  }
}

const wait = (ms: number, signal?: AbortSignal): Promise<void> =>
  new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error("Cancelled"));
      return;
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(new Error("Cancelled"));
    };
    signal?.addEventListener("abort", onAbort, { once: true });
  });

/**
 * Poll for job completion with schema validation.
 *
 * Bounded: gives up after JOB_POLLING.maxDurationMs, stops at once when
 * `signal` aborts, and reports a failed job as an error instead of treating
 * it as an unknown shape.
 */
export const pollJobStatus = async (
  messageId: string,
  signal?: AbortSignal,
): Promise<JobCompletedResponse> => {
  const deadline = Date.now() + JOB_POLLING.maxDurationMs;
  let delay: number = JOB_POLLING.initialDelayMs;

  while (true) {
    const response = await authFetch(
      API_ROUTES.job(messageId),
      { method: "GET" },
      { signal },
    );

    const data = await readJson(response);
    if (!response.ok) {
      throw new Error(
        parseApiError(
          Object.keys(data as object).length
            ? data
            : { message: "Failed to check job status" },
        ),
      );
    }

    if (JobPendingResponseSchema.safeParse(data).success) {
      if (Date.now() + delay > deadline) throw new JobTimeoutError();
      await wait(delay, signal);
      delay = Math.min(
        Math.round(delay * JOB_POLLING.backoffFactor),
        JOB_POLLING.maxDelayMs,
      );
      continue;
    }

    const failed = JobFailedResponseSchema.safeParse(data);
    if (failed.success) {
      throw new Error(
        failed.data.error || "The job could not be completed. Please try again.",
      );
    }

    const completedResult = JobCompletedResponseSchema.safeParse(data);
    if (completedResult.success) {
      return completedResult.data;
    }

    // Unexpected response format
    throw new Error("Unexpected response format from job status API");
  }
};

const submitJob = async (
  path: string,
  formData: FormData,
  fallbackMessage: string,
  context: string,
  signal?: AbortSignal,
): Promise<JobCompletedResponse> => {
  const response = await authFetch(
    path,
    { method: "POST", body: formData },
    { timeoutMs: UPLOAD_TIMEOUT_MS, signal },
  );

  const data = await readJson(response);
  if (!response.ok) {
    throw new ApiRequestError(
      parseApiError(
        Object.keys(data as object).length ? data : { message: fallbackMessage },
      ),
      response,
    );
  }

  const queuedData = validateResponse(QueuedJobResponseSchema, data, context);
  return pollJobStatus(queuedData.message_id, signal);
};

/**
 * Extract text from image
 */
export const extractTextFromImage = async (
  imageUri: string,
  signal?: AbortSignal,
): Promise<string> => {
  const formData = new FormData();
  const filename = imageUri.split("/").pop() || "photo.jpg";
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : "image/jpeg";

  formData.append("image", {
    uri: imageUri,
    name: filename,
    type: type,
  } as any);

  const result = await submitJob(
    API_ROUTES.imageToText,
    formData,
    "Text extraction failed",
    "image extraction",
    signal,
  );
  return result.content;
};

/**
 * Extract text from PDF or ask follow-up question
 */
export interface ExtractPdfParams {
  pdfUri?: string;
  pdfName?: string;
  requestId?: string;
  query: string;
  model: string;
}

export interface PdfExtractionResult {
  content: string;
  description: string;
  requestId: string;
}

export const extractTextFromPdf = async (
  params: ExtractPdfParams,
  signal?: AbortSignal,
): Promise<PdfExtractionResult> => {
  const formData = new FormData();

  if (params.requestId) {
    // Follow-up question
    formData.append("past_request_id", params.requestId);
  } else if (params.pdfUri && params.pdfName) {
    // New PDF extraction
    formData.append("pdf", {
      uri: params.pdfUri,
      name: params.pdfName,
      type: "application/pdf",
    } as any);
  } else {
    throw new Error("Either pdfUri/pdfName or requestId is required");
  }

  formData.append("query", params.query);
  formData.append("model", params.model);

  const result = await submitJob(
    API_ROUTES.pdfResponse,
    formData,
    "PDF extraction failed",
    "PDF extraction",
    signal,
  );
  if (!result.request_id) {
    throw new Error("Unexpected response format from job status API");
  }

  return {
    content: result.content,
    description: result.description ?? "",
    requestId: result.request_id,
  };
};

/**
 * Transcribe audio to text
 */
const AUDIO_MIME_TYPES: Record<string, string> = {
  m4a: "audio/mp4",
  mp4: "audio/mp4",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  webm: "audio/webm",
  ogg: "audio/ogg",
  aac: "audio/aac",
  "3gp": "audio/3gpp",
  flac: "audio/flac",
};

export const transcribeAudio = async (
  audioUri: string,
  signal?: AbortSignal,
): Promise<string> => {
  const formData = new FormData();
  const filename = audioUri.split("/").pop() || "audio.m4a";
  const match = /\.(\w+)$/.exec(filename);
  const extension = match ? match[1].toLowerCase() : "m4a";
  const type = AUDIO_MIME_TYPES[extension] || "audio/mp4";

  formData.append("file", {
    uri: audioUri,
    name: filename,
    type: type,
  } as any);

  const result = await submitJob(
    API_ROUTES.soundToText,
    formData,
    "Audio transcription failed",
    "audio transcription",
    signal,
  );
  return result.content;
};

/**
 * The signed-in account: which models the server offers and this month's usage.
 */
export const fetchAccount = async (signal?: AbortSignal): Promise<Account> => {
  const response = await authFetch(API_ROUTES.me, { method: "GET" }, { signal });
  const data = await readJson(response);
  if (!response.ok) {
    throw new Error(parseApiError(data));
  }
  return validateResponse(AccountSchema, data, "account");
};

export type StorePlatform = "ios" | "android";

const postForAccount = async (path: string, body: unknown): Promise<Account> => {
  const response = await authFetch(path, {
    method: "POST",
    body: JSON.stringify(body),
  });
  const data = await readJson(response);
  if (!response.ok) {
    throw new ApiRequestError(parseApiError(data), response);
  }
  return validateResponse(AccountSchema, data, "account");
};

/** Send one store receipt for the server to verify; returns the new plan. */
export const verifyPurchase = (
  platform: StorePlatform,
  receipt: string,
): Promise<Account> =>
  postForAccount(API_ROUTES.billingVerify, { platform, receipt });

/** Restore Purchases: re-verify the store's active subscriptions. */
export const recoverPurchases = (
  platform: StorePlatform,
  receipts: string[],
): Promise<Account> =>
  postForAccount(API_ROUTES.billingRecover, { platform, receipts });

export { ApiRequestError };

// Re-export types for consumers
export type { Account, JobCompletedResponse };
