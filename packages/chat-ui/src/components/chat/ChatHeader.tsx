import React from 'react';

import type { ChatPerson } from '@knky-chat/core-chat';
import { useChat } from '../../hooks/useChat';
import { cn } from '../../lib/utils';

function initialsOf(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function Avatar({ url, name }: { url?: string; name: string }): React.ReactElement {
  if (url) {
    return <img src={url} alt={name} className="size-9 rounded-full object-cover" />;
  }
  return (
    <div className="flex size-9 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
      {initialsOf(name)}
    </div>
  );
}

export interface ChatHeaderProps {
  creatorId?: string;
  className?: string;
}

/** Header for the active chat — target person's avatar + name. */
export function ChatHeader({ creatorId, className }: ChatHeaderProps): React.ReactElement {
  const { targetPerson } = useChat(creatorId);

  if (!targetPerson) {
    return <div className={cn('h-[57px] border-b bg-background', className)} />;
  }

  const person: ChatPerson = targetPerson;
  const name = person.display_name || person.username || 'Unknown';

  return (
    <div className={cn('flex items-center gap-3 border-b bg-background px-4 py-2.5', className)}>
      <Avatar url={person.avatar?.[0]?.url} name={name} />
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{name}</p>
        {person.username ? (
          <p className="truncate text-xs text-muted-foreground">@{person.username}</p>
        ) : null}
      </div>
    </div>
  );
}
