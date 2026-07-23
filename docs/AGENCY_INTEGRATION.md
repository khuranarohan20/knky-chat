# Agency Integration Guide (`knky-agency-frontend`)

> How to drop the `@knky-chat` micro-frontend into the agency app behind a
> `KNKY_USE_NEW_CHAT` flag, parallel to the existing chat (fully reversible).
> Written against the agency repo's real contracts (see `docs/analysis/`).

## The two-token flow (important)

The agency backend uses **two** tokens per creator:
- **creator API token** — `loginAsCreator({creatorId})` → `{ token }`. Bearer for `/users/*` chat REST calls. Stored in Redux `chat.chatDataByCreator[creatorId].creatorToken`; renewed by `ensureCreatorTokenRenewal`.
- **converse (socket) token** — `GET /users/request-converse-token` (with the creator Bearer) returns `{ r: <AES> }`; decrypt with `KNKY_DECRYPT_KEY` → `json.data.token`. Used only to init the socket.

The library never sees the creator token, the encrypted payload, or the decrypt key. The host supplies `auth.getConverseToken(creatorId)` (does login + request + decrypt) and its own `IChatApiClient` (authenticates REST calls itself).

## Step 0 — link the packages (YOUR decision)

The agency repo isn't in the knky-chat pnpm workspace, so it needs `@knky-chat/*` as deps. Options:
- **Local dev (fastest):** `file:` deps to the built packages —
  ```jsonc
  // knky-agency-frontend/package.json
  "@knky-chat/core-chat": "file:../knky-chat/packages/core-chat",
  "@knky-chat/chat-ui":   "file:../knky-chat/packages/chat-ui",
  "@knky-chat/adapters":  "file:../knky-chat/packages/adapters"
  ```
  then `pnpm build` in knky-chat (so `dist/` exists) + `pnpm install` in the agency repo.
- **Proper:** publish `@knky-chat/*` to your registry and add normal version deps.

Pick one — this affects your build/CI, so I left it for you.

## Step 1 — API client (`src/knky-chat/api.ts`)

Implements `IChatApiClient` with **explicit per-creator Bearer** (the existing
`chatAxiosClient` picks the token from `chat.currentCreatorId`, which races
during parallel multi-creator bootstrap — so we pass the token explicitly).

```ts
import type { IChatApiClient, ChatListParams, UnreadCounts } from '@knky-chat/chat-ui';
import type { Chat, ConversePair } from '@knky-chat/core-chat';
import { AES, enc } from 'crypto-js';
import { store } from '@/redux-store';

const CREATOR_HOST = import.meta.env.KNKY_CREATOR_SERVER_HOST;
const API_KEY = import.meta.env.KNKY_AGENCY_SERVER_API_KEY;
const DECRYPT_KEY = import.meta.env.KNKY_DECRYPT_KEY;

function creatorToken(creatorId: string): string {
  return store.getState().chat.chatDataByCreator[creatorId]?.creatorToken ?? '';
}

// Mirror the axios response interceptor: decrypt `r`, else pass through.
async function call<T>(creatorId: string, path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${CREATOR_HOST}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      Authorization: `Bearer ${creatorToken(creatorId)}`,
      ...(init.headers ?? {}),
    },
  });
  const body = await res.json();
  if (body?.r) {
    const text = AES.decrypt(body.r, DECRYPT_KEY).toString(enc.Utf8);
    return JSON.parse(text) as T;
  }
  return body as T;
}

export const agencyApi: IChatApiClient = {
  async getChatList(params: ChatListParams, creatorId = '') {
    const env = await call<{ data: Chat[] }>(creatorId, '/users/chat/get-converse-channel', {
      method: 'POST',
      body: JSON.stringify({ page: params.page ?? 1, limit: params.limit ?? 50, req_search: params.search }),
    });
    return env.data ?? [];
  },

  async getChannelDetails(channelId, creatorId = '') {
    const env = await call<{ data: Chat[] }>(creatorId, `/users/get-converse-channel-detail/${channelId}`);
    return env.data?.[0] ?? null; // endpoint returns an array
  },

  async getUnreadCounts(creatorId = ''): Promise<UnreadCounts> {
    const env = await call<{ data: UnreadCounts & { channelCount: number } }>(
      creatorId,
      '/users/get-message-unread-count',
      { method: 'POST', body: JSON.stringify({ is_all: true, is_human: false, tags: [] }) },
    );
    return { totalUnreadCount: env.data.totalUnreadCount, channels: env.data.channels ?? [] };
  },

  async getConverseMembers(creatorId = ''): Promise<ConversePair[]> {
    const env = await call<{ data: ConversePair[] }>(creatorId, '/users/chat/get-coverse-members');
    return env.data ?? [];
  },
};
```

## Step 2 — adapter factory (`src/knky-chat/adapter.ts`)

```ts
import { AgencyAdapter } from '@knky-chat/adapters';
import { Converse } from 'converse.svc-client';
import { AES, enc } from 'crypto-js';
import { store } from '@/redux-store';
import { chatActions } from '@/redux-store/slices/chat.slice';
import { loginAsCreator } from '@/apis/creator';
import { ensureCreatorTokenRenewal } from '@/utils/token-renew-handler';
import { agencyApi } from './api';

async function getConverseToken(creatorId: string): Promise<string> {
  // 1. creator API token → Redux (so agencyApi + interceptors can auth) + renewal
  const { data } = await loginAsCreator({ creatorId });
  store.dispatch(chatActions.setCreatorToken({ creatorId, token: data.token }));
  void ensureCreatorTokenRenewal(creatorId);

  // 2. request converse token with the creator Bearer, then AES-decrypt
  const res = await fetch(`${import.meta.env.KNKY_CREATOR_SERVER_HOST}/users/request-converse-token`, {
    headers: {
      'x-api-key': import.meta.env.KNKY_AGENCY_SERVER_API_KEY,
      Authorization: `Bearer ${data.token}`,
    },
  }).then((r) => r.json());
  const json = res?.r ? JSON.parse(AES.decrypt(res.r, import.meta.env.KNKY_DECRYPT_KEY).toString(enc.Utf8)) : res;
  return json.data.token;
}

export function createAgencyAdapter() {
  const user = store.getState().user;
  const creatorIds = store.getState().creator.activeCreators.map((c) => c.creatorId._id);

  return new AgencyAdapter({
    apiEndpoint: import.meta.env.KNKY_CREATOR_SERVER_HOST,
    converseProjectId: import.meta.env.KNKY_CONVERSE_PROJECT_ID,
    converseHost: import.meta.env.KNKY_CONVERSE_HOST,
    features: { multiCreatorSupport: true, advancedFilters: true, statistics: true, sharedContent: true, massMessages: true, customFanLists: true },
    api: agencyApi,
    ConverseClass: Converse,
    agentId: user.id,
    agentName: user.profile.username,
    creatorIds,
    auth: { getConverseToken },
  });
}
```

## Step 3 — mount behind the flag (`src/components/creator-layout/creator-messages.tsx`)

```tsx
import { ChatProvider, ChatList, ChatBox, useChatStore } from '@knky-chat/chat-ui';
import { createAgencyAdapter } from '@/knky-chat/adapter';

const USE_NEW_CHAT = import.meta.env.KNKY_USE_NEW_CHAT === 'true';

function NewAgencyChat() {
  // adapter created once; creatorIds come from Redux (already populated by Messages)
  const adapter = useMemo(() => createAgencyAdapter(), []);
  const currentUserId = useAppSelector((s) => s.user.id);
  return (
    <ChatProvider adapter={adapter} loadingFallback={<div className="p-6 text-sm">Connecting…</div>}>
      <div className="flex h-full">
        <aside className="w-80 border-r"><ChatList /></aside>
        <main className="flex-1"><ChatBox currentUserId={currentUserId} /></main>
      </div>
    </ChatProvider>
  );
}

// in the existing render:
return USE_NEW_CHAT ? <NewAgencyChat /> : (/* existing SingleCreatorList + AllCreatorsListing */);
```

Note: `Messages` already populates `creator.activeCreators`, sets
`chat.currentCreatorId`, and starts the active creator's login/renewal before
rendering `creator-messages`. `createAgencyAdapter()` reads that creator list
and (re)runs `getConverseToken` per creator — idempotent for the active one.

## Step 4 — env + activate

Add to the relevant `envs/.env.*`:
```
KNKY_USE_NEW_CHAT=true
```
Tailwind: the agency app is already Tailwind + shadcn, so the components inherit
its tokens — no extra CSS. Confirm the shadcn CSS variables the library uses
(`--primary`, `--muted`, `--border`, `--input`, `--ring`, …) exist in the
agency theme (they do in a standard shadcn setup).

## Rollback
Flip `KNKY_USE_NEW_CHAT=false` (or remove it). The `file:` deps and new
`src/knky-chat/` folder are additive and can be deleted; the existing chat is
untouched.

## Open items to confirm on first real run
- The exact decrypted envelope shape for `get-message-unread-count` (this guide
  assumes `{ data: { totalUnreadCount, channels } }` per `odd-calls.ts`).
- Whether `getChatList` should pass the current `filter` (read/fan/spend) — the
  library holds it in the store; map it into the POST body if server-side
  filtering is desired (else the library filters client-side).
