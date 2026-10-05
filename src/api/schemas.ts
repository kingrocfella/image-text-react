import { z } from "zod";

// ============================================
// Error Schemas
// ============================================

export const ApiErrorSchema = z.object({
  message: z.string().optional(),
  // A string for most errors; FastAPI sends a list of issues for a 422.
  detail: z
    .union([z.string(), z.array(z.object({ msg: z.string() }).passthrough())])
    .optional(),
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

/** The job ran and failed, or its state could not be read. */
export const JobFailedResponseSchema = z.object({
  status: z.enum(["failed", "unknown"]),
  error: z.string().optional(),
});

/**
 * A finished job. Every kind returns `content`; only a PDF answer carries a
 * `request_id` (for follow-up questions), and the server sends `description`
 * as null when it has none. Image and audio results carry `filename` instead.
 */
export const JobCompletedResponseSchema = z.object({
  content: z.string(),
  description: z.string().nullish(),
  request_id: z.string().nullish(),
});

export type JobCompletedResponse = z.infer<typeof JobCompletedResponseSchema>;

// Job status can be pending, failed or completed
export const JobStatusResponseSchema = z.union([
  JobPendingResponseSchema,
  JobFailedResponseSchema,
  JobCompletedResponseSchema,
]);

export type JobStatusResponse = z.infer<typeof JobStatusResponseSchema>;

// ============================================
// Account Schemas
// ============================================

export const QuotaUsageSchema = z.object({
  used: z.number(),
  limit: z.number(),
});

/**
 * GET /v1/me. The server decides every field: the plan, which models this
 * account may use, which need Pro, and what is left of each allowance.
 */
export const AccountSchema = z.object({
  user_id: z.string(),
  name: z.string(),
  email: z.string(),
  login_methods: z.array(z.string()).default([]),
  pro: z.boolean().default(false),
  pro_source: z.string().nullish(),
  pro_product_id: z.string().nullish(),
  pro_expires_at: z.string().nullish(),
  purchases_available: z.boolean().default(false),
  models: z.array(z.string()),
  pro_models: z.array(z.string()).default([]),
  usage: z.record(z.string(), QuotaUsageSchema),
  pro_limits: z.record(z.string(), z.number()).default({}),
});

export type Account = z.infer<typeof AccountSchema>;

export const MessageResponseSchema = z.object({
  message: z.string(),
});

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
    const errors =
      result.error?.issues
        ?.map((e) => `${e.path.join(".")}: ${e.message}`)
        .join(", ") || "Validation failed";
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
    const { detail, message } = result.data;
    if (Array.isArray(detail)) {
      return detail[0]?.msg || message || "An error occurred";
    }
    return detail || message || "An error occurred";
  }
  return "An error occurred";
}
