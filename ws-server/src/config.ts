import dotenv from "dotenv";
import path from "node:path";
import fs from "node:fs";

// Find root .env file regardless of whether command is run from root or ws-server/
const rootEnvPath = path.resolve(process.cwd(), "../.env");
const localEnvPath = path.resolve(process.cwd(), ".env");

if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath });
} else if (fs.existsSync(localEnvPath)) {
  dotenv.config({ path: localEnvPath });
} else {
  dotenv.config();
}

export interface ServerConfig {
  port: number;
  host: string;
  instanceId: string;
  redisUrl: string;
}

export const config: ServerConfig = {
  port: parseInt(process.env.WS_PORT || process.env.PORT || "4000", 10),
  host: process.env.WS_HOST || "0.0.0.0",
  instanceId: process.env.INSTANCE_ID || `ws-${Math.random().toString(36).substring(2, 9)}`,
  redisUrl: process.env.REDIS_URL || "redis://localhost:6379",
};

