export interface ExtractTextResponse {
  message: string;
  description: string;
}

export interface ImageState {
  extractedText: string | null;
  extracting: boolean;
  error: string | null;
}

export type ImageActionTypes =
  | { type: 'EXTRACT_TEXT_REQUEST' }
  | { type: 'EXTRACT_TEXT_SUCCESS'; payload: string }
  | { type: 'EXTRACT_TEXT_FAILURE'; payload: string }
  | { type: 'CLEAR_EXTRACTED_TEXT' };

