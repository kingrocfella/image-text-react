/**
 * Batches mobile log records and uploads them to the server.
 *
 * Kept free of React Native imports so the node test suite can drive it;
 * `remote.ts` wires it to the authenticated API client. Uploading is best
 * effort: failures requeue the batch and never reach the application.
 */
import type { MobileLogRecord } from "./logger";

export interface ShipperConfig {
  batchSize: number;
  queueLimit: number;
  flushDelayMs: number;
  retryDelayMs: number;
}

export interface WireLogRecord {
  timestamp: string;
  level: MobileLogRecord["level"];
  scope: string;
  event: string;
  message: string;
  runtime_id: string;
  context?: Record<string, unknown>;
}

/** Resolves true when the batch was accepted; false to retry later. */
export type UploadBatch = (records: WireLogRecord[]) => Promise<boolean>;

const MAX_CONTEXT_CHARS = 3000;

export function toWireRecord(record: MobileLogRecord): WireLogRecord {
  const { runtimeId, fields, ...rest } = record;
  const wire: WireLogRecord = { ...rest, runtime_id: runtimeId };
  if (fields && Object.keys(fields).length > 0) {
    wire.context =
      JSON.stringify(fields).length > MAX_CONTEXT_CHARS
        ? { truncated: true }
        : fields;
  }
  return wire;
}

export function createLogShipper(upload: UploadBatch, config: ShipperConfig) {
  let queue: MobileLogRecord[] = [];
  let timer: ReturnType<typeof setTimeout> | null = null;
  let sending = false;
  let running = false;

  function schedule(delayMs: number = config.flushDelayMs): void {
    if (!running || sending || timer || queue.length === 0) return;
    timer = setTimeout(() => {
      timer = null;
      void flush();
    }, delayMs);
  }

  function enqueue(record: MobileLogRecord): void {
    queue.push(record);
    if (queue.length > config.queueLimit) {
      queue.splice(0, queue.length - config.queueLimit);
    }
    schedule(queue.length >= config.batchSize ? 0 : config.flushDelayMs);
  }

  async function flush(): Promise<void> {
    if (!running || sending || queue.length === 0) return;
    sending = true;
    const batch = queue.splice(0, config.batchSize);
    // Only a backlog that existed before this upload earns an immediate
    // follow-up, so the uploader can never become its own traffic source.
    const hadBacklog = queue.length > 0;
    let accepted = false;
    try {
      accepted = await upload(batch.map(toWireRecord));
    } catch {
      accepted = false;
    }
    if (!accepted) {
      queue = [...batch, ...queue].slice(-config.queueLimit);
    }
    sending = false;
    schedule(
      !accepted ? config.retryDelayMs : hadBacklog ? 0 : config.flushDelayMs,
    );
  }

  return {
    enqueue,
    flush,
    start(backlog: MobileLogRecord[] = []): void {
      if (running) return;
      running = true;
      queue = [...backlog, ...queue].slice(-config.queueLimit);
      schedule();
    },
    stop(): void {
      running = false;
      if (timer) clearTimeout(timer);
      timer = null;
    },
    pending: (): number => queue.length,
  };
}
