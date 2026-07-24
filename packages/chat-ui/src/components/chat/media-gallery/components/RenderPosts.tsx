import { memo } from 'react';
import { PlayCircleIcon } from 'lucide-react';

import type { Author, Media } from '@knky-chat/core-chat';
import { cn } from '../../../../lib/utils';
import { formatDuration } from '../../../../lib/format';
import { useChatConfig } from '../../../../hooks/useChatConfig';
import { useResolvedCreatorId } from '../../../../hooks/useResolvedCreatorId';
import { useIsMobile } from '../../../../hooks/useIsMobile';
import { useActiveChannelId, useChatStore } from '../../../../store/chatStore';
import { Icon } from '../../../common/Icon';
import Badges from '../../../common/Badges';
import DateFormatter from '../../../common/DateFormatter';
import LoadingImage from './LoadingImage';
import { Carousel, CarouselContent, CarouselItem } from '../../../ui/carousel';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '../../../ui/context-menu';

interface PostEntry {
  media: Media[];
  author: Author;
  converse_message_created_at: string;
  converse_message_id: string;
  created_at: string;
}

const RenderPosts = memo(function RenderPosts(props: { date: string; posts: PostEntry[] }) {
  const { getAssetUrl, openFullscreenMedia } = useChatConfig();
  const isMobile = useIsMobile();
  const userId = useResolvedCreatorId();
  const channelId = useActiveChannelId(userId);
  const setShowSharedContent = useChatStore((s) => s.setShowSharedContent);
  const jumpToMessage = useChatStore((s) => s.jumpToMessage);

  return (
    <div className={isMobile ? 'p-1' : 'p-3'}>
      <div className="flex items-center justify-between text-muted-foreground">
        <DateFormatter dateString={props.date} formatType="MMM dd, yyyy" isMessage />
      </div>

      <div className={cn('flex flex-col gap-2', 'w-full')}>
        {props.posts.map((post, index) => (
          <Carousel key={index} className={cn(!isMobile && 'mb-4 w-full min-w-0')} opts={{ align: 'start' }}>
            <CarouselContent>
              {post.media?.map((m, mediaIndex) => (
                <CarouselItem key={m._id}>
                  <ContextMenu>
                    <ContextMenuTrigger asChild>
                      <div className="cursor-pointer select-none">
                        <div className="relative w-full">
                          <LoadingImage
                            src={getAssetUrl({ media: m, poster: m.type === 'video', variation: m?.variations?.includes('compressed') ? 'compressed' : 'blur' })}
                            draggable={false}
                            onContextMenu={(e) => e.preventDefault()}
                            onDragStart={(e) => e.preventDefault()}
                            height={isMobile ? 340 : 500}
                            className="rounded object-cover"
                            width="100%"
                            alt="Post media"
                            onClick={() => {
                              if (!m?.variations?.includes('compressed')) return;
                              openFullscreenMedia?.({
                                index: mediaIndex,
                                mediaUrls: [...post.media].reverse().map((media) => ({ type: media.type as 'image' | 'video', url: getAssetUrl({ media }) })),
                              });
                            }}
                          />
                          {m.type === 'video' ? (
                            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                              <PlayCircleIcon size={32} />
                            </div>
                          ) : null}

                          <div className="absolute left-0 top-0 m-1 flex items-center gap-1 text-xs text-white">
                            <Icon icon="video-image-comb" type="filled" size={18} />
                            <div>{post.media.length}</div>
                            {m.type === 'video' ? (
                              <>
                                <div>|</div>
                                <div>{formatDuration(m.duration || 0)}</div>
                              </>
                            ) : null}
                          </div>

                          <div className="absolute left-0 m-2 flex flex-col items-start gap-1 text-white" style={{ bottom: 25 }}>
                            <div className="flex items-center gap-1">
                              {post.author.avatar?.[0] ? (
                                <img
                                  src={getAssetUrl({ media: post.author.avatar[0], defaultType: 'avatar' })}
                                  className="select-none rounded-full object-cover"
                                  height={isMobile ? 18 : 32}
                                  width={isMobile ? 18 : 32}
                                  draggable={false}
                                  onContextMenu={(e) => e.preventDefault()}
                                  onDragStart={(e) => e.preventDefault()}
                                  style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'none' }}
                                  alt={post.author.display_name}
                                />
                              ) : null}
                              {post.author.display_name ? (
                                <div className="flex items-center gap-1 text-sm">
                                  {post.author.display_name} <Badges array={post.author.badges} />
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </div>
                    </ContextMenuTrigger>
                    <ContextMenuContent>
                      <ContextMenuItem
                        onClick={() => {
                          setShowSharedContent(false);
                          jumpToMessage(userId, {
                            chatId: channelId,
                            messageId: props.posts[index].converse_message_id,
                            messageTime: props.posts[index].converse_message_created_at,
                          });
                        }}
                      >
                        <Icon icon="go-to-message" size={16} />
                        Show Message
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        ))}
      </div>
    </div>
  );
});

export default RenderPosts;
