import React from 'react';

import type { Chat } from '@knky-chat/core-chat';
import { cn } from '../../lib/utils';
import { Avatar } from './Avatar';

export interface ChatPersonProps {
  chat: Chat;
  active?: boolean;
  onSelect?: (chat: Chat) => void;
  className?: string;
}

/** A single chat-list row: avatar, name, last-message preview, unread badge. */
export function ChatPerson({ chat, active = false, onSelect, className }: ChatPersonProps): React.ReactElement {
  const name = chat.target?.display_name || chat.target?.username || 'Unknown';
  const last = typeof chat.message === 'object' ? (chat.message?.message ?? '') : '';
  const unread = chat.unreadCount ?? 0;

  return (
    <button
      type="button"
      onClick={() => onSelect?.(chat)}
      className={cn(
        'flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted',
        active && 'bg-muted',
        className,
      )}
    >
      <Avatar url={chat.target?.avatar?.[0]?.url} name={name} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{name}</p>
        <p className="truncate text-xs text-muted-foreground">{last}</p>
      </div>
      {unread > 0 ? (
        <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
          {unread}
        </span>
      ) : null}
    </button>
  );
}
