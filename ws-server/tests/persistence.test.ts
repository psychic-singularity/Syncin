import * as Y from "yjs";
import { WebSocket } from "ws";
import * as syncProtocol from "y-protocols/sync";
import * as encoding from "lib0/encoding";
import * as decoding from "lib0/decoding";
import http from "node:http";
import { WebSocketServer } from "ws";
import { roomManager } from "../src/room.js";
import { prisma } from "../src/db.js";

const TEST_PORT = 4099;
const TEST_ROOM = `persist-test-${Date.now()}`;
const WS_URL = `ws://localhost:${TEST_PORT}/${TEST_ROOM}`;

function createTestClient(): Promise<{
  doc: Y.Doc;
  ws: WebSocket;
  close: () => void;
}> {
  return new Promise((resolve, reject) => {
    const doc = new Y.Doc();
    const ws = new WebSocket(WS_URL);
    let isSynced = false;

    const timeout = setTimeout(() => {
      if (!isSynced) {
        reject(new Error("Timeout waiting for client initial sync handshake"));
      }
    }, 10000);

    ws.on("open", () => {
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

        if (!isSynced) {
          isSynced = true;
          clearTimeout(timeout);
          resolve({
            doc,
            ws,
            close: () => {
              ws.close();
              doc.destroy();
            },
          });
        }
      }
    });

    doc.on("update", (update, origin) => {
      if (origin !== ws && ws.readyState === WebSocket.OPEN) {
        const encoder = encoding.createEncoder();
        encoding.writeVarUint(encoder, 0);
        syncProtocol.writeUpdate(encoder, update);
        ws.send(encoding.toUint8Array(encoder));
      }
    });

    ws.on("error", (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}

async function runTest() {
  console.log("--- Starting E2E Persistence & Rehydration Test ---");

  // Pre-connect Prisma client to Neon DB
  console.log("Connecting to Neon PostgreSQL...");
  await prisma.$connect();
  console.log("✅ Neon DB connection ready.");

  // 1. Start dedicated test HTTP + WebSocket server
  const server = http.createServer();
  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (req, socket, head) => {
    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
    const roomName = url.pathname.replace(/^\/+/, "");
    wss.handleUpgrade(req, socket, head, (ws: WebSocket) => {
      wss.emit("connection", ws, req, roomName);
    });
  });

  wss.on("connection", (socket: WebSocket, _req, roomName: string) => {
    const earlyMessages: Uint8Array[] = [];
    const onEarlyMessage = (data: any) => {
      earlyMessages.push(new Uint8Array(data));
    };
    socket.on("message", onEarlyMessage);

    roomManager
      .getOrCreateRoom(roomName)
      .then((room) => {
        socket.off("message", onEarlyMessage);
        room.handleConnection(socket);
        for (const msg of earlyMessages) {
          room.processMessage(socket, msg);
        }
      })
      .catch((err) => {
        console.error("Failed to get room in test:", err);
      });
  });

  await new Promise<void>((resolve) => server.listen(TEST_PORT, resolve));
  console.log(`✅ Test server running on port ${TEST_PORT}`);

  try {
    // Phase 1: Client 1 connects, types content, and disconnects
    console.log("Phase 1: Client 1 connects and inserts code...");
    const client1 = await createTestClient();
    const text1 = client1.doc.getText("monaco");
    text1.insert(0, "export const neonActive = true;");

    // Wait for DB async persistence write to finish
    await new Promise((r) => setTimeout(r, 1200));

    // Verify DB update count
    const updateCount = await prisma.update.count({
      where: { documentId: TEST_ROOM },
    });
    console.log(`✅ Updates confirmed in Neon DB: ${updateCount}`);
    if (updateCount === 0) {
      throw new Error("No updates were saved to database!");
    }

    // Disconnect client 1
    client1.close();
    console.log("✅ Client 1 disconnected.");

    // Evict room from memory to simulate server cold start / restart
    roomManager.removeRoom(TEST_ROOM);
    console.log("✅ Room evicted from server in-memory cache.");

    // Phase 2: Client 2 connects to the evicted room (triggers rehydration from DB)
    console.log("Phase 2: Client 2 connects to cold room (testing DB rehydration)...");
    const client2 = await createTestClient();
    const text2 = client2.doc.getText("monaco");

    console.log(`Client 2 rehydrated text: "${text2.toString()}"`);

    if (text2.toString() !== "export const neonActive = true;") {
      throw new Error(
        `Rehydration failed! Expected "export const neonActive = true;", got "${text2.toString()}"`
      );
    }
    console.log("✅ Client 2 successfully rehydrated document state from Neon PostgreSQL!");

    client2.close();
  } finally {
    // Cleanup Neon DB records
    try {
      await prisma.document.delete({ where: { id: TEST_ROOM } });
      console.log("✅ Cleaned up test document from Neon DB");
    } catch {
      // ignore
    }

    await prisma.$disconnect();
    server.close();
  }

  console.log("--- E2E Persistence & Rehydration Test PASSED ---");
  process.exit(0);
}

runTest().catch((err) => {
  console.error("❌ Test failed:", err);
  prisma.$disconnect();
  process.exit(1);
});
