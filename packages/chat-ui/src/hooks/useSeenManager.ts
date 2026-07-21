import { useCallback } from 'react';

import { useAdapter } from '../adapter/AdapterContext';
import { useResolvedCreatorId } from './useResolvedCreatorId';

/**
 * useSeenManager — enqueue seen receipts (debounced/batched by the bridge's
 * SeenReceiptQueue) and force a flush (e.g. on channel close / unmount).
 */
export function useSeenManager(creatorId?: string) {
  const adapter = useAdapter();
  const id = useResolvedCreatorId(creatorId);

  const markSeen = useCallback(
    (messageId: string, senderId: string): void => {
      adapter.getBridge(id)?.enqueueSeenMessage(messageId, senderId);
    },
    [adapter, id],
  );

  const flushSeen = useCallback((): void => {
    adapter.getBridge(id)?.flushSeen();
  }, [adapter, id]);

  return { markSeen, flushSeen };
}
