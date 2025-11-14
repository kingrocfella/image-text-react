import { PdfActionTypes, PdfState } from '../types/pdfTypes';

const initialState: PdfState = {
  extractedText: null,
  description: null,
  requestId: null,
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
        extractedText: action.payload.content,
        description: action.payload.description,
        requestId: action.payload.requestId,
        extracting: false,
        error: null,
      };
    case 'EXTRACT_PDF_TEXT_FAILURE':
      return {
        ...state,
        extracting: false,
        error: action.payload,
        extractedText: null,
        description: null,
        requestId: null,
      };
    case 'ASK_PDF_QUESTION_REQUEST':
      return {
        ...state,
        extracting: true,
        error: null,
      };
    case 'ASK_PDF_QUESTION_SUCCESS':
      return {
        ...state,
        extractedText: action.payload.content,
        description: action.payload.description,
        requestId: action.payload.requestId,
        extracting: false,
        error: null,
      };
    case 'ASK_PDF_QUESTION_FAILURE':
      return {
        ...state,
        extracting: false,
        error: action.payload,
      };
    case 'CLEAR_EXTRACTED_PDF_TEXT':
      return {
        ...state,
        extractedText: null,
        description: null,
        requestId: null,
        error: null,
      };
    default:
      return state;
  }
};

export default pdfReducer;

