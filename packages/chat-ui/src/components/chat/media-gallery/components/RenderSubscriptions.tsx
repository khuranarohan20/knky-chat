import { memo } from 'react';

import type { Media } from '@knky-chat/core-chat';
import { cn } from '../../../../lib/utils';
import { getSubscriptionPriceDetails } from '../../../../lib/subscription';
import { useChatConfig } from '../../../../hooks/useChatConfig';
import { useResolvedCreatorId } from '../../../../hooks/useResolvedCreatorId';
import { useIsMobile } from '../../../../hooks/useIsMobile';
import { useActiveChannelId, useChatStore } from '../../../../store/chatStore';
import { Icon } from '../../../common/Icon';
import DateFormatter from '../../../common/DateFormatter';
import { Button } from '../../../ui/button';
import LoadingImage from './LoadingImage';
import { SubscriptionButton } from './SubscriptionButton';
import type { GroupedSubscriptionEntry } from '../types';
import { Carousel, CarouselContent, CarouselItem } from '../../../ui/carousel';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '../../../ui/context-menu';

const PURCHASE_SUBSCRIPTION = "You can't subscribe on behalf of the creator.";

const RenderSubscriptions = memo(function RenderSubscriptions(props: { date: string; posts: GroupedSubscriptionEntry[] }) {
  const { getAssetUrl, toast } = useChatConfig();
  const isMobile = useIsMobile();
  const userId = useResolvedCreatorId();
  const channelId = useActiveChannelId(userId);
  const setShowSharedContent = useChatStore((s) => s.setShowSharedContent);
  const jumpToMessage = useChatStore((s) => s.jumpToMessage);

  return (
    <div className="p-3">
      <div className="flex items-center justify-between text-muted-foreground">
        <DateFormatter dateString={props.date} formatType="MMM dd, yyyy" isMessage />
      </div>

      <div className="flex flex-col gap-2">
        {props.posts
          .filter((x) => x?.media.length > 0)
          .map((post, index) => (
            <Carousel key={index} className={cn(!isMobile && 'mb-4 h-full w-full min-w-0')} opts={{ align: 'start' }}>
              <CarouselContent className="h-full">
                {[...(post?.media || [])].reverse().map((m: Media) => (
                  <CarouselItem key={m._id} className="h-full">
                    <ContextMenu>
                      <ContextMenuTrigger asChild>
                        <div className="h-full cursor-pointer select-none rounded border" onClick={() => setShowSharedContent(false)}>
                          <div className="relative w-full">
                            {m.type === 'video' ? (
                              <video
                                src={getAssetUrl({ media: m, variation: m.variations?.includes('compressed') ? 'compressed' : 'blur' })}
                                height={200}
                                className="rounded-t object-cover"
                                width="100%"
                                draggable={false}
                                onContextMenu={(e) => e.preventDefault()}
                                onDragStart={(e) => e.preventDefault()}
                                controls={false}
                                autoPlay
                                muted
                                loop
                              />
                            ) : (
                              <LoadingImage
                                src={getAssetUrl({ media: m, variation: m.variations?.includes('compressed') ? 'compressed' : 'blur' })}
                                height={200}
                                className="rounded-t object-cover"
                                width="100%"
                                draggable={false}
                                onContextMenu={(e) => e.preventDefault()}
                                onDragStart={(e) => e.preventDefault()}
                                alt="Channel media"
                              />
                            )}
                            <div className="p-2">
                              <div className="flex items-center gap-1">
                                {post.avatar?.[0] ? (
                                  <img
                                    src={getAssetUrl({ media: post.avatar[0], poster: m.type === 'video', defaultType: 'background' })}
                                    className="rounded-full object-cover"
                                    height={50}
                                    width={50}
                                    draggable={false}
                                    onContextMenu={(e) => e.preventDefault()}
                                    onDragStart={(e) => e.preventDefault()}
                                    style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'none' }}
                                    onError={(e) => {
                                      (e.currentTarget as HTMLImageElement).src = '/images/common/default.svg';
                                    }}
                                    alt={post.author.display_name}
                                  />
                                ) : null}
                                <div className="flex flex-col">
                                  {post.channel_name ? (
                                    <div className="flex items-center gap-1 text-sm">
                                      <div className="font-bold">{post.channel_name}</div>
                                      <div className="text-muted-foreground">@{post.tag_name}</div>
                                    </div>
                                  ) : null}
                                  {post.counter && post.counter.media_count ? (
                                    <div className="flex gap-2">
                                      <div className="text-sm">
                                        <span className="font-bold">{post.counter.media_count.image_count ?? 0}</span> photos
                                      </div>
                                      <div className="text-sm">
                                        <span className="font-bold">{post.counter.media_count.video_count ?? 0}</span> videos
                                      </div>
                                      {post.perks && post.perks.length > 0 ? (
                                        <div className="text-sm">
                                          <span className="font-bold">{post.perks.length}</span> perks
                                        </div>
                                      ) : null}
                                    </div>
                                  ) : null}
                                </div>
                              </div>
                              <div className={cn('mt-2', { invisible: post.author._id === userId })}>
                                {post?.is_subscribed ? (
                                  <SubscriptionButton
                                    is_cancelled={post?.my_subscription_data?.is_cancelled}
                                    planPrice={post?.my_subscription_data?.other_data?.price}
                                    planExpiry={post?.expires_on || ''}
                                    planType={post.my_subscription_data?.other_data?.package_type}
                                    className="w-full"
                                  />
                                ) : (
                                  Object.keys(post?.min_subscription || {}).length !== 0 && (
                                    <Button
                                      className="flex w-full justify-between"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        toast?.error?.(PURCHASE_SUBSCRIPTION);
                                      }}
                                    >
                                      <p className="m-0">Subscribe</p>
                                      <p className="m-0">
                                        {getSubscriptionPriceDetails(post?.min_subscription)?.finalAmount === 0
                                          ? 'for Free'
                                          : `from ${getSubscriptionPriceDetails(post?.min_subscription)?.finalText} /mo`}
                                      </p>
                                    </Button>
                                  )
                                )}
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

export default RenderSubscriptions;
