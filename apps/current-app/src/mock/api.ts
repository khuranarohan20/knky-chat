import type { IChatApiClient } from '@knky-chat/chat-ui';
import { CHATS } from './data';

/** Fake host API client — returns the canned chat list, no backend. */
export const mockApi: IChatApiClient = {
  async getChatList() {
    return CHATS;
  },
  async getChannelDetails(channelId: string) {
    return CHATS.find((c) => c.converse_channel_id === channelId) ?? null;
  },
  async getUnreadCounts() {
    const channels = CHATS.filter((c) => c.unreadCount > 0).map((c) => ({
      channelId: c.converse_channel_id,
      unreadCount: c.unreadCount,
    }));
    return {
      totalUnreadCount: channels.reduce((n, c) => n + c.unreadCount, 0),
      channels,
    };
  },
};
