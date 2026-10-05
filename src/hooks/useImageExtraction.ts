import { extractTextFromImage } from "../api/client";
import { useCancellableJob } from "./useCancellableJob";

export const useImageExtraction = () =>
  useCancellableJob<string, string>(extractTextFromImage);
