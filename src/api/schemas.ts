import { z } from "zod";

// ============================================
// Error Schemas
// ============================================

export const ApiErrorSchema = z.object({
  message: z.string().optional(),
  detail: z.string().optional(),
});

export type ApiError = z.infer<typeof ApiErrorSchema>;

// ============================================
// Auth Schemas
// ============================================

export const LoginResponseSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  token_type: z.string(),
  name: z.string(),
  user_id: z.string(),
});

export type LoginResponse = z.infer<typeof LoginResponseSchema>;

export const RegisterResponseSchema = z.object({
  message: z.string(),
});

export type RegisterResponse = z.infer<typeof RegisterResponseSchema>;

export const RefreshTokenResponseSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  token_type: z.string(),
});

export type RefreshTokenResponse = z.infer<typeof RefreshTokenResponseSchema>;

// ============================================
// Job Queue Schemas
// ============================================

export const QueuedJobResponseSchema = z.object({
  message: z.string(),
  message_id: z.string(),
  status: z.enum(["queued", "pending"]),
});

export type QueuedJobResponse = z.infer<typeof QueuedJobResponseSchema>;

export const JobPendingResponseSchema = z.object({
  status: z.literal("pending"),
});

export const JobCompletedResponseSchema = z.object({
  content: z.string(),
  description: z.string(),
  request_id: z.string(),
});

export type JobCompletedResponse = z.infer<typeof JobCompletedResponseSchema>;

// Job status can be either pending or completed
export const JobStatusResponseSchema = z.union([
  JobPendingResponseSchema,
  JobCompletedResponseSchema,
]);

export type JobStatusResponse = z.infer<typeof JobStatusResponseSchema>;

// ============================================
// Validation Helper
// ============================================

/**
 * Safely parse and validate API response data
 * Returns the parsed data or throws a descriptive error
 */
export function validateResponse<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  context: string,
): T {
  const result = schema.safeParse(data);

  if (!result.success) {
    const errors = result.error.errors
      .map((e) => `${e.path.join(".")}: ${e.message}`)
      .join(", ");
    throw new Error(`Invalid ${context} response: ${errors}`);
  }

  return result.data;
}

/**
 * Parse error response from API
 */
export function parseApiError(data: unknown): string {
  const result = ApiErrorSchema.safeParse(data);
  if (result.success) {
    return result.data.detail || result.data.message || "An error occurred";
  }
  return "An error occurred";
}
