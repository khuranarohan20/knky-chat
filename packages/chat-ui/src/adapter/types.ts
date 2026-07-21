import type { Chat, MessageInterface, MetaInterface } from '@knky-chat/core-chat';
import type { SocketEventBridge } from '../bridge/SocketEventBridge';
import type { ChatConnection, ConnectionManager } from '@knky-chat/core-chat';

// ---------------------------------------------------------------------------
// Feature flags
// ---------------------------------------------------------------------------

export interface ChatFeatures {
  /** Agency only: manage multiple creators simultaneously */
  multiCreatorSupport: boolean;
  /** Show filter dropdowns (read/fan/spend) */
  advancedFilters: boolean;
  /** Show ChatStats drawer */
  statistics: boolean;
  /** Show shared content / media gallery */
  sharedContent: boolean;
  /** Core only: stream messages support */
  streamMessages: boolean;
  /** Core only: GA4 session tracking */
  sessionTracking: boolean;
  /** Agency only: mass messaging UI */
  massMessages: boolean;
  /** Agency only: custom fan list tabs */
  customFanLists: boolean;
}

// ---------------------------------------------------------------------------
// Auth hooks — platform provides these; we never own tokens directly
// ---------------------------------------------------------------------------

export interface CoreAuthConfig {
  /** Return the current user's converse token */
  getConverseToken(): Promise<string>;
  /** Verify a token with the backend */
  verifyConverseToken(params: { projectId: string; token: string }): Promise<void>;
}

export interface AgencyAuthConfig {
  /** Log in as a specific creator and return their creator token */
  loginAsCreator(creatorId: string): Promise<{ token: string }>;
  /** Return the stored creator token for a given creator */
  getCreatorToken(creatorId: string): string;
  /** Verify a token with the backend for a given creator */
  verifyConverseToken(params: { projectId: string; token: string; creatorId: string }): Promise<void>;
  /** AES decryption key for converse tokens */
  decryptKey: string;
}

// ---------------------------------------------------------------------------
// Platform configs
// ---------------------------------------------------------------------------

export interface BasePlatformConfig {
  apiEndpoint: string;
  converseProjectId: string;
  converseHost: string;
  features: Partial<ChatFeatures>;
}

export interface CorePlatformConfig extends BasePlatformConfig {
  auth: CoreAuthConfig;
  /** Converse SDK class — injected to avoid bundling it twice */
  ConverseClass: new () => any;
}

export interface AgencyPlatformConfig extends BasePlatformConfig {
  auth: AgencyAuthConfig;
  ConverseClass: new () => any;
  agentId: string;
  agentName: string;
  /** List of creator IDs to initialize on startup */
  creatorIds: string[];
}

// ---------------------------------------------------------------------------
// IPlatformAdapter — the contract every adapter must fulfil
// ---------------------------------------------------------------------------

export interface IPlatformAdapter {
  readonly platformType: 'core' | 'agency';

  // Lifecycle
  initialize(): Promise<void>;
  destroy(): void;

  // Active creator
  getCreatorId(): string;
  switchCreator?(creatorId: string): Promise<void>;
  getCreatorIds?(): string[];

  // Connection access
  getConnection(creatorId?: string): ChatConnection | undefined;
  getConnectionManager?(): ConnectionManager;

  // Bridge access
  getBridge(creatorId?: string): SocketEventBridge | undefined;

  // Meta enrichment — agency adds sent_by + emp; core passes through
  enrichMeta(meta: Partial<MetaInterface>): Partial<MetaInterface>;

  // Platform config
  getMaxPinMessages(): number;    // 20 (core) | 5 (agency)
  getFlushMs(): number;           // 100 (core) | 120 (agency)
  isFeatureEnabled(feature: keyof ChatFeatures): boolean;

  // Convenience state reads (delegates to Zustand)
  getChatList(creatorId?: string): Chat[];
  getMessages(channelId: string, creatorId?: string): MessageInterface[];
}
