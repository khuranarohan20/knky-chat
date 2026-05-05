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
