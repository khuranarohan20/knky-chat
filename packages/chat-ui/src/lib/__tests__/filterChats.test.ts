import { describe, it, expect } from 'vitest';

import type { Chat } from '@knky-chat/core-chat';
import { filterChats } from '../filterChats';

function chat(p: Partial<Chat>): Chat {
  return {
    converse_channel_id: 'c',
    unreadCount: 0,
    target: { display_name: 'Someone', username: 'someone' } as any,
    ...p,
  } as Chat;
}

const chats: Chat[] = [
  chat({ converse_channel_id: 'a', unreadCount: 2, target: { display_name: 'Alice Rivera', username: 'alice' } as any }),
  chat({ converse_channel_id: 'b', unreadCount: 0, target: { display_name: 'Ben Ortiz', username: 'ben' } as any }),
  chat({ converse_channel_id: 'c', unreadCount: 0, mark_as_unread: true, target: { display_name: 'Cara', username: 'cara' } as any }),
];

const ids = (r: Chat[]) => r.map((c) => c.converse_channel_id);

describe('filterChats', () => {
  it('returns all when readStatus is all / undefined', () => {
    expect(ids(filterChats(chats, { readStatus: 'all' }))).toEqual(['a', 'b', 'c']);
    expect(ids(filterChats(chats, {}))).toEqual(['a', 'b', 'c']);
  });

  it('unread includes unreadCount>0 and mark_as_unread', () => {
    expect(ids(filterChats(chats, { readStatus: 'unread' }))).toEqual(['a', 'c']);
  });

  it('read excludes unread + mark_as_unread', () => {
    expect(ids(filterChats(chats, { readStatus: 'read' }))).toEqual(['b']);
  });

  it('search matches display name or username, case-insensitive', () => {
    expect(ids(filterChats(chats, {}, 'ali'))).toEqual(['a']);
    expect(ids(filterChats(chats, {}, 'BEN'))).toEqual(['b']);
    expect(ids(filterChats(chats, {}, 'zzz'))).toEqual([]);
  });

  it('combines read-status and search', () => {
    expect(ids(filterChats(chats, { readStatus: 'unread' }, 'car'))).toEqual(['c']);
  });
});
