import { useCallback } from 'react';

import type { MetaInterface } from '@knky-chat/core-chat';

import { useAdapter } from '../adapter/AdapterContext';
import { useResolvedCreatorId } from './useResolvedCreatorId';

/**
 * useMessageSend — send a message on a creator's active connection.
 *
 * Meta is enriched by the adapter (agency adds sent_by + emp; core passes
 * through). Edit/delete emit are intentionally not exposed yet — the socket
 * layer (ChatConnection) does not expose emit methods for them.
 */
export function useMessageSend(creatorId?: string) {
  const adapter = useAdapter();
  const id = useResolvedCreatorId(creatorId);

  const sendMessage = useCallback(
    async (text: string, meta?: Partial<MetaInterface>): Promise<void> => {
      const conn = adapter.getConnection(id);
      if (!conn) return;
      await conn.sendMessage({ text, meta: adapter.enrichMeta(meta ?? {}) });
    },
    [adapter, id],
  );

  return { sendMessage };
}
