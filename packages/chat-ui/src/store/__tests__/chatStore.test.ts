import { describe, it, expect, beforeEach } from 'vitest';

import type { Chat, MessageInterface, Receipt } from '@knky-chat/core-chat';
import { useChatStore } from '../chatStore';
import type { PinnedMessage } from '../chatStore';

const C = '__core__';
const store = () => useChatStore.getState();

function msg(p: Partial<MessageInterface>): MessageInterface {
  return {
    _id: '',
    messageId: '',
    channel_id: 'chan',
    sender_id: 'other',
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

function chat(p: Partial<Chat>): Chat {
  return { converse_channel_id: 'chan', unreadCount: 0, target: {} as any, ...p } as Chat;
}

describe('chatStore', () => {
  beforeEach(() => {
    useChatStore.setState({ currentCreatorId: null, chatDataByCreator: {} });
    store().initCreator(C);
  });

  it('addMessage dedups by _id || messageId', () => {
    store().addMessage(C, 'chan', msg({ _id: 'm1' }));
    store().addMessage(C, 'chan', msg({ _id: 'm1' })); // dup
    store().addMessage(C, 'chan', msg({ messageId: 'm2' }));
    const list = store().getCreatorState(C).completeMessagesByChatId['chan'];
    expect(list.map((m) => m._id || m.messageId)).toEqual(['m1', 'm2']);
  });

  it('addMessage bubbles the chat to the top of the list', () => {
    store().setChatList(C, [chat({ converse_channel_id: 'a' }), chat({ converse_channel_id: 'b' })]);
    store().addMessage(C, 'b', msg({ _id: 'x', channel_id: 'b' }));
    expect(store().getCreatorState(C).chatList.map((c) => c.converse_channel_id)).toEqual(['b', 'a']);
  });

  it('append/prepend dedup against existing', () => {
    store().setMessages(C, 'chan', [msg({ _id: 'm1' })]);
    store().appendMessages(C, 'chan', [msg({ _id: 'm1' }), msg({ _id: 'm2' })]);
    store().prependMessages(C, 'chan', [msg({ _id: 'm0' }), msg({ _id: 'm1' })]);
    const list = store().getCreatorState(C).completeMessagesByChatId['chan'];
    expect(list.map((m) => m._id)).toEqual(['m0', 'm1', 'm2']);
  });

  it('unread increment / clear (clear also zeroes the chat row)', () => {
    store().setChatList(C, [chat({ converse_channel_id: 'chan', unreadCount: 5 })]);
    store().incrementChannelUnread(C, 'chan');
    store().incrementChannelUnread(C, 'chan');
    expect(store().getCreatorState(C).unreadChannels['chan']).toBe(2);
    store().clearChannelUnread(C, 'chan');
    expect(store().getCreatorState(C).unreadChannels['chan']).toBeUndefined();
    expect(store().getCreatorState(C).chatList[0].unreadCount).toBe(0);
  });

  it('updateMessageReceipts dedups by userId || user_id', () => {
    store().setMessages(C, 'chan', [msg({ _id: 'm1' })]);
    store().updateMessageReceipts(C, 'chan', 'm1', { userId: 'u', status: 'delivered' } as Receipt);
    store().updateMessageReceipts(C, 'chan', 'm1', { user_id: 'u', status: 'seen' } as Receipt);
    const recs = store().getCreatorState(C).completeMessagesByChatId['chan'][0].receipts;
    expect(recs).toHaveLength(1);
    expect(recs[0].status).toBe('seen');
  });

  it('markAllSeen adds a seen receipt to every message not sent by the target', () => {
    store().setMessages(C, 'chan', [
      msg({ _id: 'mine', sender_id: 'me' }),
      msg({ _id: 'theirs', sender_id: 'target' }),
    ]);
    store().markAllSeen(C, 'chan', 'target', new Date().toISOString());
    const byId = Object.fromEntries(
      store().getCreatorState(C).completeMessagesByChatId['chan'].map((m) => [m._id, m.receipts]),
    );
    expect(byId['mine'].some((r) => (r.userId ?? r.user_id) === 'target')).toBe(true);
    expect(byId['theirs']).toHaveLength(0); // target's own message is skipped
  });

  it('pins: add dedups + newest-first sort, remove by id', () => {
    const pin = (id: string, createdAt: string): PinnedMessage => ({
      _id: id,
      messageId: id,
      channelId: 'chan',
      message: msg({ _id: id, createdAt }),
      pinnedById: '',
      pinnedByName: '',
      createdAt,
      updatedAt: createdAt,
      __v: 0,
    });
    store().addPinnedMessage(C, 'chan', pin('p1', '2026-01-01T00:00:00Z'));
    store().addPinnedMessage(C, 'chan', pin('p2', '2026-02-01T00:00:00Z'));
    store().addPinnedMessage(C, 'chan', pin('p1', '2026-01-01T00:00:00Z')); // dup
    expect(store().getCreatorState(C).pinnedMessagesByChatId['chan'].map((p) => p._id)).toEqual(['p2', 'p1']);
    store().removePinnedMessage(C, 'chan', 'p2');
    expect(store().getCreatorState(C).pinnedMessagesByChatId['chan'].map((p) => p._id)).toEqual(['p1']);
  });

  it('setFilter merges partial filter', () => {
    store().setFilter(C, { readStatus: 'unread' });
    expect(store().getCreatorState(C).filter.readStatus).toBe('unread');
    expect(store().getCreatorState(C).filter.conversationStatus).toBe('all'); // untouched
  });
});
