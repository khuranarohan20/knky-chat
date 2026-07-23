import React from 'react';
import { CheckCheck } from 'lucide-react';

import type { MessageInterface } from '@knky-chat/core-chat';
import { cn } from '../../lib/utils';

interface BubbleTimeProps {
  message: MessageInterface;
  isMine: boolean;
}

/** Timestamp + (for own messages) a seen/sent tick — blue when seen. */
export function BubbleTime({ message, isMine }: BubbleTimeProps): React.ReactElement {
  const time = message.createdAt
    ? new Date(message.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : '';

  const seen =
    (message.receipts ?? []).some((r) => r.status === 'seen') || (message.seen_count ?? 0) >= 1;

  return (
    <div
      className={cn(
        'mt-1 flex items-center gap-1 text-xs text-muted-foreground',
        isMine ? 'justify-end' : 'justify-start',
      )}
    >
      <span>{time}</span>
      {isMine ? <CheckCheck className="size-3.5" style={{ color: seen ? '#42B1FF' : 'gray' }} /> : null}
    </div>
  );
}
