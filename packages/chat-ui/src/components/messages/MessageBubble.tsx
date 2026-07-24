import React from 'react';

import type { MessageInterface } from '@knky-chat/core-chat';
import { cn } from '../../lib/utils';
import { BubbleTime } from './BubbleTime';

interface MessageBubbleProps {
  message: MessageInterface;
  isMine: boolean;
  children: React.ReactNode;
}

/** Reply-quote strip shown above a message that replies to another (knky: #E7E7F8 fill, 3px #131416 left bar, magenta text). */
function ReplyQuote({ reply }: { reply: MessageInterface }): React.ReactElement {
  const who = (reply as any)?.name || '';
  return (
    <div className="mb-1 max-w-[20rem] rounded border-l-[3px] border-[#131416] bg-[#E7E7F8] p-2">
      {who ? <div className="truncate text-[0.8rem] font-semibold text-[#ac1991]">{who}</div> : null}
      <p className="truncate text-[0.8rem] text-[#ac1991]">{reply.message || 'Attachment'}</p>
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
          className={cn('flex items-center rounded-full px-2 py-0.5 text-[0.8rem] shadow-sm', isMine ? 'bg-[#f9f4f8]' : 'bg-white')}
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
      <div className="flex max-w-[20rem] flex-col">
        <div
          className={cn(
            'break-words rounded p-2 text-[0.9rem]',
            isMine ? 'border border-[#ebebec] bg-white text-black' : 'bg-[#f5f5f6] text-black',
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
