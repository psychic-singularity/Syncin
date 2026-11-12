import dotenv from "dotenv";
import path from "node:path";
import fs from "node:fs";

// Resolve root .env regardless of execution context
const rootEnvPath = path.resolve(process.cwd(), "../.env");
const localEnvPath = path.resolve(process.cwd(), ".env");

if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath });
} else if (fs.existsSync(localEnvPath)) {
  dotenv.config({ path: localEnvPath });
} else {
  dotenv.config();
}

export interface WorkerConfig {
  redisUrl: string;
  queueName: string;
  compactionIntervalMs: number;
  compactionThreshold: number;
  concurrency: number;
}

export const config: WorkerConfig = {
  redisUrl: process.env.REDIS_URL || "redis://localhost:6379",
  queueName: process.env.COMPACTION_QUEUE_NAME || "compaction-queue",
  compactionIntervalMs: parseInt(process.env.COMPACTION_INTERVAL_MS || "300000", 10),
  compactionThreshold: parseInt(process.env.COMPACTION_UPDATE_THRESHOLD || "50", 10),
  concurrency: parseInt(process.env.COMPACTION_CONCURRENCY || "2", 10),
};
