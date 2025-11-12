export interface ExtractPdfTextResponse {
  content: string;
}

export interface PdfState {
  extractedText: string | null;
  extracting: boolean;
  error: string | null;
}

export type PdfActionTypes =
  | { type: 'EXTRACT_PDF_TEXT_REQUEST' }
  | { type: 'EXTRACT_PDF_TEXT_SUCCESS'; payload: string }
  | { type: 'EXTRACT_PDF_TEXT_FAILURE'; payload: string }
  | { type: 'CLEAR_EXTRACTED_PDF_TEXT' };

