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
 * Shared bubble frame — left/right alignment; sent = white + border,
 * received = light grey (#f5f5f6). Matches the agency chat's bubble styling.
 */
export function MessageBubble({ message, isMine, children }: MessageBubbleProps): React.ReactElement {
  return (
    <div className={cn('flex w-full px-3 py-1', isMine ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-md rounded-lg px-4 py-2 text-sm break-words',
          isMine ? 'border bg-white text-black' : 'bg-[#f5f5f6] text-black',
        )}
      >
        {children}
        <BubbleTime message={message} isMine={isMine} />
      </div>
    </div>
  );
}
