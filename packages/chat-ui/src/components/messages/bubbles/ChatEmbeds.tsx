import React, { useEffect, useState } from 'react';

import type { Media, MessageInterface } from '@knky-chat/core-chat';
import { cn } from '../../../lib/utils';
import { formatCurrency } from '../../../lib/format';
import { useChatConfig } from '../../../hooks/useChatConfig';
import { useResolvedCreatorId } from '../../../hooks/useResolvedCreatorId';
import { useChatStore, useEmbeds } from '../../../store/chatStore';
import { BubbleTime } from '../BubbleTime';

const FOUR_HOURS = 4 * 60 * 60 * 1000;

function ImageSlider({ media, resolve }: { media: Media[]; resolve: (m?: Media) => string }): React.ReactElement | null {
  if (!media?.length) return null;
  return (
    <div className="flex snap-x snap-mandatory overflow-x-auto rounded-lg">
      {media.map((m, i) => (
        <img key={m?._id || i} src={resolve(m)} alt="" className="max-h-[360px] w-full shrink-0 snap-start object-cover" />
      ))}
    </div>
  );
}

/**
 * EMBEDS bubble — post/product/channel/group card. Reads the entity from the
 * store's embed cache; fetches (once, 4h TTL) via the host's services.fetchEmbed
 * when missing/stale. Ported from the agency ChatEmbeds render.
 */
export function ChatEmbeds({ message, isMine }: { message: MessageInterface; isMine: boolean }): React.ReactElement | null {
  const { getAssetUrl, fetchEmbed, hasPermission, toast } = useChatConfig();
  const creatorId = useResolvedCreatorId();
  const embeds = useEmbeds(creatorId);
  const entityId = message?.meta?.entity_id;
  const subType = message?.meta?.sub_type;
  const details = embeds.find((e) => e._id === entityId);
  const [loading, setLoading] = useState(!details);

  useEffect(() => {
    if (!entityId || !fetchEmbed) return;
    const cached = embeds.find((e) => e._id === entityId);
    if (cached?.fetch_time && Date.now() - cached.fetch_time < FOUR_HOURS) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchEmbed({ entityId, subType, creatorId })
      .then((res) => {
        if (cancelled || !res) return;
        useChatStore.getState().setEmbed(creatorId, { ...(res as Record<string, any>), _id: entityId });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityId, subType, creatorId]);

  if (loading && !details) {
    return <div className="p-2 text-sm italic text-muted-foreground">Loading embed…</div>;
  }
  if (!details) return null;

  const wrap = cn('w-sm rounded-lg p-2', isMine ? 'border bg-white text-black' : 'bg-[#f5f5f6] text-black');
  const resolve = (m?: Media) => getAssetUrl({ media: m, poster: m?.type === 'video' });

  if (subType === 'POST' || subType === 'PRODUCT') {
    const media: Media[] = details.media || [];
    const price = subType === 'POST' ? details.pay_and_watch_rate || 0 : details.price || 0;
    const caption = subType === 'POST' ? details.caption || '' : details.description || '';
    const author = details.author;
    const canBuy = hasPermission ? hasPermission('MESSAGE') : true;
    return (
      <div className={wrap}>
        <div className="relative w-full">
          <ImageSlider media={media} resolve={resolve} />
          {!isMine && !details.is_purchased && price > 0 && canBuy ? (
            <div className="absolute left-1/2 top-1/2 z-30 -translate-x-1/2 -translate-y-1/2">
              <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground" onClick={() => toast?.error?.("You can't buy on behalf of the creator.")}>
                Buy {formatCurrency(price)}
              </button>
            </div>
          ) : null}
        </div>
        {details.name ? <div className="mt-2 font-bold">{details.name}</div> : null}
        {caption ? <p className="mt-1 whitespace-pre-wrap break-words text-sm">{caption}</p> : null}
        {details.category ? <div className="my-2 text-sm">Category: {details.category}</div> : null}
        <div className="w-full text-right text-xs">
          <span className="underline" style={{ color: '#ac1991' }}>View {subType.toLowerCase()}</span>
        </div>
        {author ? (
          <div className="mt-2 flex items-center gap-2">
            <img src={getAssetUrl({ media: author.avatar?.[0], defaultType: 'avatar' })} alt="" className="size-10 rounded-full object-cover" />
            <div className="flex flex-col">
              <span className="text-sm font-bold">{author.display_name}</span>
              <span className="text-xs text-gray-500">@{author.username}</span>
            </div>
          </div>
        ) : null}
        <BubbleTime message={message} isMine={isMine} />
      </div>
    );
  }

  // CHANNEL / GROUP
  const username = subType === 'GROUP' ? details.tag_name : details.channel_tagname;
  return (
    <div className={wrap}>
      {details.background ? <img src={getAssetUrl({ media: details.background })} alt="" className="h-24 w-full rounded object-cover" /> : null}
      <div className="mt-2 font-bold">{details.name}</div>
      {username ? <div className="text-xs text-gray-500">@{username}</div> : null}
      <div className="mt-1 flex gap-3 text-sm text-gray-500">
        <span>{details.counter?.post_count || 0} posts</span>
        <span>{details.counter?.subscriber_count || 0} subscribers</span>
      </div>
      <BubbleTime message={message} isMine={isMine} />
    </div>
  );
}
