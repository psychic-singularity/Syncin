import * as Y from "yjs";
import { prisma } from "./db.js";
import { config } from "./config.js";
import { Redis } from "ioredis";

export interface ResetSummary {
  deletedUpdates: number;
  deletedSnapshots: number;
  deletedDocuments: number;
  reseeded: boolean;
  timestamp: string;
}

const DEFAULT_STARTER_JS = `// Collaborative Room: playground
// All files and edits synchronize in real-time across collaborators.
// Note: This room automatically resets daily at 00:00 IST.

function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price, 0);
}

const shoppingCart = [
  { name: "Coffee", price: 4.5 },
  { name: "Donut", price: 2.5 },
];

console.log("Total:", calculateTotal(shoppingCart));
`;

/**
 * Resets all documents, snapshots, and incremental updates in PostgreSQL,
 * and re-seeds the default 'playground' room with a pristine JavaScript template.
 *
 * Broadcasts an eviction notice via Redis Pub/Sub to inform active WebSocket server
 * nodes to flush their in-memory room caches.
 */
export async function resetAllRoomsAndDocuments(): Promise<ResetSummary> {
  console.log("[DailyReset] Starting daily midnight reset (00:00 IST schedule)...");

  // 1. Compile fresh default Y.Doc snapshot for baseline 'playground' room
  const defaultDoc = new Y.Doc();
  const filesMap = defaultDoc.getMap("files");
  filesMap.set("index.js", {
    id: "index.js",
    name: "index.js",
    createdAt: Date.now(),
  });
  const indexText = defaultDoc.getText("file:index.js");
  indexText.insert(0, DEFAULT_STARTER_JS);
  const baselineSnapshotBlob = Buffer.from(Y.encodeStateAsUpdate(defaultDoc));

  // 2. Perform atomic database cleanup & reseed
  const result = await prisma.$transaction(async (tx) => {
    // Delete all updates
    const updatesRes = await tx.update.deleteMany({});
    // Delete all snapshots
    const snapshotsRes = await tx.snapshot.deleteMany({});
    // Delete all documents
    const docsRes = await tx.document.deleteMany({});

    // Reseed baseline playground document
    const playgroundDoc = await tx.document.create({
      data: {
        id: "playground",
        title: "Playground",
        language: "javascript",
      },
    });

    // Create baseline snapshot
    await tx.snapshot.create({
      data: {
        documentId: playgroundDoc.id,
        blob: baselineSnapshotBlob,
        lastUpdateId: 0n,
      },
    });

    return {
      deletedUpdates: updatesRes.count,
      deletedSnapshots: snapshotsRes.count,
      deletedDocuments: docsRes.count,
    };
  });

  // 3. Notify active WebSocket server nodes via Redis Pub/Sub to evict memory caches
  let redis: Redis | null = null;
  try {
    redis = new Redis(config.redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      connectTimeout: 2000,
    });
    await redis.connect();
    await redis.publish(
      "room:system",
      JSON.stringify({
        action: "DAILY_RESET",
        timestamp: new Date().toISOString(),
      })
    );
    await redis.quit();
    console.log("[DailyReset] Broadcasted system:reset notice to Redis channel 'room:system'.");
  } catch (err) {
    if (redis) {
      try {
        redis.disconnect();
      } catch {}
    }
    console.warn("[DailyReset] Warning: Could not publish eviction notice to Redis:", err);
  }

  const summary: ResetSummary = {
    deletedUpdates: result.deletedUpdates,
    deletedSnapshots: result.deletedSnapshots,
    deletedDocuments: result.deletedDocuments,
    reseeded: true,
    timestamp: new Date().toISOString(),
  };

  console.log(
    `[DailyReset] Completed! Purged ${summary.deletedDocuments} docs, ${summary.deletedUpdates} updates. Reseeded playground.`
  );

  return summary;
}

