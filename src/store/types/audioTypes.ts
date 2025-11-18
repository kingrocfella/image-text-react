export interface TranscribeAudioResponse {
  content: string;
  description: string;
  request_id: string;
}

export interface AudioState {
  transcribedText: string | null;
  transcribing: boolean;
  error: string | null;
}

export type AudioActionTypes =
  | { type: 'TRANSCRIBE_AUDIO_REQUEST' }
  | { type: 'TRANSCRIBE_AUDIO_SUCCESS'; payload: string }
  | { type: 'TRANSCRIBE_AUDIO_FAILURE'; payload: string }
  | { type: 'CLEAR_TRANSCRIBED_TEXT' };
