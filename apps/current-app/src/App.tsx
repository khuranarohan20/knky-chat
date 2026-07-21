import { CoreAdapter } from '@knky-chat/adapters';
import {
  ChatBox,
  ChatProvider,
  useChat,
  useChatStore,
  useShowChat,
} from '@knky-chat/chat-ui';
import { CORE_CREATOR_ID } from '@knky-chat/core-chat';

import { FakeConverse } from './mock/FakeConverse';
import { mockApi } from './mock/api';
import { ME, TARGET_BY_CHANNEL } from './mock/data';

const adapter = new CoreAdapter({
  apiEndpoint: 'mock',
  converseProjectId: 'mock',
  converseHost: 'mock',
  features: {},
  api: mockApi,
  ConverseClass: FakeConverse as unknown as new () => any,
  auth: {
    getConverseToken: async () => 'mock-token',
    verifyConverseToken: async () => {},
  },
});

function Sidebar() {
  const { chatList } = useChat();
  const { openChat } = useShowChat();
  const activeChannelId = useChatStore(
    (s) => s.chatDataByCreator[CORE_CREATOR_ID]?.activeChannelId ?? '',
  );

  const open = (channelId: string, unread: number) => {
    // Playground sets the header's target person on open; useShowChat itself
    // doesn't yet (it would need the chat/target — a later refinement).
    useChatStore.getState().setTargetPerson(CORE_CREATOR_ID, TARGET_BY_CHANNEL[channelId] ?? null);
    void openChat(channelId, unread);
  };

  return (
    <aside className="flex w-72 flex-col border-r bg-background">
      <div className="border-b px-4 py-3 text-sm font-semibold">Chats</div>
      <div className="flex-1 overflow-y-auto">
        {chatList.map((c) => {
          const isActive = c.converse_channel_id === activeChannelId;
          const name = c.target?.display_name ?? 'Unknown';
          const last = typeof c.message === 'object' ? c.message?.message : '';
          return (
            <button
              key={c.converse_channel_id}
              onClick={() => open(c.converse_channel_id, c.unreadCount ?? 0)}
              className={
                'flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm hover:bg-muted ' +
                (isActive ? 'bg-muted' : '')
              }
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{name}</p>
                <p className="truncate text-xs text-muted-foreground">{last}</p>
              </div>
              {c.unreadCount ? (
                <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                  {c.unreadCount}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </aside>
  );
}

export function App() {
  return (
    <ChatProvider
      adapter={adapter}
      loadingFallback={<div className="p-6 text-sm text-muted-foreground">Connecting…</div>}
      errorFallback={(err, retry) => (
        <div className="p-6 text-sm">
          <p className="text-destructive">Failed to init: {err.message}</p>
          <button className="mt-2 underline" onClick={retry}>
            Retry
          </button>
        </div>
      )}
    >
      <div className="flex h-full">
        <Sidebar />
        <main className="min-w-0 flex-1">
          <ChatBox currentUserId={ME} />
        </main>
      </div>
    </ChatProvider>
  );
}
