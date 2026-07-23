import React, { useState } from 'react';

import { useChat } from '../../hooks/useChat';
import { useShowChat } from '../../hooks/useShowChat';
import { cn } from '../../lib/utils';
import { filterChats } from '../../lib/filterChats';
import { ChatListFilters } from './ChatListFilters';
import { ChatPerson } from './ChatPerson';

export interface ChatListProps {
  creatorId?: string;
  className?: string;
  /** Show the search box + read-status filters (default true). */
  showFilters?: boolean;
}

/**
 * Left sidebar: search + read-status filters + the creator's chat list.
 * Clicking a row opens the chat (connect + load history + set header target
 * via useShowChat).
 */
export function ChatList({ creatorId, className, showFilters = true }: ChatListProps): React.ReactElement {
  const { chatList, activeChannelId, filter, creatorId: id } = useChat(creatorId);
  const { openChat } = useShowChat(creatorId);
  const [search, setSearch] = useState('');

  const visible = filterChats(chatList, filter, search);

  return (
    <div className={cn('flex h-full flex-col bg-background', className)}>
      {showFilters ? (
        <div className="border-b">
          <div className="p-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search"
              aria-label="Search chats"
              className={cn(
                'w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm outline-none',
                'placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
              )}
            />
          </div>
          <ChatListFilters creatorId={id} />
        </div>
      ) : null}

      <div className="flex-1 overflow-y-auto">
        {visible.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">No chats</p>
        ) : (
          visible.map((chat) => (
            <ChatPerson
              key={chat.converse_channel_id}
              chat={chat}
              active={chat.converse_channel_id === activeChannelId}
              onSelect={() => void openChat(chat.converse_channel_id, chat.unreadCount ?? 0)}
            />
          ))
        )}
      </div>
    </div>
  );
}
