import { transcribeAudio } from "../api/client";
import { useCancellableJob } from "./useCancellableJob";

export const useAudioTranscription = () =>
  useCancellableJob<string, string>(transcribeAudio);
