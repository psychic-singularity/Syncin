import * as Y from "yjs";
import { prisma } from "./db.js";

export interface CompactionResult {
  documentId: string;
  compactedCount: number;
  lastUpdateId: string;
  snapshotSize: number;
  durationMs: number;
}

/**
 * Compiles accumulated incremental updates for a document into an atomic snapshot
 * using Y.mergeUpdates, executing the snapshot update and update deletion
 * within a single atomic PostgreSQL transaction.
 */
export async function compactDocument(documentId: string): Promise<CompactionResult> {
  const startTime = Date.now();

  // 1. Fetch current snapshot (if any exists)
  const currentSnapshot = await prisma.snapshot.findUnique({
    where: { documentId },
  });

  const lastUpdateId = currentSnapshot ? currentSnapshot.lastUpdateId : 0n;

  // 2. Fetch all updates newer than the latest snapshot
  const updates = await prisma.update.findMany({
    where: {
      documentId,
      id: { gt: lastUpdateId },
    },
    orderBy: { id: "asc" },
  });

  if (updates.length === 0) {
    return {
      documentId,
      compactedCount: 0,
      lastUpdateId: lastUpdateId.toString(),
      snapshotSize: currentSnapshot ? currentSnapshot.blob.length : 0,
      durationMs: Date.now() - startTime,
    };
  }

  const maxUpdateId = updates[updates.length - 1].id;

  // 3. Assemble binary blobs for CRDT merge
  const blobsToMerge: Uint8Array[] = [];
  if (currentSnapshot) {
    blobsToMerge.push(new Uint8Array(currentSnapshot.blob));
  }
  for (const update of updates) {
    blobsToMerge.push(new Uint8Array(update.blob));
  }

  // 4. Merge all updates into a single compiled binary state vector
  const mergedBlob = Y.mergeUpdates(blobsToMerge);

  // 5. Execute snapshot update and log pruning in a single atomic transaction
  await prisma.$transaction([
    prisma.snapshot.upsert({
      where: { documentId },
      update: {
        blob: Buffer.from(mergedBlob),
        lastUpdateId: maxUpdateId,
      },
      create: {
        documentId,
        blob: Buffer.from(mergedBlob),
        lastUpdateId: maxUpdateId,
      },
    }),
    prisma.update.deleteMany({
      where: {
        documentId,
        id: { lte: maxUpdateId },
      },
    }),
  ]);

  const durationMs = Date.now() - startTime;
  console.log(
    `[Compactor] Compacted ${updates.length} updates for doc "${documentId}" -> snapshot up to ID ${maxUpdateId} (${mergedBlob.byteLength} bytes in ${durationMs}ms)`
  );

  return {
    documentId,
    compactedCount: updates.length,
    lastUpdateId: maxUpdateId.toString(),
    snapshotSize: mergedBlob.byteLength,
    durationMs,
  };
}
