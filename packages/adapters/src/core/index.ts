// Core Platform Adapter
// Next.js + Bootstrap integration for single-creator platform

import type { IPlatformAdapter, CorePlatformConfig } from '../types';
import type { IChatConnection } from '@knky-chat/core-chat';
import { CoreChatManager, ICoreChatStateManager } from '@knky-chat/business-logic';

/**
 * Core platform adapter implementation
 * Integrates chat functionality with Next.js + Bootstrap
 */
export class CoreAdapter implements IPlatformAdapter {
  readonly platformType = 'core' as const;
  readonly config: CorePlatformConfig;

  private chatManager: CoreChatManager;
  private connection: IChatConnection | null = null;
  private unsubscribe: (() => void) | null = null;

  constructor(config: CorePlatformConfig) {
    this.config = config;
    this.chatManager = new CoreChatManager({
      getState: () => {
        // Will be implemented with actual state manager
        return this.getState();
      },
      setState: () => {
        // Will be implemented with actual state manager
      },
      subscribe: () => {
        // Will be implemented with actual state manager
        return () => {};
      },
    });
  }

  /**
   * Initialize adapter
   */
  async initialize(): Promise<void> {
    try {
      // Get token from auth function
      const token = await this.config.auth.getToken();

      // Initialize connection with converse client
      // Note: Actual Converse client injection will be done by platform
      if (this.connection) {
        await this.connection.init({
          projectId: this.config.converseProjectId,
          token,
          serverUrl: this.config.converseHost,
        });

        // Setup message handlers
        this.connection.setMessageHandlers({
          onNewMessage: this.handleNewMessage.bind(this),
          onConnectionChange: this.handleConnectionChange.bind(this),
          onError: this.handleError.bind(this),
        });
      }

      // Apply theme
      this.applyTheme(this.config.theme);

      console.log('Core adapter initialized');
    } catch (error) {
      console.error('Failed to initialize core adapter:', error);
      throw error;
    }
  }

  /**
   * Destroy adapter
   */
  destroy(): void {
    if (this.connection) {
      this.connection.disconnect();
      this.connection = null;
    }

    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }

  /**
   * Get authentication token
   */
  async getToken(): Promise<string> {
    return this.config.auth.getToken();
  }

  /**
   * Verify authentication token
   */
  async verifyToken(token: string): Promise<boolean> {
    return this.config.auth.verifyToken(token);
  }

  /**
   * Get current state
   */
  getState(): any {
    return this.chatManager.getState();
  }

  /**
   * Dispatch action
   */
  dispatch(action: any): void {
    // Will be implemented with actual state manager
    console.log('Dispatch action:', action);
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener: () => void): () => void {
    this.unsubscribe = listener();
    return () => {
      this.unsubscribe = null;
    };
  }

  /**
   * Get current theme
   */
  getTheme(): 'bootstrap' {
    return 'bootstrap';
  }

  /**
   * Apply theme to DOM
   */
  applyTheme(theme: 'bootstrap'): void {
    if (theme === 'bootstrap') {
      // Apply Bootstrap CSS variables
      document.documentElement.style.setProperty('--knky-primary', '#0d6efd');
      document.documentElement.style.setProperty('--knky-secondary', '#6c757d');
      document.documentElement.style.setProperty('--knky-bg', '#ffffff');
      document.documentElement.style.setProperty('--knky-surface', '#f8f9fa');
    }
  }

  /**
   * Set chat connection (called by platform)
   */
  setChatConnection(connection: IChatConnection): void {
    this.connection = connection;
  }

  /**
   * Handle new message from socket
   */
  private handleNewMessage(message: any): void {
    this.chatManager.addMessage(message, message.channel_id);
  }

  /**
   * Handle connection state change
   */
  private handleConnectionChange(connected: boolean): void {
    this.chatManager.setIsLoading(!connected);
    console.log('Connection state changed:', connected);
  }

  /**
   * Handle connection error
   */
  private handleError(error: Error): void {
    console.error('Connection error:', error);
    // Could trigger retry logic here
  }

  /**
   * Core platform does not support creator switching
   */
  switchCreator?(creatorId: string): Promise<void> {
    throw new Error('Creator switching not supported in core platform');
  }
}

/**
 * Factory function to create core adapter
 */
export function createCoreAdapter(
  config: CorePlatformConfig
): CoreAdapter {
  return new CoreAdapter(config);
}
