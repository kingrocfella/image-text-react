import { ThunkAction } from "redux-thunk";
import { RootState } from "../index";
import { AudioActionTypes, QueuedAudioJobResponse } from "../types/audioTypes";
import { API_CONFIG } from "../../../config";
import { apiCallWithRefresh } from "../../utils/apiClient";
import { pollJobStatus } from "./helpers/pollJobStatus";

// Action Creators
export const transcribeAudioRequest = (): AudioActionTypes => ({
  type: "TRANSCRIBE_AUDIO_REQUEST",
});
export const transcribeAudioSuccess = (text: string): AudioActionTypes => ({
  type: "TRANSCRIBE_AUDIO_SUCCESS",
  payload: text,
});
export const transcribeAudioFailure = (error: string): AudioActionTypes => ({
  type: "TRANSCRIBE_AUDIO_FAILURE",
  payload: error,
});
export const clearTranscribedText = (): AudioActionTypes => ({
  type: "CLEAR_TRANSCRIBED_TEXT",
});

// Thunk Action
export const transcribeAudio = (
  audioUri: string,
  accessToken: string | null,
  tokenType: string | null
): ThunkAction<Promise<void>, RootState, unknown, AudioActionTypes> => {
  return async (dispatch, getState) => {
    dispatch(transcribeAudioRequest());

    try {
      const formData = new FormData();
      const filename = audioUri.split("/").pop() || "audio.m4a";
      const match = /\.(\w+)$/.exec(filename);
      const extension = match ? match[1].toLowerCase() : "m4a";

      const mimeTypes: Record<string, string> = {
        m4a: "audio/mp4",
        mp4: "audio/mp4",
        mp3: "audio/mpeg",
        wav: "audio/wav",
        webm: "audio/webm",
        ogg: "audio/ogg",
        aac: "audio/aac",
        "3gp": "audio/3gpp",
        flac: "audio/flac",
      };

      const type = mimeTypes[extension] || "audio/mp4";
      formData.append("file", {
        uri: audioUri,
        name: filename,
        type: type,
      } as any);

      const response = await apiCallWithRefresh(
        `${API_CONFIG.BASE_URL}/convert/sound/text`,
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
          .catch(() => ({ message: "Audio transcription failed" }));

        throw new Error(
          errorData.message || errorData.detail || "Audio transcription failed"
        );
      }

      const queuedData: QueuedAudioJobResponse = await response.json();

      // Poll for job completion
      const data = await pollJobStatus(
        queuedData.message_id,
        dispatch,
        getState,
        accessToken,
        tokenType
      );

      dispatch(transcribeAudioSuccess(data.content));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";
      dispatch(transcribeAudioFailure(errorMessage));
      throw error;
    }
  };
};
