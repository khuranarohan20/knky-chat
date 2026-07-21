import {
  useActiveChannelId,
  useActiveMessages,
  useChatFilter,
  useChatList,
  useMessagesLoading,
  usePinnedMessages,
  useTargetPerson,
  useTotalUnreadCount,
} from '../store/chatStore';
import { useResolvedCreatorId } from './useResolvedCreatorId';

/**
 * useChat — the master read hook. Aggregates the reactive slices a chat view
 * needs for one creator. All values come from the Zustand store, so the
 * component re-renders only when the slices it reads change.
 */
export function useChat(creatorId?: string) {
  const id = useResolvedCreatorId(creatorId);

  const chatList = useChatList(id);
  const messages = useActiveMessages(id);
  const activeChannelId = useActiveChannelId(id);
  const targetPerson = useTargetPerson(id);
  const messagesLoading = useMessagesLoading(id);
  const filter = useChatFilter(id);
  const unreadCount = useTotalUnreadCount(id);
  const pinned = usePinnedMessages(id, activeChannelId);

  return {
    creatorId: id,
    chatList,
    messages,
    activeChannelId,
    targetPerson,
    messagesLoading,
    filter,
    unreadCount,
    pinned,
  };
}
