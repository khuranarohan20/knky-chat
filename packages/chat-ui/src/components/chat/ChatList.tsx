import React, { useState } from 'react';
import { Search } from 'lucide-react';

import { useChat } from '../../hooks/useChat';
import { useShowChat } from '../../hooks/useShowChat';
import { useChatConfig } from '../../hooks/useChatConfig';
import { cn } from '../../lib/utils';
import { filterChats } from '../../lib/filterChats';
import { otherParticipant } from '../../lib/participant';
import { useChatListLoading, useOnlineUsers } from '../../store/chatStore';
import { ChatListFilters } from './ChatListFilters';
import { ChatPerson } from './ChatPerson';
import { ChatListShimmer } from '../shimmers/ChatListShimmer';

export interface ChatListProps {
  creatorId?: string;
  className?: string;
  /** Show the search box + read-status filters (default true). */
  showFilters?: boolean;
  /**
   * The logged-in participant's id, used to pick the OTHER participant to show
   * per row. Agency: the creator id (default). Core: the logged-in user id
   * (the creatorId there is the "__core__" sentinel, which matches nobody).
   */
  selfId?: string;
}

/**
 * Left sidebar: search + read-status filters + the creator's chat list.
 * Clicking a row opens the chat (connect + load history + set header target
 * via useShowChat).
 */
export function ChatList({ creatorId, className, showFilters = true, selfId }: ChatListProps): React.ReactElement {
  const { chatList, activeChannelId, filter, creatorId: id } = useChat(creatorId);
  const self = selfId ?? id;
  const loading = useChatListLoading(id);
  const onlineUsers = useOnlineUsers(id);
  const { getAssetUrl } = useChatConfig();
  const { openChat } = useShowChat(creatorId);
  const [search, setSearch] = useState('');

  const visible = filterChats(chatList, filter, search);

  return (
    <div className={cn('flex h-full flex-col bg-background', className)}>
      {showFilters ? (
        <div className="border-b">
          <div className="m-3 flex items-center justify-between gap-2">
            <span className="text-[1.25rem] font-semibold">Chat</span>
            <div className="relative w-full" style={{ maxWidth: '24rem' }}>
              <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search"
                aria-label="Search chats"
                className="w-full rounded-md border-0 bg-[#f1f1f4] p-2 pl-11 text-[0.9rem] outline-none placeholder:text-muted-foreground"
              />
            </div>
          </div>
          <ChatListFilters creatorId={id} />
        </div>
      ) : null}

      <div className="flex-1 overflow-y-auto">
        {loading && chatList.length === 0 ? (
          <ChatListShimmer />
        ) : visible.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">No chats</p>
        ) : (
          visible.map((chat) => {
            const person = otherParticipant(chat, self);
            return (
              <ChatPerson
                key={chat.converse_channel_id}
                chat={chat}
                person={person}
                selfId={self}
                active={chat.converse_channel_id === activeChannelId}
                online={!!person?._id && onlineUsers.has(person._id)}
                avatarUrl={getAssetUrl({ media: person?.avatar?.[0], defaultType: 'avatar' })}
                onSelect={() => void openChat(chat.converse_channel_id, chat.unreadCount ?? 0)}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
