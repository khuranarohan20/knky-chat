import { useAdapter } from '../adapter/AdapterContext';
import { useChatStore } from '../store/chatStore';

/**
 * Resolve the creatorId a hook should operate on.
 *
 * Precedence: explicit arg → store's currentCreatorId (reactive, so hooks
 * re-render when the agency adapter switches creator) → adapter fallback.
 */
export function useResolvedCreatorId(explicit?: string): string {
  const adapter = useAdapter();
  const current = useChatStore((s) => s.currentCreatorId);
  return explicit ?? current ?? adapter.getCreatorId();
}
