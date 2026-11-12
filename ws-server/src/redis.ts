import { Redis } from "ioredis";
import { config } from "./config.js";

const ROOM_CHANNEL_PREFIX = "room:";

export interface RedisPubSubPayload {
  origin: string; // Sender instanceId
  type: "update" | "awareness";
  data: string; // Base64 encoded binary payload
}

export type RoomMessageCallback = (
  type: "update" | "awareness",
  payload: Uint8Array,
  originInstanceId: string
) => void;

/**
 * Manages distributed horizontal message broadcasting across WebSocket servers
 * using Redis Pub/Sub with echo loop suppression.
 */
export class RedisService {
  public readonly instanceId: string;
  public readonly redisUrl: string;

  private pubClient: Redis | null = null;
  private subClient: Redis | null = null;
  private roomCallbacks: Map<string, Set<RoomMessageCallback>> = new Map();
  private subscribedChannels: Set<string> = new Set();
  private isInitialized = false;

  constructor(
    instanceId: string = config.instanceId,
    redisUrl: string = config.redisUrl
  ) {
    this.instanceId = instanceId;
    this.redisUrl = redisUrl;
  }

  public init(): void {
    if (this.isInitialized) return;

    this.pubClient = new Redis(this.redisUrl, {
      lazyConnect: false,
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        return Math.min(times * 100, 3000);
      },
    });

    this.subClient = new Redis(this.redisUrl, {
      lazyConnect: false,
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        return Math.min(times * 100, 3000);
      },
    });

    this.pubClient.on("error", (err) => {
      console.error(`[Redis Pub (${this.instanceId})] Error:`, err.message);
    });

    this.subClient.on("error", (err) => {
      console.error(`[Redis Sub (${this.instanceId})] Error:`, err.message);
    });

    this.subClient.on("message", (channel: string, message: string) => {
      this.handleIncomingMessage(channel, message);
    });

    this.isInitialized = true;
    console.log(`[Redis] Pub/Sub initialized for instance "${this.instanceId}"`);
  }

  private handleIncomingMessage(channel: string, rawMessage: string): void {
    if (!channel.startsWith(ROOM_CHANNEL_PREFIX)) return;
    const roomName = channel.slice(ROOM_CHANNEL_PREFIX.length);
    const callbacks = this.roomCallbacks.get(roomName);
    if (!callbacks || callbacks.size === 0) return;

    try {
      const parsed: RedisPubSubPayload = JSON.parse(rawMessage);

      // Echo Loop Prevention: Discard messages originating from this exact server instance
      if (parsed.origin === this.instanceId) {
        return;
      }

      const binaryPayload = new Uint8Array(Buffer.from(parsed.data, "base64"));
      callbacks.forEach((callback) => {
        callback(parsed.type, binaryPayload, parsed.origin);
      });
    } catch (err) {
      console.error(
        `[Redis (${this.instanceId})] Failed to parse message on channel "${channel}":`,
        err
      );
    }
  }

  /**
   * Subscribes a room handler to the Redis channel for the specified room.
   */
  public async subscribeRoom(
    roomName: string,
    callback: RoomMessageCallback
  ): Promise<void> {
    this.init();
    const channel = `${ROOM_CHANNEL_PREFIX}${roomName}`;

    let callbacks = this.roomCallbacks.get(roomName);
    if (!callbacks) {
      callbacks = new Set();
      this.roomCallbacks.set(roomName, callbacks);
    }
    callbacks.add(callback);

    if (!this.subscribedChannels.has(channel) && this.subClient) {
      await this.subClient.subscribe(channel);
      this.subscribedChannels.add(channel);
    }
  }

  /**
   * Unsubscribes a room handler and unsubscribes from Redis if no handlers remain.
   */
  public async unsubscribeRoom(
    roomName: string,
    callback?: RoomMessageCallback
  ): Promise<void> {
    const callbacks = this.roomCallbacks.get(roomName);
    if (callbacks && callback) {
      callbacks.delete(callback);
    }

    if (!callbacks || callbacks.size === 0) {
      this.roomCallbacks.delete(roomName);
      const channel = `${ROOM_CHANNEL_PREFIX}${roomName}`;
      if (this.subscribedChannels.has(channel) && this.subClient) {
        await this.subClient.unsubscribe(channel);
        this.subscribedChannels.delete(channel);
      }
    }
  }

  /**
   * Publishes an update or awareness binary delta to the room's Redis channel.
   */
  public async publish(
    roomName: string,
    type: "update" | "awareness",
    payload: Uint8Array
  ): Promise<void> {
    this.init();
    if (!this.pubClient) return;

    const channel = `${ROOM_CHANNEL_PREFIX}${roomName}`;
    const message: RedisPubSubPayload = {
      origin: this.instanceId,
      type,
      data: Buffer.from(payload).toString("base64"),
    };

    await this.pubClient.publish(channel, JSON.stringify(message));
  }

  public async shutdown(): Promise<void> {
    if (this.subClient) {
      await this.subClient.quit();
      this.subClient = null;
    }
    if (this.pubClient) {
      await this.pubClient.quit();
      this.pubClient = null;
    }
    this.isInitialized = false;
    this.subscribedChannels.clear();
    this.roomCallbacks.clear();
  }
}

export const redisService = new RedisService();

