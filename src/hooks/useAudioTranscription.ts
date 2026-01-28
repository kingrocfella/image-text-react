import { useMutation } from "@tanstack/react-query";
import { transcribeAudio } from "../api/client";

export const useAudioTranscription = () => {
  return useMutation({
    mutationFn: transcribeAudio,
  });
};
