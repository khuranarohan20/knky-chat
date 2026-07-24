import React from 'react';

import type { Media, MessageInterface } from '@knky-chat/core-chat';
import { MessageBubble } from './MessageBubble';
import { TextBubble } from './bubbles/TextBubble';
import { MediaAttachment } from './bubbles/MediaAttachment';
import { SentTip } from './bubbles/SentTip';
import {
  ChatEmbeds,
  ChatUnlock,
  CustomRequest,
  JoinCallBtn,
  NewPayment,
  RatingRequest,
  RequestTip,
  SetPrice,
  StoryReply,
  TagApproval,
  VideoVoiceBubble,
} from './bubbles/service-bubbles';

export interface RenderMessageProps {
  message: MessageInterface;
  /** The logged-in user's id — used to align own vs incoming messages. */
  currentUserId?: string;
}

function hasMedia(message: MessageInterface): boolean {
  const m = message.meta?.media as Media | Media[] | undefined;
  return Array.isArray(m) ? m.length > 0 : !!m;
}

/** Fallback for message types not yet given a dedicated bubble in this slice. */
function FallbackBubble({ message }: { message: MessageInterface }): React.ReactElement {
  if (message.message) return <TextBubble message={message} />;
  return <span className="text-xs italic opacity-70">[{message.meta?.type ?? 'message'}]</span>;
}

/**
 * Polymorphic router: picks a bubble variation from `meta.type`.
 *
 * Dedicated bubbles cover the full meta.type union: text, media attachments,
 * tips (sent + requested), VIDEO/VOICE, RATING, CUSTOM-SERVICE, ACCEPT_CALL,
 * EMBEDS, NEW-PAYMENT, chat-unlock, story-reply, SET-PRICE, TAG-APPROVAL.
 * `stream` and any unknown/future type fall through to FallbackBubble (its
 * text or a labelled placeholder) so nothing crashes.
 */
export function RenderMessage({ message, currentUserId }: RenderMessageProps): React.ReactElement {
  const senderId = message.sender_id || message.sid || '';
  const isMine = !!currentUserId && senderId === currentUserId;
  const type = message.meta?.type;

  // Card-style bubbles render standalone (own container + timestamp), not inside
  // the text bubble frame — matches the agency's card bubbles.
  const alignWrap = (node: React.ReactNode) => (
    <div className={`flex w-full px-3 py-1 ${isMine ? 'justify-end' : 'justify-start'}`}>{node}</div>
  );
  if (type === 'message-attachment' || type === 'MASS-MESSAGE' || hasMedia(message)) {
    return alignWrap(<MediaAttachment message={message} isMine={isMine} />);
  }
  if (type === 'SENT-TIP') {
    return alignWrap(<SentTip message={message} isMine={isMine} />);
  }

  let content: React.ReactNode;
  switch (type) {
    case 'REQUEST-TIP':
      content = <RequestTip message={message} />;
      break;
    case 'VIDEO':
    case 'VOICE':
      content = <VideoVoiceBubble message={message} />;
      break;
    case 'RATING':
      content = <RatingRequest message={message} />;
      break;
    case 'CUSTOM-SERVICE':
      content = <CustomRequest message={message} />;
      break;
    case 'ACCEPT_CALL':
      content = <JoinCallBtn message={message} />;
      break;
    case 'EMBEDS':
      content = <ChatEmbeds message={message} />;
      break;
    case 'NEW-PAYMENT':
      content = <NewPayment message={message} />;
      break;
    case 'chat-unlock':
      content = <ChatUnlock message={message} />;
      break;
    case 'story-reply':
      content = <StoryReply message={message} />;
      break;
    case 'SET-PRICE':
      content = <SetPrice message={message} />;
      break;
    case 'TAG-APPROVAL':
      content = <TagApproval message={message} />;
      break;
    case 'message':
    case 'direct-message':
    case 'auto-message':
    case undefined:
      // media already handled above via isMediaCard
      content = <TextBubble message={message} />;
      break;
    default:
      // stream and any unknown/future type — text or labelled placeholder.
      content = <FallbackBubble message={message} />;
  }

  return (
    <MessageBubble message={message} isMine={isMine}>
      {content}
    </MessageBubble>
  );
}
