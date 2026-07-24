import { describe, it, expect, beforeEach } from 'vitest';

import { useChatStore } from '@knky-chat/chat-ui';

import { AgencyAdapter } from '../agency/AgencyAdapter';
import { FakeConverse, mkMsg, mkChat, makeFakeApi, type FakeApi } from '../test/fakeConverse';

const CREATORS = ['creatorA', 'creatorB'];

function makeAgencyAdapter(api: FakeApi = makeFakeApi()) {
  return new AgencyAdapter({
    apiEndpoint: 'http://api.test',
    converseProjectId: 'proj',
    converseHost: 'wss://socket.test',
    features: {},
    api,
    services: { getAssetUrl: () => '' },
    ConverseClass: FakeConverse as unknown as new () => any,
    agentId: 'agent1',
    agentName: 'Agent One',
    creatorIds: CREATORS,
    auth: {
      getConverseToken: async (id: string) => `converse-${id}`,
      verifyConverseToken: async () => {},
    },
  });
}

describe('AgencyAdapter end-to-end (fake Converse SDK)', () => {
  beforeEach(() => {
    FakeConverse.instances = [];
    FakeConverse.cannedMessages = [];
    useChatStore.setState({ currentCreatorId: null, chatDataByCreator: {} });
  });

  it('initializes every creator with its own connection + token, activates the first', async () => {
    const adapter = makeAgencyAdapter();
    await adapter.initialize();

    const st = useChatStore.getState();
    expect(st.currentCreatorId).toBe('creatorA');

    for (const id of CREATORS) {
      expect(st.getCreatorState(id).converseToken).toBe(`converse-${id}`);
      expect(adapter.getConnection(id)?.isConnected).toBe(true);
    }

    adapter.destroy();
  });

  it("bootstraps each creator's chat list from the host API", async () => {
    const api = makeFakeApi({ chatList: [mkChat({ converse_channel_id: 'c1' })] });
    const adapter = makeAgencyAdapter(api);
    await adapter.initialize();

    // getChatList called once per creator (scoped by creatorId)
    expect(api.calls.getChatList).toBe(CREATORS.length);
    for (const id of CREATORS) {
      expect(adapter.getChatList(id).map((c) => c.converse_channel_id)).toContain('c1');
    }

    adapter.destroy();
  });

  it('enriches outbound meta with sent_by + emp', () => {
    const adapter = makeAgencyAdapter();
    const meta = adapter.enrichMeta({ type: 'message' } as any);
    expect(meta.sent_by).toBe('agency');
    expect(meta.emp).toBe(btoa(JSON.stringify({ id: 'agent1', name: 'Agent One' })));
  });

  it('keeps per-creator message state isolated', async () => {
    const adapter = makeAgencyAdapter();
    await adapter.initialize();

    const store = useChatStore.getState();
    store.setActiveChannelId('creatorA', 'chanA');

    const connA = adapter.getConnection('creatorA')!;
    await connA.connectChannel('chanA');
    const fakeA = (connA as unknown as { converse: FakeConverse }).converse;

    fakeA.channel.msgListener!(
      mkMsg({ _id: 'ma', channel_id: 'chanA', sender_id: 'x', meta: { type: 'message', converseId: 'chanA' } as any }),
    );

    expect(adapter.getMessages('chanA', 'creatorA').map((m) => m._id)).toContain('ma');
    // creatorB's slot is untouched
    expect(adapter.getMessages('chanA', 'creatorB')).toHaveLength(0);

    adapter.destroy();
  });

  it('switchCreator changes the active creator', async () => {
    const adapter = makeAgencyAdapter();
    await adapter.initialize();

    await adapter.switchCreator('creatorB');
    expect(adapter.getCreatorId()).toBe('creatorB');
    expect(useChatStore.getState().currentCreatorId).toBe('creatorB');

    adapter.destroy();
  });
});
