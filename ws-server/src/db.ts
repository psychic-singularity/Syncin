import "./config.js";
import { PrismaClient } from "@prisma/client";
import * as Y from "yjs";

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
});

/**
 * Ensures a document record exists in the database.
 * Upserts by docId to avoid race conditions when multiple users join a new room.
 */
export async function getOrCreateDocument(docId: string, title?: string) {
  return await prisma.document.upsert({
    where: { id: docId },
    update: {},
    create: {
      id: docId,
      title: title || docId,
    },
  });
}

/**
 * Rehydrates a Y.Doc instance from persistent database state.
 * 1. Loads latest snapshot (if any) and applies binary blob with origin 'db'.
 * 2. Loads all updates created after the snapshot and applies them sequentially.
 */
export async function loadDocumentState(docId: string, ydoc: Y.Doc): Promise<void> {
  // Ensure document entity exists
  await getOrCreateDocument(docId);

  // 1. Fetch latest snapshot if one exists
  const snapshot = await prisma.snapshot.findUnique({
    where: { documentId: docId },
  });

  let lastUpdateId = 0n;
  if (snapshot) {
    Y.applyUpdate(ydoc, new Uint8Array(snapshot.blob), "db");
    lastUpdateId = snapshot.lastUpdateId;
  }

  // 2. Fetch incremental updates after snapshot
  const updates = await prisma.update.findMany({
    where: {
      documentId: docId,
      id: { gt: lastUpdateId },
    },
    orderBy: { id: "asc" },
  });

  for (const update of updates) {
    Y.applyUpdate(ydoc, new Uint8Array(update.blob), "db");
  }

  console.log(
    `[DB] Rehydrated room "${docId}" (snapshot: ${!!snapshot}, updates: ${updates.length})`
  );
}

/**
 * Persists an incremental binary update to the append-only updates table.
 * Designed to run asynchronously without blocking the WebSocket broadcast loop.
 */
export async function saveUpdate(docId: string, update: Uint8Array): Promise<void> {
  // Defensive check: ensure document row exists
  await getOrCreateDocument(docId);

  await prisma.update.create({
    data: {
      documentId: docId,
      blob: Buffer.from(update),
    },
  });
}

