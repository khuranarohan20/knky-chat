import { useCallback } from 'react';

import { useAdapter } from '../adapter/AdapterContext';
import { useChatStore } from '../store/chatStore';
import { useResolvedCreatorId } from './useResolvedCreatorId';

/**
 * useShowChat — opens a channel end-to-end:
 *   set active channel → connect the socket channel → load history →
 *   clear the channel's unread count.
 *
 * Encapsulates the sequence a view otherwise has to orchestrate by hand.
 */
export function useShowChat(creatorId?: string) {
  const adapter = useAdapter();
  const id = useResolvedCreatorId(creatorId);

  const openChat = useCallback(
    async (channelId: string, unreadCount = 0): Promise<void> => {
      const conn = adapter.getConnection(id);
      if (!conn) return;

      const store = useChatStore.getState();
      store.setActiveChannelId(id, channelId);
      store.setMessagesLoading(id, true);
      try {
        await conn.connectChannel(channelId, unreadCount);
        await conn.loadMessages();
        store.clearChannelUnread(id, channelId);
      } finally {
        store.setMessagesLoading(id, false);
      }
    },
    [adapter, id],
  );

  return { openChat };
}
