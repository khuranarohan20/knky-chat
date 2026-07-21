import type { Chat, ConversePair, MessageInterface, Receipt } from '@knky-chat/core-chat';
import type { IChatApiClient, UnreadCounts } from '@knky-chat/chat-ui';

// ---------------------------------------------------------------------------
// Fake Converse SDK — implements the surface ChatConnection depends on and
// lets tests emit socket events. ChatConnection does `new ConverseClass()`
// internally; reach an instance via `(connection as any).converse`, or via
// FakeConverse.instances for the single-connection (core) case.
// ---------------------------------------------------------------------------

export class FakeChannel {
  sent: Array<{ message?: string; meta: any }> = [];
  seenCalls: Array<Array<{ messageId: string; senderId: string }>> = [];

  // ChatConnection registers its own wrappers here via listenX(cb)
  msgListener?: (m: MessageInterface) => void;
  seenListener?: (r: { messageId: string; receipt: Receipt }) => void;
  seenAllListener?: (r: { firstUnSeenMessage: string }) => void;
  pinListener?: (r: any) => void;
  unpinListener?: (r: any) => void;
  editListener?: (m: MessageInterface) => void;
  deleteListener?: (m: MessageInterface) => void;

  constructor(private messages: MessageInterface[]) {}

  async sendMessage(opts: { message?: string; meta: any }) {
    this.sent.push(opts);
  }
  async getMessages() {
    return { msgs: { read: this.messages, unread: [] } };
  }
  async getMessagesReceipts() {
    return { receipts: [] as Array<{ _id: string; receipts: Receipt[] }> };
  }
  seenMessage(items: Array<{ messageId: string; senderId: string }>) {
    this.seenCalls.push(items);
  }
  checkMoreMessage() {}
  async addPinMessage() {}
  async unPinMessage() {}
  async getPinnedMessages() {
    return { data: { pinnedMsgs: [] } };
  }
  listenMessage(cb: any) { this.msgListener = cb; }
  listenCheckMoreMessage() {}
  listenEditMessage(cb: any) { this.editListener = cb; }
  listenMessageDelete(cb: any) { this.deleteListener = cb; }
  listenMessageDeleteMe() {}
  listenSeenMessage(cb: any) { this.seenListener = cb; }
  listenSeenAllMessage(cb: any) { this.seenAllListener = cb; }
  listenPinMessage(cb: any) { this.pinListener = cb; }
  listenUnPinMessage(cb: any) { this.unpinListener = cb; }
}

export class FakeProject {
  newMsgListener?: (raw: any) => void;
  onlineListener?: (r: { userId: string }) => void;
  offlineListener?: (r: { userId: string }) => void;
  exitOnlineUsersRoom() {}
  joinOnlineUsersRoom() {}
  listenNewMessage(cb: any) { this.newMsgListener = cb; }
  listenEditMessage() {}
  listenUserOnline(cb: any) { this.onlineListener = cb; }
  listenUserOffline(cb: any) { this.offlineListener = cb; }
}

export class FakeConverse {
  static instances: FakeConverse[] = [];
  static cannedMessages: MessageInterface[] = [];

  channel: FakeChannel;
  project = new FakeProject();
  private connected = false;

  constructor() {
    this.channel = new FakeChannel(FakeConverse.cannedMessages);
    FakeConverse.instances.push(this);
  }
  async init() { this.connected = true; }
  checkConnection() { return this.connected; }
  listenConnectionCallback(cb: () => void) { cb(); }
  async connectProject() { return this.project; }
  async connectChannel() { return this.channel; }
  closeChannel() {}
  closeProject() {}
  shutdown() { this.connected = false; }
}

export function mkMsg(p: Partial<MessageInterface>): MessageInterface {
  return {
    _id: '',
    messageId: '',
    channel_id: '',
    sender_id: '',
    message: '',
    url: '',
    og_msg: '',
    name: '',
    meta: { type: 'message' } as any,
    message_deleted_by: [],
    reactions: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isHuman: true,
    receipts: [],
    seen_count: 0,
    tags: [],
    ...p,
  } as MessageInterface;
}

export function mkChat(p: Partial<Chat>): Chat {
  return { converse_channel_id: '', unreadCount: 0, ...p } as Chat;
}

// ---------------------------------------------------------------------------
// Fake host API client — records calls, returns canned data.
// ---------------------------------------------------------------------------

export interface FakeApi extends IChatApiClient {
  calls: { getChatList: number; getChannelDetails: string[] };
}

export function makeFakeApi(opts?: {
  chatList?: Chat[];
  channelDetails?: Record<string, Chat>;
  unread?: UnreadCounts;
  members?: ConversePair[];
}): FakeApi {
  const calls = { getChatList: 0, getChannelDetails: [] as string[] };
  return {
    calls,
    async getChatList() {
      calls.getChatList++;
      return opts?.chatList ?? [];
    },
    async getChannelDetails(channelId: string) {
      calls.getChannelDetails.push(channelId);
      return opts?.channelDetails?.[channelId] ?? null;
    },
    async getUnreadCounts() {
      return opts?.unread ?? { totalUnreadCount: 0, channels: [] };
    },
    async getConverseMembers() {
      return opts?.members ?? [];
    },
  };
}
