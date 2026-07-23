import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect } from 'vitest';

import type { Chat } from '@knky-chat/core-chat';
import { ChatPerson } from '../ChatPerson';

function chat(p: Partial<Chat>): Chat {
  return {
    converse_channel_id: 'c1',
    unreadCount: 0,
    target: { display_name: 'Alice', username: 'alice', avatar: [] } as any,
    message: { message: 'hey there' } as any,
    ...p,
  } as Chat;
}

const render = (el: React.ReactElement) => renderToStaticMarkup(el);

describe('ChatPerson', () => {
  it('renders the name and last-message preview', () => {
    const html = render(<ChatPerson chat={chat({})} />);
    expect(html).toContain('Alice');
    expect(html).toContain('hey there');
  });

  it('shows an unread badge when unreadCount > 0', () => {
    expect(render(<ChatPerson chat={chat({ unreadCount: 3 })} />)).toContain('>3<');
  });

  it('omits the unread badge when count is zero', () => {
    // The unread badge is the only element using bg-red-500.
    expect(render(<ChatPerson chat={chat({ unreadCount: 0 })} />)).not.toContain('bg-red-500');
  });

  it('applies the active highlight (magenta left border)', () => {
    expect(render(<ChatPerson chat={chat({})} active />)).toContain('border-l-[#ac1991]');
  });
});
