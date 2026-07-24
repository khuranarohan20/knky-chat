import { memo, useMemo } from 'react';

import type { Media, MetaInterface } from '@knky-chat/core-chat';
import { cn } from '../../../../lib/utils';
import { useResolvedCreatorId } from '../../../../hooks/useResolvedCreatorId';
import { useIsMobile } from '../../../../hooks/useIsMobile';
import { useActiveChannelId, useChatList, useChatStore, useTargetPerson } from '../../../../store/chatStore';
import { Icon } from '../../../common/Icon';
import DateFormatter from '../../../common/DateFormatter';
import { sharedItemToMedia } from '../constants';
import type { SharedMediaItem } from '../types';
import AudioSlide from './AudioSlide';
import MediaSlide from './MediaSlide';
import { Carousel, CarouselContent, CarouselItem } from '../../../ui/carousel';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '../../../ui/context-menu';

const MIN_MEDIA_PRICE = 1;

const DateWiseMedia = memo(function DateWiseMedia(props: {
  date: string;
  media: SharedMediaItem[][];
  meta: MetaInterface[];
  author?: string;
  type: 'audio' | 'media';
}) {
  const isMobile = useIsMobile();
  const userId = useResolvedCreatorId();
  const channelId = useActiveChannelId(userId);
  const targetPerson = useTargetPerson(userId);
  const chatList = useChatList(userId);
  const setShowSharedContent = useChatStore((s) => s.setShowSharedContent);
  const jumpToMessage = useChatStore((s) => s.jumpToMessage);

  const targetAvatar = targetPerson?.avatar as Media[] | undefined;
  const myAvatar = useMemo(() => {
    const foundChat = chatList.find((x) => x.converse_channel_id === channelId);
    return foundChat?.initiator?._id === userId ? foundChat.initiator.avatar : foundChat?.target?.avatar;
  }, [chatList, channelId, userId]) as Media[] | undefined;

  const isAudio = props.type === 'audio';

  const reversedMediaGroups = useMemo(() => props.media.map((group) => ({ original: group, reversed: [...group].reverse() })), [props.media]);

  return (
    <div className="flex w-full min-w-0 grow flex-col">
      <div className="flex items-center justify-between p-3 text-muted-foreground">
        <DateFormatter dateString={props.date || new Date().toISOString()} formatType="MMM dd, yyyy" isMessage />
      </div>

      <div className={cn(isAudio ? 'flex flex-col gap-2' : 'flex flex-col gap-2', 'w-full')}>
        {reversedMediaGroups.map(({ reversed }, groupIndex) => (
          <Carousel key={groupIndex} className={cn(!isMobile && 'mb-4', 'min-w-0')} opts={{ align: 'start', ...(isAudio && { dragFree: true, watchDrag: false }) }}>
            <CarouselContent>
              {reversed.map((m, index) => {
                const mediaItem = sharedItemToMedia(m);
                const isOwner = m.author === userId;
                const isLocked = m?.is_unlocked === false;
                const isPaidMedia = m?.media_fee >= MIN_MEDIA_PRICE;
                return (
                  <CarouselItem key={m._id}>
                    <ContextMenu>
                      <ContextMenuTrigger asChild>
                        <div className="cursor-pointer select-none">
                          {!isAudio ? (
                            <MediaSlide
                              m={m}
                              index={index}
                              mediaItem={mediaItem}
                              reversedGroup={reversed}
                              isOwner={isOwner}
                              isLocked={isLocked}
                              isPaidMedia={isPaidMedia}
                              converse_message_created_at={m.converse_message_created_at}
                              converse_message_id={m.converse_message_id}
                            />
                          ) : (
                            <AudioSlide m={m} mediaItem={mediaItem} isOwner={isOwner} isLocked={isLocked} myAvatar={myAvatar} targetAvatar={targetAvatar} />
                          )}
                        </div>
                      </ContextMenuTrigger>
                      <ContextMenuContent>
                        <ContextMenuItem
                          onClick={() => {
                            setShowSharedContent(false);
                            jumpToMessage(userId, { chatId: channelId, messageId: m.converse_message_id, messageTime: m.converse_message_created_at });
                          }}
                        >
                          <Icon icon="go-to-message" size={16} />
                          Show Message
                        </ContextMenuItem>
                      </ContextMenuContent>
                    </ContextMenu>
                  </CarouselItem>
                );
              })}
            </CarouselContent>
          </Carousel>
        ))}
      </div>
    </div>
  );
});

export default DateWiseMedia;
