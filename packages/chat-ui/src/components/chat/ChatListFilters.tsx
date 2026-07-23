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
    <div className={cn('flex gap-1 px-2 pb-2', className)}>
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => useChatStore.getState().setFilter(id, { readStatus: o.value })}
          className={cn(
            'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
            active === o.value
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/70',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
