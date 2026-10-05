import { useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";

/**
 * A mutation for an upload-then-poll job.
 *
 * - Leaving the screen aborts the upload and stops the polling, instead of
 *   leaving a loop running against a screen that no longer exists.
 * - Starting another job cancels the previous one.
 * - Never retried automatically: a retry would upload the file again and
 *   spend a second unit of the user's monthly allowance.
 */
export function useCancellableJob<TResult, TInput>(
  run: (input: TInput, signal: AbortSignal) => Promise<TResult>,
) {
  const controller = useRef<AbortController | null>(null);

  useEffect(() => () => controller.current?.abort(), []);

  return useMutation<TResult, Error, TInput>({
    retry: false,
    mutationFn: (input) => {
      controller.current?.abort();
      controller.current = new AbortController();
      return run(input, controller.current.signal);
    },
  });
}
