import { useEffect, useMemo, useRef, useState } from 'react';
import { format } from 'date-fns/format';
import { Loader2, X } from 'lucide-react';
import InfiniteScroll from 'react-infinite-scroll-component';

import type { Author, Media, MetaInterface } from '@knky-chat/core-chat';
import { cn } from '../../../lib/utils';
import { useAdapter } from '../../../adapter/AdapterContext';
import { useChatConfig } from '../../../hooks/useChatConfig';
import { useResolvedCreatorId } from '../../../hooks/useResolvedCreatorId';
import { useIsMobile } from '../../../hooks/useIsMobile';
import { useActiveChannelId, useChatStore } from '../../../store/chatStore';
import DateWiseMedia from './components/DateWiseMedia';
import RenderPosts from './components/RenderPosts';
import RenderService from './components/RenderServices';
import RenderSubscriptions from './components/RenderSubscriptions';
import { categories, LIMIT } from './constants';
import type { ApiPost, GroupedServiceEntry, GroupedSubscriptionEntry, ServiceItem, SharedMediaItem } from './types';

type Category = 'Media' | 'Audio' | 'Channel' | 'Posts' | 'Services';

export interface MediaGalleryProps {
  creatorId?: string;
}

/**
 * Shared-content gallery — ported from the agency MediaGallery. Five category
 * tabs (Media/Audio/Channel/Posts/Services), each infinite-scroll paginated via
 * the host's api.getSharedContent seam and grouped by date.
 */
export function MediaGallery({ creatorId }: MediaGalleryProps = {}): React.ReactElement {
  const isMobile = useIsMobile();
  const api = useAdapter().getApi();
  const { toast } = useChatConfig();
  const userId = useResolvedCreatorId(creatorId);
  const channelId = useActiveChannelId(userId);
  const showSharedContent = useChatStore((s) => s.showSharedContent);
  const setShowSharedContent = useChatStore((s) => s.setShowSharedContent);

  const [categorySelected, setCategorySelected] = useState<Category>('Media');
  const [mediaData, setMediaData] = useState<SharedMediaItem[]>([]);
  const [postData, setPostData] = useState<ApiPost[][]>([]);
  const [subscriptionData, setSubscriptionData] = useState<any[]>([]);
  const [serviceData, setServiceData] = useState<ServiceItem[]>([]);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const currentPageRef = useRef(1);
  const mediaDataRef = useRef<SharedMediaItem[]>([]);
  const postDataRef = useRef<ApiPost[][]>([]);
  const subscriptionDataRef = useRef<any[]>([]);
  const serviceDataRef = useRef<ServiceItem[]>([]);

  useEffect(() => {
    currentPageRef.current = page;
  }, [page]);

  const fetchShared = (type: Category, pageNum: number) =>
    api.getSharedContent?.({
      channelId,
      type: (type === 'Channel' ? 'channel' : type === 'Posts' ? 'post' : type === 'Services' ? 'service' : type.toLowerCase()) as any,
      page: pageNum,
      limit: LIMIT,
      creatorId: userId,
    }) ?? Promise.resolve([]);

  const isContentScrollable = () => {
    const c = scrollContainerRef.current;
    return c ? c.scrollHeight > c.clientHeight : false;
  };

  // Initial load per (channel, category).
  useEffect(() => {
    if (!showSharedContent || !channelId || !api.getSharedContent) return;
    let cancelled = false;
    currentPageRef.current = 1;
    mediaDataRef.current = [];
    postDataRef.current = [];
    subscriptionDataRef.current = [];
    serviceDataRef.current = [];
    setIsLoadingMore(false);
    setLoading(true);
    (async () => {
      try {
        const data = await fetchShared(categorySelected, 1);
        if (cancelled) return;
        if (categorySelected === 'Media' || categorySelected === 'Audio') {
          setMediaData(data as SharedMediaItem[]);
          mediaDataRef.current = data as SharedMediaItem[];
        } else if (categorySelected === 'Posts') {
          setPostData(data as ApiPost[][]);
          postDataRef.current = data as ApiPost[][];
        } else if (categorySelected === 'Channel') {
          setSubscriptionData(data);
          subscriptionDataRef.current = data;
        } else {
          setServiceData(data as ServiceItem[]);
          serviceDataRef.current = data as ServiceItem[];
        }
        setHasMoreData(data.length > 0);
        setPage(2);
        currentPageRef.current = 2;
        if ((categorySelected === 'Media' || categorySelected === 'Audio') && data.length === LIMIT) {
          setTimeout(() => {
            if (!isContentScrollable()) void loadMore();
          }, 200);
        }
      } catch (error) {
        console.error({ error });
        toast?.error?.('Error fetching data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId, showSharedContent, categorySelected]);

  async function loadMore() {
    if (!hasMoreData || isLoadingMore || !showSharedContent || !channelId) return;
    setIsLoadingMore(true);

    let calculatedPage = currentPageRef.current;
    if (categorySelected === 'Media' || categorySelected === 'Audio') calculatedPage = Math.ceil(mediaDataRef.current.length / LIMIT) + 1;
    else if (categorySelected === 'Posts') calculatedPage = Math.ceil(postDataRef.current.flat().length / LIMIT) + 1;
    else if (categorySelected === 'Channel') calculatedPage = Math.ceil(subscriptionDataRef.current.length / LIMIT) + 1;
    else if (categorySelected === 'Services') calculatedPage = Math.ceil(serviceDataRef.current.length / LIMIT) + 1;

    try {
      const data = await fetchShared(categorySelected, calculatedPage);
      if (categorySelected === 'Media' || categorySelected === 'Audio') {
        setMediaData((prev) => {
          const seen = new Set(prev.map((i) => i._id));
          const combined = [...prev, ...(data as SharedMediaItem[]).filter((i) => !seen.has(i._id))];
          mediaDataRef.current = combined;
          if (data.length === 0) setHasMoreData(false);
          else if (data.length < LIMIT) setHasMoreData(false);
          else
            setTimeout(() => {
              if (!isContentScrollable()) void loadMore();
            }, 100);
          return combined;
        });
      } else if (categorySelected === 'Posts') {
        setPostData((prev) => {
          const combined = [...prev, ...(data as ApiPost[][])];
          postDataRef.current = combined;
          return combined;
        });
        if (data.length === 0) setHasMoreData(false);
      } else if (categorySelected === 'Channel') {
        setSubscriptionData((prev) => {
          const combined = [...prev, ...data];
          subscriptionDataRef.current = combined;
          return combined;
        });
        if (data.length === 0) setHasMoreData(false);
      } else {
        setServiceData((prev) => {
          const combined = [...prev, ...(data as ServiceItem[])];
          serviceDataRef.current = combined;
          return combined;
        });
        if (data.length === 0) setHasMoreData(false);
      }
      setPage(() => {
        const p = calculatedPage + 1;
        currentPageRef.current = p;
        return p;
      });
    } catch (error) {
      console.error({ error });
    } finally {
      setIsLoadingMore(false);
    }
  }

  const groupedMedia = useMemo(() => {
    if (categorySelected !== 'Media' && categorySelected !== 'Audio') return [];
    const messageMap = new Map<string, { date: string; meta: MetaInterface; mediaItems: SharedMediaItem[]; author: string }>();
    mediaData.forEach((item) => {
      const tempId = item.message_data.temporary_message_id;
      const date = format(new Date(item.message_data.message_creation_time), 'yyyy-MM-dd');
      if (!messageMap.has(tempId)) messageMap.set(tempId, { date, meta: item.message_data.meta, mediaItems: [item], author: item.author });
      else messageMap.get(tempId)!.mediaItems.push(item);
    });
    const dateMap = new Map<string, { media: SharedMediaItem[]; meta: MetaInterface; author: string }[]>();
    for (const [, { date, meta, mediaItems, author }] of messageMap.entries()) {
      if (!dateMap.has(date)) dateMap.set(date, []);
      dateMap.get(date)!.push({ media: mediaItems, meta, author });
    }
    return Array.from(dateMap.entries());
  }, [mediaData, categorySelected]);

  const groupedPosts = useMemo(() => {
    if (categorySelected !== 'Posts') return [];
    const flatPosts: ApiPost[] = postData.length && Array.isArray(postData[0]) ? postData.flat() : (postData as unknown as ApiPost[]);
    if (!flatPosts.length) return [];
    const dateMap = new Map<string, { media: Media[]; author: Author; converse_message_created_at: string; converse_message_id: string; created_at: string }[]>();
    flatPosts.forEach((item) => {
      const date = format(new Date(item.created_at), 'yyyy-MM-dd');
      if (!dateMap.has(date)) dateMap.set(date, []);
      dateMap.get(date)!.push({
        media: item.post.media,
        author: item.post.author,
        converse_message_created_at: item.converse_message_created_at,
        converse_message_id: item.converse_message_id,
        created_at: item.post.created_at || '',
      });
    });
    return Array.from(dateMap.entries());
  }, [postData, categorySelected]);

  const groupedSubscription = useMemo(() => {
    if (categorySelected !== 'Channel') return [];
    const dateMap = new Map<string, GroupedSubscriptionEntry[]>();
    subscriptionData.forEach((entry) => {
      const channel = entry?.channel;
      if (!channel) return;
      const date = format(new Date(entry.created_at ?? new Date().toISOString()), 'yyyy-MM-dd');
      if (!dateMap.has(date)) dateMap.set(date, []);
      dateMap.get(date)!.push({
        media: Array.isArray(channel.background) ? channel.background : [],
        author: channel.author,
        tag_name: channel.channel_tagname || 'Unknown',
        avatar: Array.isArray(channel.avatar) ? channel.avatar : [],
        counter: { media_count: channel.counter?.media_count },
        channel_name: channel.name ?? 'Unknown Channel',
        perks: [],
        is_subscribed: channel.is_subscribed,
        my_subscription_data: channel?.my_subscription_data,
        expires_on: channel?.my_subscription_data?.expires_on,
        converse_message_created_at: channel.converse_message_created_at,
        converse_message_id: channel.converse_message_id,
        min_subscription: channel?.min_subscription,
        _id: channel._id,
      });
    });
    return Array.from(dateMap.entries());
  }, [subscriptionData, categorySelected]);

  const groupedService = useMemo(() => {
    if (categorySelected !== 'Services') return [];
    const dateMap = new Map<string, GroupedServiceEntry[]>();
    serviceData.forEach((item) => {
      const date = format(new Date(item.converse_message_created_at ?? new Date().toISOString()), 'yyyy-MM-dd');
      if (!dateMap.has(date)) dateMap.set(date, []);
      dateMap.get(date)!.push({ service: item, avatar: item.media || [], meta: item.message_data?.meta || ({} as MetaInterface) });
    });
    return Array.from(dateMap.entries());
  }, [serviceData, categorySelected]);

  const dataLength =
    categorySelected === 'Audio' || categorySelected === 'Media'
      ? mediaData.length
      : categorySelected === 'Posts'
      ? postData.flat().length
      : categorySelected === 'Channel'
      ? subscriptionData.length
      : serviceData.length;

  return (
    <div className="flex h-full w-full min-w-0 grow flex-col rounded-xl bg-background">
      <div className="flex items-center gap-2 border-b p-3">
        {!isMobile ? <X className="cursor-pointer" onClick={() => setShowSharedContent(false)} /> : null}
        <span className="text-lg">Shared Content</span>
      </div>
      <div className={cn('flex items-center border-b', isMobile && 'overflow-x-auto')}>
        {categories.map((c, i) => (
          <div
            key={i}
            className="cursor-pointer p-3"
            onClick={() => {
              if (c === categorySelected) return;
              setCategorySelected(c);
              setMediaData([]);
              setPostData([]);
              setSubscriptionData([]);
              setServiceData([]);
              mediaDataRef.current = [];
              postDataRef.current = [];
              subscriptionDataRef.current = [];
              serviceDataRef.current = [];
              setHasMoreData(true);
              setPage(1);
              currentPageRef.current = 1;
              setIsLoadingMore(false);
            }}
            style={{ color: categorySelected === c ? '#ac1991' : '#000', borderBottom: categorySelected === c ? '2px solid #ac1991' : '2px solid transparent' }}
          >
            {c}
          </div>
        ))}
      </div>
      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="animate-spin" />
        </div>
      ) : (
        <div id="shareContentScroll" ref={scrollContainerRef} className="flex-1 overflow-y-auto" style={{ height: '100%' }}>
          <InfiniteScroll
            className="flex h-full flex-col overflow-y-auto"
            style={{ overflowX: 'hidden' }}
            next={loadMore}
            dataLength={dataLength}
            hasMore={hasMoreData}
            loader={<div className="p-3 text-center text-sm text-muted-foreground">Loading…</div>}
            scrollThreshold={0.6}
            scrollableTarget="shareContentScroll"
            endMessage={<div className="p-3 text-center">{dataLength > 0 ? "You've seen it all!" : 'Nothing to show :('}</div>}
          >
            {categorySelected === 'Audio' || categorySelected === 'Media' ? (
              <div className="flex h-full flex-col overflow-y-auto">
                {groupedMedia.map(([date, items]) => (
                  <DateWiseMedia
                    key={date}
                    date={date}
                    media={items.map((entry) => entry.media)}
                    meta={items.map((e) => e.meta)}
                    author={items[0].author}
                    type={categorySelected === 'Audio' ? 'audio' : 'media'}
                  />
                ))}
              </div>
            ) : null}
            {categorySelected === 'Posts' ? (
              <div className="flex h-full flex-col overflow-y-auto">
                {groupedPosts.map(([date, posts], idx) => (
                  <RenderPosts key={idx} date={date} posts={posts} />
                ))}
              </div>
            ) : null}
            {categorySelected === 'Channel' ? (
              <div className="flex h-full flex-col overflow-y-auto">
                {groupedSubscription.map(([date, posts], idx) => (
                  <RenderSubscriptions key={idx} date={date} posts={posts} />
                ))}
              </div>
            ) : null}
            {categorySelected === 'Services' ? (
              <div className="flex h-full flex-col overflow-y-auto">
                {groupedService.map(([date, items], idx) => (
                  <RenderService key={idx} date={date} service={items.map((e) => e.service)} />
                ))}
              </div>
            ) : null}
          </InfiniteScroll>
        </div>
      )}
    </div>
  );
}

export default MediaGallery;
