import { UPLOAD_LIMITS } from "../constants";

const megabytes = (bytes: number): string =>
  `${Math.round(bytes / (1024 * 1024))} MB`;

/**
 * A message when the file is larger than the server accepts, else null.
 * A picker that cannot report a size returns null too: the server enforces
 * the limit either way, this only saves a doomed upload.
 */
export function tooLargeMessage(
  kind: keyof typeof UPLOAD_LIMITS,
  bytes: number | null | undefined,
): string | null {
  if (typeof bytes !== "number" || bytes <= UPLOAD_LIMITS[kind]) return null;
  return `That file is ${megabytes(bytes)}. The largest we can accept is ${megabytes(UPLOAD_LIMITS[kind])}.`;
}
