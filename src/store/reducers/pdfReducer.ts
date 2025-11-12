import { PdfActionTypes, PdfState } from '../types/pdfTypes';

const initialState: PdfState = {
  extractedText: null,
  extracting: false,
  error: null,
};

const pdfReducer = (state = initialState, action: PdfActionTypes): PdfState => {
  switch (action.type) {
    case 'EXTRACT_PDF_TEXT_REQUEST':
      return {
        ...state,
        extracting: true,
        error: null,
      };
    case 'EXTRACT_PDF_TEXT_SUCCESS':
      return {
        ...state,
        extractedText: action.payload,
        extracting: false,
        error: null,
      };
    case 'EXTRACT_PDF_TEXT_FAILURE':
      return {
        ...state,
        extracting: false,
        error: action.payload,
        extractedText: null,
      };
    case 'CLEAR_EXTRACTED_PDF_TEXT':
      return {
        ...state,
        extractedText: null,
        error: null,
      };
    default:
      return state;
  }
};

export default pdfReducer;

