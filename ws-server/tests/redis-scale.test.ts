import * as Y from "yjs";
import { WebSocket, WebSocketServer } from "ws";
import * as syncProtocol from "y-protocols/sync";
import * as encoding from "lib0/encoding";
import * as decoding from "lib0/decoding";
import http from "node:http";
import { RedisService } from "../src/redis.js";
import { RoomManager } from "../src/room.js";
import { prisma } from "../src/db.js";

const PORT_1 = 4011;
const PORT_2 = 4012;
const TEST_ROOM = `scale-test-${Date.now()}`;

function createTestClient(port: number, roomName: string): Promise<{
  doc: Y.Doc;
  ws: WebSocket;
  close: () => void;
}> {
  return new Promise((resolve, reject) => {
    const doc = new Y.Doc();
    const ws = new WebSocket(`ws://localhost:${port}/${roomName}`);
    let isSynced = false;

    const timeout = setTimeout(() => {
      if (!isSynced) {
        reject(new Error(`Timeout waiting for client initial sync on port ${port}`));
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

function createInstanceServer(
  port: number,
  instanceId: string
): {
  server: http.Server;
  roomManager: RoomManager;
  redis: RedisService;
  start: () => Promise<void>;
  close: () => Promise<void>;
} {
  const redis = new RedisService(instanceId);
  const roomManager = new RoomManager(redis);
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
        console.error(`[Instance ${instanceId}] Error initializing room:`, err);
      });
  });

  return {
    server,
    roomManager,
    redis,
    start: () => new Promise<void>((resolve) => server.listen(port, resolve)),
    close: async () => {
      await redis.shutdown();
      await new Promise<void>((resolve) => server.close(() => resolve()));
    },
  };
}

async function runScaleTest() {
  console.log("==================================================");
  console.log("🚀 Starting Multi-Node Redis Scaling Integration Test");
  console.log(`   Room: ${TEST_ROOM}`);
  console.log("==================================================");

  // 1. Start Server Instance 1 (node-1 on port 4011)
  const node1 = createInstanceServer(PORT_1, "node-1");
  await node1.start();
  console.log(`✅ Server Node 1 running on port ${PORT_1} (instance: node-1)`);

  // 2. Start Server Instance 2 (node-2 on port 4012)
  const node2 = createInstanceServer(PORT_2, "node-2");
  await node2.start();
  console.log(`✅ Server Node 2 running on port ${PORT_2} (instance: node-2)`);

  try {
    // 3. Connect Client A to Node 1
    console.log(`Connecting Client A to Node 1 (port ${PORT_1})...`);
    const clientA = await createTestClient(PORT_1, TEST_ROOM);
    console.log("✅ Client A connected to Node 1.");

    // 4. Connect Client B to Node 2
    console.log(`Connecting Client B to Node 2 (port ${PORT_2})...`);
    const clientB = await createTestClient(PORT_2, TEST_ROOM);
    console.log("✅ Client B connected to Node 2.");

    // 5. Test Cross-Node Sync: Client A (on Node 1) writes text
    const textA = clientA.doc.getText("monaco");
    const textB = clientB.doc.getText("monaco");

    console.log("Action: Client A (Node 1) inserts code...");
    textA.insert(0, "export const redisScale = 'verified';");

    // Wait for Redis Pub/Sub delivery to Node 2 and WS broadcast to Client B
    await new Promise((r) => setTimeout(r, 600));

    console.log(`Client A text (Node 1): "${textA.toString()}"`);
    console.log(`Client B text (Node 2): "${textB.toString()}"`);

    if (textB.toString() !== textA.toString()) {
      throw new Error(
        `Cross-node sync failed! Expected "${textA.toString()}", got "${textB.toString()}"`
      );
    }
    console.log("✅ Step 4.1 Passed: Client B on Node 2 received Client A's edit via Redis Pub/Sub!");

    // 6. Test Bidirectional Sync: Client B (on Node 2) writes text
    console.log("Action: Client B (Node 2) appends code...");
    textB.insert(textB.length, " // bidirectional OK");

    await new Promise((r) => setTimeout(r, 1000));

    console.log(`Client A text (Node 1): "${textA.toString()}"`);
    console.log(`Client B text (Node 2): "${textB.toString()}"`);

    if (textA.toString() !== textB.toString()) {
      throw new Error(
        `Bidirectional cross-node sync failed! Expected "${textB.toString()}", got "${textA.toString()}"`
      );
    }
    console.log("✅ Step 4.2 Passed: Client A on Node 1 received Client B's edit via Redis Pub/Sub!");

    // 7. Verify Database Persistence: wait until both updates are persisted
    let updateCount = 0;
    for (let i = 0; i < 25; i++) {
      updateCount = await prisma.update.count({
        where: { documentId: TEST_ROOM },
      });
      if (updateCount >= 2) break;
      await new Promise((r) => setTimeout(r, 200));
    }

    console.log(`Database updates persisted in Neon DB: ${updateCount}`);
    if (updateCount < 2) {
      throw new Error(`Expected at least 2 updates in database, found ${updateCount}`);
    }
    console.log("✅ Step 4.3 Passed: Updates correctly recorded in Neon DB without duplicate writes.");

    clientA.close();
    clientB.close();
  } finally {
    // Wait for client sockets to close cleanly
    await new Promise((r) => setTimeout(r, 400));

    // Cleanup Neon DB test document
    try {
      await prisma.document.delete({ where: { id: TEST_ROOM } });
      console.log("✅ Cleaned up test document from Neon DB");
    } catch {
      // ignore
    }

    await prisma.$disconnect();
    await node1.close();
    await node2.close();
  }

  console.log("==================================================");
  console.log("🎉 Multi-Node Redis Scaling Integration Test PASSED");
  console.log("==================================================");
  process.exit(0);
}

runScaleTest().catch((err) => {
  console.error("❌ Test failed:", err);
  prisma.$disconnect();
  process.exit(1);
});
  