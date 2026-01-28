import { useMutation } from "@tanstack/react-query";
import { extractTextFromImage } from "../api/client";

export const useImageExtraction = () => {
  return useMutation({
    mutationFn: extractTextFromImage,
  });
};
