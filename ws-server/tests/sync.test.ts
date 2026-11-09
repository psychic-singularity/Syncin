import * as Y from "yjs";
import { WebSocket } from "ws";
import * as syncProtocol from "y-protocols/sync";
import * as encoding from "lib0/encoding";
import * as decoding from "lib0/decoding";

const WS_URL = "ws://localhost:4000/test-sync-room";

function createTestClient(name: string): Promise<{
  doc: Y.Doc;
  ws: WebSocket;
  close: () => void;
}> {
  return new Promise((resolve, reject) => {
    const doc = new Y.Doc();
    const ws = new WebSocket(WS_URL);

    ws.on("open", () => {
      // Step 1: Send client SyncStep 1
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, 0); // MESSAGE_SYNC
      syncProtocol.writeSyncStep1(encoder, doc);
      ws.send(encoding.toUint8Array(encoder));
    });

    ws.on("message", (data: Buffer) => {
      const uint8 = new Uint8Array(data);
      const decoder = decoding.createDecoder(uint8);
      const messageType = decoding.readVarUint(decoder);

      if (messageType === 0) {
        const encoder = encoding.createEncoder();
        encoding.writeVarUint(encoder, 0);
        syncProtocol.readSyncMessage(decoder, encoder, doc, ws);
        if (encoding.length(encoder) > 1) {
          ws.send(encoding.toUint8Array(encoder));
        }
      }
    });

    // Send local document updates to server
    doc.on("update", (update, origin) => {
      if (origin !== ws && ws.readyState === WebSocket.OPEN) {
        const encoder = encoding.createEncoder();
        encoding.writeVarUint(encoder, 0);
        syncProtocol.writeUpdate(encoder, update);
        ws.send(encoding.toUint8Array(encoder));
      }
    });

    ws.on("error", reject);

    // Give handshake 300ms to settle
    setTimeout(() => {
      resolve({
        doc,
        ws,
        close: () => {
          ws.close();
          doc.destroy();
        },
      });
    }, 300);
  });
}

async function runTest() {
  console.log("--- Starting Two-Client WebSocket Sync Test ---");

  const clientA = await createTestClient("Client A");
  console.log("✅ Client A connected and initialized.");

  const clientB = await createTestClient("Client B");
  console.log("✅ Client B connected and initialized.");

  // Test 1: Client A inserts text
  const textA = clientA.doc.getText("monaco");
  const textB = clientB.doc.getText("monaco");

  console.log("Action: Client A inserts text...");
  textA.insert(0, "function calculateTotal() { return 42; }");

  // Wait for broadcast
  await new Promise((r) => setTimeout(r, 400));

  console.log(`Client A text: "${textA.toString()}"`);
  console.log(`Client B text: "${textB.toString()}"`);

  if (textB.toString() !== textA.toString()) {
    throw new Error(
      `Sync mismatch! Expected "${textA.toString()}", got "${textB.toString()}"`
    );
  }
  console.log("✅ Verification 1 Passed: Client B received text from Client A.");

  // Test 2: Client B edits concurrently
  console.log("Action: Client B appends text...");
  textB.insert(textB.length, " // verified");

  await new Promise((r) => setTimeout(r, 400));

  console.log(`Client A text: "${textA.toString()}"`);
  console.log(`Client B text: "${textB.toString()}"`);

  if (textA.toString() !== textB.toString()) {
    throw new Error(
      `Sync mismatch! Expected "${textB.toString()}", got "${textA.toString()}"`
    );
  }
  console.log("✅ Verification 2 Passed: Bidirectional synchronization converged deterministically.");

  clientA.close();
  clientB.close();
  console.log("--- Two-Client WebSocket Sync Test Passed Successfully ---");
  process.exit(0);
}

runTest().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});

