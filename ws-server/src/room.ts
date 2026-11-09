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

  constructor(name: string) {
    this.name = name;
    this.doc = new Y.Doc();
    this.awareness = new awarenessProtocol.Awareness(this.doc);

    // 1. Listen for Y.Doc updates and broadcast delta to other clients in room
    this.doc.on("update", (update: Uint8Array, origin: any) => {
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, MESSAGE_SYNC);
      syncProtocol.writeUpdate(encoder, update);
      const message = encoding.toUint8Array(encoder);

      this.clients.forEach((_, client) => {
        if (client !== origin) {
          sendBinary(client, message);
        }
      });
    });

    // 2. Listen for awareness updates (cursors, presence) and broadcast
    this.awareness.on(
      "update",
      ({ added, updated, removed }: { added: number[]; updated: number[]; removed: number[] }, origin: any) => {
        const changedClients = added.concat(updated).concat(removed);
        const encoder = encoding.createEncoder();
        encoding.writeVarUint(encoder, MESSAGE_AWARENESS);
        encoding.writeVarUint8Array(
          encoder,
          awarenessProtocol.encodeAwarenessUpdate(this.awareness, changedClients)
        );
        const message = encoding.toUint8Array(encoder);

        this.clients.forEach((_, client) => {
          if (client !== origin) {
            sendBinary(client, message);
          }
        });
      }
    );
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
      if (!isBinary) return;
      const buffer = new Uint8Array(data);
      handleProtocolMessage(socket, this.doc, this.awareness, buffer);
    });

    // Attach disconnection cleanup
    const cleanup = () => {
      this.handleDisconnection(socket);
    };

    socket.on("close", cleanup);
    socket.on("error", cleanup);
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
 * Manages active rooms in memory.
 */
export class RoomManager {
  private readonly rooms: Map<string, Room> = new Map();

  public getOrCreateRoom(roomName: string): Room {
    let room = this.rooms.get(roomName);
    if (!room) {
      room = new Room(roomName);
      this.rooms.set(roomName, room);
      console.log(`[RoomManager] Created new room: "${roomName}"`);
    }
    return room;
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

