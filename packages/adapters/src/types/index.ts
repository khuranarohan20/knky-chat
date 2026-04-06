// Adapter Types
// Platform integration interfaces and configuration

import type { Theme } from '@knky-chat/chat-ui';

/**
 * Platform configuration interface
 */
export interface PlatformConfig {
  apiEndpoint: string;
  converseProjectId: string;
  converseHost: string;
  theme: Theme;
  features: {
    multiCreatorSupport: boolean;
    advancedFilters: boolean;
    statistics: boolean;
    sharedContent: boolean;
  };
  auth: {
    getToken(): Promise<string>;
    verifyToken(token: string): Promise<boolean>;
  };
}

/**
 * Platform adapter interface
 */
export interface IPlatformAdapter {
  readonly platformType: 'core' | 'agency';
  readonly config: PlatformConfig;

  // Lifecycle
  initialize(): Promise<void>;
  destroy(): void;

  // Authentication
  getToken(): Promise<string>;
  verifyToken(token: string): Promise<boolean>;

  // State management
  getState(): any;
  dispatch(action: any): void;
  subscribe(listener: () => void): () => void;

  // Theme
  getTheme(): Theme;
  applyTheme(theme: Theme): void;

  // Platform-specific operations
  switchCreator?(creatorId: string): Promise<void>;
}

/**
 * Core platform configuration
 */
export interface CorePlatformConfig extends PlatformConfig {
  platformType: 'core';
  features: PlatformConfig['features'] & {
    multiCreatorSupport: false;
  };
}

/**
 * Agency platform configuration
 */
export interface AgencyPlatformConfig extends PlatformConfig {
  platformType: 'agency';
  features: PlatformConfig['features'] & {
    multiCreatorSupport: true;
    creatorId: string;
  };
}

/**
 * Adapter error types
 */
export interface AdapterError extends Error {
  platformType: 'core' | 'agency';
  operation: string;
  originalError?: Error;
}

/**
 * Adapter initialization result
 */
export interface AdapterInitResult {
  success: boolean;
  error?: AdapterError;
}
