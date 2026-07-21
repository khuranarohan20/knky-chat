import React from 'react';
import { Check, CheckCheck } from 'lucide-react';

import type { MessageInterface } from '@knky-chat/core-chat';
import { cn } from '../../lib/utils';

interface BubbleTimeProps {
  message: MessageInterface;
  isMine: boolean;
}

/** Timestamp + (for own messages) sent/seen receipt ticks. */
export function BubbleTime({ message, isMine }: BubbleTimeProps): React.ReactElement {
  const time = message.createdAt
    ? new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  const seen = (message.receipts ?? []).some((r) => r.status === 'seen');

  return (
    <div
      className={cn(
        'mt-1 flex items-center gap-1 text-[10px] opacity-70',
        isMine ? 'justify-end' : 'justify-start',
      )}
    >
      <span>{time}</span>
      {isMine && (seen ? <CheckCheck className="size-3" /> : <Check className="size-3" />)}
    </div>
  );
}
