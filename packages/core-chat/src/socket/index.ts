// Core Chat Socket Utilities
// Platform-agnostic socket management for chat functionality

import type { MessageInterface, MetaInterface } from '../types';

export interface ChatConnectionConfig {
  projectId: string;
  token: string;
  serverUrl: string;
}

export interface MessageHandlers {
  onNewMessage?: (message: MessageInterface) => void;
  onConnectionChange?: (connected: boolean) => void;
  onError?: (error: Error) => void;
}

export interface MessageData {
  message?: string;
  files?: File[];
  meta?: MetaInterface;
  users?: string[];
  shareOnProject?: boolean;
}

/**
 * Abstract interface for chat connection
 */
export interface IChatConnection {
  readonly isConnected: boolean;
  readonly projectId: string | null;

  init(config: ChatConnectionConfig): Promise<void>;
  disconnect(): void;
  sendMessage(data: MessageData): Promise<void>;
  updateChannel(channelId: string): Promise<void>;
  setMessageHandlers(handlers: MessageHandlers): void;
}

/**
 * Message fetch limit constant
 */
export const MESSAGE_FETCH_LIMIT = 50;

/**
 * Abstract base class for chat connection implementations
 * Platform-specific implementations should extend this
 */
export abstract class BaseChatConnection implements IChatConnection {
  protected converse: any = null;
  protected channel: any = null;
  protected project: any = null;
  protected channelId: string | null = null;
  protected config: ChatConnectionConfig | null = null;
  protected messageHandlers: MessageHandlers = {};

  get isConnected(): boolean {
    return this.converse?.checkConnection() || false;
  }

  get projectId(): string | null {
    return this.config?.projectId || null;
  }

  /**
   * Initialize connection to converse server
   */
  async init(config: ChatConnectionConfig): Promise<void> {
    this.config = config;

    try {
      if (!this.converse) {
        // Converse client will be injected by platform-specific adapters
        throw new Error('Converse client must be provided by platform adapter');
      }

      await this.converse.init({
        projectId: config.projectId,
        converseToken: config.token,
        serverUrl: config.serverUrl,
      });

      this.setupConnectionListeners();
    } catch (error) {
      this.messageHandlers.onError?.(error as Error);
      throw error;
    }
  }

  /**
   * Disconnect from converse server
   */
  disconnect(): void {
    this.closeChannel();
    this.closeProject();
    this.shutdown();
  }

  /**
   * Send message to channel or project
   */
  async sendMessage(data: MessageData): Promise<void> {
    if (!data.message && !data.files) {
      throw new Error('No message or files to send');
    }

    if (data.shareOnProject && data.users && data.users.length > 0) {
      return this.sendProjectMessage({
        message: data.message || '',
        users: data.users,
        meta: data.meta,
      });
    }

    return this.sendChannelMessage({
      message: data.message || '',
      meta: data.meta || {},
    });
  }

  /**
   * Update to specific channel
   */
  async updateChannel(channelId: string): Promise<void> {
    if (!this.converse) {
      throw new Error('Connection not initialized');
    }

    this.closeChannel();
    this.channelId = channelId;

    this.channel = await this.converse.connectChannel({
      channelId,
      ephemeral: false,
      batch: MESSAGE_FETCH_LIMIT,
    });

    this.setupChannelListeners();
  }

  /**
   * Set message handlers for callbacks
   */
  setMessageHandlers(handlers: MessageHandlers): void {
    this.messageHandlers = { ...this.messageHandlers, ...handlers };
  }

  /**
   * Setup connection-level listeners (to be implemented by platform adapters)
   */
  protected abstract setupConnectionListeners(): void;

  /**
   * Setup channel-level listeners
   */
  protected setupChannelListeners(): void {
    if (!this.channel) return;

    this.channel.listenMessage((message: MessageInterface) => {
      // Filter out own messages and duplicates
      if (this.shouldHandleMessage(message)) {
        this.messageHandlers.onNewMessage?.(message);
      }
    });
  }

  /**
   * Check if message should be handled
   */
  protected shouldHandleMessage(message: MessageInterface): boolean {
    // To be implemented based on platform logic
    return true;
  }

  /**
   * Send message to current channel
   */
  protected async sendChannelMessage(data: {
    message: string;
    meta: any;
  }): Promise<void> {
    if (!this.channel) {
      throw new Error('No active channel');
    }

    return this.channel.sendMessage(data);
  }

  /**
   * Send message to project (broadcast to multiple users)
   */
  protected async sendProjectMessage(data: {
    message: string;
    users: string[];
    meta: any;
  }): Promise<void> {
    if (!this.project) {
      throw new Error('No active project');
    }

    return this.project.notifyPeople({
      msg: {
        message: data.message,
        meta: {
          ...data.meta,
          converseId: this.channelId,
        },
        creationTime: new Date().toISOString(),
      },
      users: data.users,
    });
  }

  /**
   * Close current channel
   */
  protected closeChannel(): void {
    if (this.channelId && this.converse) {
      this.converse.closeChannel(this.channelId);
      this.channelId = null;
      this.channel = null;
    }
  }

  /**
   * Close project connection
   */
  protected closeProject(): void {
    if (this.project && this.converse) {
      this.converse.closeProject();
      this.project = null;
    }
  }

  /**
   * Shutdown connection
   */
  protected shutdown(): void {
    if (this.converse) {
      this.converse.shutdown();
      this.converse = null;
    }
  }

  /**
   * Wait for connection to be established
   */
  protected async waitForConnection(timeout: number = 10000): Promise<void> {
    return new Promise((resolve, reject) => {
      const intervalId = setInterval(() => {
        if (this.isConnected) {
          clearInterval(intervalId);
          resolve();
        }
      }, 500);

      setTimeout(() => {
        clearInterval(intervalId);
        reject(new Error('Connection timeout'));
      }, timeout);
    });
  }

  /**
   * Retry logic for failed connections
   */
  protected async retryConnection(
    operation: () => Promise<any>,
    maxRetries: number = 5
  ): Promise<any> {
    let retryCount = 0;

    while (retryCount < maxRetries) {
      try {
        return await operation();
      } catch (error) {
        retryCount++;
        if (retryCount >= maxRetries) {
          throw error;
        }

        const delay = Math.min(1000 * Math.pow(2, retryCount), 30000);
        await this.delay(delay);
      }
    }

    throw new Error('Max retries exceeded');
  }

  /**
   * Delay utility
   */
  protected delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Factory function to create chat connection with platform-specific Converse client
 */
export function createChatConnection(
  converseClient: any,
  platformUserId: string
): IChatConnection {
  // Platform-specific adapter should implement this
  throw new Error('Platform-specific adapter must provide createChatConnection implementation');
}
