import http from "node:http";
import { WebSocketServer, WebSocket } from "ws";
import { config } from "./config.js";
import { roomManager } from "./room.js";

/**
 * HTTP Server setup:
 * Serves health checks and coordinates WebSocket upgrades.
 */
const server = http.createServer((req, res) => {
  if (req.url === "/health" || req.url === "/") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        status: "ok",
        instanceId: config.instanceId,
        activeRooms: roomManager.getActiveRoomCount(),
        timestamp: new Date().toISOString(),
      })
    );
    return;
  }

  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("Not Found");
});

/**
 * Dedicated WebSocket Server attached to the HTTP upgrade pipeline.
 */
const wss = new WebSocketServer({ noServer: true });

server.on("upgrade", (req, socket, head) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  
  // Extract room name from URL path or query param
  // Path format: /<roomName> (e.g., /demo-document)
  let roomName = url.pathname.replace(/^\/+/, "");
  if (!roomName) {
    roomName = url.searchParams.get("room") || "default";
  }

  wss.handleUpgrade(req, socket, head, (ws: WebSocket) => {
    wss.emit("connection", ws, req, roomName);
  });
});

wss.on("connection", (socket: WebSocket, _req: http.IncomingMessage, roomName: string) => {
  const earlyMessages: Uint8Array[] = [];
  const onEarlyMessage = (data: any) => {
    earlyMessages.push(new Uint8Array(data));
  };
  socket.on("message", onEarlyMessage);

  roomManager
    .getOrCreateRoom(roomName)
    .then((room) => {
      socket.off("message", onEarlyMessage);
      console.log(`[WebSocket] Client connected to room: "${roomName}"`);
      room.handleConnection(socket);

      // Drain any messages received during DB rehydration
      for (const msg of earlyMessages) {
        room.processMessage(socket, msg);
      }

      socket.on("close", (code, reason) => {
        console.log(
          `[WebSocket] Client disconnected from room: "${roomName}" (code: ${code}, reason: ${reason.toString() || "none"})`
        );
      });
    })
    .catch((err) => {
      console.error(`[WebSocket] Failed to initialize connection for room "${roomName}":`, err);
      socket.close(1011, "Internal server error initializing room");
    });
});

// Start listening
server.listen(config.port, config.host, () => {
  console.log("==================================================");
  console.log(`🚀 Collaborative WebSocket Server running`);
  console.log(`   Host:        ${config.host}`);
  console.log(`   Port:        ${config.port}`);
  console.log(`   Instance ID: ${config.instanceId}`);
  console.log(`   Health:      http://${config.host}:${config.port}/health`);
  console.log("==================================================");
});

// Graceful shutdown
const shutdown = () => {
  console.log("[Server] Shutting down gracefully...");
  server.close(() => {
    console.log("[Server] Closed HTTP and WebSocket listener.");
    process.exit(0);
  });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

