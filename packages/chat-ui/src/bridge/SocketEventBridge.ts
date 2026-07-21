import type { ChatConnection, ChatConnectionCallbacks } from '@knky-chat/core-chat';
import type { Chat, ConversePair, MessageInterface, PinMessageResponse } from '@knky-chat/core-chat';
import { SeenReceiptQueue } from '@knky-chat/core-chat';
import type { PinnedMessage } from '../store/chatStore';
import { useChatStore } from '../store/chatStore';

// ---------------------------------------------------------------------------
// Bridge config
// ---------------------------------------------------------------------------

export interface SocketEventBridgeConfig {
  creatorId: string;
  currentUserId: string;
  flushMs: number;

  /**
   * Called when a new message arrives on a channel not in the chat list.
   * The bridge needs to fetch channel details to display the chat entry.
   */
  onFetchChannelDetails: (channelId: string) => Promise<Chat | null>;

  /**
   * Called when the bridge needs to check if a channel passes current filters.
   * Returns true if the chat should appear in the list.
   */
  onShouldShowChat?: (chat: Chat) => boolean;

  /**
   * Called when the connection is ready (post-init).
   */
  onReady?: () => void;

  /**
   * Called when connection is lost.
   */
  onLost?: () => void;

  /**
   * Called on any socket error.
   */
  onError?: (error: Error) => void;
}

// ---------------------------------------------------------------------------
// SocketEventBridge
// ---------------------------------------------------------------------------

/**
 * SocketEventBridge wires ChatConnection event callbacks to Zustand store actions.
 *
 * It is the only place in the system that has a dependency on both the socket
 * layer and the state layer. All business logic for "what does this event mean
 * for the UI state" lives here.
 *
 * One bridge instance per creator (core apps have one; agency apps have one
 * per managed creator).
 */
export class SocketEventBridge {
  private seenQueue: SeenReceiptQueue;
  private mounted = false;

  constructor(
    private connection: ChatConnection,
    private config: SocketEventBridgeConfig,
  ) {
    this.seenQueue = new SeenReceiptQueue(
      () => (this.connection as any).channel ?? null,
      config.flushMs,
    );
  }

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  mount(): void {
    if (this.mounted) return;
    this.mounted = true;

    const store = useChatStore.getState();
    store.initCreator(this.config.creatorId);

    this.connection.setCallbacks(this.buildCallbacks());
  }

  unmount(): void {
    if (!this.mounted) return;
    this.mounted = false;
    this.seenQueue.destroy();
    // Reset callbacks to no-ops so stale events from a closing connection
    // don't write to state after unmount
    this.connection.setCallbacks({});
  }

  /** Flush any pending seen receipts immediately (e.g. on channel close) */
  flushSeen(): void {
    this.seenQueue.flush();
  }

  /** Enqueue a message to be marked as seen */
  enqueueSeenMessage(messageId: string, senderId: string): void {
    this.seenQueue.enqueue(messageId, senderId);
  }

  // ---------------------------------------------------------------------------
  // Callback builder
  // ---------------------------------------------------------------------------

  private buildCallbacks(): ChatConnectionCallbacks {
    return {
      onReady: () => {
        this.config.onReady?.();
      },

      onLost: () => {
        this.config.onLost?.();
      },

      onError: (err) => {
        this.config.onError?.(err);
      },

      // -----------------------------------------------------------------------
      // Bootstrap data
      // -----------------------------------------------------------------------

      onUnreadCount: (data) => {
        const store = useChatStore.getState();
        const { creatorId } = this.config;

        store.setTotalUnreadCount(creatorId, data.totalUnreadCount);

        const channelMap: Record<string, number> = {};
        data.channels.forEach((c) => {
          channelMap[c.channelId] = c.unreadCount;
        });
        store.setUnreadChannels(creatorId, channelMap);
      },

      onConverseMembersList: (members: ConversePair[]) => {
        useChatStore.getState().setConverseMembersList(this.config.creatorId, members);
      },

      // -----------------------------------------------------------------------
      // Message loading states
      // -----------------------------------------------------------------------

      onMessagesLoading: (loading) => {
        useChatStore.getState().setMessagesLoading(this.config.creatorId, loading);
      },

      onMoreMessagesLoading: (direction, loading) => {
        useChatStore.getState().setMoreMessagesLoading(this.config.creatorId, direction, loading);
      },

      // -----------------------------------------------------------------------
      // Bulk message loads
      // -----------------------------------------------------------------------

      onMessagesLoaded: (messages) => {
        const store = useChatStore.getState();
        const { creatorId } = this.config;
        const channelId = store.getCreatorState(creatorId).activeChannelId;
        if (!channelId) return;
        store.setMessages(creatorId, channelId, messages);
      },

      onPrependMessages: (messages) => {
        const store = useChatStore.getState();
        const { creatorId } = this.config;
        const channelId = store.getCreatorState(creatorId).activeChannelId;
        if (!channelId) return;
        store.prependMessages(creatorId, channelId, messages);
      },

      onAppendMessages: (messages) => {
        const store = useChatStore.getState();
        const { creatorId } = this.config;
        const channelId = store.getCreatorState(creatorId).activeChannelId;
        if (!channelId) return;
        store.appendMessages(creatorId, channelId, messages);
      },

      // -----------------------------------------------------------------------
      // Active channel real-time events
      // -----------------------------------------------------------------------

      onMessage: (message) => {
        this.handleIncomingMessage(message);
      },

      onEditMessage: (channelId, message) => {
        const msgId = message._id || message.messageId;
        useChatStore.getState().editMessage(this.config.creatorId, channelId, msgId, {
          message: message.message,
          meta: message.meta,
          updatedAt: message.updatedAt,
        });
      },

      onDeleteMessage: (channelId, messageId) => {
        const { currentUserId, creatorId } = this.config;
        // Ignore delete_for targeting someone else — handled by meta.delete_for upstream
        useChatStore.getState().deleteMessage(creatorId, channelId, messageId);
        void currentUserId; // referenced for doc purposes
      },

      onSeenMessage: (channelId, messageId, receipt) => {
        useChatStore
          .getState()
          .updateMessageReceipts(this.config.creatorId, channelId, messageId, receipt);
      },

      onSeenAll: (channelId, firstUnseenTimestamp) => {
        const store = useChatStore.getState();
        const { creatorId } = this.config;
        const targetPerson = store.getCreatorState(creatorId).targetPerson;
        if (!targetPerson?._id) return;
        store.markAllSeen(creatorId, channelId, targetPerson._id, firstUnseenTimestamp);
      },

      onPinMessage: (channelId, res: PinMessageResponse) => {
        const pinPayload = (res as any).pinnedMsg;
        if (!pinPayload) return;

        const { creatorId, currentUserId } = this.config;
        const message: MessageInterface = pinPayload.message;
        const pin: PinnedMessage = {
          _id: pinPayload._id || pinPayload.pinId || '',
          messageId: message?._id || message?.messageId || '',
          channelId: pinPayload.channelId || channelId,
          message,
          pinnedById: currentUserId,
          pinnedByName: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          __v: 0,
        };
        useChatStore.getState().addPinnedMessage(creatorId, channelId, pin);
      },

      onUnpinMessage: (channelId, pinId) => {
        useChatStore.getState().removePinnedMessage(this.config.creatorId, channelId, pinId);
      },

      // -----------------------------------------------------------------------
      // Project-level events (channels NOT currently open)
      // -----------------------------------------------------------------------

      onProjectMessage: async (channelId, message) => {
        await this.handleProjectMessage(channelId, message);
      },

      onProjectMessageEdit: (channelId, edit) => {
        useChatStore
          .getState()
          .editMessage(this.config.creatorId, channelId, edit.messageId, {
            message: edit.message,
            meta: edit.meta,
          });
      },

      // -----------------------------------------------------------------------
      // Presence
      // -----------------------------------------------------------------------

      onUserOnline: (userId) => {
        const { creatorId } = this.config;
        const store = useChatStore.getState();
        // Cancel any pending offline removal
        this.connection.cancelOfflineRemoval(userId);
        store.clearOfflineUser(creatorId, userId);
        store.addOnlineUser(creatorId, userId);
      },

      onUserOffline: (userId, expiryAt) => {
        const { creatorId } = this.config;
        const store = useChatStore.getState();
        store.removeOnlineUser(creatorId, userId);
        store.setOfflineUser(creatorId, userId, expiryAt);
        // Delegate timer management to the connection (it has the cleanup hooks)
        this.connection.scheduleOfflineRemoval(userId, expiryAt);
      },

      onOfflineExpired: (userId) => {
        const { creatorId } = this.config;
        const store = useChatStore.getState();
        const channelId = store.getCreatorState(creatorId).userToChannel[userId];
        store.clearOfflineUser(creatorId, userId);

        // Remove chat from list only if filter is set to "online"
        const filter = store.getCreatorState(creatorId).filter;
        if (filter.readStatus === 'online' && channelId) {
          const chatList = store.getCreatorState(creatorId).chatList;
          store.setChatList(
            creatorId,
            chatList.filter((c) => c.converse_channel_id !== channelId),
          );
        }
      },
    };
  }

  // ---------------------------------------------------------------------------
  // Message routing helpers
  // ---------------------------------------------------------------------------

  private handleIncomingMessage(message: MessageInterface): void {
    const { creatorId, currentUserId } = this.config;
    const store = useChatStore.getState();
    const channelId = message.meta?.converseId || message.channel_id || '';

    if (!channelId) return;

    const activeChannelId = store.getCreatorState(creatorId).activeChannelId;

    // Mark as seen immediately if this is the currently open channel
    if (channelId === activeChannelId) {
      const msgId = message._id || message.messageId;
      const senderId = message.sender_id || message.sid || '';
      if (senderId !== currentUserId) {
        this.seenQueue.enqueue(msgId, senderId);
      }
      store.clearChannelUnread(creatorId, channelId);
    } else {
      // Increment unread for background channels
      if ((message.sender_id || message.sid) !== currentUserId) {
        store.incrementChannelUnread(creatorId, channelId);
      }
    }

    store.addMessage(creatorId, channelId, message);
  }

  private async handleProjectMessage(
    channelId: string,
    message: MessageInterface,
  ): Promise<void> {
    const { creatorId, currentUserId } = this.config;
    const store = useChatStore.getState();

    // Skip messages deleted for this user
    if (message.meta?.delete_for && message.meta.delete_for === currentUserId) return;

    const chatList = store.getCreatorState(creatorId).chatList;
    const existingChat = chatList.find((c) => c.converse_channel_id === channelId);

    if (existingChat) {
      // Channel already in list — apply filter check
      const passes = this.config.onShouldShowChat?.(existingChat) ?? true;
      if (!passes) return;

      store.addMessage(creatorId, channelId, message);
      if ((message.sender_id || message.sid) !== currentUserId) {
        store.incrementChannelUnread(creatorId, channelId);
      }
    } else if (message.isHuman) {
      // New human channel — fetch details and prepend to list
      try {
        const chat = await this.config.onFetchChannelDetails(channelId);
        if (!chat) return;

        const passes = this.config.onShouldShowChat?.(chat) ?? true;
        if (!passes) return;

        store.prependChat(creatorId, {
          ...chat,
          unreadCount: (chat as any).unread_count ?? chat.unreadCount ?? 1,
        });
        store.addMessage(creatorId, channelId, message);
        store.incrementChannelUnread(creatorId, channelId);
      } catch {
        // Silently drop — channel fetch failed (e.g. deleted user)
      }
    }
  }
}
