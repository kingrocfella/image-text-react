import { AudioActionTypes, AudioState } from '../types/audioTypes';

const initialState: AudioState = {
  transcribedText: null,
  transcribing: false,
  error: null,
};

const audioReducer = (state = initialState, action: AudioActionTypes): AudioState => {
  switch (action.type) {
    case 'TRANSCRIBE_AUDIO_REQUEST':
      return {
        ...state,
        transcribing: true,
        error: null,
      };
    case 'TRANSCRIBE_AUDIO_SUCCESS':
      return {
        ...state,
        transcribedText: action.payload,
        transcribing: false,
        error: null,
      };
    case 'TRANSCRIBE_AUDIO_FAILURE':
      return {
        ...state,
        transcribing: false,
        error: action.payload,
        transcribedText: null,
      };
    case 'CLEAR_TRANSCRIBED_TEXT':
      return {
        ...state,
        transcribedText: null,
        error: null,
      };
    default:
      return state;
  }
};

export default audioReducer;
