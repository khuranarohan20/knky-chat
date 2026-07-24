import React from 'react';
import {
  BadgeCheck,
  Gift,
  Link as LinkIcon,
  LockOpen,
  Phone,
  Sparkles,
  Star,
  Tag,
  Video,
} from 'lucide-react';

import type { MessageInterface } from '@knky-chat/core-chat';
import { InfoBubble } from './InfoBubble';
import { cn } from '../../../lib/utils';
import { useChatConfig } from '../../../hooks/useChatConfig';
import { Icon } from '../../common/Icon';
import { BubbleTime } from '../BubbleTime';
import { AudioSent, VideoSent } from '../svg';

type BubbleProps = { message: MessageInterface };
/** Card bubbles render standalone (own container + timestamp) and need "me/them". */
type CardProps = { message: MessageInterface; isMine: boolean };

/** VIDEO / VOICE call request. */
export function VideoVoiceBubble({ message }: BubbleProps): React.ReactElement {
  const isVideo = message.meta?.type === 'VIDEO';
  const duration = message.meta?.duration;
  const price = message.meta?.price ?? message.meta?.amount;
  return (
    <InfoBubble
      icon={isVideo ? <Video className="size-4" /> : <Phone className="size-4" />}
      title={isVideo ? 'Video call' : 'Voice call'}
      subtitle={duration ? `${duration}s` : undefined}
      amount={price}
    />
  );
}

/** RATING request. */
export function RatingRequest({ message }: BubbleProps): React.ReactElement {
  const stars = message.meta?.stars;
  return (
    <InfoBubble
      icon={<Star className="size-4" />}
      title="Rating request"
      subtitle={message.meta?.rateText || message.message || undefined}
      status={stars ? `${stars}★` : undefined}
    />
  );
}

/** CUSTOM-SERVICE request. */
export function CustomRequest({ message }: BubbleProps): React.ReactElement {
  return (
    <InfoBubble
      icon={<Sparkles className="size-4" />}
      title="Custom request"
      subtitle={message.meta?.request_note || message.meta?.custom_info || message.message || undefined}
      amount={message.meta?.price ?? message.meta?.amount}
    />
  );
}

/** ACCEPT_CALL — join a voice/video call (ported verbatim as a card). */
export function JoinCallBtn({ message, isMine }: CardProps): React.ReactElement {
  const { toast } = useChatConfig();
  const isVoice = message?.message === 'Voice Call';
  return (
    <div className={cn('flex w-sm flex-col gap-2 rounded-xl p-2', isMine ? 'border bg-white text-black' : 'bg-[#f5f5f6] text-black')}>
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center">{isVoice ? <AudioSent /> : <VideoSent />}</div>
        <div className="font-bold">{isVoice ? 'Voice Call' : 'Video Call'}</div>
      </div>
      <button
        type="button"
        className="w-full rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground"
        onClick={() => toast?.error?.("You can't join a call on behalf of the creator.")}
      >
        Join the call
      </button>
      <BubbleTime message={message} isMine={isMine} />
    </div>
  );
}

const EMBED_LABEL: Record<string, string> = {
  POST: 'Shared a post',
  PRODUCT: 'Shared a product',
  CHANNEL: 'Shared a channel',
  GROUP: 'Shared a group',
  VAULT: 'Shared from vault',
};

/** EMBEDS — post / product / channel / group card. */
export function ChatEmbeds({ message }: BubbleProps): React.ReactElement {
  const sub = message.meta?.sub_type;
  return (
    <InfoBubble
      icon={<LinkIcon className="size-4" />}
      title={(sub && EMBED_LABEL[sub]) || 'Shared content'}
      subtitle={message.meta?.title || message.message || undefined}
    />
  );
}

/** NEW-PAYMENT — media unlocked notice (ported verbatim as a card). */
export function NewPayment({ message, isMine }: CardProps): React.ReactElement {
  return (
    <div className="max-w-sm rounded border bg-white p-2 text-black">
      <div className="flex items-center gap-2">
        <Icon icon="dollar-symbol" iconFolder="stand-alone-icons" />
        <span>Media unlocked</span>
      </div>
      <BubbleTime message={message} isMine={isMine} />
    </div>
  );
}

/** REQUEST-TIP — requested a tip. */
export function RequestTip({ message }: BubbleProps): React.ReactElement {
  return (
    <InfoBubble
      icon={<Gift className="size-4" />}
      title="Tip request"
      amount={message.meta?.amount}
      subtitle={message.message || undefined}
    />
  );
}

/** chat-unlock — content unlocked notice. */
export function ChatUnlock({ message }: BubbleProps): React.ReactElement {
  return (
    <InfoBubble
      icon={<LockOpen className="size-4" />}
      title="Content unlocked"
      subtitle={message.message || undefined}
    />
  );
}

/** story-reply — reply to a story with its media preview (ported verbatim). */
export function StoryReply({ message, isMine }: CardProps): React.ReactElement | null {
  const { getAssetUrl } = useChatConfig();
  const story = message?.meta?.story_data as any;
  const mediaArr = story?.media;
  const media = Array.isArray(mediaArr) ? mediaArr[0] : mediaArr;
  const isMediaEmpty = !mediaArr?.length;

  if (!message?.meta?.expiry_date) return null;
  const isExpired = new Date(message.meta.expiry_date) < new Date();

  return (
    <div className={cn('mt-2 flex flex-col', isMine ? 'items-end justify-end text-right' : 'items-start justify-start text-left')}>
      <span className="text-sm text-gray-400">
        {isMine ? 'You replied to their story' : 'Replied to your story'}
      </span>
      {isExpired ? (
        <div className="h-40 w-24 rounded bg-gray-900 p-1">
          <span className="text-center text-gray-400">Story Expired</span>
        </div>
      ) : (
        <div className="cursor-pointer">
          {isMediaEmpty ? (
            <div className="h-40 w-24 rounded bg-black">
              <img
                src={getAssetUrl({ media: story?.post_id?.media?.[0] || story?.product?.media?.[0], variation: 'compressed', defaultType: 'background' })}
                alt=""
                height={80}
                className="h-[80px] rounded object-cover"
              />
            </div>
          ) : media?.type === 'video' ? (
            <video controls className="rounded object-cover" height={160}>
              <source src={getAssetUrl({ media, variation: 'compressed', defaultType: 'background' })} type="video/mp4" />
            </video>
          ) : (
            <img
              alt=""
              src={getAssetUrl({ media, variation: 'compressed', defaultType: 'background' })}
              className="rounded object-cover"
              style={{ objectFit: 'cover', aspectRatio: '9 / 16', height: 160 }}
            />
          )}
        </div>
      )}
    </div>
  );
}

/** SET-PRICE — a price was set on the conversation / content. */
export function SetPrice({ message }: BubbleProps): React.ReactElement {
  return (
    <InfoBubble
      icon={<Tag className="size-4" />}
      title="Price set"
      amount={message.meta?.price ?? message.meta?.amount}
      subtitle={message.message || undefined}
    />
  );
}

/** TAG-APPROVAL — request to approve a tag. */
export function TagApproval({ message }: BubbleProps): React.ReactElement {
  return (
    <InfoBubble
      icon={<BadgeCheck className="size-4" />}
      title="Tag approval"
      subtitle={message.meta?.tag_name || message.message || undefined}
    />
  );
}
