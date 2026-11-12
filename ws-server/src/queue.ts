import { Queue, ConnectionOptions } from "bullmq";
import { config } from "./config.js";

function parseRedisConnection(urlStr: string): ConnectionOptions {
  try {
    const parsed = new URL(urlStr);
    return {
      host: parsed.hostname || "localhost",
      port: parseInt(parsed.port || "6379", 10),
      username: parsed.username || undefined,
      password: parsed.password || undefined,
      maxRetriesPerRequest: null,
    };
  } catch {
    return {
      host: "localhost",
      port: 6379,
      maxRetriesPerRequest: null,
    };
  }
}

/**
 * BullMQ compaction producer queue in ws-server.
 */
export const compactionQueue = new Queue("compaction-queue", {
  connection: parseRedisConnection(config.redisUrl),
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
    removeOnComplete: true,
    removeOnFail: 100,
  },
});

/**
 * Enqueues a compaction job for a document from ws-server.
 */
export async function enqueueCompaction(
  documentId: string,
  trigger: "threshold" | "idle" | "interval" | "manual" = "threshold"
): Promise<void> {
  const jobId = `compact_${documentId}`;
  try {
    await compactionQueue.add(
      "compact-document",
      { documentId, trigger },
      { jobId }
    );
  } catch (err: any) {
    console.error(`[CompactionQueue] Failed to enqueue job for "${documentId}":`, err.message);
  }
}
