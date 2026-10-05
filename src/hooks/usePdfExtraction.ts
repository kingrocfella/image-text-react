import {
  extractTextFromPdf,
  ExtractPdfParams,
  PdfExtractionResult,
} from "../api/client";
import { useCancellableJob } from "./useCancellableJob";

export const usePdfExtraction = () =>
  useCancellableJob<PdfExtractionResult, ExtractPdfParams>(extractTextFromPdf);
