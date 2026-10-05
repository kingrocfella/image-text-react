import {
  createMobileLogger,
  getRecentMobileLogs,
  sanitizeLogFields,
  sanitizeLogText,
  setMobileLogSink,
  type MobileLogRecord,
} from "../logger";
import { createLogShipper, toWireRecord } from "../shipper";

const JWT = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.c2lnbmF0dXJl";

describe("redaction", () => {
  it("removes emails, tokens and bearer credentials from text", () => {
    const text = sanitizeLogText(
      `ada@example.com sent Bearer ${JWT} to /x?token=abc123`,
    );
    expect(text).not.toContain("ada@example.com");
    expect(text).not.toContain(JWT);
    expect(text).not.toContain("abc123");
  });

  it("redacts sensitive keys and bounds depth and size", () => {
    const fields = sanitizeLogFields({
      password: "hunter2",
      query: "what is in my contract?",
      filename: "payslip.pdf",
      status: 500,
      nested: { a: { b: { c: { d: "deep" } } } },
      list: Array.from({ length: 100 }, (_, i) => i),
      error: new Error(`failed for ada@example.com`),
    });
    expect(fields.password).toBe("[REDACTED]");
    // The user\'s own questions and document names never leave the device.
    expect(fields.query).toBe("[REDACTED]");
    expect(fields.filename).toBe("[REDACTED]");
    expect(fields.status).toBe(500);
    expect(JSON.stringify(fields.nested)).toContain("[Truncated]");
    expect((fields.list as unknown[]).length).toBe(25);
    expect(JSON.stringify(fields.error)).not.toContain("ada@example.com");
  });
});

describe("createMobileLogger", () => {
  afterEach(() => setMobileLogSink(null));

  it("hands redacted records to the sink and keeps a bounded backlog", () => {
    const seen: MobileLogRecord[] = [];
    setMobileLogSink((record) => seen.push(record));

    createMobileLogger("auth").error("refresh_failed", `Bearer ${JWT} rejected`, {
      token: JWT,
    });

    expect(seen).toHaveLength(1);
    expect(seen[0]).toMatchObject({ level: "error", scope: "auth", event: "refresh_failed" });
    expect(JSON.stringify(seen[0])).not.toContain(JWT);
    expect(getRecentMobileLogs().at(-1)?.event).toBe("refresh_failed");
  });

  it("is not broken by a sink that throws", () => {
    setMobileLogSink(() => {
      throw new Error("sink down");
    });
    expect(() => createMobileLogger("app").warn("x", "y")).not.toThrow();
  });
});

describe("log shipper", () => {
  const config = { batchSize: 2, queueLimit: 3, flushDelayMs: 1000, retryDelayMs: 5000 };
  const record = (event: string): MobileLogRecord => ({
    timestamp: "2026-10-05T12:00:00.000Z",
    level: "info",
    scope: "app",
    event,
    message: "m",
    runtimeId: "mobile-1",
  });

  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("converts to the server\'s wire format", () => {
    const wire = toWireRecord({ ...record("e"), fields: { status: 500 } });
    expect(wire).toMatchObject({ runtime_id: "mobile-1", context: { status: 500 } });
    expect(wire).not.toHaveProperty("runtimeId");
    expect(wire).not.toHaveProperty("fields");
  });

  it("uploads in batches and requeues a failed batch", async () => {
    const upload = jest
      .fn<Promise<boolean>, [unknown[]]>()
      .mockResolvedValueOnce(false)
      .mockResolvedValue(true);
    const shipper = createLogShipper(upload, config);
    shipper.start();
    shipper.enqueue(record("a"));
    shipper.enqueue(record("b"));

    await jest.advanceTimersByTimeAsync(config.flushDelayMs);
    expect(upload).toHaveBeenCalledTimes(1);
    expect(shipper.pending()).toBe(2);

    await jest.advanceTimersByTimeAsync(config.retryDelayMs);
    expect(upload).toHaveBeenCalledTimes(2);
    expect(shipper.pending()).toBe(0);
    shipper.stop();
  });

  it("drops the oldest records rather than grow without bound", () => {
    const shipper = createLogShipper(jest.fn().mockResolvedValue(false), config);
    for (const event of ["a", "b", "c", "d", "e"]) shipper.enqueue(record(event));
    expect(shipper.pending()).toBe(3);
  });
});
