import { Queue, Worker, Job, ConnectionOptions } from "bullmq";
import { config } from "./config.js";
import { compactDocument, CompactionResult } from "./compactor.js";

export interface CompactionJobData {
  documentId: string;
  trigger?: "threshold" | "idle" | "interval" | "manual";
}

/**
 * Parses REDIS_URL into BullMQ compatible connection options.
 */
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

export const redisConnectionOptions = parseRedisConnection(config.redisUrl);

/**
 * BullMQ Queue for scheduling compaction jobs with automatic job deduplication.
 */
export const compactionQueue = new Queue<CompactionJobData, any, string>(
  config.queueName,
  {
    connection: redisConnectionOptions,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 1000,
      },
      removeOnComplete: true,
      removeOnFail: 100,
    },
  }
);

/**
 * Enqueues a compaction job for a document, deduplicating so multiple rapid requests
 * for the same document collapse into a single pending compaction job.
 */
export async function enqueueCompaction(
  documentId: string,
  trigger: CompactionJobData["trigger"] = "threshold"
): Promise<void> {
  const jobId = `compact_${documentId}`;
  await compactionQueue.add(
    "compact-document",
    { documentId, trigger },
    { jobId }
  );
}

/**
 * Factory creating the BullMQ Worker to process compaction jobs.
 */
export function createCompactionWorker(): Worker<
  CompactionJobData,
  CompactionResult,
  string
> {
  const worker = new Worker<CompactionJobData, CompactionResult, string>(
    config.queueName,
    async (job: Job<CompactionJobData, CompactionResult, string>) => {
      console.log(
        `[Worker] Processing compaction job "${job.id}" for document "${job.data.documentId}" (trigger: ${job.data.trigger || "manual"})`
      );
      return await compactDocument(job.data.documentId);
    },
    {
      connection: redisConnectionOptions,
      concurrency: config.concurrency,
    }
  );

  worker.on("completed", (job) => {
    console.log(
      `[Worker] Compaction job "${job.id}" completed. Compacted: ${job.returnvalue?.compactedCount ?? 0} updates.`
    );
  });

  worker.on("failed", (job, err) => {
    console.error(
      `[Worker] Compaction job "${job?.id}" failed for document "${job?.data?.documentId}":`,
      err
    );
  });

  return worker;
}

