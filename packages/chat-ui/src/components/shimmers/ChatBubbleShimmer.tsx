import React from 'react';

import { cn } from '../../lib/utils';

/** Skeleton for the message list while history loads. */
export function ChatBubbleShimmer({ count = 6, className }: { count?: number; className?: string }): React.ReactElement {
  return (
    <div className={cn('space-y-3 p-3', className)}>
      {Array.from({ length: count }).map((_, i) => {
        const mine = i % 3 === 0;
        return (
          <div key={i} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
            <div className={cn('h-10 animate-pulse rounded-2xl bg-muted', mine ? 'w-40' : 'w-56')} />
          </div>
        );
      })}
    </div>
  );
}
