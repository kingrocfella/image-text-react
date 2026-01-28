import {
  ApiErrorSchema,
  LoginResponseSchema,
  RegisterResponseSchema,
  RefreshTokenResponseSchema,
  QueuedJobResponseSchema,
  JobPendingResponseSchema,
  JobCompletedResponseSchema,
  JobStatusResponseSchema,
  validateResponse,
  parseApiError,
} from "../schemas";

describe("API Schemas", () => {
  describe("ApiErrorSchema", () => {
    it("validates error with message", () => {
      const data = { message: "Something went wrong" };
      const result = ApiErrorSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.message).toBe("Something went wrong");
      }
    });

    it("validates error with detail", () => {
      const data = { detail: "Invalid credentials" };
      const result = ApiErrorSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.detail).toBe("Invalid credentials");
      }
    });

    it("validates error with both message and detail", () => {
      const data = { message: "Error", detail: "Details here" };
      const result = ApiErrorSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("validates empty object", () => {
      const result = ApiErrorSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });

  describe("LoginResponseSchema", () => {
    it("validates valid login response", () => {
      const data = {
        access_token: "abc123",
        refresh_token: "def456",
        token_type: "Bearer",
        name: "John Doe",
        user_id: "user-123",
      };
      const result = LoginResponseSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.access_token).toBe("abc123");
        expect(result.data.name).toBe("John Doe");
      }
    });

    it("rejects login response with missing fields", () => {
      const data = {
        access_token: "abc123",
        // missing other required fields
      };
      const result = LoginResponseSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("rejects login response with wrong types", () => {
      const data = {
        access_token: 123, // should be string
        refresh_token: "def456",
        token_type: "Bearer",
        name: "John Doe",
        user_id: "user-123",
      };
      const result = LoginResponseSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe("RegisterResponseSchema", () => {
    it("validates valid register response", () => {
      const data = { message: "Registration successful" };
      const result = RegisterResponseSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.message).toBe("Registration successful");
      }
    });

    it("rejects register response without message", () => {
      const result = RegisterResponseSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("RefreshTokenResponseSchema", () => {
    it("validates valid refresh token response", () => {
      const data = {
        access_token: "new-access",
        refresh_token: "new-refresh",
        token_type: "Bearer",
      };
      const result = RefreshTokenResponseSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("rejects refresh token response with missing fields", () => {
      const data = {
        access_token: "new-access",
        // missing refresh_token and token_type
      };
      const result = RefreshTokenResponseSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe("QueuedJobResponseSchema", () => {
    it("validates queued job response", () => {
      const data = {
        message: "Job queued",
        message_id: "job-123",
        status: "queued",
      };
      const result = QueuedJobResponseSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("validates pending job response", () => {
      const data = {
        message: "Job pending",
        message_id: "job-456",
        status: "pending",
      };
      const result = QueuedJobResponseSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("rejects invalid status", () => {
      const data = {
        message: "Job",
        message_id: "job-789",
        status: "completed", // not in enum
      };
      const result = QueuedJobResponseSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe("JobPendingResponseSchema", () => {
    it("validates pending status", () => {
      const data = { status: "pending" };
      const result = JobPendingResponseSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("rejects non-pending status", () => {
      const data = { status: "queued" };
      const result = JobPendingResponseSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe("JobCompletedResponseSchema", () => {
    it("validates completed job response", () => {
      const data = {
        content: "Extracted text content",
        description: "A document about testing",
        request_id: "req-123",
      };
      const result = JobCompletedResponseSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.content).toBe("Extracted text content");
      }
    });

    it("rejects completed response with missing fields", () => {
      const data = {
        content: "Some content",
        // missing description and request_id
      };
      const result = JobCompletedResponseSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe("JobStatusResponseSchema", () => {
    it("validates pending job status", () => {
      const data = { status: "pending" };
      const result = JobStatusResponseSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("validates completed job status", () => {
      const data = {
        content: "Text",
        description: "Desc",
        request_id: "id",
      };
      const result = JobStatusResponseSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("rejects invalid job status", () => {
      const data = { invalid: "data" };
      const result = JobStatusResponseSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });
});

describe("validateResponse", () => {
  it("returns parsed data for valid input", () => {
    const schema = LoginResponseSchema;
    const data = {
      access_token: "token",
      refresh_token: "refresh",
      token_type: "Bearer",
      name: "Test User",
      user_id: "123",
    };
    const result = validateResponse(schema, data, "login");
    expect(result.access_token).toBe("token");
    expect(result.name).toBe("Test User");
  });

  it("throws error with context for invalid input", () => {
    const schema = LoginResponseSchema;
    const invalidData = { access_token: "token" };
    expect(() => validateResponse(schema, invalidData, "login")).toThrow(
      /Invalid login response/,
    );
  });

  it("includes field path in error message", () => {
    const schema = LoginResponseSchema;
    const invalidData = {
      access_token: 123, // wrong type
      refresh_token: "refresh",
      token_type: "Bearer",
      name: "Test",
      user_id: "123",
    };
    expect(() => validateResponse(schema, invalidData, "login")).toThrow(
      /Invalid login response/,
    );
  });
});

describe("parseApiError", () => {
  it("returns detail when available", () => {
    const data = { detail: "Invalid credentials", message: "Error" };
    expect(parseApiError(data)).toBe("Invalid credentials");
  });

  it("returns message when detail is not available", () => {
    const data = { message: "Something went wrong" };
    expect(parseApiError(data)).toBe("Something went wrong");
  });

  it("returns default message for empty object", () => {
    expect(parseApiError({})).toBe("An error occurred");
  });

  it("returns default message for invalid data", () => {
    expect(parseApiError(null)).toBe("An error occurred");
    expect(parseApiError(undefined)).toBe("An error occurred");
    expect(parseApiError("string")).toBe("An error occurred");
  });
});
