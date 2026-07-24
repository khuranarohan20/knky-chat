import {
  ConnectionManager,
  FLUSH_MS_AGENCY,
  MAX_PIN_AGENCY,
} from '@knky-chat/core-chat';
import type { Chat, MessageInterface, MetaInterface } from '@knky-chat/core-chat';
import { SocketEventBridge, useChatStore } from '@knky-chat/chat-ui';
import type { IPlatformAdapter, ChatFeatures, AgencyPlatformConfig } from '@knky-chat/chat-ui';

const DEFAULT_FEATURES: ChatFeatures = {
  multiCreatorSupport: true,
  advancedFilters: true,
  statistics: true,
  sharedContent: true,
  streamMessages: false,
  sessionTracking: false,
  massMessages: true,
  customFanLists: true,
};

/**
 * AgencyAdapter: multi-creator adapter for knky-agency-frontend (React + Vite + Tailwind).
 *
 * Each managed creator gets its own ChatConnection + SocketEventBridge.
 * Agency enriches every outbound message with `sent_by: "agency"` and
 * `emp: btoa({id, name})` so the server knows it came from an agent.
 */
export class AgencyAdapter implements IPlatformAdapter {
  readonly platformType = 'agency' as const;

  private manager = new ConnectionManager();
  private bridges = new Map<string, SocketEventBridge>();
  private activeCreatorId: string;
  private features: ChatFeatures;
  private emp: string;

  constructor(private config: AgencyPlatformConfig) {
    this.features = { ...DEFAULT_FEATURES, ...config.features };
    this.activeCreatorId = config.creatorIds[0] ?? '';
    this.emp = btoa(JSON.stringify({ id: config.agentId, name: config.agentName }));
  }

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  async initialize(): Promise<void> {
    const store = useChatStore.getState();
    store.setCompleteChatLoading(true);

    try {
      // Initialize all creators in parallel
      await Promise.all(this.config.creatorIds.map((id) => this.initCreator(id)));

      if (this.activeCreatorId) {
        store.setCurrentCreatorId(this.activeCreatorId);
      }
    } finally {
      store.setCompleteChatLoading(false);
    }
  }

  destroy(): void {
    for (const bridge of this.bridges.values()) {
      bridge.unmount();
    }
    this.bridges.clear();
    this.manager.disconnectAll();
    useChatStore.getState().setCompleteChatLoading(false);
  }

  // ---------------------------------------------------------------------------
  // Creator management
  // ---------------------------------------------------------------------------

  getCreatorId(): string {
    return this.activeCreatorId;
  }

  getCreatorIds(): string[] {
    return this.config.creatorIds;
  }

  async switchCreator(creatorId: string): Promise<void> {
    if (!this.config.creatorIds.includes(creatorId)) {
      throw new Error(`AgencyAdapter: unknown creatorId "${creatorId}"`);
    }

    this.activeCreatorId = creatorId;
    useChatStore.getState().setCurrentCreatorId(creatorId);

    // Ensure this creator's socket is initialized
    if (!this.manager.has(creatorId)) {
      await this.initCreator(creatorId);
    }
  }

  // ---------------------------------------------------------------------------
  // Connection + bridge access
  // ---------------------------------------------------------------------------

  getConnection(creatorId?: string) {
    return this.manager.get(creatorId ?? this.activeCreatorId);
  }

  getConnectionManager() {
    return this.manager;
  }

  getBridge(creatorId?: string): SocketEventBridge | undefined {
    return this.bridges.get(creatorId ?? this.activeCreatorId);
  }

  // ---------------------------------------------------------------------------
  // Meta enrichment — agency adds sent_by + emp to every outbound message
  // ---------------------------------------------------------------------------

  enrichMeta(meta: Partial<MetaInterface>): Partial<MetaInterface> {
    return {
      ...meta,
      sent_by: 'agency',
      emp: this.emp,
    };
  }

  // ---------------------------------------------------------------------------
  // Platform config
  // ---------------------------------------------------------------------------

  getMaxPinMessages(): number {
    return MAX_PIN_AGENCY;
  }

  getFlushMs(): number {
    return FLUSH_MS_AGENCY;
  }

  isFeatureEnabled(feature: keyof ChatFeatures): boolean {
    return this.features[feature] ?? false;
  }

  getServices() {
    return this.config.services;
  }

  getApi() {
    return this.config.api;
  }

  // ---------------------------------------------------------------------------
  // State reads
  // ---------------------------------------------------------------------------

  getChatList(creatorId?: string): Chat[] {
    const id = creatorId ?? this.activeCreatorId;
    return useChatStore.getState().getCreatorState(id).chatList;
  }

  getMessages(channelId: string, creatorId?: string): MessageInterface[] {
    const id = creatorId ?? this.activeCreatorId;
    return useChatStore.getState().getCreatorState(id).completeMessagesByChatId[channelId] ?? [];
  }

  // ---------------------------------------------------------------------------
  // Private — per-creator initialization
  // ---------------------------------------------------------------------------

  private async initCreator(creatorId: string): Promise<void> {
    const store = useChatStore.getState();
    store.initCreator(creatorId);

    // 1. Get the plaintext converse token (host logs in as the creator,
    //    requests the token, and decrypts it — all internal to the host).
    const converseToken = await this.config.auth.getConverseToken(creatorId);
    store.setConverseToken(creatorId, converseToken);
    await this.config.auth.verifyConverseToken?.({
      projectId: this.config.converseProjectId,
      token: converseToken,
      creatorId,
    });

    // 2. Register the connection, mount the bridge, THEN init — so onReady and
    //    any init-time bootstrap events reach the bridge's callbacks rather
    //    than firing into the void (mirrors CoreAdapter's ordering).
    const connection = this.manager.create(creatorId);

    const bridge = new SocketEventBridge(connection, {
      creatorId,
      currentUserId: creatorId,
      flushMs: FLUSH_MS_AGENCY,
      onFetchChannelDetails: (channelId) => this.fetchChannelDetails(channelId, creatorId),
      onShouldShowChat: (chat) => this.shouldShowChat(chat, creatorId),
    });
    bridge.mount();
    this.bridges.set(creatorId, bridge);

    await connection.init({
      ConverseClass: this.config.ConverseClass,
      projectId: this.config.converseProjectId,
      token: converseToken,
      serverUrl: this.config.converseHost,
      agencyMeta: { sent_by: 'agency', emp: this.emp },
    });

    // Bootstrap this creator's chat data from the host API (scoped by creatorId)
    await this.bootstrap(creatorId);
  }

  /** Load a creator's chat list + unread counts + converse members. */
  private async bootstrap(creatorId: string): Promise<void> {
    const store = useChatStore.getState();
    const { api } = this.config;

    store.setChatListLoading(creatorId, true);
    try {
      const [chatList, unread, members] = await Promise.all([
        api.getChatList({}, creatorId),
        api.getUnreadCounts?.(creatorId) ?? Promise.resolve(null),
        api.getConverseMembers?.(creatorId) ?? Promise.resolve(null),
      ]);

      store.setChatList(creatorId, chatList);

      if (unread) {
        store.setTotalUnreadCount(creatorId, unread.totalUnreadCount);
        const map: Record<string, number> = {};
        unread.channels.forEach((c) => { map[c.channelId] = c.unreadCount; });
        store.setUnreadChannels(creatorId, map);
      }

      if (members) {
        store.setConverseMembersList(creatorId, members);
      }
    } finally {
      store.setChatListLoading(creatorId, false);
    }
  }

  private async fetchChannelDetails(channelId: string, creatorId: string): Promise<Chat | null> {
    return this.config.api.getChannelDetails(channelId, creatorId);
  }

  private shouldShowChat(chat: Chat, creatorId: string): boolean {
    const filter = useChatStore.getState().getCreatorState(creatorId).filter;
    if (filter.readStatus === 'online') return false;
    if (filter.readStatus === 'unread') return (chat.unreadCount ?? 0) > 0 || chat.mark_as_unread;
    if (filter.readStatus === 'read') return (chat.unreadCount ?? 0) === 0 && !chat.mark_as_unread;
    return true;
  }
}
