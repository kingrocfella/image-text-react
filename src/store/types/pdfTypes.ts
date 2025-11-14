export interface ExtractPdfTextResponse {
  content: string;
  description: string;
  request_id: string;
}

export interface PdfState {
  extractedText: string | null;
  description: string | null;
  requestId: string | null;
  extracting: boolean;
  error: string | null;
}

export type PdfActionTypes =
  | { type: 'EXTRACT_PDF_TEXT_REQUEST' }
  | { type: 'EXTRACT_PDF_TEXT_SUCCESS'; payload: { content: string; description: string; requestId: string } }
  | { type: 'EXTRACT_PDF_TEXT_FAILURE'; payload: string }
  | { type: 'CLEAR_EXTRACTED_PDF_TEXT' }
  | { type: 'ASK_PDF_QUESTION_REQUEST' }
  | { type: 'ASK_PDF_QUESTION_SUCCESS'; payload: { content: string; description: string; requestId: string } }
  | { type: 'ASK_PDF_QUESTION_FAILURE'; payload: string };

