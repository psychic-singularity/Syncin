import * as Y from "yjs";
import { prisma } from "../src/db.js";
import { createCompactionWorker, enqueueCompaction, compactionQueue } from "../src/queue.js";

const TEST_DOC = `compact-test-${Date.now()}`;

async function runCompactionTest() {
  console.log("==================================================");
  console.log("🧪 Starting BullMQ Document Compaction Integration Test");
  console.log(`   Document ID: ${TEST_DOC}`);
  console.log("==================================================");

  // 1. Ensure test document entity exists in Neon DB
  await prisma.document.create({
    data: {
      id: TEST_DOC,
      title: "Compaction Test Document",
    },
  });
  console.log("✅ Created test document in Neon DB.");

  // 2. Generate 60 incremental Yjs updates
  console.log("Generating 60 incremental updates in Neon DB...");
  const sourceDoc = new Y.Doc();
  const sourceText = sourceDoc.getText("monaco");

  let updateCount = 0;
  const updatePromises: Promise<any>[] = [];

  sourceDoc.on("update", (update) => {
    updateCount++;
    const p = prisma.update.create({
      data: {
        documentId: TEST_DOC,
        blob: Buffer.from(update),
      },
    });
    updatePromises.push(p);
  });

  for (let i = 1; i <= 60; i++) {
    sourceText.insert(sourceText.length, `// Line ${i}: const val_${i} = ${i * 10};\n`);
  }

  // Await all 60 updates inserted into database
  await Promise.all(updatePromises);
  console.log(`✅ Generated and stored ${updateCount} incremental updates in Neon DB.`);

  // 3. Verify Pre-Compaction Database State
  const initialUpdatesInDb = await prisma.update.count({
    where: { documentId: TEST_DOC },
  });
  const initialSnapshot = await prisma.snapshot.findUnique({
    where: { documentId: TEST_DOC },
  });

  console.log(`Pre-Compaction Updates: ${initialUpdatesInDb}`);
  console.log(`Pre-Compaction Snapshot: ${initialSnapshot ? "EXISTS" : "NONE (null)"}`);

  if (initialUpdatesInDb !== 60) {
    throw new Error(`Expected 60 updates in DB, found ${initialUpdatesInDb}`);
  }
  if (initialSnapshot !== null) {
    throw new Error("Expected initial snapshot to be null");
  }

  // 4. Start BullMQ worker
  console.log("Starting BullMQ Compaction Worker...");
  const worker = createCompactionWorker();

  // 5. Enqueue compaction job
  console.log("Enqueuing compaction job for document...");
  await enqueueCompaction(TEST_DOC, "threshold");

  // 6. Wait for compaction to complete
  console.log("Waiting for worker to process compaction job...");
  let jobCompleted = false;

  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("Timeout waiting for compaction job to complete"));
    }, 15000);

    worker.on("completed", (job) => {
      if (job.data.documentId === TEST_DOC) {
        jobCompleted = true;
        clearTimeout(timeout);
        resolve();
      }
    });

    worker.on("failed", (_job, err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });

  console.log("✅ Worker reported job completion!");

  // 7. Verify Post-Compaction Database State
  const postCompactionSnapshot = await prisma.snapshot.findUnique({
    where: { documentId: TEST_DOC },
  });
  const postCompactionUpdates = await prisma.update.count({
    where: { documentId: TEST_DOC },
  });

  console.log(`Post-Compaction Updates Count: ${postCompactionUpdates}`);
  console.log(
    `Post-Compaction Snapshot Size: ${postCompactionSnapshot?.blob.length} bytes, lastUpdateId: ${postCompactionSnapshot?.lastUpdateId}`
  );

  if (!postCompactionSnapshot) {
    throw new Error("Compaction failed: No snapshot found in database!");
  }
  if (postCompactionUpdates !== 0) {
    throw new Error(
      `Compaction failed: Expected 0 updates remaining, found ${postCompactionUpdates}`
    );
  }
  console.log("✅ Verification 1 Passed: 60 updates pruned and compiled into single snapshot.");

  // 8. Verify Lossless State Rehydration from Snapshot
  console.log("Verifying document rehydration from snapshot blob...");
  const rehydratedDoc = new Y.Doc();
  Y.applyUpdate(rehydratedDoc, new Uint8Array(postCompactionSnapshot.blob));
  const rehydratedText = rehydratedDoc.getText("monaco").toString();

  if (rehydratedText !== sourceText.toString()) {
    throw new Error(
      `CRDT divergence! Rehydrated text does not match original source text.`
    );
  }
  console.log("✅ Verification 2 Passed: Rehydrated document matches original text byte-for-byte.");

  // 9. Test Concurrency Safety: Write Update #61 after compaction
  console.log("Testing concurrent/incremental update after compaction...");
  sourceText.insert(sourceText.length, "// Line 61: Added concurrently after compaction!\n");

  // Wait for the update listener to save row #61
  await Promise.all(updatePromises);
  await new Promise((r) => setTimeout(r, 600));

  const afterNewUpdateCount = await prisma.update.count({
    where: { documentId: TEST_DOC },
  });
  console.log(`Uncompacted updates after new write: ${afterNewUpdateCount}`);

  if (afterNewUpdateCount !== 1) {
    throw new Error(`Expected exactly 1 new uncompacted update, found ${afterNewUpdateCount}`);
  }

  // Second compaction pass incorporating existing snapshot + new update #61
  console.log("Triggering second compaction pass...");
  await new Promise((r) => setTimeout(r, 500));

  await new Promise<void>(async (resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("Timeout waiting for second compaction pass"));
    }, 15000);

    const onComplete = (job: any) => {
      if (job.data.documentId === TEST_DOC) {
        clearTimeout(timeout);
        worker.off("completed", onComplete);
        resolve();
      }
    };
    worker.on("completed", onComplete);

    try {
      await enqueueCompaction(TEST_DOC, "manual");
    } catch (err) {
      clearTimeout(timeout);
      reject(err);
    }
  });

  const finalSnapshot = await prisma.snapshot.findUnique({
    where: { documentId: TEST_DOC },
  });
  const finalUpdates = await prisma.update.count({
    where: { documentId: TEST_DOC },
  });

  if (finalUpdates !== 0) {
    throw new Error(`Expected 0 updates after second pass, found ${finalUpdates}`);
  }

  const finalRehydratedDoc = new Y.Doc();
  Y.applyUpdate(finalRehydratedDoc, new Uint8Array(finalSnapshot!.blob));
  if (finalRehydratedDoc.getText("monaco").toString() !== sourceText.toString()) {
    throw new Error("CRDT divergence after second compaction pass!");
  }
  console.log("✅ Verification 3 Passed: Multi-pass compaction with incremental updates verified.");

  // 10. Clean up
  console.log("Cleaning up test document and closing connections...");
  await prisma.document.delete({ where: { id: TEST_DOC } });
  await worker.close();
  await compactionQueue.close();
  await prisma.$disconnect();

  console.log("==================================================");
  console.log("🎉 BullMQ Document Compaction Integration Test PASSED");
  console.log("==================================================");
  process.exit(0);
}

runCompactionTest().catch(async (err) => {
  console.error("❌ Test failed:", err);
  try {
    await prisma.document.delete({ where: { id: TEST_DOC } });
  } catch {}
  await prisma.$disconnect();
  process.exit(1);
});
