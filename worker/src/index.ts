import { config } from "./config.js";
import { createCompactionWorker, compactionQueue, enqueueCompaction } from "./queue.js";
import { prisma } from "./db.js";

console.log("==================================================");
console.log("🛠️  Starting BullMQ Document Compaction Worker");
console.log(`   Redis:       ${config.redisUrl}`);
console.log(`   Queue:       ${config.queueName}`);
console.log(`   Concurrency: ${config.concurrency}`);
console.log(`   Threshold:   ${config.compactionThreshold} updates`);
console.log("==================================================");

const worker = createCompactionWorker();

/**
 * Periodically scans for documents that have accumulated updates exceeding
 * the compaction threshold and enqueues background jobs.
 */
async function scanAndEnqueueOverdueDocuments() {
  try {
    const updateCounts = await prisma.update.groupBy({
      by: ["documentId"],
      _count: { id: true },
      having: {
        id: {
          _count: {
            gte: config.compactionThreshold,
          },
        },
      },
    });

    for (const group of updateCounts) {
      console.log(
        `[Scheduler] Document "${group.documentId}" reached ${group._count.id} updates. Enqueueing compaction...`
      );
      await enqueueCompaction(group.documentId, "interval");
    }
  } catch (err) {
    console.error("[Scheduler] Error scanning for uncompacted documents:", err);
  }
}

// Run periodic scanner every config.compactionIntervalMs
const scanInterval = setInterval(scanAndEnqueueOverdueDocuments, config.compactionIntervalMs);

// Graceful shutdown
async function shutdown() {
  console.log("[Worker] Shutting down gracefully...");
  clearInterval(scanInterval);
  await worker.close();
  await compactionQueue.close();
  await prisma.$disconnect();
  console.log("[Worker] Closed all queues and database connections.");
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
