import * as Y from "yjs";
import * as syncProtocol from "y-protocols/sync";
import * as awarenessProtocol from "y-protocols/awareness";
import * as encoding from "lib0/encoding";
import * as decoding from "lib0/decoding";
import type { WebSocket } from "ws";

// Wire protocol message identifiers as specified by y-protocols / y-websocket
export const MESSAGE_SYNC = 0;
export const MESSAGE_AWARENESS = 1;
export const MESSAGE_AUTH = 2;
export const MESSAGE_QUERY_AWARENESS = 3;

/**
 * Sends a binary payload safely to a WebSocket client if the connection is open.
 */
export function sendBinary(socket: WebSocket, message: Uint8Array): void {
  if (socket.readyState === 1) { // WebSocket.OPEN === 1
    socket.send(message, { binary: true });
  }
}

/**
 * Handles incoming binary messages conforming to the Yjs wire protocol.
 *
 * @param socket The sending client WebSocket
 * @param doc The room's Y.Doc instance
 * @param awareness The room's Awareness instance
 * @param message The raw binary message buffer
 */
export function handleProtocolMessage(
  socket: WebSocket,
  doc: Y.Doc,
  awareness: awarenessProtocol.Awareness,
  message: Uint8Array
): void {
  try {
    const decoder = decoding.createDecoder(message);
    const messageType = decoding.readVarUint(decoder);

    switch (messageType) {
      case MESSAGE_SYNC: {
        const encoder = encoding.createEncoder();
        encoding.writeVarUint(encoder, MESSAGE_SYNC);
        // Process SyncStep1 / SyncStep2 / Update
        syncProtocol.readSyncMessage(decoder, encoder, doc, socket);

        // If readSyncMessage wrote a response (e.g., SyncStep2 reply to SyncStep1), send it back
        if (encoding.length(encoder) > 1) {
          sendBinary(socket, encoding.toUint8Array(encoder));
        }
        break;
      }

      case MESSAGE_AWARENESS: {
        // Apply remote awareness update (cursors, presence)
        awarenessProtocol.applyAwarenessUpdate(
          awareness,
          decoding.readVarUint8Array(decoder),
          socket
        );
        break;
      }

      case MESSAGE_QUERY_AWARENESS: {
        // Client queries existing awareness states in the room
        const encoder = encoding.createEncoder();
        encoding.writeVarUint(encoder, MESSAGE_AWARENESS);
        encoding.writeVarUint8Array(
          encoder,
          awarenessProtocol.encodeAwarenessUpdate(
            awareness,
            Array.from(awareness.getStates().keys())
          )
        );
        sendBinary(socket, encoding.toUint8Array(encoder));
        break;
      }

      default:
        console.warn(`[SyncProtocol] Unhandled message type: ${messageType}`);
    }
  } catch (err) {
    console.error("[SyncProtocol] Error processing binary message:", err);
  }
}

