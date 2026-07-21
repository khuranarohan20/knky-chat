import React from 'react';

import type { MessageInterface } from '@knky-chat/core-chat';
import { cn } from '../../lib/utils';
import { BubbleTime } from './BubbleTime';

interface MessageBubbleProps {
  message: MessageInterface;
  isMine: boolean;
  children: React.ReactNode;
}

/**
 * The shared bubble frame: handles left/right alignment and mine/theirs
 * colours, and appends the timestamp + receipt row. Individual bubble
 * variations render only their inner content.
 */
export function MessageBubble({ message, isMine, children }: MessageBubbleProps): React.ReactElement {
  return (
    <div className={cn('flex w-full px-3 py-1', isMine ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[75%] rounded-2xl px-3 py-2 text-sm break-words',
          isMine
            ? 'bg-primary text-primary-foreground rounded-br-sm'
            : 'bg-muted text-foreground rounded-bl-sm',
        )}
      >
        {children}
        <BubbleTime message={message} isMine={isMine} />
      </div>
    </div>
  );
}
