import { memo } from 'react';

import type { Media } from '@knky-chat/core-chat';
import { formatCurrency, formatDuration } from '../../../../lib/format';
import { cn } from '../../../../lib/utils';
import { useChatConfig } from '../../../../hooks/useChatConfig';
import WaveAudioPlayer from '../../../common/WaveAudioPlayer';
import { Button } from '../../../ui/button';
import type { SharedMediaItem } from '../types';
import { StatusBadge } from './Badges';

const MIN_MEDIA_PRICE = 1;
const PURCHASE_MEDIA = "You can't buy media on behalf of the creator.";

const AudioSlide = memo(function AudioSlide({
  m,
  mediaItem,
  isOwner,
  isLocked,
  myAvatar,
  targetAvatar,
}: {
  m: SharedMediaItem;
  mediaItem: Media;
  isOwner: boolean;
  isLocked: boolean;
  myAvatar?: Media[];
  targetAvatar?: Media[];
}) {
  const { getAssetUrl, toast } = useChatConfig();
  return (
    <div className={cn('flex w-full items-center gap-2 px-3')}>
      <div className="shrink-0">
        <img
          src={
            isOwner
              ? getAssetUrl({ media: myAvatar?.[0] ? myAvatar[0] : undefined, variation: 'thumb', defaultType: 'avatar' })
              : getAssetUrl({ media: targetAvatar?.[0] ? targetAvatar[0] : undefined, variation: 'thumb', defaultType: 'avatar' })
          }
          alt="User avatar"
          className="rounded-full object-cover"
          height={38}
          width={38}
        />
      </div>
      <div className="flex w-full items-center gap-3 rounded border px-1">
        <WaveAudioPlayer height={25} disable={!isOwner && isLocked} url={getAssetUrl({ media: mediaItem })} className="mb-2 mt-2 h-full w-full" progressColor="rgb(172,25,145, 0.5)" waveColor="#ddd" />
        <div className="text-xs">{formatDuration(mediaItem.duration || 0)}</div>
      </div>

      <Button className={cn((isOwner || !isLocked || m.media_fee < MIN_MEDIA_PRICE) && 'hidden')} onClick={() => toast?.error?.(PURCHASE_MEDIA)}>
        Pay {formatCurrency(m.media_fee)}
      </Button>

      <div className={cn('flex w-fit items-center', !isOwner && 'hidden')}>
        {m.media_fee >= MIN_MEDIA_PRICE ? <div className="text-xs">{formatCurrency(m.media_fee || 0)}</div> : null}
        {m.media_fee >= MIN_MEDIA_PRICE ? <StatusBadge isUnlocked={m?.is_unlocked === true} absoluteRequired={false} /> : null}
      </div>
    </div>
  );
});

export default AudioSlide;
