import React, { useCallback, useEffect } from 'react';
import { Virtuoso } from 'react-virtuoso';

import { VIRTUOSO_BASE } from '@knky-chat/core-chat';
import { useChat } from '../../hooks/useChat';
import { useSeenManager } from '../../hooks/useSeenManager';
import { cn } from '../../lib/utils';
import { RenderMessage } from '../messages/RenderMessage';
import { ChatBubbleShimmer } from '../shimmers/ChatBubbleShimmer';

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
  const { messages, messagesLoading } = useChat(creatorId);
  const { markSeen, flushSeen } = useSeenManager(creatorId);

  // Stable base keeps indices monotonic across prepends.
  const firstItemIndex = Math.max(0, VIRTUOSO_BASE - messages.length);

  // Mark visible incoming messages as seen (batched by the bridge queue).
  const onRangeChanged = useCallback(
    (range: { startIndex: number; endIndex: number }) => {
      if (!currentUserId) return;
      const start = Math.max(0, range.startIndex - firstItemIndex);
      const end = Math.min(messages.length - 1, range.endIndex - firstItemIndex);
      for (let i = start; i <= end; i++) {
        const m = messages[i];
        if (!m) continue;
        const senderId = m.sender_id || m.sid || '';
        if (senderId && senderId !== currentUserId) {
          markSeen(m._id || m.messageId, senderId);
        }
      }
    },
    [messages, firstItemIndex, currentUserId, markSeen],
  );

  // Flush pending receipts when the list unmounts (channel close / switch).
  useEffect(() => () => flushSeen(), [flushSeen]);

  if (messages.length === 0) {
    if (messagesLoading) {
      return <ChatBubbleShimmer className={className} />;
    }
    return (
      <div className={cn('flex h-full w-full flex-col items-center justify-center text-center text-[1.25rem] font-bold', className)}>
        <div>🥳</div>
        <div>Don&apos;t be shy</div>
        <div>Just start with a 👋🏻</div>
      </div>
    );
  }

  return (
    <Virtuoso
      className={cn('h-full w-full', className)}
      data={messages}
      firstItemIndex={firstItemIndex}
      initialTopMostItemIndex={messages.length - 1}
      followOutput="smooth"
      rangeChanged={onRangeChanged}
      itemContent={(_index, message) => (
        <RenderMessage message={message} currentUserId={currentUserId} />
      )}
    />
  );
}
