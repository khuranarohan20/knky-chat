import React from 'react';
import { Lock, Play } from 'lucide-react';

import type { Media, MessageInterface } from '@knky-chat/core-chat';
import { cn } from '../../../lib/utils';

function toArray(media: Media | Media[] | undefined): Media[] {
  if (!media) return [];
  return Array.isArray(media) ? media : [media];
}

function MediaItem({ item, locked, fee }: { item: Media; locked: boolean; fee?: number }): React.ReactElement {
  const isVideo = item.type?.startsWith('video');

  if (locked) {
    return (
      <div className="relative flex aspect-square items-center justify-center rounded-lg bg-black/60 text-white">
        <div className="flex flex-col items-center gap-1">
          <Lock className="size-5" />
          {fee ? <span className="text-xs font-medium">${fee}</span> : null}
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-lg">
      <img
        src={item.thumbnail || item.url}
        alt=""
        className="aspect-square w-full object-cover"
        loading="lazy"
      />
      {isVideo && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
          <Play className="size-8 text-white" fill="currentColor" />
        </div>
      )}
    </div>
  );
}

/** Image / video attachment(s), with a locked (pay-to-view) state. */
export function MediaAttachment({ message }: { message: MessageInterface }): React.ReactElement {
  const media = toArray(message.meta?.media);
  const locked = message.meta?.is_unlocked === false;
  const fee = message.meta?.media_fee;

  return (
    <div className="space-y-1.5">
      {message.message ? <p className="whitespace-pre-wrap break-words">{message.message}</p> : null}
      {media.length > 0 && (
        <div className={cn('grid gap-1', media.length > 1 ? 'grid-cols-2' : 'grid-cols-1')}>
          {media.map((m, i) => (
            <MediaItem key={m._id || i} item={m} locked={locked} fee={fee} />
          ))}
        </div>
      )}
    </div>
  );
}
