import React from 'react';

import type { MessageInterface } from '@knky-chat/core-chat';
import { cn } from '../../lib/utils';
import { BubbleTime } from './BubbleTime';

interface MessageBubbleProps {
  message: MessageInterface;
  isMine: boolean;
  children: React.ReactNode;
}

/** Reply-quote strip shown above a message that replies to another. */
function ReplyQuote({ reply }: { reply: MessageInterface }): React.ReactElement {
  return (
    <div className="mb-1 rounded border-l-[3px] border-[#ac1991] bg-[#AC19911A] p-2">
      <p className="truncate text-xs text-gray-600">{reply.message || 'Attachment'}</p>
    </div>
  );
}

/** Emoji reaction pills shown under a bubble. */
function Reactions({ reactions, isMine }: { reactions: Array<{ emote: string }>; isMine: boolean }): React.ReactElement {
  return (
    <div className={cn('mt-1 flex gap-1', isMine ? 'justify-end' : 'justify-start')}>
      {reactions.map((r, i) => (
        <span
          key={i}
          className="flex items-center rounded-full border bg-white px-2 py-0.5 text-xs shadow-sm"
        >
          {r.emote}
        </span>
      ))}
    </div>
  );
}

/**
 * Shared bubble frame — alignment + colours (sent = white+border, received =
 * #f5f5f6), reply-quote, timestamp, and reaction pills. Matches the agency
 * bubble structure.
 */
export function MessageBubble({ message, isMine, children }: MessageBubbleProps): React.ReactElement {
  const reply = message.meta?.replyMessage;
  const reactions = (message.meta?.reactions ?? []) as Array<{ emote: string }>;

  return (
    <div className={cn('flex w-full px-3 py-1', isMine ? 'justify-end' : 'justify-start')}>
      <div className="flex max-w-md flex-col">
        <div
          className={cn(
            'rounded-lg px-4 py-2 text-sm break-words',
            isMine ? 'border bg-white text-black' : 'bg-[#f5f5f6] text-black',
          )}
        >
          {reply ? <ReplyQuote reply={reply} /> : null}
          {children}
          <BubbleTime message={message} isMine={isMine} />
        </div>
        {reactions.length > 0 ? <Reactions reactions={reactions} isMine={isMine} /> : null}
      </div>
    </div>
  );
}
