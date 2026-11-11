import * as Y from "yjs";
import { prisma, getOrCreateDocument, saveUpdate, loadDocumentState } from "../src/db.js";

async function runDbTest() {
  console.log("--- Testing Neon PostgreSQL + Prisma Persistence ---");

  const testDocId = `test-doc-${Date.now()}`;

  // 1. Ensure document creation
  console.log(`1. Creating test document: ${testDocId}`);
  const docRecord = await getOrCreateDocument(testDocId, "Integration Test Doc");
  console.log("✅ Created document:", docRecord.id);

  // 2. Create Y.Doc with initial content and save updates
  const doc1 = new Y.Doc();
  const text1 = doc1.getText("monaco");

  doc1.on("update", (update, origin) => {
    if (origin !== "db") {
      saveUpdate(testDocId, update).catch(console.error);
    }
  });

  console.log("2. Inserting text into Y.Doc...");
  text1.insert(0, "console.log('Hello from Neon DB!');");

  // Allow async DB write to complete
  await new Promise((r) => setTimeout(r, 1000));

  // 3. Verify updates exist in database
  const count = await prisma.update.count({
    where: { documentId: testDocId },
  });
  console.log(`✅ Update count in DB: ${count}`);
  if (count === 0) {
    throw new Error("Expected at least 1 update in DB, got 0");
  }

  // 4. Rehydrate a fresh Y.Doc from DB
  console.log("3. Rehydrating new Y.Doc from DB...");
  const doc2 = new Y.Doc();
  await loadDocumentState(testDocId, doc2);

  const text2 = doc2.getText("monaco");
  console.log(`Rehydrated text: "${text2.toString()}"`);

  if (text2.toString() !== text1.toString()) {
    throw new Error(`Rehydration mismatch! Expected "${text1.toString()}", got "${text2.toString()}"`);
  }
  console.log("✅ Rehydration verified successfully!");

  // 5. Cleanup test document
  await prisma.document.delete({
    where: { id: testDocId },
  });
  console.log("✅ Cleaned up test document");

  await prisma.$disconnect();
  console.log("--- Neon DB + Prisma Persistence Test PASSED ---");
  process.exit(0);
}

runDbTest().catch((err) => {
  console.error("❌ Test failed:", err);
  prisma.$disconnect();
  process.exit(1);
});

