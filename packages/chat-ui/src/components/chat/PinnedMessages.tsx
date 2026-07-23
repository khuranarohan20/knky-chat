import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Pin } from 'lucide-react';

import { usePinManager } from '../../hooks/usePinManager';
import { cn } from '../../lib/utils';

export interface PinnedMessagesProps {
  creatorId?: string;
  channelId?: string;
  className?: string;
}

/** Carousel banner of pinned messages for the active channel. */
export function PinnedMessages({ creatorId, channelId, className }: PinnedMessagesProps): React.ReactElement | null {
  const { pinned } = usePinManager(creatorId, channelId);
  const [idx, setIdx] = useState(0);

  if (pinned.length === 0) return null;

  const safeIdx = Math.min(idx, pinned.length - 1);
  const current = pinned[safeIdx];
  const preview = current?.message?.message || '[media]';

  return (
    <div className={cn('flex items-center gap-2 border-b bg-muted/50 px-3 py-2', className)}>
      <Pin className="size-4 shrink-0 opacity-70" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm">{preview}</p>
        {pinned.length > 1 ? (
          <p className="text-[11px] text-muted-foreground">
            {safeIdx + 1} of {pinned.length} pinned
          </p>
        ) : null}
      </div>
      {pinned.length > 1 ? (
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            aria-label="Previous pinned"
            onClick={() => setIdx((safeIdx - 1 + pinned.length) % pinned.length)}
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            aria-label="Next pinned"
            onClick={() => setIdx((safeIdx + 1) % pinned.length)}
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
