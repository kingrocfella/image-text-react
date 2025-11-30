import { ThunkAction } from "redux-thunk";
import { RootState } from "../index";
import { PdfActionTypes, QueuedJobResponse } from "../types/pdfTypes";
import { API_CONFIG } from "../../../config";
import { apiCallWithRefresh } from "../../utils/apiClient";
import { pollJobStatus } from "./helpers/pollJobStatus";

// Action Creators
export const extractPdfTextRequest = (): PdfActionTypes => ({
  type: "EXTRACT_PDF_TEXT_REQUEST",
});
export const extractPdfTextSuccess = (
  content: string,
  description: string,
  requestId: string
): PdfActionTypes => ({
  type: "EXTRACT_PDF_TEXT_SUCCESS",
  payload: { content, description, requestId },
});
export const extractPdfTextFailure = (error: string): PdfActionTypes => ({
  type: "EXTRACT_PDF_TEXT_FAILURE",
  payload: error,
});
export const clearExtractedPdfText = (): PdfActionTypes => ({
  type: "CLEAR_EXTRACTED_PDF_TEXT",
});

// Action Creators for asking follow-up questions
export const askPdfQuestionRequest = (): PdfActionTypes => ({
  type: "ASK_PDF_QUESTION_REQUEST",
});
export const askPdfQuestionSuccess = (
  content: string,
  description: string,
  requestId: string
): PdfActionTypes => ({
  type: "ASK_PDF_QUESTION_SUCCESS",
  payload: { content, description, requestId },
});
export const askPdfQuestionFailure = (error: string): PdfActionTypes => ({
  type: "ASK_PDF_QUESTION_FAILURE",
  payload: error,
});

// Thunk Action
export const extractPdfText = (
  pdfUri: string,
  pdfName: string,
  query: string,
  model: string,
  openaiPass: string | undefined,
  accessToken: string | null,
  tokenType: string | null
): ThunkAction<Promise<void>, RootState, unknown, PdfActionTypes> => {
  return async (dispatch, getState) => {
    dispatch(extractPdfTextRequest());

    try {
      const formData = new FormData();

      formData.append("pdf", {
        uri: pdfUri,
        name: pdfName,
        type: "application/pdf",
      } as any);

      formData.append("query", query);
      formData.append("model", model);

      if (model === "openai" && openaiPass) {
        formData.append("openai_pass", openaiPass);
      }

      const response = await apiCallWithRefresh(
        `${API_CONFIG.BASE_URL}/pdf/get/response`,
        {
          method: "POST",
          body: formData,
        },
        dispatch,
        getState,
        accessToken,
        tokenType
      );

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: "PDF text extraction failed" }));
        throw new Error(
          errorData.message || errorData.detail || "PDF text extraction failed"
        );
      }

      const queuedData: QueuedJobResponse = await response.json();

      // Poll for job completion
      const data = await pollJobStatus(
        queuedData.message_id,
        dispatch,
        getState,
        accessToken,
        tokenType
      );

      dispatch(
        extractPdfTextSuccess(data.content, data.description, data.request_id)
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";
      dispatch(extractPdfTextFailure(errorMessage));
      throw error;
    }
  };
};

// Thunk Action for asking follow-up questions using request_id
export const askPdfQuestion = (
  requestId: string,
  query: string,
  model: string,
  openaiPass: string | undefined,
  accessToken: string | null,
  tokenType: string | null
): ThunkAction<Promise<void>, RootState, unknown, PdfActionTypes> => {
  return async (dispatch, getState) => {
    dispatch(askPdfQuestionRequest());

    try {
      const formData = new FormData();
      formData.append("past_request_id", requestId);
      formData.append("query", query);
      formData.append("model", model);

      if (model === "openai" && openaiPass) {
        formData.append("openai_pass", openaiPass);
      }

      const response = await apiCallWithRefresh(
        `${API_CONFIG.BASE_URL}/pdf/get/response`,
        {
          method: "POST",
          body: formData,
        },
        dispatch,
        getState,
        accessToken,
        tokenType
      );

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: "PDF question failed" }));
        throw new Error(
          errorData.message || errorData.detail || "PDF question failed"
        );
      }

      const queuedData: QueuedJobResponse = await response.json();

      // Poll for job completion
      const data = await pollJobStatus(
        queuedData.message_id,
        dispatch,
        getState,
        accessToken,
        tokenType
      );

      dispatch(
        askPdfQuestionSuccess(data.content, data.description, data.request_id)
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";
      dispatch(askPdfQuestionFailure(errorMessage));
      throw error;
    }
  };
};
