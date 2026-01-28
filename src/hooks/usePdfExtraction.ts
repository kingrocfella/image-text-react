import { useMutation } from "@tanstack/react-query";
import { extractTextFromPdf, ExtractPdfParams, PdfExtractionResult } from "../api/client";

export const usePdfExtraction = () => {
  return useMutation<PdfExtractionResult, Error, ExtractPdfParams>({
    mutationFn: extractTextFromPdf,
  });
};
