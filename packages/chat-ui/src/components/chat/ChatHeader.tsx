import React from 'react';
import { Ellipsis } from 'lucide-react';

import type { ChatPerson } from '@knky-chat/core-chat';
import { useChat } from '../../hooks/useChat';
import { useChatConfig } from '../../hooks/useChatConfig';
import { useResolvedCreatorId } from '../../hooks/useResolvedCreatorId';
import { useOnlineUsers, useChatStore } from '../../store/chatStore';
import { cn } from '../../lib/utils';
import { Avatar } from './Avatar';
import Badges from '../common/Badges';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Icon } from '../common/Icon';

export interface ChatHeaderProps {
  creatorId?: string;
  className?: string;
}

/**
 * Conversation header — ported to knky-frontend's design: fixed 73px bar with
 * shadow, 56px avatar, name + badges, alias (#7A29CC), online status, and the
 * ⋯ actions menu (Shared Content / Set Alias / Block / Delete via host seams).
 */
export function ChatHeader({ creatorId, className }: ChatHeaderProps): React.ReactElement {
  const id = useResolvedCreatorId(creatorId);
  const { targetPerson } = useChat(creatorId);
  const { getAssetUrl, openModal } = useChatConfig();
  const onlineUsers = useOnlineUsers(id);
  const setShowSharedContent = useChatStore((s) => s.setShowSharedContent);
  const showSharedContent = useChatStore((s) => s.showSharedContent);

  if (!targetPerson) {
    return <div className={cn('border-b bg-white', className)} style={{ height: 73 }} />;
  }

  const person: ChatPerson = targetPerson;
  const name = person.display_name || person.username || 'Unknown';
  const alias = (person as any).alias_name as string | undefined;
  const online = !!person._id && onlineUsers.has(person._id);

  return (
    <div className={cn('z-10 flex items-center justify-between gap-2 rounded-t border-b bg-white p-2 shadow-sm md:p-3', className)} style={{ height: 73 }}>
      <div className="flex min-w-0 items-center gap-2">
        <Avatar url={getAssetUrl({ media: person.avatar?.[0], defaultType: 'avatar' })} name={name} className="size-14 rounded-full object-cover" />
        <div className="min-w-0">
          <div className="flex items-center gap-1">
            <span className="truncate text-[0.9rem] font-semibold text-[#131416]">{name}</span>
            <Badges array={person.badges} />
          </div>
          {alias ? <div className="truncate text-[0.8rem] text-[#7A29CC]">{alias}</div> : null}
          <div className="flex items-center gap-1 text-[0.8rem] text-muted-foreground">
            <span className={cn('size-2 rounded-full', online ? 'bg-green-500' : 'bg-gray-300')} />
            {online ? 'Online' : 'Offline'}
          </div>
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button" className="rounded p-1 hover:bg-black/[0.04]" aria-label="Chat actions">
            <Ellipsis />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => setShowSharedContent(!showSharedContent)}>
            <Icon icon="media" size={20} /> Shared Content
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => openModal?.('SET_ALIAS_NAME', { userId: person._id })}>
            <Icon icon="edit-icon" iconFolder="stand-alone-icons" size={20} /> Set Alias
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => openModal?.('BLOCK_USER', { userId: person._id })}>
            Block
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer gap-2 text-red-600" onClick={() => openModal?.('DELETE_ENTIRE_CHAT', { userId: person._id })}>
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
