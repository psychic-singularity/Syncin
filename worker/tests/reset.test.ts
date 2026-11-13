import * as Y from "yjs";
import { prisma } from "../src/db.js";
import { resetAllRoomsAndDocuments } from "../src/reset.js";

async function runResetIntegrationTest() {
  console.log("==================================================");
  console.log("🧪 Starting Automated Midnight IST Reset Integration Test");
  console.log("==================================================");

  // 1. Seed dummy ephemeral documents and updates
  const testDocId = `temp-room-${Date.now()}`;
  console.log(`1. Seeding temporary room "${testDocId}"...`);

  await prisma.document.create({
    data: {
      id: testDocId,
      title: "Temporary Project",
      language: "javascript",
    },
  });

  const dummyDoc = new Y.Doc();
  dummyDoc.getText("file:test.js").insert(0, "console.log('ephemeral code');");
  const dummyUpdate = Buffer.from(Y.encodeStateAsUpdate(dummyDoc));

  await prisma.update.create({
    data: {
      documentId: testDocId,
      blob: dummyUpdate,
    },
  });

  const countBefore = await prisma.document.count({
    where: { id: testDocId },
  });
  if (countBefore !== 1) {
    throw new Error(`Failed to seed test document "${testDocId}"`);
  }
  console.log(`✅ Temporary document and update confirmed in database.`);

  // 2. Trigger the midnight reset routine
  console.log(`2. Triggering resetAllRoomsAndDocuments()...`);
  const summary = await resetAllRoomsAndDocuments();
  console.log(`✅ Reset summary:`, summary);

  // 3. Verification 1: Temporary document must be deleted
  const tempDocAfter = await prisma.document.findUnique({
    where: { id: testDocId },
  });
  if (tempDocAfter !== null) {
    throw new Error(`Verification Failed: Temporary document "${testDocId}" was NOT purged.`);
  }
  console.log(`✅ Verification 1 Passed: Ephemeral document was purged successfully.`);

  // 4. Verification 2: Baseline 'playground' document must exist
  const playgroundDoc = await prisma.document.findUnique({
    where: { id: "playground" },
    include: { snapshot: true },
  });
  if (!playgroundDoc) {
    throw new Error(`Verification Failed: Baseline 'playground' document does not exist.`);
  }
  if (!playgroundDoc.snapshot) {
    throw new Error(`Verification Failed: Baseline 'playground' snapshot does not exist.`);
  }
  console.log(`✅ Verification 2 Passed: Baseline 'playground' document and snapshot exist.`);

  // 5. Verification 3: Rehydrate Y.Doc from playground snapshot and verify multi-file structure
  const rehydratedDoc = new Y.Doc();
  Y.applyUpdate(rehydratedDoc, new Uint8Array(playgroundDoc.snapshot.blob));

  const filesMap = rehydratedDoc.getMap("files");
  if (!filesMap.has("index.js")) {
    throw new Error(`Verification Failed: Reseeded playground is missing 'index.js' in files map.`);
  }

  const indexContent = rehydratedDoc.getText("file:index.js").toString();
  if (!indexContent.includes("calculateTotal")) {
    throw new Error(`Verification Failed: Reseeded 'index.js' does not contain starter JavaScript code.`);
  }
  console.log(`✅ Verification 3 Passed: Rehydrated playground contains 'index.js' with expected JavaScript starter code.`);

  // 6. Cleanup
  await prisma.$disconnect();

  console.log("==================================================");
  console.log("🎉 Automated Midnight IST Reset Test PASSED");
  console.log("==================================================");
}

runResetIntegrationTest().catch((err) => {
  console.error("❌ Reset Integration Test FAILED:", err);
  process.exit(1);
});
