import React from 'react';

import type { Chat } from '@knky-chat/core-chat';
import { cn } from '../../lib/utils';
import { Avatar } from './Avatar';

export interface ChatPersonProps {
  chat: Chat;
  active?: boolean;
  online?: boolean;
  onSelect?: (chat: Chat) => void;
  className?: string;
}

/** Compact relative time for the list row: today → time, else short date. */
function formatChatTime(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const sameYear = d.getFullYear() === now.getFullYear();
  return d.toLocaleDateString([], sameYear ? { day: '2-digit', month: '2-digit' } : { day: '2-digit', month: '2-digit', year: '2-digit' });
}

/** A chat-list row — avatar (+online dot), name, last-message preview, time, unread badge. */
export function ChatPerson({ chat, active = false, online = false, onSelect, className }: ChatPersonProps): React.ReactElement {
  const name = chat.target?.display_name || chat.target?.username || 'Unknown';
  const msg = typeof chat.message === 'object' ? chat.message : undefined;
  const last = msg?.meta?.chat_list_message ?? msg?.message ?? '';
  const unread = chat.unreadCount ?? 0;
  const time = formatChatTime(msg?.createdAt);

  return (
    <button
      type="button"
      onClick={() => onSelect?.(chat)}
      className={cn(
        'relative flex w-full items-center gap-3 border-b border-l-[3px] p-2 text-left transition-colors',
        active ? 'border-l-[#ac1991] bg-[#f9f4f8]' : 'border-l-transparent hover:bg-gray-100',
        className,
      )}
    >
      <div className="relative size-14 shrink-0">
        <Avatar url={chat.target?.avatar?.[0]?.url} name={name} className="size-14 text-sm" />
        {online ? (
          <span className="absolute bottom-0 right-0 size-3.5 rounded-full border-2 border-white bg-green-500" />
        ) : null}
      </div>

      {time ? <span className="absolute right-2 top-1.5 text-xs text-gray-400">{time}</span> : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate pr-10 text-sm font-medium text-gray-900">{name}</span>
        <div className="mt-0.5 flex items-center gap-1">
          <span className="min-w-0 flex-1 truncate text-sm text-gray-600">{last}</span>
          {unread > 0 ? (
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white">
              {unread > 99 ? '99+' : unread}
            </span>
          ) : null}
        </div>
      </div>
    </button>
  );
}
