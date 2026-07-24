import React from 'react';

import type { FilterInterface } from '@knky-chat/core-chat';
import { useResolvedCreatorId } from '../../hooks/useResolvedCreatorId';
import { useChatFilter, useChatStore } from '../../store/chatStore';
import { cn } from '../../lib/utils';

type ReadStatus = NonNullable<FilterInterface['readStatus']>;

const OPTIONS: Array<{ value: ReadStatus; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'read', label: 'Read' },
];

export interface ChatListFiltersProps {
  creatorId?: string;
  className?: string;
}

/** Read-status filter chips, wired to the store's per-creator filter. */
export function ChatListFilters({ creatorId, className }: ChatListFiltersProps): React.ReactElement {
  const id = useResolvedCreatorId(creatorId);
  const filter = useChatFilter(id);
  const active = filter.readStatus ?? 'all';

  return (
    <div className={cn('mx-3 flex items-center gap-4 border-b', className)}>
      {OPTIONS.map((o) => {
        const isActive = active === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => useChatStore.getState().setFilter(id, { readStatus: o.value })}
            className={cn('relative cursor-pointer text-nowrap py-2 text-[0.9rem]', isActive ? 'font-semibold text-black' : 'text-[#4D5053]')}
            style={isActive ? { borderBottom: '2px solid #000' } : { borderBottom: '2px solid transparent' }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
