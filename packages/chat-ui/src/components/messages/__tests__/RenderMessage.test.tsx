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

  it('falls back to message text for types without a dedicated bubble', () => {
    const html = render(<RenderMessage message={msg({ message: 'call started', meta: { type: 'ACCEPT_CALL' } as any })} />);
    expect(html).toContain('call started');
  });
});
