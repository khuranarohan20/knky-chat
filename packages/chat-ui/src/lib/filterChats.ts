import type { Chat, FilterInterface } from '@knky-chat/core-chat';

/**
 * Apply the read-status filter + a name/username search to a chat list.
 *
 * Scope: readStatus (all/read/unread) + text search. `online` presence
 * filtering and fan-type / spend-range filters are deferred (they need
 * presence data and creator-side metadata) — treated as "all" here.
 */
export function filterChats(chats: Chat[], filter: FilterInterface, search = ''): Chat[] {
  const q = search.trim().toLowerCase();

  return chats.filter((chat) => {
    const isUnread = (chat.unreadCount ?? 0) > 0 || !!chat.mark_as_unread;

    if (filter.readStatus === 'unread' && !isUnread) return false;
    if (filter.readStatus === 'read' && isUnread) return false;

    if (q) {
      const name = (chat.target?.display_name ?? '').toLowerCase();
      const username = (chat.target?.username ?? '').toLowerCase();
      if (!name.includes(q) && !username.includes(q)) return false;
    }

    return true;
  });
}
