import type {
  ConversePair,
  MessageInterface,
  MetaInterface,
  PinMessageResponse,
  Receipt,
} from '../types';
import { MESSAGE_FETCH_LIMIT, OFFLINE_REMOVAL_DELAY } from '../constants';

// ---------------------------------------------------------------------------
// Public types for consumers
// ---------------------------------------------------------------------------

export interface ChatConnectionConfig {
  /** converse.svc-client Converse class (injected by host adapter) */
  ConverseClass: new () => ConverseSDK;
  projectId: string;
  token: string;
  serverUrl: string;
  /** Agency-mode: enriches every outbound message with sent_by/emp fields */
  agencyMeta?: { sent_by: 'agency'; emp: string };
  /** How many messages to fetch per batch — defaults to MESSAGE_FETCH_LIMIT */
  batchSize?: number;
}

/** Minimal subset of Converse SDK surface this class uses */
export interface ConverseSDK {
  init(opts: { projectId: string; converseToken: string; serverUrl: string }): Promise<void>;
  checkConnection(): boolean;
  listenConnectionCallback(cb: () => void): void;
  connectProject(): Promise<ConverseProject>;
  connectChannel(opts: { channelId: string; ephemeral: boolean; batch: number }): Promise<ConverseChannel>;
  closeChannel(channelId: string): void;
  closeProject(): void;
  shutdown(): void;
}

export interface ConverseProject {
  exitOnlineUsersRoom(): void;
  joinOnlineUsersRoom(): void;
  close?(): void;
  listenNewMessage(cb: (msg: any) => void): void;
  listenEditMessage(cb: (msg: any) => void): void;
  listenUserOnline(cb: (res: { userId: string }) => void): void;
  listenUserOffline(cb: (res: { userId: string }) => void): void;
}

export interface ConverseChannel {
  sendMessage(opts: { message?: string; meta: any }): Promise<void>;
  getMessages(opts: { time?: string; reversePaginate?: boolean; fetchAll?: boolean }): Promise<GetMessagesResult>;
  getMessagesReceipts(opts: {}): Promise<ReceiptsResult>;
  seenMessage(items: Array<{ messageId: string; senderId: string }>): void;
  checkMoreMessage(opts: { time: string }): void;
  addPinMessage(opts: { messageId: string; forAll: boolean }): Promise<void>;
  unPinMessage(opts: { messageId: string; forAll: boolean; pinId: string }): Promise<void>;
  getPinnedMessages(opts: { limit: number; page: number }): Promise<any>;
  listenMessage(cb: (msg: MessageInterface) => void): void;
  listenCheckMoreMessage(cb: (data: MoreMessagesEvent) => void): void;
  listenEditMessage(cb: (msg: MessageInterface) => void): void;
  listenMessageDelete(cb: (msg: MessageInterface) => void): void;
  listenMessageDeleteMe(cb: (msg: MessageInterface) => void): void;
  listenSeenMessage(cb: (res: { messageId: string; receipt: Receipt }) => void): void;
  listenSeenAllMessage(cb: (res: { firstUnSeenMessage: string }) => void): void;
  listenPinMessage(cb: (res: any) => void): void;
  listenUnPinMessage(cb: (res: any) => void): void;
}

interface GetMessagesResult {
  msgs: { read: MessageInterface[]; unread: MessageInterface[] };
}

interface ReceiptsResult {
  receipts: Array<{ _id: string; receipts: Receipt[] }>;
}

interface MoreMessagesEvent {
  haveMoreMessage: boolean;
}

// ---------------------------------------------------------------------------
// Callback surface (the only coupling point between socket and state layer)
// ---------------------------------------------------------------------------

export interface ChatConnectionCallbacks {
  // Connection lifecycle
  onReady?: () => void;
  onLost?: () => void;

  // Bootstrap data
  onUnreadCount?: (data: {
    totalUnreadCount: number;
    channelCount: number;
    otherUnreadChannelCount?: number;
    channels: Array<{ channelId: string; unreadCount: number }>;
  }) => void;
  onConverseMembersList?: (members: ConversePair[]) => void;

  // Project-level message events (channels NOT currently active)
  onProjectMessage?: (channelId: string, message: MessageInterface) => void;
  onProjectMessageEdit?: (channelId: string, edit: { message: string; messageId: string; meta: MetaInterface }) => void;

  // Active channel — bulk load
  onMessagesLoaded?: (messages: MessageInterface[]) => void;
  onMessagesLoading?: (loading: boolean) => void;

  // Active channel — pagination (upward scroll)
  onPrependMessages?: (messages: MessageInterface[]) => void;
  onMoreMessagesLoading?: (direction: 'upwards' | 'downwards', loading: boolean) => void;

  // Active channel — downward check (background check-more)
  onAppendMessages?: (messages: MessageInterface[]) => void;

  // Active channel — real-time events
  onMessage?: (message: MessageInterface) => void;
  onEditMessage?: (channelId: string, message: MessageInterface) => void;
  onDeleteMessage?: (channelId: string, messageId: string) => void;
  onSeenMessage?: (channelId: string, messageId: string, receipt: Receipt) => void;
  onSeenAll?: (channelId: string, firstUnseenMessage: string) => void;
  onPinMessage?: (channelId: string, res: PinMessageResponse) => void;
  onUnpinMessage?: (channelId: string, pinId: string) => void;

  // Presence
  onUserOnline?: (userId: string) => void;
  onUserOffline?: (userId: string, expiryAt: string) => void;
  onOfflineExpired?: (userId: string) => void;

  // Error
  onError?: (error: Error) => void;
}

// ---------------------------------------------------------------------------
// ChatConnection
// ---------------------------------------------------------------------------

export class ChatConnection {
  private converse: ConverseSDK | null = null;
  private project: ConverseProject | null = null;
  private channel: ConverseChannel | null = null;
  private channelId = '';
  private updatedChannels = new Set<string>();

  private messageQueue: Array<{ text?: string; media?: any[]; meta?: Partial<MetaInterface> }> = [];
  private isProcessingQueue = false;

  private seenFlushTimer: ReturnType<typeof setTimeout> | null = null;

  private offlineTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private processRemovalInterval: ReturnType<typeof setInterval> | null = null;

  isConnected = false;

  private config: ChatConnectionConfig | null = null;
  private callbacks: ChatConnectionCallbacks = {};

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  setCallbacks(callbacks: ChatConnectionCallbacks): void {
    this.callbacks = callbacks;
  }

  async init(config: ChatConnectionConfig): Promise<void> {
    this.config = config;

    if (this.converse) {
      this.converse.shutdown();
      this.converse = null;
    }

    try {
      this.converse = new config.ConverseClass();

      await this.converse.init({
        projectId: config.projectId,
        converseToken: config.token,
        serverUrl: config.serverUrl,
      });

      await new Promise<void>((resolve) => {
        this.converse!.listenConnectionCallback(resolve);
      });

      this.project = await this.converse.connectProject();

      this.project.exitOnlineUsersRoom();
      this.setupProjectListeners();

      this.isConnected = true;
      this.callbacks.onReady?.();
    } catch (err) {
      this.callbacks.onError?.(err as Error);
      throw err;
    }
  }

  async connectChannel(channelId: string, unreadCount = 0): Promise<void> {
    if (!this.isConnected || !this.converse || !this.project) return;

    this.closeCurrentChannel();

    if (this.updatedChannels.has(channelId)) return;

    this.channelId = channelId;

    const batchSize = Math.max(
      this.config?.batchSize ?? MESSAGE_FETCH_LIMIT,
      unreadCount > MESSAGE_FETCH_LIMIT ? unreadCount + 10 : MESSAGE_FETCH_LIMIT,
    );

    this.channel = await this.converse.connectChannel({
      channelId,
      ephemeral: false,
      batch: batchSize,
    });

    await this.waitTillConnected();
    this.setupChannelListeners();
    this.updatedChannels.add(channelId);
  }

  async loadMessages(): Promise<void> {
    if (!this.channel) return;

    this.callbacks.onMessagesLoading?.(true);

    try {
      const { messages, hasCache } = await this.fetchMessages();

      if (hasCache) {
        const unseenFromCache = this.computeUnseen(messages);
        if (unseenFromCache.length > 0) {
          this.channel.seenMessage(unseenFromCache);
        }
        this.callbacks.onMessagesLoaded?.(messages);
        // Trigger background check for newer messages
        if (messages.length > 0) {
          this.channel.checkMoreMessage({ time: messages[messages.length - 1].createdAt });
        }
      } else {
        const unseen = this.computeUnseen(messages);
        if (unseen.length > 0) {
          this.channel.seenMessage(unseen);
        }
        this.callbacks.onMessagesLoaded?.(messages);
      }
    } catch (err) {
      this.callbacks.onError?.(err as Error);
    } finally {
      this.callbacks.onMessagesLoading?.(false);
    }
  }

  async loadMoreMessages(timestamp: string, reversePaginate = false): Promise<MessageInterface[]> {
    if (!this.channel) return [];

    this.callbacks.onMoreMessagesLoading?.('upwards', true);

    try {
      const response = await this.channel.getMessages({ time: timestamp, reversePaginate });
      const messages = this.mergeAndDedup([...response.msgs.read, ...response.msgs.unread]);
      this.callbacks.onPrependMessages?.(messages);
      return messages;
    } catch (err) {
      this.callbacks.onError?.(err as Error);
      return [];
    } finally {
      this.callbacks.onMoreMessagesLoading?.('upwards', false);
    }
  }

  async sendMessage(opts: {
    text?: string;
    media?: any[];
    meta?: Partial<MetaInterface>;
  }): Promise<void> {
    this.messageQueue.push(opts);
    this.processQueue();
  }

  async pinMessage(messageId: string, forAll = true): Promise<void> {
    await this.channel?.addPinMessage({ messageId, forAll });
  }

  async unpinMessage(messageId: string, pinId: string, forAll = true): Promise<void> {
    await this.channel?.unPinMessage({ messageId, forAll, pinId });
  }

  async getPinnedMessages(): Promise<PinMessageResponse['pinnedMsg'][]> {
    const response = await this.channel?.getPinnedMessages({ limit: 20, page: 1 });
    const raw = response?.data?.pinnedMsgs ?? [];
    return raw.sort(
      (a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  }

  seenMessage(items: Array<{ messageId: string; senderId: string }>): void {
    this.channel?.seenMessage(items);
  }

  joinOnlineRoom(): void {
    if (!this.project || !this.isConnected) return;
    this.project.joinOnlineUsersRoom();
    this.startProcessRemoval();
  }

  leaveOnlineRoom(): void {
    this.project?.exitOnlineUsersRoom?.();
    this.stopProcessRemoval();
  }

  closeCurrentChannel(): void {
    if (this.channelId) {
      this.converse?.closeChannel(this.channelId);
      this.updatedChannels.delete(this.channelId);
      this.channelId = '';
      this.channel = null;
    }
  }

  async disconnect(): Promise<void> {
    this.closeCurrentChannel();
    if (this.converse) {
      this.converse.closeProject();
      this.project?.close?.();
      this.converse.shutdown();
      this.converse = null;
    }
    this.project = null;
    this.isConnected = false;
    this.stopProcessRemoval();
    this.clearSeenFlush();
  }

  getChannelId(): string {
    return this.channelId;
  }

  // ---------------------------------------------------------------------------
  // Private — message fetching helpers
  // ---------------------------------------------------------------------------

  private async fetchMessages(): Promise<{ messages: MessageInterface[]; hasCache: boolean }> {
    // Caller should pass cached messages — for library use, we always fetch fresh
    const response = await this.channel!.getMessages({});
    const receiptResponse = await this.channel!.getMessagesReceipts({});

    const raw = this.mergeAndDedup([...response.msgs.read, ...response.msgs.unread]);
    const messages = this.mergeReceipts(raw, receiptResponse.receipts);
    return { messages, hasCache: false };
  }

  private mergeAndDedup(messages: MessageInterface[]): MessageInterface[] {
    const seen = new Map<string, MessageInterface>();
    for (const msg of messages) {
      const id = this.msgId(msg);
      if (id && !seen.has(id)) seen.set(id, msg);
    }
    return Array.from(seen.values());
  }

  private mergeReceipts(
    messages: MessageInterface[],
    receiptBuckets: Array<{ _id: string; receipts: Receipt[] }>,
  ): MessageInterface[] {
    const map = new Map(receiptBuckets.map((b) => [b._id, b.receipts]));
    return messages.map((m) => {
      const recs = map.get(this.msgId(m));
      return recs?.length ? { ...m, receipts: recs } : m;
    });
  }

  private computeUnseen(
    messages: MessageInterface[],
  ): Array<{ messageId: string; senderId: string }> {
    // For now: return empty. Callers should pass their own userId to filter correctly.
    // The store layer has the userId context needed for this filter.
    return messages
      .filter((m) => !m.receipts?.length)
      .map((m) => ({ messageId: this.msgId(m), senderId: m.sender_id || m.sid || '' }));
  }

  private msgId(m: MessageInterface): string {
    return m._id || m.messageId || (m as any).message_id || '';
  }

  // ---------------------------------------------------------------------------
  // Private — queue processing
  // ---------------------------------------------------------------------------

  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || !this.channel) return;

    this.isProcessingQueue = true;

    while (this.messageQueue.length > 0) {
      const msg = this.messageQueue[0];
      try {
        const outMeta: any = {
          ...msg.meta,
          converseId: this.channelId,
        };

        // Agency enrichment — injected via config
        if (this.config?.agencyMeta) {
          outMeta.sent_by = this.config.agencyMeta.sent_by;
          outMeta.emp = this.config.agencyMeta.emp;
        }

        await this.channel.sendMessage({ message: msg.text, meta: outMeta });
        this.messageQueue.shift();
      } catch (err) {
        this.callbacks.onError?.(err as Error);
        await this.delay(1000);
      }
    }

    this.isProcessingQueue = false;
  }

  // ---------------------------------------------------------------------------
  // Private — listeners
  // ---------------------------------------------------------------------------

  private setupProjectListeners(): void {
    if (!this.project) return;

    this.project.listenNewMessage((raw: any) => {
      const message: MessageInterface = raw.message ?? raw;
      const channelId: string = message.meta?.converseId || message.meta?.channel_id || '';
      if (!channelId || channelId === this.channelId) return;
      if (message.meta?.delete_for) return;
      this.callbacks.onProjectMessage?.(channelId, message);
    });

    this.project.listenEditMessage((raw: any) => {
      const channelId: string = raw.channelId ?? '';
      if (!channelId || channelId === this.channelId) return;
      if (raw.meta?.delete_for) return;
      this.callbacks.onProjectMessageEdit?.(channelId, {
        message: raw.message,
        messageId: raw.messageId,
        meta: raw.meta,
      });
    });

    this.project.listenUserOnline((res) => {
      this.callbacks.onUserOnline?.(res.userId);
    });

    this.project.listenUserOffline((res) => {
      const expiryAt = new Date(Date.now() + OFFLINE_REMOVAL_DELAY).toISOString();
      this.callbacks.onUserOffline?.(res.userId, expiryAt);
    });
  }

  private setupChannelListeners(): void {
    if (!this.channel) return;

    this.channel.listenMessage((message) => {
      if (message.meta?.type === 'stream') {
        // stream messages don't trigger normal message path
        this.callbacks.onMessage?.(message);
        return;
      }
      if (message.meta?.delete_for) return;

      // Auto-seen for currently active channel
      const msgId = this.msgId(message);
      const senderId = message.sender_id || message.sid || '';
      this.channel?.seenMessage([{ messageId: msgId, senderId }]);

      this.callbacks.onMessage?.(message);
    });

    this.channel.listenCheckMoreMessage(async (data) => {
      if (!data.haveMoreMessage) return;
      await this.handleDownwardPagination();
    });

    this.channel.listenEditMessage((message) => {
      this.callbacks.onEditMessage?.(this.channelId, message);
    });

    this.channel.listenMessageDelete((message) => {
      const id = this.msgId(message);
      this.callbacks.onDeleteMessage?.(this.channelId, id);
    });

    this.channel.listenMessageDeleteMe((message) => {
      const id = this.msgId(message);
      this.callbacks.onDeleteMessage?.(this.channelId, id);
    });

    this.channel.listenSeenMessage((res) => {
      this.callbacks.onSeenMessage?.(this.channelId, res.messageId, res.receipt);
    });

    this.channel.listenSeenAllMessage((res) => {
      this.callbacks.onSeenAll?.(this.channelId, res.firstUnSeenMessage);
    });

    this.channel.listenPinMessage((res) => {
      this.callbacks.onPinMessage?.(this.channelId, res);
    });

    this.channel.listenUnPinMessage((res) => {
      this.callbacks.onUnpinMessage?.(this.channelId, res.pinId ?? res._id ?? '');
    });
  }

  private async handleDownwardPagination(): Promise<void> {
    if (!this.channel) return;

    this.callbacks.onMoreMessagesLoading?.('downwards', true);
    try {
      // Caller will provide the timestamp; for now fire with what we have
      const response = await this.channel.getMessages({ reversePaginate: true });
      const receiptResponse = await this.channel.getMessagesReceipts({});
      const raw = this.mergeAndDedup([...response.msgs.read, ...response.msgs.unread]);
      const messages = this.mergeReceipts(raw, receiptResponse.receipts);
      this.callbacks.onAppendMessages?.(messages);
    } catch (err) {
      this.callbacks.onError?.(err as Error);
    } finally {
      this.callbacks.onMoreMessagesLoading?.('downwards', false);
    }
  }

  // ---------------------------------------------------------------------------
  // Private — presence management
  // ---------------------------------------------------------------------------

  private startProcessRemoval(): void {
    if (this.processRemovalInterval) return;

    this.processRemovalInterval = setInterval(() => {
      if (!this.isConnected) return;

      const now = Date.now();
      for (const [userId, timer] of this.offlineTimers) {
        // Timer fires on its own — this interval is just a heartbeat guard
        // Actual removal is handled by the per-user setTimeout below
        void userId; void timer; void now;
      }
    }, OFFLINE_REMOVAL_DELAY);
  }

  private stopProcessRemoval(): void {
    if (this.processRemovalInterval) {
      clearInterval(this.processRemovalInterval);
      this.processRemovalInterval = null;
    }
    for (const timer of this.offlineTimers.values()) {
      clearTimeout(timer);
    }
    this.offlineTimers.clear();
  }

  scheduleOfflineRemoval(userId: string, expiryAt: string): void {
    const existing = this.offlineTimers.get(userId);
    if (existing) clearTimeout(existing);

    const delay = new Date(expiryAt).getTime() - Date.now();
    if (delay <= 0) {
      this.callbacks.onOfflineExpired?.(userId);
      return;
    }

    const timer = setTimeout(() => {
      this.offlineTimers.delete(userId);
      this.callbacks.onOfflineExpired?.(userId);
    }, delay);

    this.offlineTimers.set(userId, timer);
  }

  cancelOfflineRemoval(userId: string): void {
    const timer = this.offlineTimers.get(userId);
    if (timer) {
      clearTimeout(timer);
      this.offlineTimers.delete(userId);
    }
  }

  // ---------------------------------------------------------------------------
  // Private — utilities
  // ---------------------------------------------------------------------------

  private async waitTillConnected(timeout = 10_000): Promise<void> {
    // Fast path: already connected (the common case right after init) — resolve
    // immediately instead of waiting for the first poll tick.
    if (this.converse?.checkConnection()) return;

    return new Promise((resolve, reject) => {
      const interval = setInterval(() => {
        if (this.converse?.checkConnection()) {
          clearInterval(interval);
          clearTimeout(timer);
          resolve();
        }
      }, 100);

      const timer = setTimeout(() => {
        clearInterval(interval);
        reject(new Error('ChatConnection: waitTillConnected timed out'));
      }, timeout);
    });
  }

  private clearSeenFlush(): void {
    if (this.seenFlushTimer) {
      clearTimeout(this.seenFlushTimer);
      this.seenFlushTimer = null;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
