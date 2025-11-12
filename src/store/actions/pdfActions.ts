import { ThunkAction } from "redux-thunk";
import { RootState } from "../index";
import { PdfActionTypes, ExtractPdfTextResponse } from "../types/pdfTypes";
import { API_CONFIG } from "../../../config";

// Action Creators
export const extractPdfTextRequest = (): PdfActionTypes => ({
  type: "EXTRACT_PDF_TEXT_REQUEST",
});
export const extractPdfTextSuccess = (text: string): PdfActionTypes => ({
  type: "EXTRACT_PDF_TEXT_SUCCESS",
  payload: text,
});
export const extractPdfTextFailure = (error: string): PdfActionTypes => ({
  type: "EXTRACT_PDF_TEXT_FAILURE",
  payload: error,
});
export const clearExtractedPdfText = (): PdfActionTypes => ({
  type: "CLEAR_EXTRACTED_PDF_TEXT",
});

// Thunk Action
export const extractPdfText = (
  pdfUri: string,
  pdfName: string,
  query: string,
  accessToken: string | null,
  tokenType: string | null
): ThunkAction<Promise<void>, RootState, unknown, PdfActionTypes> => {
  return async (dispatch) => {
    dispatch(extractPdfTextRequest());

    try {
      const formData = new FormData();

      formData.append("pdf", {
        uri: pdfUri,
        name: pdfName,
        type: "application/pdf",
      } as any);

      formData.append("query", query);

      const headers: Record<string, string> = {};

      if (accessToken && tokenType) {
        headers["Authorization"] = `${tokenType} ${accessToken}`;
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}/pdf/get/response`, {
        method: "POST",
        body: formData,
        headers: Object.keys(headers).length > 0 ? headers : undefined,
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: "PDF text extraction failed" }));
        throw new Error(
          errorData.message || errorData.detail || "PDF text extraction failed"
        );
      }

      const data: ExtractPdfTextResponse = await response.json();

      const extractedText: string = data?.content;

      dispatch(extractPdfTextSuccess(extractedText));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";
      dispatch(extractPdfTextFailure(errorMessage));
      throw error;
    }
  };
};
