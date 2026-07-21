import {
  CORE_CREATOR_ID,
  ChatConnection,
  FLUSH_MS_CORE,
  MAX_PIN_CORE,
} from '@knky-chat/core-chat';
import type { Chat, MessageInterface, MetaInterface } from '@knky-chat/core-chat';
import { SocketEventBridge, useChatStore } from '@knky-chat/chat-ui';
import type { IPlatformAdapter, ChatFeatures, CorePlatformConfig } from '@knky-chat/chat-ui';

const DEFAULT_FEATURES: ChatFeatures = {
  multiCreatorSupport: false,
  advancedFilters: true,
  statistics: true,
  sharedContent: true,
  streamMessages: true,
  sessionTracking: false,
  massMessages: false,
  customFanLists: false,
};

/**
 * CoreAdapter: single-creator adapter for knky-frontend (Next.js + Bootstrap).
 *
 * Uses "__core__" as the fixed creatorId throughout so the Zustand store's
 * nested-by-creator shape works identically to the agency adapter.
 */
export class CoreAdapter implements IPlatformAdapter {
  readonly platformType = 'core' as const;

  private connection: ChatConnection;
  private bridge: SocketEventBridge | null = null;
  private features: ChatFeatures;

  constructor(private config: CorePlatformConfig) {
    this.connection = new ChatConnection();
    this.features = { ...DEFAULT_FEATURES, ...config.features };
  }

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  async initialize(): Promise<void> {
    const store = useChatStore.getState();
    store.initCreator(CORE_CREATOR_ID);
    store.setCurrentCreatorId(CORE_CREATOR_ID);

    // 1. Get or refresh converse token
    let token: string;
    try {
      token = await this.config.auth.getConverseToken();
      await this.config.auth.verifyConverseToken({
        projectId: this.config.converseProjectId,
        token,
      });
    } catch {
      token = await this.config.auth.getConverseToken();
    }
    store.setConverseToken(CORE_CREATOR_ID, token);

    // 2. Mount bridge before initializing connection so all callbacks fire
    this.bridge = new SocketEventBridge(this.connection, {
      creatorId: CORE_CREATOR_ID,
      currentUserId: '',  // set from unreadCount bootstrap
      flushMs: FLUSH_MS_CORE,
      onFetchChannelDetails: this.fetchChannelDetails.bind(this),
      onShouldShowChat: this.shouldShowChat.bind(this),
    });
    this.bridge.mount();

    // 3. Initialize socket
    await this.connection.init({
      ConverseClass: this.config.ConverseClass,
      projectId: this.config.converseProjectId,
      token,
      serverUrl: this.config.converseHost,
    });
  }

  destroy(): void {
    this.bridge?.unmount();
    this.connection.disconnect();
    useChatStore.getState().removeCreator(CORE_CREATOR_ID);
  }

  // ---------------------------------------------------------------------------
  // Creator (core always has exactly one)
  // ---------------------------------------------------------------------------

  getCreatorId(): string {
    return CORE_CREATOR_ID;
  }

  // ---------------------------------------------------------------------------
  // Connection + bridge access
  // ---------------------------------------------------------------------------

  getConnection(): ChatConnection {
    return this.connection;
  }

  getBridge(): SocketEventBridge | undefined {
    return this.bridge ?? undefined;
  }

  // ---------------------------------------------------------------------------
  // Meta enrichment — core passes through unchanged
  // ---------------------------------------------------------------------------

  enrichMeta(meta: Partial<MetaInterface>): Partial<MetaInterface> {
    return meta;
  }

  // ---------------------------------------------------------------------------
  // Platform config
  // ---------------------------------------------------------------------------

  getMaxPinMessages(): number {
    return MAX_PIN_CORE;
  }

  getFlushMs(): number {
    return FLUSH_MS_CORE;
  }

  isFeatureEnabled(feature: keyof ChatFeatures): boolean {
    return this.features[feature] ?? false;
  }

  // ---------------------------------------------------------------------------
  // State reads (delegates to Zustand)
  // ---------------------------------------------------------------------------

  getChatList(): Chat[] {
    return useChatStore.getState().getCreatorState(CORE_CREATOR_ID).chatList;
  }

  getMessages(channelId: string): MessageInterface[] {
    return (
      useChatStore.getState().getCreatorState(CORE_CREATOR_ID)
        .completeMessagesByChatId[channelId] ?? []
    );
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private async fetchChannelDetails(channelId: string): Promise<Chat | null> {
    // The host app's API client handles this — we call back via config.
    // For now return null; CoreAdapter consumers should override if needed.
    void channelId;
    return null;
  }

  private shouldShowChat(chat: Chat): boolean {
    const filter = useChatStore
      .getState()
      .getCreatorState(CORE_CREATOR_ID).filter;

    if (filter.readStatus === 'online') return false; // caller handles online filter
    if (filter.readStatus === 'unread') return (chat.unreadCount ?? 0) > 0 || chat.mark_as_unread;
    if (filter.readStatus === 'read') return (chat.unreadCount ?? 0) === 0 && !chat.mark_as_unread;

    return true;
  }
}
