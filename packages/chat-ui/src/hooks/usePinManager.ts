import { useCallback } from 'react';

import { useActiveChannelId, usePinnedMessages } from '../store/chatStore';
import { useAdapter } from '../adapter/AdapterContext';
import { useResolvedCreatorId } from './useResolvedCreatorId';

/**
 * usePinManager — pin/unpin messages for a channel, enforcing the platform's
 * pin cap (adapter.getMaxPinMessages: 20 core / 5 agency). Reads the current
 * pinned list reactively so `canPin` stays accurate.
 */
export function usePinManager(creatorId?: string, channelId?: string) {
  const adapter = useAdapter();
  const id = useResolvedCreatorId(creatorId);
  const activeChannelId = useActiveChannelId(id);
  const channel = channelId ?? activeChannelId;

  const pinned = usePinnedMessages(id, channel);
  const maxPins = adapter.getMaxPinMessages();
  const canPin = pinned.length < maxPins;

  const pinMessage = useCallback(
    async (messageId: string): Promise<boolean> => {
      if (!channel || pinned.length >= maxPins) return false;
      await adapter.getConnection(id)?.pinMessage(messageId);
      return true;
    },
    [adapter, id, channel, pinned.length, maxPins],
  );

  const unpinMessage = useCallback(
    async (messageId: string, pinId: string): Promise<void> => {
      await adapter.getConnection(id)?.unpinMessage(messageId, pinId);
    },
    [adapter, id],
  );

  return { pinned, maxPins, canPin, pinMessage, unpinMessage };
}
