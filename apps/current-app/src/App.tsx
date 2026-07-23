import { CoreAdapter } from '@knky-chat/adapters';
import { ChatBox, ChatList, ChatProvider } from '@knky-chat/chat-ui';

import { FakeConverse } from './mock/FakeConverse';
import { mockApi } from './mock/api';
import { ME } from './mock/data';

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
        <aside className="flex w-72 flex-col border-r bg-background">
          <div className="border-b px-4 py-3 text-sm font-semibold">Chats</div>
          <ChatList className="flex-1" />
        </aside>
        <main className="min-w-0 flex-1">
          <ChatBox currentUserId={ME} />
        </main>
      </div>
    </ChatProvider>
  );
}
