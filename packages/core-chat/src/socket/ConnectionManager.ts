import { ChatConnection } from './ChatConnection';
import type { ChatConnectionCallbacks, ChatConnectionConfig } from './ChatConnection';

/**
 * ConnectionManager: manages one ChatConnection per creator for agency mode.
 *
 * Agency apps need a separate socket connection for every creator they manage.
 * Core apps use a single connection (creatorId = "__core__").
 *
 * Usage:
 *   const manager = new ConnectionManager();
 *   await manager.init(creatorId, config, callbacks);
 *   await manager.get(creatorId)?.connectChannel(channelId);
 *   manager.disconnect(creatorId);
 *   manager.disconnectAll();
 */
export class ConnectionManager {
  private connections = new Map<string, ChatConnection>();

  /**
   * Create and register a connection WITHOUT initializing it.
   *
   * Use this when callbacks must be attached before `init()` runs (e.g. the
   * SocketEventBridge, which needs the connection instance to build its
   * callbacks). Returns the existing connection if one is already registered.
   *
   *   const conn = manager.create(creatorId);
   *   const bridge = new SocketEventBridge(conn, ...); bridge.mount();
   *   await conn.init(config); // onReady + bootstrap events now reach the bridge
   */
  create(creatorId: string): ChatConnection {
    const existing = this.connections.get(creatorId);
    if (existing) return existing;

    const conn = new ChatConnection();
    this.connections.set(creatorId, conn);
    return conn;
  }

  async init(
    creatorId: string,
    config: ChatConnectionConfig,
    callbacks: ChatConnectionCallbacks,
  ): Promise<ChatConnection> {
    let conn = this.connections.get(creatorId);

    if (conn) {
      await conn.disconnect();
    }

    conn = new ChatConnection();
    conn.setCallbacks(callbacks);
    this.connections.set(creatorId, conn);

    await conn.init(config);
    return conn;
  }

  get(creatorId: string): ChatConnection | undefined {
    return this.connections.get(creatorId);
  }

  has(creatorId: string): boolean {
    return this.connections.has(creatorId);
  }

  async disconnect(creatorId: string): Promise<void> {
    const conn = this.connections.get(creatorId);
    if (conn) {
      await conn.disconnect();
      this.connections.delete(creatorId);
    }
  }

  async disconnectAll(): Promise<void> {
    await Promise.all(Array.from(this.connections.keys()).map((id) => this.disconnect(id)));
  }

  creatorIds(): string[] {
    return Array.from(this.connections.keys());
  }

  size(): number {
    return this.connections.size;
  }
}
