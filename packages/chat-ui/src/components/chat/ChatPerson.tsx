import React from 'react';
import { CheckCheck } from 'lucide-react';

import type { Chat, ChatPerson as ChatPersonType } from '@knky-chat/core-chat';
import { cn } from '../../lib/utils';
import { Avatar } from './Avatar';
import Badges from '../common/Badges';

export interface ChatPersonProps {
  chat: Chat;
  /** The participant to display (the fan = the side that isn't me). */
  person?: ChatPersonType | null;
  active?: boolean;
  online?: boolean;
  /** Pre-resolved avatar URL (from the host's getAssetUrl). */
  avatarUrl?: string;
  /** Logged-in participant id — to detect if the last message was sent by me. */
  selfId?: string;
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

/**
 * Chat-list row — ported to knky-frontend's design: ~80px, 1rem padding, 56px
 * avatar, 3px magenta left border on the active row (no bg fill), #E7E7F8
 * bottom divider, fs-9 timestamp top-right, fs-7 name/preview (bold when
 * unread from the other party), #42B1FF seen double-check on my last message,
 * red pill unread badge.
 */
export function ChatPerson({ chat, person, active = false, online = false, avatarUrl, selfId, onSelect, className }: ChatPersonProps): React.ReactElement {
  const who = person ?? chat.target;
  const name = who?.display_name || who?.username || 'Unknown';
  const msg = typeof chat.message === 'object' ? chat.message : undefined;
  const last = msg?.meta?.chat_list_message ?? msg?.message ?? '';
  const unread = chat.unreadCount ?? 0;
  const time = formatChatTime(msg?.createdAt);
  const sentByMe = !!selfId && (msg?.sender_id === selfId || (msg as any)?.sid === selfId);
  const seen = (msg?.seen_count ?? 0) > 0;
  const bold = unread > 0 && !sentByMe;

  return (
    <button
      type="button"
      onClick={() => onSelect?.(chat)}
      style={{ borderBottom: '1px solid #E7E7F8' }}
      className={cn(
        'relative flex min-h-[80px] w-full items-center gap-2 border-l-[3px] border-r-[3px] border-r-transparent p-4 text-left transition-colors',
        active ? 'border-l-[#ac1991]' : 'border-l-transparent hover:bg-black/[0.02]',
        className,
      )}
    >
      <div className="relative size-14 shrink-0">
        <Avatar url={avatarUrl ?? who?.avatar?.[0]?.url} name={name} className="size-14 rounded-full object-cover text-sm" />
        {online ? <span className="absolute bottom-0 right-0 size-3.5 rounded-full border-2 border-white bg-green-500" /> : null}
      </div>

      {time ? <span className="absolute right-3 top-2 text-[0.7rem] text-muted-foreground">{time}</span> : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <span className={cn('flex items-center gap-1 truncate pr-10 text-[0.9rem] text-[#131416]', bold && 'font-bold')}>
          <span className="truncate">{name}</span>
          <Badges array={who?.badges} />
        </span>
        <div className="mt-0.5 flex w-full items-center gap-1">
          {sentByMe ? <CheckCheck size={16} className="shrink-0" color={seen ? '#42B1FF' : 'gray'} /> : null}
          <span className={cn('block min-w-0 flex-1 truncate text-[0.9rem] text-[#131416]', bold && 'font-bold')}>{last}</span>
          {unread > 0 ? (
            <span
              className="flex shrink-0 items-center justify-center rounded-full bg-red-500 px-[5px] text-[0.8rem] font-medium text-white"
              style={{ height: 20, minWidth: 20 }}
            >
              {unread > 99 ? '99+' : unread}
            </span>
          ) : null}
        </div>
      </div>
    </button>
  );
}
