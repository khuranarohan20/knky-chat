import React from 'react';

import { useChat } from '../../hooks/useChat';
import { cn } from '../../lib/utils';
import { ChatBar } from './ChatBar';
import { ChatBubbles } from './ChatBubbles';
import { ChatHeader } from './ChatHeader';

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
      <div className="min-h-0 flex-1">
        {hasActiveChannel ? (
          <ChatBubbles creatorId={creatorId} currentUserId={currentUserId} />
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-muted-foreground">Select a conversation</p>
          </div>
        )}
      </div>
      <ChatBar creatorId={creatorId} disabled={!hasActiveChannel} />
    </div>
  );
}
