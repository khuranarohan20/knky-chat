import React from 'react';
import { Virtuoso } from 'react-virtuoso';

import { VIRTUOSO_BASE } from '@knky-chat/core-chat';
import { useChat } from '../../hooks/useChat';
import { cn } from '../../lib/utils';
import { RenderMessage } from '../messages/RenderMessage';

export interface ChatBubblesProps {
  /** Creator scope — defaults to the active creator (core: "__core__"). */
  creatorId?: string;
  /** Logged-in user's id, so own messages align right with receipt ticks. */
  currentUserId?: string;
  className?: string;
}

/**
 * Virtualised message list for the active channel.
 *
 * Uses react-virtuoso with a fixed BASE offset (VIRTUOSO_BASE = 2,000,000) as
 * `firstItemIndex` so that prepending older messages (upward pagination)
 * doesn't corrupt item indices — the documented non-negotiable from both
 * source apps.
 */
export function ChatBubbles({ creatorId, currentUserId, className }: ChatBubblesProps): React.ReactElement {
  const { messages } = useChat(creatorId);

  if (messages.length === 0) {
    return (
      <div className={cn('flex h-full w-full items-center justify-center', className)}>
        <p className="text-sm text-muted-foreground">No messages yet</p>
      </div>
    );
  }

  // Stable base keeps indices monotonic across prepends.
  const firstItemIndex = Math.max(0, VIRTUOSO_BASE - messages.length);

  return (
    <Virtuoso
      className={cn('h-full w-full', className)}
      data={messages}
      firstItemIndex={firstItemIndex}
      initialTopMostItemIndex={messages.length - 1}
      followOutput="smooth"
      itemContent={(_index, message) => (
        <RenderMessage message={message} currentUserId={currentUserId} />
      )}
    />
  );
}
