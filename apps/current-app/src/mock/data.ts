import type { Chat, ChatPerson, MessageInterface } from '@knky-chat/core-chat';

export const ME = 'me-user-1';

function person(id: string, name: string, username: string): ChatPerson {
  return {
    _id: id,
    display_name: name,
    username,
    avatar: [],
    user_type: 'user',
    badges: {},
    latest_chat_fee: {} as ChatPerson['latest_chat_fee'],
    chat_fee_services: [],
  } as ChatPerson;
}

let seq = 0;
function msg(p: Partial<MessageInterface>): MessageInterface {
  seq += 1;
  const now = Date.now() - (100 - seq) * 60_000;
  return {
    _id: `m-${seq}`,
    messageId: `m-${seq}`,
    channel_id: '',
    sender_id: '',
    message: '',
    url: '',
    og_msg: '',
    name: '',
    meta: { type: 'message' } as MessageInterface['meta'],
    message_deleted_by: [],
    reactions: [],
    createdAt: new Date(now).toISOString(),
    updatedAt: new Date(now).toISOString(),
    isHuman: true,
    receipts: [],
    seen_count: 0,
    tags: [],
    ...p,
  } as MessageInterface;
}

const ALICE = person('u-alice', 'Alice Rivera', 'alice');
const BEN = person('u-ben', 'Ben Ortiz', 'ben');

function chat(channelId: string, target: ChatPerson, last: string, unread: number): Chat {
  return {
    converse_channel_id: channelId,
    unreadCount: unread,
    target,
    initiator: person(ME, 'Me', 'me'),
    message: msg({ channel_id: channelId, sender_id: target._id, message: last }),
  } as Chat;
}

export const CHATS: Chat[] = [
  chat('chan-alice', ALICE, 'See you tomorrow!', 2),
  chat('chan-ben', BEN, 'Thanks for the tip 🙌', 0),
];

export const TARGET_BY_CHANNEL: Record<string, ChatPerson> = {
  'chan-alice': ALICE,
  'chan-ben': BEN,
};

export const MESSAGES: Record<string, MessageInterface[]> = {
  'chan-alice': [
    msg({ channel_id: 'chan-alice', sender_id: 'u-alice', message: 'Hey! Are you around?' }),
    msg({ channel_id: 'chan-alice', sender_id: ME, message: 'Yep, what’s up?', receipts: [{ userId: 'u-alice', status: 'seen' }] }),
    msg({
      channel_id: 'chan-alice',
      sender_id: 'u-alice',
      message: 'Sent you some photos',
      meta: { type: 'message-attachment', media: [
        { _id: 'a1', url: 'https://picsum.photos/seed/a1/400', type: 'image' },
        { _id: 'a2', url: 'https://picsum.photos/seed/a2/400', type: 'image' },
      ] } as MessageInterface['meta'],
    }),
    msg({ channel_id: 'chan-alice', sender_id: 'u-alice', message: 'See you tomorrow!' }),
  ],
  'chan-ben': [
    msg({ channel_id: 'chan-ben', sender_id: ME, message: 'Appreciate you!', receipts: [{ userId: 'u-ben', status: 'seen' }] }),
    msg({
      channel_id: 'chan-ben',
      sender_id: 'u-ben',
      message: '',
      meta: { type: 'SENT-TIP', amount: 25 } as MessageInterface['meta'],
    }),
    msg({
      channel_id: 'chan-ben',
      sender_id: 'u-ben',
      message: 'Locked a special clip for you',
      meta: { type: 'message-attachment', is_unlocked: false, media_fee: 15, media: [
        { _id: 'b1', url: 'https://picsum.photos/seed/b1/400', type: 'image' },
      ] } as MessageInterface['meta'],
    }),
    msg({ channel_id: 'chan-ben', sender_id: 'u-ben', message: 'Thanks for the tip 🙌' }),
  ],
};
