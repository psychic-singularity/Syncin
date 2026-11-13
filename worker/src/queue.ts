import { Queue, Worker, Job, ConnectionOptions } from "bullmq";
import { config } from "./config.js";
import { compactDocument, CompactionResult } from "./compactor.js";
import { resetAllRoomsAndDocuments, ResetSummary } from "./reset.js";

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
 * Schedules the recurring midnight IST cleanup job in BullMQ.
 * Uses cron pattern '0 0 * * *' with timezone 'Asia/Kolkata'.
 */
export async function scheduleMidnightResetJob(): Promise<void> {
  await compactionQueue.add(
    "midnight-reset",
    { documentId: "system", trigger: "interval" },
    {
      repeat: {
        pattern: "0 0 * * *",
        tz: "Asia/Kolkata",
      },
      jobId: "daily_midnight_reset_ist",
      removeOnComplete: true,
    }
  );
  console.log("[Worker] Scheduled recurring daily midnight reset (00:00 IST / Asia/Kolkata).");
}

/**
 * Factory creating the BullMQ Worker to process compaction and maintenance jobs.
 */
export function createCompactionWorker(): Worker<
  CompactionJobData,
  any,
  string
> {
  const worker = new Worker<CompactionJobData, any, string>(
    config.queueName,
    async (job: Job<CompactionJobData, any, string>) => {
      if (job.name === "midnight-reset") {
        console.log(`[Worker] Executing scheduled daily midnight reset job "${job.id}"...`);
        return await resetAllRoomsAndDocuments();
      }

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
    if (job.name === "midnight-reset") {
      console.log(`[Worker] Daily midnight reset job completed successfully.`);
    } else {
      console.log(
        `[Worker] Compaction job "${job.id}" completed. Compacted: ${job.returnvalue?.compactedCount ?? 0} updates.`
      );
    }
  });

  worker.on("failed", (job, err) => {
    console.error(
      `[Worker] Maintenance job "${job?.id}" (${job?.name}) failed:`,
      err
    );
  });

  return worker;
}

