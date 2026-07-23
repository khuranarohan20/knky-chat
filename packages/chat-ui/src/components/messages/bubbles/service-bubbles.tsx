import React from 'react';
import {
  BadgeCheck,
  DollarSign,
  Gift,
  Link as LinkIcon,
  LockOpen,
  Phone,
  PhoneCall,
  Reply,
  Sparkles,
  Star,
  Tag,
  Video,
} from 'lucide-react';

import type { MessageInterface } from '@knky-chat/core-chat';
import { InfoBubble } from './InfoBubble';

type BubbleProps = { message: MessageInterface };

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

/** ACCEPT_CALL — active (join) or completed (ended). */
export function JoinCallBtn({ message }: BubbleProps): React.ReactElement {
  const done = message.meta?.isCompleted;
  return (
    <InfoBubble icon={<PhoneCall className="size-4" />} title={done ? 'Call ended' : 'Incoming call'}>
      {!done ? (
        <button type="button" className="mt-1.5 rounded-md border px-3 py-1 text-xs font-medium">
          Join call
        </button>
      ) : null}
    </InfoBubble>
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

/** NEW-PAYMENT — payment received. */
export function NewPayment({ message }: BubbleProps): React.ReactElement {
  const tx = message.meta?.transaction_id;
  return (
    <InfoBubble
      icon={<DollarSign className="size-4" />}
      title="Payment"
      amount={message.meta?.amount}
      subtitle={tx ? `#${tx}` : message.message || undefined}
    />
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

/** story-reply — reply to a story. */
export function StoryReply({ message }: BubbleProps): React.ReactElement {
  return (
    <InfoBubble icon={<Reply className="size-4" />} title="Replied to your story">
      {message.message ? <p className="mt-1 text-sm">{message.message}</p> : null}
    </InfoBubble>
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
