import React, { useEffect, useMemo, useState } from 'react';
import { Loader } from 'lucide-react';

import type { Media, MessageInterface } from '@knky-chat/core-chat';
import { cn } from '../../../lib/utils';
import { formatCurrency as money, formatDuration as duration } from '../../../lib/format';
import { useChatConfig } from '../../../hooks/useChatConfig';
import { useResolvedCreatorId } from '../../../hooks/useResolvedCreatorId';
import { Icon } from '../../common/Icon';
import { BubbleTime } from '../BubbleTime';
import WaveAudioPlayer from '../../common/WaveAudioPlayer';

const PURCHASE_MEDIA = "You can't buy media on behalf of the creator.";
// Chat media stored behind the vault needs a signed URL (paths starting with these).
const VAULT_PREFIXES = ['vault', 'post', 'hls', 'shop', 'chat-media'];

function resolutionLabel(res?: { width: number; height: number }): string {
  return res?.height ? `${res.height}p` : '';
}

/**
 * Media/attachment bubble — ports the agency MessageAttachment: media grid
 * (scroll-snap), PPV blur+lock overlay with image/video counts + total
 * duration, unlock button, unlock fee + paid/pending badge, resolution/
 * duration/video-play badges, standalone card + its own timestamp. Audio
 * renders the WaveAudioPlayer; vault-backed media resolves signed URLs via
 * the host's services.getSignedMediaUrls seam.
 */
export function MediaAttachment({ message, isMine }: { message: MessageInterface; isMine: boolean }): React.ReactElement {
  const { getAssetUrl, getSignedMediaUrls, openFullscreenMedia, toast } = useChatConfig();
  const creatorId = useResolvedCreatorId();
  const [ready, setReady] = useState<Record<number, boolean>>({});
  const [signed, setSigned] = useState<Record<string, string>>({});

  const media = useMemo<Media[]>(() => {
    const m = message.meta?.media as Media | Media[] | undefined;
    return Array.isArray(m) ? m : m ? [m] : [];
  }, [message.meta?.media]);

  const fee = message.meta?.media_fee ?? 0;
  const unlocked = message.meta?.is_unlocked ?? true;
  const locked = !isMine && fee > 0 && !unlocked;
  const imageCount = media.filter((m) => m?.type === 'image').length;
  const videoCount = media.filter((m) => m?.type === 'video').length;
  const totalDuration = media.reduce((a, m) => a + (m?.type === 'video' ? Number(m.duration || 0) : 0), 0);

  // Signed-URL fetch for vault-backed completed media (host owns GetChatSignedUrl).
  const completedIds = useMemo(
    () => media.filter((m) => m?.status === 'Completed' && m?.path && VAULT_PREFIXES.some((p) => m.path!.startsWith(p))).map((m) => m._id as string),
    [media],
  );
  const completedKey = completedIds.join(',');
  useEffect(() => {
    if (!getSignedMediaUrls || completedIds.length === 0) return;
    let cancelled = false;
    getSignedMediaUrls({ mediaIds: completedIds, creatorId })
      .then((map) => {
        if (!cancelled && map) setSigned(map);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completedKey, creatorId]);

  const needsSigned = (m: Media, removeVideoFilter = false): boolean => {
    const path = m?.path || '';
    const isVaultish = VAULT_PREFIXES.some((p) => path.startsWith(p));
    return (m.type !== 'video' || (!removeVideoFilter && m?.type === 'video')) && isVaultish && (!isMine ? unlocked : true);
  };
  const signedUrlFor = (m: Media): string | null => signed[m?._id || ''] || null;
  const srcFor = (m: Media): string =>
    needsSigned(m, true) ? signedUrlFor(m) ?? '' : getAssetUrl({ media: m, poster: m?.type === 'video', variation: locked ? 'blur' : 'compressed' });

  const cardCls = cn('overflow-hidden rounded-xl shadow max-w-sm', isMine ? 'border bg-white text-black' : 'bg-[#f5f5f6] text-black');

  // Audio — waveform player (matches agency WaveAudioPlayer branch).
  if (media.some((m) => m?.type === 'audio')) {
    return (
      <div className={cn(cardCls, 'w-sm p-2')}>
        <WaveAudioPlayer url={getAssetUrl({ media: media[0] })} disable={fee > 0 && !unlocked} className="max-w-sm rounded-lg border p-1" />
        {message.message && message.message !== 'Attachment' ? <p className="mt-1 text-sm">{message.message}</p> : null}
        {locked ? (
          <button className="mb-2 mt-2 w-full rounded-md bg-primary py-2 text-sm text-primary-foreground" onClick={() => toast?.error?.(PURCHASE_MEDIA)}>
            Unlock for {money(fee)}
          </button>
        ) : null}
        {fee > 0 ? <div className="text-sm text-muted-foreground">Unlock fee: {money(fee)}</div> : null}
        <BubbleTime message={message} isMine={isMine} />
      </div>
    );
  }

  const fullscreen = (index: number) => {
    if (locked) return;
    openFullscreenMedia?.({
      index,
      mediaUrls: media
        .filter((m) => m.type === 'image' || m.type === 'video')
        .map((m) => ({ url: needsSigned(m, false) ? signed[m._id || ''] || '' : getAssetUrl({ media: m, variation: locked ? 'blur' : 'compressed' }), type: m.type as 'image' | 'video' })),
    });
  };

  return (
    <div className={cardCls}>
      <div className="flex snap-x snap-mandatory overflow-x-auto">
        {media.map((m, index) => (
          <div key={m?._id || index} className="relative h-[350px] w-full shrink-0 grow-0 snap-start">
            {m?.status === 'Failed' ? (
              <div className="flex h-[350px] w-full flex-col items-center justify-center text-sm text-gray-400">
                Media moderation failed.
              </div>
            ) : m?.status && m.status !== 'Completed' ? (
              <div className="flex h-[350px] w-full flex-col items-center justify-center gap-1 text-sm text-gray-400">
                Processing and moderating your media
                <Loader className="animate-spin" />
              </div>
            ) : needsSigned(m, true) && !signedUrlFor(m) ? (
              <div className="h-[350px] w-full animate-pulse bg-black/10" />
            ) : (
              <img
                src={srcFor(m)}
                alt="Media"
                loading="lazy"
                decoding="async"
                onLoad={() => setReady((p) => ({ ...p, [index]: true }))}
                onError={(e) => {
                  e.currentTarget.src = '/images/common/defaultBack.svg';
                  setReady((p) => ({ ...p, [index]: true }));
                }}
                onClick={() => fullscreen(index)}
                className={cn(
                  'h-[350px] w-full object-cover transition-opacity duration-300',
                  ready[index] ? 'opacity-100' : 'opacity-0',
                  locked && 'brightness-[0.6]',
                )}
              />
            )}

            {m?.resolution ? (
              <div className="absolute start-1 top-1 rounded-md bg-black/50 p-1 text-xs text-white">{resolutionLabel(m.resolution)}</div>
            ) : null}

            {media.length > 1 ? (
              <div className="absolute left-1/2 top-2 flex -translate-x-1/2 gap-1">
                {media.map((_, i) => (
                  <div key={i} className={cn('size-1.5 rounded-full', i === index ? 'bg-white' : 'bg-white/50')} />
                ))}
              </div>
            ) : null}

            {m?.type === 'video' && m?.status === 'Completed' ? (
              <div className="absolute bottom-1 end-1 rounded-md bg-black/50 p-1 text-xs text-white">{duration(m.duration)}</div>
            ) : null}

            {m?.type === 'video' && m?.status === 'Completed' && !locked ? (
              <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <Icon icon="video-play" iconFolder="stand-alone-icons" size={32} className="brightness-[20]" />
              </div>
            ) : null}

            {locked ? (
              <div className="absolute left-1/2 top-1/2 flex w-full -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center gap-2">
                <Icon icon="lock" iconFolder="stand-alone-icons" size={48} />
                <div className="flex items-center gap-2 text-sm text-white">
                  {imageCount > 0 ? (
                    <span className="flex items-center gap-1">
                      <Icon icon="image" size={15} className="brightness-[20]" />
                      {imageCount}
                    </span>
                  ) : null}
                  {imageCount > 0 && videoCount > 0 ? <div className="opacity-50">|</div> : null}
                  {videoCount > 0 ? (
                    <span className="flex items-center gap-1">
                      <Icon icon="video" size={15} type="filled" className="brightness-[2]" />
                      {videoCount}
                    </span>
                  ) : null}
                  {(imageCount > 0 || videoCount > 0) && totalDuration > 0 ? <div className="opacity-50">|</div> : null}
                  {totalDuration > 0 ? <span className="text-nowrap">Total: {duration(totalDuration)}</span> : null}
                </div>
              </div>
            ) : null}
          </div>
        ))}
      </div>

      <div className="space-y-1 px-2 py-3">
        {message.message && message.message !== 'Attachment' ? (
          <p className="whitespace-pre-wrap break-words text-sm font-medium text-black">{message.message}</p>
        ) : null}

        {locked ? (
          <button className="mb-2 w-full rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground" onClick={() => toast?.error?.('Purchase to unlock')}>
            Unlock for {money(fee)}
          </button>
        ) : null}

        {fee > 0 ? (
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">Unlock fee: {money(fee)}</div>
            <div
              className={cn('rounded-sm border p-[2px] text-xs', unlocked ? 'border-blue-500 bg-blue-200 text-blue-500' : 'border-yellow-500 bg-yellow-100 text-yellow-500')}
            >
              {unlocked ? 'Paid' : 'Pending'}
            </div>
          </div>
        ) : null}

        <BubbleTime message={message} isMine={isMine} />
      </div>
    </div>
  );
}
