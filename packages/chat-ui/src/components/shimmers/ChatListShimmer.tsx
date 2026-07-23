import React from 'react';

import { ChatPersonShimmer } from './ChatPersonShimmer';

/** Skeleton list of chat rows. */
export function ChatListShimmer({ rows = 6, className }: { rows?: number; className?: string }): React.ReactElement {
  return (
    <div className={className}>
      {Array.from({ length: rows }).map((_, i) => (
        <ChatPersonShimmer key={i} />
      ))}
    </div>
  );
}
