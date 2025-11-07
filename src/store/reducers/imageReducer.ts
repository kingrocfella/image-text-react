import { ImageActionTypes, ImageState } from '../types/imageTypes';

const initialState: ImageState = {
  extractedText: null,
  extracting: false,
  error: null,
};

const imageReducer = (state = initialState, action: ImageActionTypes): ImageState => {
  switch (action.type) {
    case 'EXTRACT_TEXT_REQUEST':
      return {
        ...state,
        extracting: true,
        error: null,
      };
    case 'EXTRACT_TEXT_SUCCESS':
      return {
        ...state,
        extractedText: action.payload,
        extracting: false,
        error: null,
      };
    case 'EXTRACT_TEXT_FAILURE':
      return {
        ...state,
        extracting: false,
        error: action.payload,
        extractedText: null,
      };
    case 'CLEAR_EXTRACTED_TEXT':
      return {
        ...state,
        extractedText: null,
        error: null,
      };
    default:
      return state;
  }
};

export default imageReducer;

