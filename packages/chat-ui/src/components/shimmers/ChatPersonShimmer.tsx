import React from 'react';

import { cn } from '../../lib/utils';

/** Skeleton for a single chat-list row. */
export function ChatPersonShimmer({ className }: { className?: string }): React.ReactElement {
  return (
    <div className={cn('flex items-center gap-3 px-4 py-3', className)}>
      <div className="size-9 shrink-0 animate-pulse rounded-full bg-muted" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
        <div className="h-2.5 w-2/3 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}
