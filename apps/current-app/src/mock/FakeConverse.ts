import type { MessageInterface } from '@knky-chat/core-chat';
import { ME, MESSAGES } from './data';

/**
 * Fake converse.svc-client for the playground. Serves canned history per
 * channel and echoes sent messages back through the message listener (as a
 * real server would) so they appear in the UI.
 */

class FakeChannel {
  private msgListener?: (m: MessageInterface) => void;
  constructor(private channelId: string) {}

  async sendMessage(opts: { message?: string; meta: any }) {
    const now = new Date().toISOString();
    const echoed: MessageInterface = {
      _id: `local-${Math.round(performance.now())}`,
      messageId: `local-${Math.round(performance.now())}`,
      channel_id: this.channelId,
      sender_id: ME,
      message: opts.message ?? '',
      url: '',
      og_msg: '',
      name: '',
      meta: { ...opts.meta },
      message_deleted_by: [],
      reactions: [],
      createdAt: now,
      updatedAt: now,
      isHuman: true,
      receipts: [],
      seen_count: 0,
      tags: [],
    } as MessageInterface;
    (MESSAGES[this.channelId] ??= []).push(echoed);
    this.msgListener?.(echoed);
  }

  async getMessages() {
    return { msgs: { read: MESSAGES[this.channelId] ?? [], unread: [] } };
  }
  async getMessagesReceipts() {
    return { receipts: [] };
  }
  seenMessage() {}
  checkMoreMessage() {}
  async addPinMessage() {}
  async unPinMessage() {}
  async getPinnedMessages() {
    return { data: { pinnedMsgs: [] } };
  }
  listenMessage(cb: (m: MessageInterface) => void) { this.msgListener = cb; }
  listenCheckMoreMessage() {}
  listenEditMessage() {}
  listenMessageDelete() {}
  listenMessageDeleteMe() {}
  listenSeenMessage() {}
  listenSeenAllMessage() {}
  listenPinMessage() {}
  listenUnPinMessage() {}
}

class FakeProject {
  exitOnlineUsersRoom() {}
  joinOnlineUsersRoom() {}
  listenNewMessage() {}
  listenEditMessage() {}
  listenUserOnline() {}
  listenUserOffline() {}
}

export class FakeConverse {
  private connected = false;
  async init() { this.connected = true; }
  checkConnection() { return this.connected; }
  listenConnectionCallback(cb: () => void) { cb(); }
  async connectProject() { return new FakeProject(); }
  async connectChannel(opts: { channelId: string }) { return new FakeChannel(opts.channelId); }
  closeChannel() {}
  closeProject() {}
  shutdown() { this.connected = false; }
}
