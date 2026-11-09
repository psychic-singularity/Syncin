import dotenv from "dotenv";
import path from "node:path";

// Load environment variables from root .env if present
dotenv.config({ path: path.resolve(process.cwd(), "../.env") });
dotenv.config();

export interface ServerConfig {
  port: number;
  host: string;
  instanceId: string;
}

export const config: ServerConfig = {
  port: parseInt(process.env.WS_PORT || process.env.PORT || "4000", 10),
  host: process.env.WS_HOST || "0.0.0.0",
  instanceId: process.env.INSTANCE_ID || `ws-${Math.random().toString(36).substring(2, 9)}`,
};

