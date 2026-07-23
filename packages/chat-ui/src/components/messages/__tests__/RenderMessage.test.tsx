import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect } from 'vitest';

import type { MessageInterface } from '@knky-chat/core-chat';
import { RenderMessage } from '../RenderMessage';

function msg(p: Partial<MessageInterface>): MessageInterface {
  return {
    _id: '',
    messageId: '',
    channel_id: '',
    sender_id: '',
    message: '',
    url: '',
    og_msg: '',
    name: '',
    meta: { type: 'message' } as any,
    message_deleted_by: [],
    reactions: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isHuman: true,
    receipts: [],
    seen_count: 0,
    tags: [],
    ...p,
  } as MessageInterface;
}

const render = (el: React.ReactElement) => renderToStaticMarkup(el);

describe('RenderMessage', () => {
  it('renders plain text', () => {
    const html = render(<RenderMessage message={msg({ message: 'hello world' })} />);
    expect(html).toContain('hello world');
  });

  it('aligns own messages right and incoming messages left', () => {
    const mine = render(<RenderMessage message={msg({ sender_id: 'me', message: 'hi' })} currentUserId="me" />);
    const theirs = render(<RenderMessage message={msg({ sender_id: 'other', message: 'hi' })} currentUserId="me" />);
    expect(mine).toContain('justify-end');
    expect(theirs).toContain('justify-start');
  });

  it('renders a tip bubble with amount', () => {
    const html = render(<RenderMessage message={msg({ meta: { type: 'SENT-TIP', amount: 20 } as any })} />);
    expect(html).toContain('Tip');
    expect(html).toContain('$20');
  });

  it('renders media attachments as images', () => {
    const html = render(
      <RenderMessage
        message={msg({ meta: { type: 'message-attachment', media: [{ _id: 'x', url: 'http://img/1.jpg', type: 'image' }] } as any })}
      />,
    );
    expect(html).toContain('<img');
    expect(html).toContain('http://img/1.jpg');
  });

  it('shows a locked state (no real src) for pay-to-view media', () => {
    const html = render(
      <RenderMessage
        message={msg({
          meta: {
            type: 'message-attachment',
            is_unlocked: false,
            media_fee: 15,
            media: [{ _id: 'x', url: 'http://img/1.jpg', type: 'image' }],
          } as any,
        })}
      />,
    );
    expect(html).toContain('$15');
    expect(html).not.toContain('http://img/1.jpg');
  });

  it('routes VIDEO/VOICE to a call bubble', () => {
    expect(render(<RenderMessage message={msg({ meta: { type: 'VIDEO', price: 30 } as any })} />)).toContain('Video call');
    expect(render(<RenderMessage message={msg({ meta: { type: 'VOICE' } as any })} />)).toContain('Voice call');
  });

  it('routes RATING / CUSTOM-SERVICE / EMBEDS / NEW-PAYMENT', () => {
    expect(render(<RenderMessage message={msg({ meta: { type: 'RATING' } as any })} />)).toContain('Rating request');
    expect(render(<RenderMessage message={msg({ meta: { type: 'CUSTOM-SERVICE', request_note: 'lyrics', price: 50 } as any })} />)).toContain('Custom request');
    expect(render(<RenderMessage message={msg({ meta: { type: 'EMBEDS', sub_type: 'POST' } as any })} />)).toContain('Shared a post');
    expect(render(<RenderMessage message={msg({ meta: { type: 'NEW-PAYMENT', amount: 12 } as any })} />)).toContain('$12');
  });

  it('routes REQUEST-TIP, chat-unlock, ACCEPT_CALL, story-reply', () => {
    expect(render(<RenderMessage message={msg({ meta: { type: 'REQUEST-TIP', amount: 5 } as any })} />)).toContain('Tip request');
    expect(render(<RenderMessage message={msg({ meta: { type: 'chat-unlock' } as any })} />)).toContain('Content unlocked');
    expect(render(<RenderMessage message={msg({ meta: { type: 'ACCEPT_CALL' } as any })} />)).toContain('Incoming call');
    expect(render(<RenderMessage message={msg({ meta: { type: 'ACCEPT_CALL', isCompleted: true } as any })} />)).toContain('Call ended');
    expect(render(<RenderMessage message={msg({ message: 'nice story', meta: { type: 'story-reply' } as any })} />)).toContain('Replied to your story');
  });

  it('routes SET-PRICE and TAG-APPROVAL', () => {
    expect(render(<RenderMessage message={msg({ meta: { type: 'SET-PRICE', price: 9 } as any })} />)).toContain('Price set');
    expect(render(<RenderMessage message={msg({ meta: { type: 'TAG-APPROVAL', tag_name: 'collab' } as any })} />)).toContain('Tag approval');
  });

  it('falls back to message text for unknown/stream types', () => {
    const html = render(<RenderMessage message={msg({ message: 'live now', meta: { type: 'stream' } as any })} />);
    expect(html).toContain('live now');
  });
});
