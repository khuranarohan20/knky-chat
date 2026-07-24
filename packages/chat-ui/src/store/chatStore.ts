import { produce } from 'immer';
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

import type {
  Chat,
  ChatListCountInterface,
  ChatPerson,
  ChatTab,
  ConversePair,
  FilterInterface,
  Media,
  MessageInterface,
  Receipt,
} from '@knky-chat/core-chat';

// ---------------------------------------------------------------------------
// Per-creator state shape
// ---------------------------------------------------------------------------

export interface PinnedMessage {
  _id: string;
  messageId: string;
  channelId: string;
  message: MessageInterface;
  pinnedById: string;
  pinnedByName: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface CreatorChatState {
  // Chat list
  chatList: Chat[];
  chatListLoading: boolean;

  // Active channel
  activeChannelId: string;
  targetPerson: ChatPerson | null;

  // Messages — keyed by channelId
  completeMessagesByChatId: Record<string, MessageInterface[]>;
  isMessagesLoading: boolean;
  loadingMoreMessages: { upwards: boolean; downwards: boolean };

  // Pinned messages — keyed by channelId
  pinnedMessagesByChatId: Record<string, PinnedMessage[]>;

  // Auth
  converseToken: string;
  creatorToken: string;

  // Filters
  filter: FilterInterface;

  // Presence
  onlineUsers: Set<string>;
  offlineList: Record<string, string>; // userId -> expiry ISO string
  userToChannel: Record<string, string>; // userId -> channelId

  // Unread tracking
  totalUnreadCount: number;
  unreadChannels: Record<string, number>; // channelId -> count

  // Converse members (userId <-> channelId pairs)
  converseMembersList: ConversePair[];

  // Embedded entity cache (post/product/channel/group) for EMBEDS bubbles;
  // each item carries a `fetch_time` for the 4h TTL.
  embeds: Array<Record<string, any>>;

  // Tabs
  chatTabs: ChatTab[];
  tabCounts: Record<string, ChatListCountInterface>; // tab._id -> count

  // Composer
  replyMessage: { channelId: string; message: MessageInterface } | null;
  template: { message: string; price: number; vault_media_ids: Media[] };
}

// ---------------------------------------------------------------------------
// Top-level store shape
// ---------------------------------------------------------------------------

export interface ChatStore {
  // Multi-creator state — core uses "__core__" as the only key
  currentCreatorId: string | null;
  chatDataByCreator: Record<string, CreatorChatState>;

  // Global loading (agency: "loading all creators")
  completeChatLoading: boolean;

  // Shared content panel open/close
  showSharedContent: boolean;

  // ---------------------------------------------------------------------------
  // Selectors (convenience — derive from chatDataByCreator)
  // ---------------------------------------------------------------------------
  getCreatorState: (creatorId: string) => CreatorChatState;
  getActiveMessages: (creatorId: string) => MessageInterface[];

  // ---------------------------------------------------------------------------
  // Global actions
  // ---------------------------------------------------------------------------
  setCurrentCreatorId: (creatorId: string) => void;
  setCompleteChatLoading: (loading: boolean) => void;
  setShowSharedContent: (show: boolean) => void;

  // ---------------------------------------------------------------------------
  // Per-creator actions — all take creatorId as first arg
  // ---------------------------------------------------------------------------

  /** Ensure a creator slot exists with initial state */
  initCreator: (creatorId: string) => void;
  /** Remove a creator's entire state (e.g., on logout / creator switch) */
  removeCreator: (creatorId: string) => void;

  // Chat list
  setChatList: (creatorId: string, chatList: Chat[]) => void;
  updateChat: (creatorId: string, channelId: string, patch: Partial<Chat>) => void;
  prependChat: (creatorId: string, chat: Chat) => void;
  setChatListLoading: (creatorId: string, loading: boolean) => void;

  // Active channel
  setActiveChannelId: (creatorId: string, channelId: string) => void;
  setTargetPerson: (creatorId: string, person: ChatPerson | null) => void;

  // Messages
  setMessages: (creatorId: string, channelId: string, messages: MessageInterface[]) => void;
  appendMessages: (creatorId: string, channelId: string, messages: MessageInterface[]) => void;
  prependMessages: (creatorId: string, channelId: string, messages: MessageInterface[]) => void;
  addMessage: (creatorId: string, channelId: string, message: MessageInterface) => void;
  editMessage: (creatorId: string, channelId: string, messageId: string, patch: Partial<MessageInterface>) => void;
  deleteMessage: (creatorId: string, channelId: string, messageId: string) => void;
  updateMessageReceipts: (creatorId: string, channelId: string, messageId: string, receipt: Receipt) => void;
  markAllSeen: (creatorId: string, channelId: string, targetUserId: string, firstUnseenTimestamp: string) => void;
  setMessagesLoading: (creatorId: string, loading: boolean) => void;
  setMoreMessagesLoading: (creatorId: string, direction: 'upwards' | 'downwards', loading: boolean) => void;

  // Pinned messages
  setPinnedMessages: (creatorId: string, channelId: string, pins: PinnedMessage[]) => void;
  addPinnedMessage: (creatorId: string, channelId: string, pin: PinnedMessage) => void;
  removePinnedMessage: (creatorId: string, channelId: string, pinId: string) => void;

  // Auth tokens
  setConverseToken: (creatorId: string, token: string) => void;
  setCreatorToken: (creatorId: string, token: string) => void;

  // Filter
  setFilter: (creatorId: string, filter: Partial<FilterInterface>) => void;

  // Presence
  addOnlineUser: (creatorId: string, userId: string) => void;
  removeOnlineUser: (creatorId: string, userId: string) => void;
  setOfflineUser: (creatorId: string, userId: string, expiryAt: string) => void;
  clearOfflineUser: (creatorId: string, userId: string) => void;
  setUserToChannel: (creatorId: string, userId: string, channelId: string) => void;

  // Unread
  setTotalUnreadCount: (creatorId: string, count: number) => void;
  setUnreadChannels: (creatorId: string, channels: Record<string, number>) => void;
  incrementChannelUnread: (creatorId: string, channelId: string) => void;
  clearChannelUnread: (creatorId: string, channelId: string) => void;
  decrementChannelUnread: (creatorId: string, channelId: string) => void;

  // Converse members
  setConverseMembersList: (creatorId: string, members: ConversePair[]) => void;

  // Embeds cache (upsert by _id, stamps fetch_time)
  setEmbed: (creatorId: string, embed: Record<string, any>) => void;

  // Tabs
  setChatTabs: (creatorId: string, tabs: ChatTab[]) => void;
  setTabCount: (creatorId: string, tabId: string, count: ChatListCountInterface) => void;

  // Composer
  setReplyMessage: (creatorId: string, reply: { channelId: string; message: MessageInterface } | null) => void;
  setTemplate: (creatorId: string, template: { message: string; price: number; vault_media_ids: Media[] }) => void;
}

// ---------------------------------------------------------------------------
// Initial per-creator state
// ---------------------------------------------------------------------------

function initialCreatorState(): CreatorChatState {
  return {
    chatList: [],
    chatListLoading: false,
    activeChannelId: '',
    targetPerson: null,
    completeMessagesByChatId: {},
    isMessagesLoading: false,
    loadingMoreMessages: { upwards: false, downwards: false },
    pinnedMessagesByChatId: {},
    converseToken: '',
    creatorToken: '',
    filter: { readStatus: 'all', conversationStatus: 'all', fanType: 'all', spendRanks: 'all' },
    onlineUsers: new Set(),
    offlineList: {},
    userToChannel: {},
    totalUnreadCount: 0,
    unreadChannels: {},
    converseMembersList: [],
    embeds: [],
    chatTabs: [],
    tabCounts: {},
    replyMessage: null,
    template: { message: '', price: 0, vault_media_ids: [] },
  };
}

// ---------------------------------------------------------------------------
// Helper: get message id with dual-field fallback
// ---------------------------------------------------------------------------

function msgId(m: MessageInterface): string {
  return m._id || m.messageId || (m as any).message_id || '';
}

// ---------------------------------------------------------------------------
// Helpers to safely access creator state
// ---------------------------------------------------------------------------

function ensureCreator(draft: ChatStore, creatorId: string): void {
  if (!draft.chatDataByCreator[creatorId]) {
    draft.chatDataByCreator[creatorId] = initialCreatorState();
  }
}

function getC(draft: ChatStore, creatorId: string): CreatorChatState {
  ensureCreator(draft, creatorId);
  return draft.chatDataByCreator[creatorId];
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useChatStore = create<ChatStore>()(
  subscribeWithSelector((set, get) => ({
    currentCreatorId: null,
    chatDataByCreator: {},
    completeChatLoading: false,
    showSharedContent: false,

    // ---------------------------------------------------------------------------
    // Selectors
    // ---------------------------------------------------------------------------

    getCreatorState: (creatorId) =>
      get().chatDataByCreator[creatorId] ?? initialCreatorState(),

    getActiveMessages: (creatorId) => {
      const s = get().chatDataByCreator[creatorId];
      if (!s) return [];
      return s.completeMessagesByChatId[s.activeChannelId] ?? [];
    },

    // ---------------------------------------------------------------------------
    // Global
    // ---------------------------------------------------------------------------

    setCurrentCreatorId: (creatorId) =>
      set(
        produce((draft: ChatStore) => {
          draft.currentCreatorId = creatorId;
          ensureCreator(draft, creatorId);
        }),
      ),

    setCompleteChatLoading: (loading) =>
      set(produce((draft: ChatStore) => { draft.completeChatLoading = loading; })),

    setShowSharedContent: (show) =>
      set(produce((draft: ChatStore) => { draft.showSharedContent = show; })),

    // ---------------------------------------------------------------------------
    // Creator lifecycle
    // ---------------------------------------------------------------------------

    initCreator: (creatorId) =>
      set(
        produce((draft: ChatStore) => {
          ensureCreator(draft, creatorId);
        }),
      ),

    removeCreator: (creatorId) =>
      set(
        produce((draft: ChatStore) => {
          delete draft.chatDataByCreator[creatorId];
          if (draft.currentCreatorId === creatorId) draft.currentCreatorId = null;
        }),
      ),

    // ---------------------------------------------------------------------------
    // Chat list
    // ---------------------------------------------------------------------------

    setChatList: (creatorId, chatList) =>
      set(
        produce((draft: ChatStore) => {
          getC(draft, creatorId).chatList = chatList;
        }),
      ),

    updateChat: (creatorId, channelId, patch) =>
      set(
        produce((draft: ChatStore) => {
          const c = getC(draft, creatorId);
          const idx = c.chatList.findIndex((ch) => ch.converse_channel_id === channelId);
          if (idx !== -1) Object.assign(c.chatList[idx], patch);
        }),
      ),

    prependChat: (creatorId, chat) =>
      set(
        produce((draft: ChatStore) => {
          const c = getC(draft, creatorId);
          const exists = c.chatList.findIndex(
            (ch) => ch.converse_channel_id === chat.converse_channel_id,
          );
          if (exists === -1) c.chatList.unshift(chat);
        }),
      ),

    setChatListLoading: (creatorId, loading) =>
      set(
        produce((draft: ChatStore) => {
          getC(draft, creatorId).chatListLoading = loading;
        }),
      ),

    // ---------------------------------------------------------------------------
    // Active channel
    // ---------------------------------------------------------------------------

    setActiveChannelId: (creatorId, channelId) =>
      set(
        produce((draft: ChatStore) => {
          getC(draft, creatorId).activeChannelId = channelId;
        }),
      ),

    setTargetPerson: (creatorId, person) =>
      set(
        produce((draft: ChatStore) => {
          getC(draft, creatorId).targetPerson = person;
        }),
      ),

    // ---------------------------------------------------------------------------
    // Messages
    // ---------------------------------------------------------------------------

    setMessages: (creatorId, channelId, messages) =>
      set(
        produce((draft: ChatStore) => {
          getC(draft, creatorId).completeMessagesByChatId[channelId] = messages;
        }),
      ),

    appendMessages: (creatorId, channelId, incoming) =>
      set(
        produce((draft: ChatStore) => {
          const c = getC(draft, creatorId);
          const existing = c.completeMessagesByChatId[channelId] ?? [];
          const existingIds = new Set(existing.map(msgId));
          const fresh = incoming.filter((m) => !existingIds.has(msgId(m)));
          c.completeMessagesByChatId[channelId] = [...existing, ...fresh];
        }),
      ),

    prependMessages: (creatorId, channelId, incoming) =>
      set(
        produce((draft: ChatStore) => {
          const c = getC(draft, creatorId);
          const existing = c.completeMessagesByChatId[channelId] ?? [];
          const existingIds = new Set(existing.map(msgId));
          const fresh = incoming.filter((m) => !existingIds.has(msgId(m)));
          c.completeMessagesByChatId[channelId] = [...fresh, ...existing];
        }),
      ),

    addMessage: (creatorId, channelId, message) =>
      set(
        produce((draft: ChatStore) => {
          const c = getC(draft, creatorId);
          const list = (c.completeMessagesByChatId[channelId] ??= []);
          const id = msgId(message);
          if (!list.some((m) => msgId(m) === id)) {
            list.push(message);
          }

          // Bubble message to top of chat list
          const chatIdx = c.chatList.findIndex((ch) => ch.converse_channel_id === channelId);
          if (chatIdx > 0) {
            const [chat] = c.chatList.splice(chatIdx, 1);
            c.chatList.unshift(chat);
          }
        }),
      ),

    editMessage: (creatorId, channelId, messageId, patch) =>
      set(
        produce((draft: ChatStore) => {
          const list = getC(draft, creatorId).completeMessagesByChatId[channelId];
          if (!list) return;
          const idx = list.findIndex((m) => msgId(m) === messageId);
          if (idx !== -1) Object.assign(list[idx], patch);
        }),
      ),

    deleteMessage: (creatorId, channelId, messageId) =>
      set(
        produce((draft: ChatStore) => {
          const c = getC(draft, creatorId);
          const list = c.completeMessagesByChatId[channelId];
          if (!list) return;
          c.completeMessagesByChatId[channelId] = list.filter((m) => msgId(m) !== messageId);
        }),
      ),

    updateMessageReceipts: (creatorId, channelId, messageId, receipt) =>
      set(
        produce((draft: ChatStore) => {
          const list = getC(draft, creatorId).completeMessagesByChatId[channelId];
          if (!list) return;
          const msg = list.find((m) => msgId(m) === messageId);
          if (!msg) return;
          const existing = msg.receipts ?? [];
          // Use userId || user_id dual-field — normalise to userId for dedup
          const userId = receipt.userId ?? receipt.user_id ?? '';
          const idx = existing.findIndex((r) => (r.userId ?? r.user_id) === userId);
          if (idx === -1) {
            existing.push(receipt);
          } else {
            Object.assign(existing[idx], receipt);
          }
          msg.receipts = existing;
        }),
      ),

    markAllSeen: (creatorId, channelId, targetUserId, firstUnseenTimestamp) =>
      set(
        produce((draft: ChatStore) => {
          const list = getC(draft, creatorId).completeMessagesByChatId[channelId];
          if (!list) return;
          for (const msg of list) {
            if (msg.sender_id === targetUserId || msg.sid === targetUserId) continue;
            const existing = msg.receipts ?? [];
            const hasEntry = existing.some((r) => (r.userId ?? r.user_id) === targetUserId);
            if (!hasEntry) {
              existing.push({
                userId: targetUserId,
                status: 'seen',
                timestamp: firstUnseenTimestamp,
              });
              msg.receipts = existing;
            }
          }
        }),
      ),

    setMessagesLoading: (creatorId, loading) =>
      set(
        produce((draft: ChatStore) => {
          getC(draft, creatorId).isMessagesLoading = loading;
        }),
      ),

    setMoreMessagesLoading: (creatorId, direction, loading) =>
      set(
        produce((draft: ChatStore) => {
          getC(draft, creatorId).loadingMoreMessages[direction] = loading;
        }),
      ),

    // ---------------------------------------------------------------------------
    // Pinned messages
    // ---------------------------------------------------------------------------

    setPinnedMessages: (creatorId, channelId, pins) =>
      set(
        produce((draft: ChatStore) => {
          getC(draft, creatorId).pinnedMessagesByChatId[channelId] = pins;
        }),
      ),

    addPinnedMessage: (creatorId, channelId, pin) =>
      set(
        produce((draft: ChatStore) => {
          const c = getC(draft, creatorId);
          const list = (c.pinnedMessagesByChatId[channelId] ??= []);
          if (!list.some((p) => p._id === pin._id)) {
            list.push(pin);
            list.sort(
              (a, b) =>
                new Date(b.message?.createdAt ?? 0).getTime() -
                new Date(a.message?.createdAt ?? 0).getTime(),
            );
          }
        }),
      ),

    removePinnedMessage: (creatorId, channelId, pinId) =>
      set(
        produce((draft: ChatStore) => {
          const c = getC(draft, creatorId);
          const list = c.pinnedMessagesByChatId[channelId];
          if (list) {
            c.pinnedMessagesByChatId[channelId] = list.filter((p) => p._id !== pinId);
          }
        }),
      ),

    // ---------------------------------------------------------------------------
    // Auth tokens
    // ---------------------------------------------------------------------------

    setConverseToken: (creatorId, token) =>
      set(
        produce((draft: ChatStore) => {
          getC(draft, creatorId).converseToken = token;
        }),
      ),

    setCreatorToken: (creatorId, token) =>
      set(
        produce((draft: ChatStore) => {
          getC(draft, creatorId).creatorToken = token;
        }),
      ),

    // ---------------------------------------------------------------------------
    // Filter
    // ---------------------------------------------------------------------------

    setFilter: (creatorId, filter) =>
      set(
        produce((draft: ChatStore) => {
          const c = getC(draft, creatorId);
          Object.assign(c.filter, filter);
        }),
      ),

    // ---------------------------------------------------------------------------
    // Presence
    // ---------------------------------------------------------------------------

    addOnlineUser: (creatorId, userId) =>
      set(
        produce((draft: ChatStore) => {
          getC(draft, creatorId).onlineUsers.add(userId);
        }),
      ),

    removeOnlineUser: (creatorId, userId) =>
      set(
        produce((draft: ChatStore) => {
          getC(draft, creatorId).onlineUsers.delete(userId);
        }),
      ),

    setOfflineUser: (creatorId, userId, expiryAt) =>
      set(
        produce((draft: ChatStore) => {
          getC(draft, creatorId).offlineList[userId] = expiryAt;
        }),
      ),

    clearOfflineUser: (creatorId, userId) =>
      set(
        produce((draft: ChatStore) => {
          const c = getC(draft, creatorId);
          delete c.offlineList[userId];
        }),
      ),

    setUserToChannel: (creatorId, userId, channelId) =>
      set(
        produce((draft: ChatStore) => {
          getC(draft, creatorId).userToChannel[userId] = channelId;
        }),
      ),

    // ---------------------------------------------------------------------------
    // Unread
    // ---------------------------------------------------------------------------

    setTotalUnreadCount: (creatorId, count) =>
      set(
        produce((draft: ChatStore) => {
          getC(draft, creatorId).totalUnreadCount = count;
        }),
      ),

    setUnreadChannels: (creatorId, channels) =>
      set(
        produce((draft: ChatStore) => {
          getC(draft, creatorId).unreadChannels = channels;
        }),
      ),

    incrementChannelUnread: (creatorId, channelId) =>
      set(
        produce((draft: ChatStore) => {
          const c = getC(draft, creatorId);
          c.unreadChannels[channelId] = (c.unreadChannels[channelId] ?? 0) + 1;
        }),
      ),

    clearChannelUnread: (creatorId, channelId) =>
      set(
        produce((draft: ChatStore) => {
          const c = getC(draft, creatorId);
          delete c.unreadChannels[channelId];

          // Reflect in chat list
          const chat = c.chatList.find((ch) => ch.converse_channel_id === channelId);
          if (chat) chat.unreadCount = 0;
        }),
      ),

    decrementChannelUnread: (creatorId, channelId) =>
      set(
        produce((draft: ChatStore) => {
          const c = getC(draft, creatorId);
          if (c.unreadChannels[channelId]) {
            c.unreadChannels[channelId] = Math.max(0, c.unreadChannels[channelId] - 1);
          }
        }),
      ),

    // ---------------------------------------------------------------------------
    // Converse members
    // ---------------------------------------------------------------------------

    setConverseMembersList: (creatorId, members) =>
      set(
        produce((draft: ChatStore) => {
          getC(draft, creatorId).converseMembersList = members;
        }),
      ),

    setEmbed: (creatorId, embed) =>
      set(
        produce((draft: ChatStore) => {
          const c = getC(draft, creatorId);
          const stamped = { ...embed, fetch_time: embed.fetch_time ?? Date.now() };
          const idx = c.embeds.findIndex((e) => e._id === embed._id);
          if (idx === -1) c.embeds.push(stamped);
          else c.embeds[idx] = stamped;
        }),
      ),

    // ---------------------------------------------------------------------------
    // Tabs
    // ---------------------------------------------------------------------------

    setChatTabs: (creatorId, tabs) =>
      set(
        produce((draft: ChatStore) => {
          getC(draft, creatorId).chatTabs = tabs;
        }),
      ),

    setTabCount: (creatorId, tabId, count) =>
      set(
        produce((draft: ChatStore) => {
          getC(draft, creatorId).tabCounts[tabId] = count;
        }),
      ),

    // ---------------------------------------------------------------------------
    // Composer
    // ---------------------------------------------------------------------------

    setReplyMessage: (creatorId, reply) =>
      set(
        produce((draft: ChatStore) => {
          getC(draft, creatorId).replyMessage = reply;
        }),
      ),

    setTemplate: (creatorId, template) =>
      set(
        produce((draft: ChatStore) => {
          getC(draft, creatorId).template = template;
        }),
      ),
  })),
);

// ---------------------------------------------------------------------------
// Typed selector hooks — avoids re-render when unrelated state changes.
//
// IMPORTANT: fallbacks MUST be stable module-level references. Returning a
// fresh `[]` / `{}` / `new Set()` from a selector on every call makes Zustand's
// useSyncExternalStore snapshot change identity every render → infinite loop
// ("getSnapshot should be cached"). Use the shared constants below.
// ---------------------------------------------------------------------------

const EMPTY_CHATS: Chat[] = [];
const EMPTY_MESSAGES: MessageInterface[] = [];
const EMPTY_PINS: PinnedMessage[] = [];
const EMPTY_ONLINE: Set<string> = new Set<string>();
const EMPTY_EMBEDS: Array<Record<string, any>> = [];
const DEFAULT_FILTER: FilterInterface = {
  readStatus: 'all',
  conversationStatus: 'all',
  fanType: 'all',
  spendRanks: 'all',
};
const DEFAULT_MORE: { upwards: boolean; downwards: boolean } = { upwards: false, downwards: false };

export const useChatList = (creatorId: string) =>
  useChatStore((s) => s.chatDataByCreator[creatorId]?.chatList ?? EMPTY_CHATS);

export const useActiveMessages = (creatorId: string) =>
  useChatStore((s) => {
    const d = s.chatDataByCreator[creatorId];
    return d ? (d.completeMessagesByChatId[d.activeChannelId] ?? EMPTY_MESSAGES) : EMPTY_MESSAGES;
  });

export const usePinnedMessages = (creatorId: string, channelId: string) =>
  useChatStore((s) => s.chatDataByCreator[creatorId]?.pinnedMessagesByChatId[channelId] ?? EMPTY_PINS);

export const useMessagesLoading = (creatorId: string) =>
  useChatStore((s) => s.chatDataByCreator[creatorId]?.isMessagesLoading ?? false);

export const useChatListLoading = (creatorId: string) =>
  useChatStore((s) => s.chatDataByCreator[creatorId]?.chatListLoading ?? false);

export const useMoreMessagesLoading = (creatorId: string) =>
  useChatStore((s) => s.chatDataByCreator[creatorId]?.loadingMoreMessages ?? DEFAULT_MORE);

export const useTargetPerson = (creatorId: string) =>
  useChatStore((s) => s.chatDataByCreator[creatorId]?.targetPerson ?? null);

export const useActiveChannelId = (creatorId: string) =>
  useChatStore((s) => s.chatDataByCreator[creatorId]?.activeChannelId ?? '');

export const useChatFilter = (creatorId: string) =>
  useChatStore((s) => s.chatDataByCreator[creatorId]?.filter ?? DEFAULT_FILTER);

export const useTotalUnreadCount = (creatorId: string) =>
  useChatStore((s) => s.chatDataByCreator[creatorId]?.totalUnreadCount ?? 0);

export const useOnlineUsers = (creatorId: string) =>
  useChatStore((s) => s.chatDataByCreator[creatorId]?.onlineUsers ?? EMPTY_ONLINE);

export const useEmbeds = (creatorId: string) =>
  useChatStore((s) => s.chatDataByCreator[creatorId]?.embeds ?? EMPTY_EMBEDS);

const DEFAULT_TEMPLATE: { message: string; price: number; vault_media_ids: Media[] } = { message: '', price: 0, vault_media_ids: [] };

export const useReplyMessage = (creatorId: string) =>
  useChatStore((s) => s.chatDataByCreator[creatorId]?.replyMessage ?? null);

export const useTemplate = (creatorId: string) =>
  useChatStore((s) => s.chatDataByCreator[creatorId]?.template ?? DEFAULT_TEMPLATE);
