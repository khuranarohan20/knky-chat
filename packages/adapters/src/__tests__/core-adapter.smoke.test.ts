import { describe, it, expect, beforeEach } from 'vitest';

import { CORE_CREATOR_ID } from '@knky-chat/core-chat';
import type { Receipt } from '@knky-chat/core-chat';
import { useChatStore } from '@knky-chat/chat-ui';

import { CoreAdapter } from '../core/CoreAdapter';
import { FakeConverse, mkMsg } from '../test/fakeConverse';

function makeAdapter() {
  return new CoreAdapter({
    apiEndpoint: 'http://api.test',
    converseProjectId: 'proj',
    converseHost: 'wss://socket.test',
    features: {},
    ConverseClass: FakeConverse as unknown as new () => any,
    auth: {
      getConverseToken: async () => 'tok-123',
      verifyConverseToken: async () => {},
    },
  });
}

// ---------------------------------------------------------------------------

describe('CoreAdapter end-to-end (fake Converse SDK)', () => {
  beforeEach(() => {
    FakeConverse.instances = [];
    FakeConverse.cannedMessages = [];
    // Reset store data without clobbering the action functions (merge, not replace)
    useChatStore.setState({ currentCreatorId: null, chatDataByCreator: {} });
  });

  it('initializes the socket and seeds creator state + token', async () => {
    const adapter = makeAdapter();
    await adapter.initialize();

    expect(adapter.getConnection().isConnected).toBe(true);
    const st = useChatStore.getState();
    expect(st.currentCreatorId).toBe(CORE_CREATOR_ID);
    expect(st.getCreatorState(CORE_CREATOR_ID).converseToken).toBe('tok-123');

    adapter.destroy();
    expect(adapter.getConnection().isConnected).toBe(false);
  });

  it('loads history, receives realtime messages, sends, updates seen + pins', async () => {
    FakeConverse.cannedMessages = [
      mkMsg({ _id: 'm1', channel_id: 'chan1', sender_id: 'other', message: 'hello', meta: { type: 'message', converseId: 'chan1' } as any }),
    ];

    const adapter = makeAdapter();
    await adapter.initialize();

    const store = useChatStore.getState();
    store.setActiveChannelId(CORE_CREATOR_ID, 'chan1');

    const conn = adapter.getConnection();
    await conn.connectChannel('chan1');
    await conn.loadMessages();

    // History landed in the store via the bridge
    expect(adapter.getMessages('chan1').map((m) => m._id)).toContain('m1');

    const fake = FakeConverse.instances.at(-1)!;

    // Realtime inbound message on the active channel
    fake.channel.msgListener!(
      mkMsg({ _id: 'm2', channel_id: 'chan1', sender_id: 'other', message: 'hi again', meta: { type: 'message', converseId: 'chan1' } as any }),
    );
    expect(adapter.getMessages('chan1').map((m) => m._id)).toContain('m2');
    // Active-channel messages are auto-seen at the socket layer
    expect(fake.channel.seenCalls.flat().some((s) => s.messageId === 'm2')).toBe(true);

    // Outbound send reaches the channel, enriched with converseId
    await conn.sendMessage({ text: 'yo', meta: { type: 'message' } as any });
    expect(fake.channel.sent.some((s) => s.message === 'yo' && s.meta.converseId === 'chan1')).toBe(true);

    // Server seen-receipt updates the message in the store
    fake.channel.seenListener!({
      messageId: 'm2',
      receipt: { userId: 'me', status: 'seen', timestamp: new Date().toISOString() } as Receipt,
    });
    const m2 = adapter.getMessages('chan1').find((m) => m._id === 'm2')!;
    expect((m2.receipts ?? []).some((r) => (r.userId ?? r.user_id) === 'me')).toBe(true);

    // Pin event lands in pinned map
    fake.channel.pinListener!({
      pinnedMsg: { _id: 'p1', channelId: 'chan1', message: m2 },
    });
    const pins = useChatStore.getState().getCreatorState(CORE_CREATOR_ID).pinnedMessagesByChatId['chan1'] ?? [];
    expect(pins.map((p) => p._id)).toContain('p1');

    adapter.destroy();
  });
});
