import React, { memo } from 'react';

import type { Media } from '@knky-chat/core-chat';
import { formatCurrency, formatDuration } from '../../../../lib/format';
import { getResolution } from '../../../../lib/media';
import { useChatConfig } from '../../../../hooks/useChatConfig';
import { useResolvedCreatorId } from '../../../../hooks/useResolvedCreatorId';
import { useActiveChannelId, useChatStore } from '../../../../store/chatStore';
import { Icon } from '../../../common/Icon';
import { sharedItemToMedia } from '../constants';
import type { SharedMediaItem } from '../types';
import { BottomRightBadge, PriceBadge, StatusBadge, TopLeftBadge, VideoOverlay } from './Badges';
import LoadingImage from './LoadingImage';

const MediaSlide = memo(function MediaSlide({
  m,
  index,
  mediaItem,
  reversedGroup,
  isOwner,
  isLocked,
  isPaidMedia,
  converse_message_id,
  converse_message_created_at,
}: {
  m: SharedMediaItem;
  index: number;
  mediaItem: Media;
  reversedGroup: SharedMediaItem[];
  isOwner: boolean;
  isLocked: boolean;
  isPaidMedia: boolean;
  converse_message_id: string;
  converse_message_created_at: string;
}) {
  const { getAssetUrl, openFullscreenMedia } = useChatConfig();
  const userId = useResolvedCreatorId();
  const channelId = useActiveChannelId(userId);
  const setShowSharedContent = useChatStore((s) => s.setShowSharedContent);
  const jumpToMessage = useChatStore((s) => s.jumpToMessage);

  const canOpenFullscreen = m.variations.includes('compressed');

  const handleOpen = () => {
    if (!canOpenFullscreen) return;
    openFullscreenMedia?.({
      index,
      mediaUrls: reversedGroup.map((media) => ({ type: media.type as 'image' | 'video', url: getAssetUrl({ media: sharedItemToMedia(media) }) })),
    });
  };

  const showMessage = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setShowSharedContent(false);
    jumpToMessage(userId, { chatId: channelId, messageId: converse_message_id, messageTime: converse_message_created_at });
  };

  return (
    <div className="relative w-full">
      <LoadingImage
        draggable={false}
        onDragStart={(e) => e.preventDefault()}
        src={getAssetUrl({ media: mediaItem, poster: m.type === 'video', variation: canOpenFullscreen ? 'compressed' : 'blur' })}
        height={200}
        width="100%"
        className="object-cover"
        alt="Shared media"
        onClick={handleOpen}
        style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'none', userSelect: 'none' }}
      />

      {m?.is_unlocked !== undefined && isOwner && isPaidMedia ? <StatusBadge isUnlocked={!!m.is_unlocked} /> : null}

      {m?.is_unlocked === false && !isOwner && isPaidMedia ? (
        <div className="absolute left-1/2 top-1/2 flex w-full -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center text-white">
          <div className="flex items-center gap-2">
            <Icon icon="video-image-comb" size={18} type="filled" /> {reversedGroup.length}
            {reversedGroup.some((x) => x.type === 'video') ? (
              <>
                <div>|</div>
                <div>{formatDuration(reversedGroup.reduce((acc, curr) => (curr.type === 'video' ? acc + (+(curr.duration || 0) || 0) : acc), 0))}</div>
              </>
            ) : null}
          </div>
          <div className="mt-2 cursor-pointer" onClick={showMessage}>
            Unlock for {formatCurrency(m.media_fee)}
          </div>
        </div>
      ) : null}

      <div className="absolute top-0 m-2 flex w-full justify-center gap-1">
        {reversedGroup.length > 1
          ? (() => {
              const maxDots = 5;
              const shouldLimit = reversedGroup.length > maxDots;
              const visibleCount = shouldLimit ? maxDots : reversedGroup.length;
              const activeDotPosition = shouldLimit ? index % maxDots : index;
              return Array.from({ length: visibleCount }).map((_, idx) => (
                <div key={idx} className="rounded-full" style={{ height: 8, width: 8, backgroundColor: activeDotPosition === idx ? '#fff' : '#FFFFFF66' }} />
              ));
            })()
          : null}
      </div>

      {m?.is_unlocked !== undefined && isPaidMedia ? <PriceBadge price={m.media_fee} isOwner={isOwner} isUnlocked={m?.is_unlocked === true} /> : null}

      {m.type === 'video' && (m.is_unlocked === undefined || m.is_unlocked === true) ? <VideoOverlay isLocked={isLocked && !isOwner} /> : null}

      {m.type === 'video' && mediaItem.duration ? <BottomRightBadge>{formatDuration(mediaItem.duration)}</BottomRightBadge> : null}

      {mediaItem.resolution ? <TopLeftBadge>{getResolution(mediaItem.resolution)}</TopLeftBadge> : null}
    </div>
  );
});

export default MediaSlide;
