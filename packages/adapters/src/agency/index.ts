// Agency Platform Adapter
// React + Vite + Tailwind integration for multi-creator platform

import type { IPlatformAdapter, AgencyPlatformConfig } from '../types';
import type { IChatConnection } from '@knky-chat/core-chat';
import { AgencyChatManager, IAgencyChatStateManager } from '@knky-chat/business-logic';

/**
 * Agency platform adapter implementation
 * Integrates chat functionality with React + Vite + Tailwind for multi-creator support
 */
export class AgencyAdapter implements IPlatformAdapter {
  readonly platformType = 'agency' as const;
  readonly config: AgencyPlatformConfig;

  private chatManager: AgencyChatManager;
  private connection: IChatConnection | null = null;
  private unsubscribe: (() => void) | null = null;

  constructor(config: AgencyPlatformConfig) {
    this.config = config;
    this.chatManager = new AgencyChatManager({
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
      // Get token from auth function for current creator
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

      // Set current creator ID
      this.chatManager.setCurrentCreatorId(this.config.features.creatorId);

      console.log('Agency adapter initialized for creator:', this.config.features.creatorId);
    } catch (error) {
      console.error('Failed to initialize agency adapter:', error);
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
   * Get authentication token for current creator
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
  getTheme(): 'tailwind' {
    return 'tailwind';
  }

  /**
   * Apply theme to DOM
   */
  applyTheme(theme: 'tailwind'): void {
    if (theme === 'tailwind') {
      // Apply Tailwind CSS variables
      document.documentElement.style.setProperty('--knky-primary', '#3b82f6');
      document.documentElement.style.setProperty('--knky-secondary', '#6b7280');
      document.documentElement.style.setProperty('--knky-bg', '#ffffff');
      document.documentElement.style.setProperty('--knky-surface', '#f9fafb');
    }
  }

  /**
   * Set chat connection (called by platform)
   */
  setChatConnection(connection: IChatConnection): void {
    this.connection = connection;
  }

  /**
   * Switch to different creator
   */
  async switchCreator(creatorId: string): Promise<void> {
    try {
      // Disconnect current connection
      if (this.connection) {
        this.connection.disconnect();
        this.connection = null;
      }

      // Switch creator in business logic
      await this.chatManager.switchCreator(creatorId, async () => {
        // Reinitialize connection with new creator token
        const newToken = await this.config.auth.getToken();

        if (this.connection) {
          await this.connection.init({
            projectId: this.config.converseProjectId,
            token: newToken,
            serverUrl: this.config.converseHost,
          });
        }
      });

      console.log('Switched to creator:', creatorId);
    } catch (error) {
      console.error('Failed to switch creator:', error);
      throw error;
    }
  }

  /**
   * Handle new message from socket
   */
  private handleNewMessage(message: any): void {
    const creatorId = this.chatManager.getCurrentCreatorId();
    if (creatorId) {
      this.chatManager.addMessage(creatorId, message, message.channel_id);
    }
  }

  /**
   * Handle connection state change
   */
  private handleConnectionChange(connected: boolean): void {
    const creatorId = this.chatManager.getCurrentCreatorId();
    if (creatorId) {
      this.chatManager.setIsLoading(creatorId, !connected);
    }
    console.log('Connection state changed:', connected, 'for creator:', creatorId);
  }

  /**
   * Handle connection error
   */
  private handleError(error: Error): void {
    console.error('Connection error:', error);
    // Could trigger retry logic here
  }
}

/**
 * Factory function to create agency adapter
 */
export function createAgencyAdapter(
  config: AgencyPlatformConfig
): AgencyAdapter {
  return new AgencyAdapter(config);
}
