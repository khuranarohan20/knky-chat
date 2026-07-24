import type { Chat, ChatStatsInterface, ConversePair, Media, MessageInterface, MetaInterface, Transactions } from '@knky-chat/core-chat';
import type { SocketEventBridge } from '../bridge/SocketEventBridge';
import type { ChatConnection, ConnectionManager } from '@knky-chat/core-chat';

// ---------------------------------------------------------------------------
// Host services — app-specific integration points the library calls but does
// not own (asset/CDN URLs, host modals, permission gating, toasts). Injected
// via config so ported components behave exactly like the host app.
// ---------------------------------------------------------------------------

export interface ChatHostServices {
  /** Resolve an asset URL (avatar/media) — host owns the CDN + signing. */
  getAssetUrl(input: {
    media?: Media;
    defaultType?: 'avatar' | 'media' | 'post' | 'background';
    /** Image variation, e.g. 'compressed' | 'blur' (for PPV-locked previews). */
    variation?: string;
    /** Use the video poster frame. */
    poster?: boolean;
  }): string;
  /** Open the host's fullscreen media viewer. Optional. */
  openFullscreenMedia?(input: { index: number; mediaUrls: Array<{ url: string; type: 'image' | 'video' }> }): void;
  /** Open a host modal by key (e.g. SET_ALIAS_NAME, DELETE_ENTIRE_CHAT, CREATE_CUSTOM_LIST). */
  openModal?(key: string, payload?: unknown): void;
  /** Permission check (agency); default allow when omitted. */
  hasPermission?(subject: string): boolean;
  /** Toast notifications; no-op when omitted. */
  toast?: { success(msg: string): void; error(msg: string): void };
  /**
   * Fetch an embedded entity (post/product/channel/group) for EMBEDS bubbles.
   * The host owns the backend calls (GetSinglePost/Product/Channel/Group);
   * the library caches the result (4h) in the store's embeds. Returns the
   * entity object, or null if it can't be resolved.
   */
  fetchEmbed?(input: {
    entityId: string;
    subType?: 'POST' | 'PRODUCT' | 'CHANNEL' | 'GROUP' | 'VAULT' | string;
    creatorId?: string;
  }): Promise<unknown | null>;
  /**
   * Resolve signed full URLs for vault-backed chat media (paths starting
   * vault/post/hls/shop/chat-media). The host owns GetChatSignedUrl; the
   * library requests once per completed-media set. Returns a map of
   * mediaId → signed URL. Omit to fall back to getAssetUrl for everything.
   */
  getSignedMediaUrls?(input: { mediaIds: string[]; creatorId?: string }): Promise<Record<string, string>>;
  /** Open the host's vault picker; resolves with the chosen media. Optional. */
  openVault?(input: { readonly?: boolean; creatorId?: string }): Promise<{ medias: Media[] }>;
  /** Fire a host analytics event (GA4/GTM). No-op when omitted. */
  trackEvent?(event: Record<string, unknown>): void;
  /**
   * Fetch the target's active CHAT-FEE services (core chat-fee gating).
   * Wraps the host's GetServiceList. Returns [] when the caller can't chat for
   * free → the composer opens the host's chat-fee modal instead of sending.
   */
  getChatServices?(input: { userId: string; role?: string }): Promise<Array<{ is_active?: boolean; chat_fee_type?: string; price?: number; [k: string]: any }>>;
}

// ---------------------------------------------------------------------------
// Host API contract — the library never talks to the backend directly; the
// host app injects an implementation (its own axios/fetch client with auth).
// Every method takes an optional creatorId so agency can scope calls to the
// right creator token; core ignores it (there is only "__core__").
// ---------------------------------------------------------------------------

export interface ChatListParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface UnreadCounts {
  totalUnreadCount: number;
  channels: Array<{ channelId: string; unreadCount: number }>;
}

export interface IChatApiClient {
  /** Fetch the chat list (already sorted/filtered by the host as needed). */
  getChatList(params: ChatListParams, creatorId?: string): Promise<Chat[]>;
  /** Fetch a single channel's details — used when a message arrives on a
   *  channel not yet in the list. Return null if it can't be resolved. */
  getChannelDetails(channelId: string, creatorId?: string): Promise<Chat | null>;
  /** Optional bootstrap: unread counts seeded on connect. */
  getUnreadCounts?(creatorId?: string): Promise<UnreadCounts>;
  /** Optional bootstrap: converse member (userId↔channelId) pairs. */
  getConverseMembers?(creatorId?: string): Promise<ConversePair[]>;
  /**
   * Send a media/attachment message (device files and/or vault media, with an
   * optional unlock fee). The host owns the S3 upload + the backend call
   * (ChatMedia) + platform meta (sent_by/emp/chat_list_message). Text-only
   * messages go through the socket connection, not this method.
   */
  sendMediaMessage?(input: {
    channelId: string;
    creatorId?: string;
    message: string;
    files?: File[];
    vaultMediaIds?: string[];
    mediaFee?: number;
    replyMessage?: MessageInterface | null;
  }): Promise<void>;

  // Stats drawer (all optional; the drawer only renders when provided).
  /** Spend/subscription/notes summary for a fan. */
  getChatStats?(input: { userId: string; creatorId?: string }): Promise<ChatStatsInterface>;
  /** Persist the free-text notes for a fan. */
  updateNotes?(input: { userId: string; notes: string; creatorId?: string }): Promise<void>;
  /** Paginated user↔user transactions for the stats drawer. */
  getTransactionsBetweenUsers?(input: { targetUserId: string; page?: number; limit?: number; creatorId?: string }): Promise<Transactions[]>;
  /**
   * Shared-content gallery data for a channel, by category. Returns the raw
   * `data[]` array (shape varies per type — the gallery narrows what it renders).
   */
  getSharedContent?(input: {
    channelId: string;
    type: 'audio' | 'media' | 'channel' | 'post' | 'service';
    mediaSource?: 'vault' | 'direct-upload';
    page?: number;
    limit?: number;
    creatorId?: string;
  }): Promise<any[]>;
}

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
  /**
   * Return the plaintext converse (socket) token for a creator.
   *
   * The host owns the full flow: log in as the creator, request the converse
   * token, and AES-decrypt it. The library never sees the creator API token,
   * the encrypted payload, or the decrypt key — the host's own API client
   * handles request auth, and the host manages token renewal.
   */
  getConverseToken(creatorId: string): Promise<string>;
  /** Optional: verify the converse token with the backend before connecting. */
  verifyConverseToken?(params: { projectId: string; token: string; creatorId: string }): Promise<void>;
}

// ---------------------------------------------------------------------------
// Platform configs
// ---------------------------------------------------------------------------

export interface BasePlatformConfig {
  apiEndpoint: string;
  converseProjectId: string;
  converseHost: string;
  features: Partial<ChatFeatures>;
  /** Host-provided API client — how the library reads chat data from the backend. */
  api: IChatApiClient;
  /** Host-provided integration services (assets, modals, permissions, toasts). */
  services: ChatHostServices;
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
  /** Host integration services (assets, modals, permissions, toasts). */
  getServices(): ChatHostServices;
  /** Host-provided API client (chat list, channel details, media send). */
  getApi(): IChatApiClient;

  // Convenience state reads (delegates to Zustand)
  getChatList(creatorId?: string): Chat[];
  getMessages(channelId: string, creatorId?: string): MessageInterface[];
}
