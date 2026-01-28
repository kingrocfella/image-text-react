import { API_CONFIG } from "../../config";
import { store } from "../store";
import { refreshToken, clearAuth } from "../store/slices/authSlice";
import {
  QueuedJobResponseSchema,
  JobPendingResponseSchema,
  JobCompletedResponseSchema,
  validateResponse,
  parseApiError,
  type JobCompletedResponse,
} from "./schemas";

const POLLING_INTERVAL = 10000; // 10 seconds

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

/**
 * Make an authenticated API call with automatic token refresh
 */
export const apiCall = async (
  url: string,
  options: RequestInit = {},
): Promise<Response> => {
  let { accessToken, tokenType } = getAuthTokens();

  const makeRequest = async (token: string | null, type: string | null) => {
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    if (token && type) {
      headers["Authorization"] = `${type} ${token}`;
    }

    return fetch(url, {
      ...options,
      headers: Object.keys(headers).length > 0 ? headers : undefined,
    });
  };

  let response = await makeRequest(accessToken, tokenType);

  // If 401, try to refresh token
  if (response.status === 401) {
    const result = await store.dispatch(refreshToken());

    if (refreshToken.fulfilled.match(result)) {
      // Get new tokens and retry
      const newTokens = getAuthTokens();
      response = await makeRequest(newTokens.accessToken, newTokens.tokenType);
    } else {
      // Refresh failed, clear auth
      store.dispatch(clearAuth());
      throw new Error("Session expired. Please login again.");
    }
  }

  return response;
};

/**
 * Poll for job completion with schema validation
 */
export const pollJobStatus = async (
  messageId: string,
): Promise<JobCompletedResponse> => {
  while (true) {
    const response = await apiCall(`${API_CONFIG.BASE_URL}/job/${messageId}`, {
      method: "GET",
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ message: "Failed to check job status" }));
      throw new Error(parseApiError(errorData));
    }

    const data = await response.json();

    // Check if job is still pending
    const pendingResult = JobPendingResponseSchema.safeParse(data);
    if (pendingResult.success) {
      await new Promise((resolve) => setTimeout(resolve, POLLING_INTERVAL));
      continue;
    }

    // Check if job is completed
    const completedResult = JobCompletedResponseSchema.safeParse(data);
    if (completedResult.success) {
      return completedResult.data;
    }

    // Unexpected response format
    throw new Error("Unexpected response format from job status API");
  }
};

/**
 * Extract text from image
 */
export const extractTextFromImage = async (
  imageUri: string,
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

  const response = await apiCall(`${API_CONFIG.BASE_URL}/convert/image/text`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ message: "Text extraction failed" }));
    throw new Error(parseApiError(errorData));
  }

  const data = await response.json();
  const queuedData = validateResponse(
    QueuedJobResponseSchema,
    data,
    "image extraction",
  );
  const result = await pollJobStatus(queuedData.message_id);
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
  openaiPass?: string;
}

export interface PdfExtractionResult {
  content: string;
  description: string;
  requestId: string;
}

export const extractTextFromPdf = async (
  params: ExtractPdfParams,
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

  if (params.model === "openai" && params.openaiPass) {
    formData.append("openai_pass", params.openaiPass);
  }

  const response = await apiCall(`${API_CONFIG.BASE_URL}/pdf/get/response`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ message: "PDF extraction failed" }));
    throw new Error(parseApiError(errorData));
  }

  const data = await response.json();
  const queuedData = validateResponse(
    QueuedJobResponseSchema,
    data,
    "PDF extraction",
  );
  const result = await pollJobStatus(queuedData.message_id);

  return {
    content: result.content,
    description: result.description,
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

export const transcribeAudio = async (audioUri: string): Promise<string> => {
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

  const response = await apiCall(`${API_CONFIG.BASE_URL}/convert/sound/text`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ message: "Audio transcription failed" }));
    throw new Error(parseApiError(errorData));
  }

  const data = await response.json();
  const queuedData = validateResponse(
    QueuedJobResponseSchema,
    data,
    "audio transcription",
  );
  const result = await pollJobStatus(queuedData.message_id);
  return result.content;
};

// Re-export types for consumers
export type { JobCompletedResponse };
