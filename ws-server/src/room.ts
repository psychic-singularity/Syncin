import * as Y from "yjs";
import * as syncProtocol from "y-protocols/sync";
import * as awarenessProtocol from "y-protocols/awareness";
import * as encoding from "lib0/encoding";
import type { WebSocket } from "ws";
import {
  MESSAGE_SYNC,
  MESSAGE_AWARENESS,
  handleProtocolMessage,
  sendBinary,
} from "./sync.js";
import { saveUpdate, loadDocumentState } from "./db.js";
import { RedisService, redisService, RoomMessageCallback } from "./redis.js";

/**
 * Represents a collaborative document room session holding the authoritative
 * in-memory Y.Doc, awareness instance, and connected WebSocket clients.
 */
export class Room {
  public readonly name: string;
  public readonly doc: Y.Doc;
  public readonly awareness: awarenessProtocol.Awareness;
  // Tracks connected sockets and their associated awareness client IDs
  public readonly clients: Map<WebSocket, Set<number>> = new Map();
  private readonly redis: RedisService;
  private readonly redisCallback: RoomMessageCallback;

  constructor(name: string, redis: RedisService = redisService) {
    this.name = name;
    this.redis = redis;
    this.doc = new Y.Doc();
    this.awareness = new awarenessProtocol.Awareness(this.doc);

    // 1. Listen for Y.Doc updates and broadcast delta to other clients in room
    this.doc.on("update", (update: Uint8Array, origin: any) => {
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, MESSAGE_SYNC);
      syncProtocol.writeUpdate(encoder, update);
      const message = encoding.toUint8Array(encoder);

      // Broadcast to local clients in this room (excluding origin socket)
      this.clients.forEach((_, client) => {
        if (client !== origin) {
          sendBinary(client, message);
        }
      });

      // Persist to Neon Postgres asynchronously if not originating from DB rehydration or Redis
      // (Only the server that directly received the edit from a client writes to the database)
      if (origin !== "db" && origin !== "redis") {
        saveUpdate(this.name, update).catch((err) => {
          console.error(`[DB] Error saving update for room "${this.name}":`, err);
        });
      }

      // Publish delta to Redis for other server instances if not received from Redis
      if (origin !== "redis") {
        this.redis.publish(this.name, "update", update).catch((err) => {
          console.error(`[Redis] Error publishing update for room "${this.name}":`, err);
        });
      }
    });

    // 2. Listen for awareness updates (cursors, presence) and broadcast
    this.awareness.on(
      "update",
      ({ added, updated, removed }: { added: number[]; updated: number[]; removed: number[] }, origin: any) => {
        const changedClients = added.concat(updated).concat(removed);
        const awarenessUpdate = awarenessProtocol.encodeAwarenessUpdate(
          this.awareness,
          changedClients
        );
        const encoder = encoding.createEncoder();
        encoding.writeVarUint(encoder, MESSAGE_AWARENESS);
        encoding.writeVarUint8Array(encoder, awarenessUpdate);
        const message = encoding.toUint8Array(encoder);

        this.clients.forEach((_, client) => {
          if (client !== origin) {
            sendBinary(client, message);
          }
        });

        // Publish awareness to other server instances if not received from Redis
        if (origin !== "redis") {
          this.redis.publish(this.name, "awareness", awarenessUpdate).catch((err) => {
            console.error(`[Redis] Error publishing awareness for room "${this.name}":`, err);
          });
        }
      }
    );

    // 3. Subscribe to Redis messages from other server nodes for this room
    this.redisCallback = (type: "update" | "awareness", payload: Uint8Array) => {
      if (type === "update") {
        // Apply remote update with origin 'redis'
        // This triggers this.doc.on('update') which broadcasts to local sockets
        // without re-publishing to Redis or double-writing to the database.
        Y.applyUpdate(this.doc, payload, "redis");
      } else if (type === "awareness") {
        awarenessProtocol.applyAwarenessUpdate(this.awareness, payload, "redis");
      }
    };

    this.redis.subscribeRoom(this.name, this.redisCallback).catch((err) => {
      console.error(`[Redis] Failed to subscribe room "${this.name}":`, err);
    });
  }

  /**
   * Registers a newly connected client socket into the room and initiates
   * the Yjs synchronization protocol handshake (SyncStep 1).
   */
  public handleConnection(socket: WebSocket): void {
    this.clients.set(socket, new Set());

    // Send SyncStep 1: Offer server state vector to client
    const syncEncoder = encoding.createEncoder();
    encoding.writeVarUint(syncEncoder, MESSAGE_SYNC);
    syncProtocol.writeSyncStep1(syncEncoder, this.doc);
    sendBinary(socket, encoding.toUint8Array(syncEncoder));

    // Send existing awareness states to client
    const states = this.awareness.getStates();
    if (states.size > 0) {
      const awarenessEncoder = encoding.createEncoder();
      encoding.writeVarUint(awarenessEncoder, MESSAGE_AWARENESS);
      encoding.writeVarUint8Array(
        awarenessEncoder,
        awarenessProtocol.encodeAwarenessUpdate(
          this.awareness,
          Array.from(states.keys())
        )
      );
      sendBinary(socket, encoding.toUint8Array(awarenessEncoder));
    }

    // Attach message receiver
    socket.on("message", (data: any, isBinary: boolean) => {
      if (!isBinary && typeof data === "string") return;
      const buffer = new Uint8Array(data);
      this.processMessage(socket, buffer);
    });

    // Attach disconnection cleanup
    const cleanup = () => {
      this.handleDisconnection(socket);
    };

    socket.on("close", cleanup);
    socket.on("error", cleanup);
  }

  /**
   * Processes an incoming protocol message for a client socket.
   */
  public processMessage(socket: WebSocket, message: Uint8Array): void {
    handleProtocolMessage(socket, this.doc, this.awareness, message);
  }

  /**
   * Cleans up client socket awareness states and removes from active room clients.
   */
  public handleDisconnection(socket: WebSocket): void {
    const controlledIds = this.clients.get(socket);
    if (controlledIds && controlledIds.size > 0) {
      awarenessProtocol.removeAwarenessStates(
        this.awareness,
        Array.from(controlledIds),
        null
      );
    }
    this.clients.delete(socket);
  }

  public destroy(): void {
    this.redis.unsubscribeRoom(this.name, this.redisCallback).catch(() => {});
    this.clients.forEach((_, socket) => {
      try {
        socket.close();
      } catch {
        // ignore
      }
    });
    this.clients.clear();
    this.awareness.destroy();
    this.doc.destroy();
  }
}

/**
 * Manages active rooms in memory and coordinates persistent rehydration.
 */
export class RoomManager {
  private readonly rooms: Map<string, Room> = new Map();
  private readonly loadingRooms: Map<string, Promise<Room>> = new Map();
  private readonly redis: RedisService;

  constructor(redis: RedisService = redisService) {
    this.redis = redis;
  }

  public async getOrCreateRoom(roomName: string): Promise<Room> {
    const existing = this.rooms.get(roomName);
    if (existing) {
      return existing;
    }

    let loading = this.loadingRooms.get(roomName);
    if (!loading) {
      loading = (async () => {
        const room = new Room(roomName, this.redis);
        try {
          await loadDocumentState(roomName, room.doc);
        } catch (err) {
          console.error(`[RoomManager] Failed to rehydrate room "${roomName}":`, err);
        }
        this.rooms.set(roomName, room);
        this.loadingRooms.delete(roomName);
        console.log(`[RoomManager] Initialized and cached room: "${roomName}"`);
        return room;
      })();
      this.loadingRooms.set(roomName, loading);
    }

    return loading;
  }

  public getRoom(roomName: string): Room | undefined {
    return this.rooms.get(roomName);
  }

  public removeRoom(roomName: string): void {
    const room = this.rooms.get(roomName);
    if (room) {
      room.destroy();
      this.rooms.delete(roomName);
      console.log(`[RoomManager] Destroyed room: "${roomName}"`);
    }
  }

  public getActiveRoomCount(): number {
    return this.rooms.size;
  }
}

export const roomManager = new RoomManager();

