import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect } from 'vitest';

import type { MessageInterface } from '@knky-chat/core-chat';
import { RenderMessage } from '../RenderMessage';
import { AdapterProvider } from '../../../adapter/AdapterContext';

// Minimal adapter for context-bound bubbles (media uses useChatConfig).
const fakeAdapter = {
  getCreatorId: () => '__core__',
  getServices: () => ({ getAssetUrl: ({ media }: { media?: { url?: string } }) => media?.url ?? '' }),
} as any;
const renderWithAdapter = (el: React.ReactElement) =>
  renderToStaticMarkup(<AdapterProvider adapter={fakeAdapter}>{el}</AdapterProvider>);

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
    const html = renderWithAdapter(
      <RenderMessage
        message={msg({ meta: { type: 'message-attachment', media: [{ _id: 'x', url: 'http://img/1.jpg', type: 'image' }] } as any })}
      />,
    );
    expect(html).toContain('<img');
    expect(html).toContain('http://img/1.jpg');
  });

  it('shows the PPV lock overlay + unlock price for locked media', () => {
    const html = renderWithAdapter(
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
    expect(html).toContain('$15'); // unlock price
    expect(html).toContain('/stand-alone-icons/lock.svg'); // lock overlay
    expect(html).toContain('brightness-[0.6]'); // dimmed preview
  });

  it('routes VIDEO/VOICE to a call card', () => {
    expect(renderWithAdapter(<RenderMessage message={msg({ meta: { type: 'VIDEO', price: 30 } as any })} />)).toContain('Video Call');
    expect(renderWithAdapter(<RenderMessage message={msg({ meta: { type: 'VOICE' } as any })} />)).toContain('Voice Call');
  });

  it('routes RATING / CUSTOM-SERVICE / EMBEDS / NEW-PAYMENT', () => {
    expect(renderWithAdapter(<RenderMessage message={msg({ meta: { type: 'RATING' } as any })} />)).toContain('Ratings');
    expect(renderWithAdapter(<RenderMessage message={msg({ meta: { type: 'CUSTOM-SERVICE', request_note: 'lyrics', price: 50 } as any })} />)).toContain('Requesting for:');
    // EMBEDS fetches the entity via services.fetchEmbed; with nothing cached it shows a loading placeholder.
    expect(renderWithAdapter(<RenderMessage message={msg({ meta: { type: 'EMBEDS', sub_type: 'POST', entity_id: 'p1' } as any })} />)).toContain('Loading embed');
    // NEW-PAYMENT is a card rendered "Media unlocked" (matches agency NewPayment).
    expect(renderWithAdapter(<RenderMessage message={msg({ meta: { type: 'NEW-PAYMENT' } as any })} />)).toContain('Media unlocked');
  });

  it('routes Promotion (mass-message) to sender/receiver views with the offered amount', () => {
    // Sender view (mine) shows a status badge; receiver view (theirs) shows an Accept CTA.
    const mine = renderWithAdapter(
      <RenderMessage
        message={msg({ sender_id: 'me', message: 'Promotion', meta: { type: 'VIDEO', duration: 120, offered_amount: 40, requestAccept: 'sent' } as any })}
        currentUserId="me"
      />,
    );
    expect(mine).toContain('Video call');
    expect(mine).toContain('Waiting for fan');
    expect(mine).toContain('$40');

    const theirs = renderWithAdapter(
      <RenderMessage message={msg({ sender_id: 'other', message: 'Promotion', meta: { type: 'RATING', price: 15, requestAccept: 'sent' } as any })} currentUserId="me" />,
    );
    expect(theirs).toContain('Ratings');
    expect(theirs).toContain('Accept for');
    expect(theirs).toContain('$15');
  });

  it('routes REQUEST-TIP, chat-unlock, ACCEPT_CALL, story-reply', () => {
    expect(render(<RenderMessage message={msg({ meta: { type: 'REQUEST-TIP', amount: 5 } as any })} />)).toContain('Tip request');
    expect(render(<RenderMessage message={msg({ meta: { type: 'chat-unlock' } as any })} />)).toContain('Content unlocked');
    // ACCEPT_CALL card (uses host toast) + story-reply card (uses getAssetUrl) need the adapter context.
    expect(renderWithAdapter(<RenderMessage message={msg({ meta: { type: 'ACCEPT_CALL' } as any })} />)).toContain('Join the call');
    const future = new Date(Date.now() + 86_400_000).toISOString();
    expect(
      renderWithAdapter(<RenderMessage message={msg({ message: 'nice story', meta: { type: 'story-reply', expiry_date: future } as any })} />),
    ).toContain('Replied to your story');
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
