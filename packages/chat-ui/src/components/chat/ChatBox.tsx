import React from 'react';

import { useChat } from '../../hooks/useChat';
import { cn } from '../../lib/utils';
import { ChatBar } from './ChatBar';
import { ChatBubbles } from './ChatBubbles';
import { ChatFeeBanner } from './ChatFeeBanner';
import { ChatHeader } from './ChatHeader';
import { PinnedMessages } from './PinnedMessages';
import { SubscriptionPrompt } from './SubscriptionPrompt';

export interface ChatBoxProps {
  creatorId?: string;
  /** Logged-in user's id — own messages align right with receipt ticks. */
  currentUserId?: string;
  className?: string;
}

/**
 * The chat panel: header + virtualised message list + composer.
 * Shows an empty state until a channel is opened (activeChannelId set).
 */
export function ChatBox({ creatorId, currentUserId, className }: ChatBoxProps): React.ReactElement {
  const { activeChannelId } = useChat(creatorId);
  const hasActiveChannel = activeChannelId.length > 0;

  return (
    <div className={cn('flex h-full flex-col bg-background', className)}>
      <ChatHeader creatorId={creatorId} />
      {hasActiveChannel ? <PinnedMessages creatorId={creatorId} /> : null}
      <div className="min-h-0 flex-1">
        {hasActiveChannel ? (
          <ChatBubbles creatorId={creatorId} currentUserId={currentUserId} />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 rounded bg-white">
            <img src="/images/knky.svg" alt="KNKY" height={50} className="h-[50px]" onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')} />
            <p className="text-[0.9rem] text-black/50">Select a chat to get started!</p>
          </div>
        )}
      </div>
      {hasActiveChannel ? (
        <>
          <SubscriptionPrompt creatorId={creatorId} selfId={currentUserId} />
          <ChatFeeBanner creatorId={creatorId} selfId={currentUserId} />
          <ChatBar creatorId={creatorId} selfId={currentUserId} />
        </>
      ) : null}
    </div>
  );
}
