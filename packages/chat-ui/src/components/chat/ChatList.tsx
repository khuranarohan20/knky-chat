import React from 'react';

import { useChat } from '../../hooks/useChat';
import { useShowChat } from '../../hooks/useShowChat';
import { cn } from '../../lib/utils';
import { ChatPerson } from './ChatPerson';

export interface ChatListProps {
  creatorId?: string;
  className?: string;
}

/**
 * Left sidebar: the creator's chat list. Clicking a row opens the chat
 * (connect + load history + set the header's target person via useShowChat).
 */
export function ChatList({ creatorId, className }: ChatListProps): React.ReactElement {
  const { chatList, activeChannelId } = useChat(creatorId);
  const { openChat } = useShowChat(creatorId);

  return (
    <div className={cn('flex h-full flex-col overflow-y-auto bg-background', className)}>
      {chatList.length === 0 ? (
        <p className="p-4 text-sm text-muted-foreground">No chats</p>
      ) : (
        chatList.map((chat) => (
          <ChatPerson
            key={chat.converse_channel_id}
            chat={chat}
            active={chat.converse_channel_id === activeChannelId}
            onSelect={() => void openChat(chat.converse_channel_id, chat.unreadCount ?? 0)}
          />
        ))
      )}
    </div>
  );
}
