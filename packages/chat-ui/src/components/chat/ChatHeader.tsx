import React from 'react';

import type { ChatPerson } from '@knky-chat/core-chat';
import { useChat } from '../../hooks/useChat';
import { useChatConfig } from '../../hooks/useChatConfig';
import { cn } from '../../lib/utils';
import { Avatar } from './Avatar';

export interface ChatHeaderProps {
  creatorId?: string;
  className?: string;
}

/** Header for the active chat — target person's avatar + name. */
export function ChatHeader({ creatorId, className }: ChatHeaderProps): React.ReactElement {
  const { targetPerson } = useChat(creatorId);
  const { getAssetUrl } = useChatConfig();

  if (!targetPerson) {
    return <div className={cn('h-[57px] border-b bg-background', className)} />;
  }

  const person: ChatPerson = targetPerson;
  const name = person.display_name || person.username || 'Unknown';

  return (
    <div className={cn('flex items-center gap-3 border-b bg-white p-3', className)}>
      <Avatar url={getAssetUrl({ media: person.avatar?.[0], defaultType: 'avatar' })} name={name} className="size-11" />
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-gray-900">{name}</p>
        {person.username ? (
          <p className="truncate text-xs text-gray-500">@{person.username}</p>
        ) : null}
      </div>
    </div>
  );
}
