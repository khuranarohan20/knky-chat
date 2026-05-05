# Master Implementation Plan: knky-chat Micro Frontend

> Created: 2026-05-05
> Based on: Full code analysis of both knky-frontend and knky-agency-frontend
> Analysis files: `docs/analysis/`

---

## Reality Check First

The existing knky-chat packages are **scaffolding, not implementation**. They have the right structure but the actual code inside is placeholder-level. The types are simplified, Redux is not wired to anything real, and the UI components are shells. This plan treats the project as starting from verified scaffolding with the correct directory structure already in place.

**Estimated total effort: 8–10 focused weeks** (not the original 14-week estimate, because we now have both source apps to directly port from).

---

## Guiding Principles

1. **Port, don't rewrite** — both source apps have working, battle-tested logic. The job is extraction and abstraction, not reimplementation.
2. **Adapter normalizes, components are dumb** — all platform differences resolved at adapter layer; UI components receive normalized props.
3. **Types first, always** — no component or hook is written before its full TypeScript interface is locked.
4. **Agency state shape is the harder one** — design Redux slice for agency first (nested), then ensure core adapter can work with a flat projection of it.
5. **Socket is a first-class citizen** — the Converse SDK is the heart of this system; it must be fully wrapped before any UI can be meaningful.
6. **Feature flags over branches** — agency-only features (multi-creator, mass message, custom lists) are guarded by `PlatformConfig.features.*`, not separate code paths.

---

## Architecture Decision: State Strategy

**Problem**: Core uses flat state, Agency uses nested state. How do we handle this in one Redux slice?

**Decision: Nested-by-creator as the canonical shape for `chat-ui`**

Rationale:
- Agency's nested shape is a superset — core is just agency with one creator
- The `CoreAdapter` will use a fixed `creatorId = "core"` sentinel value
- All selectors always take a `creatorId` parameter
- The `CoreAdapter` provides this sentinel; components never hardcode it
- This means one Redux slice, one set of selectors, zero branching in components

```typescript
// CoreAdapter always provides:
const CORE_CREATOR_ID = "__core__"

// AgencyAdapter provides actual creator IDs
```

---

## Phase 0: Foundation Repair (Week 1)
**Goal: Make the monorepo actually build cleanly**

### 0.1 Fix TypeScript errors in core-chat
- Fix `packages/core-chat/src/types/index.ts` compilation errors
- Run `pnpm build` in core-chat — must pass with zero errors

### 0.2 Upgrade & lock the real MetaInterface
The current types are missing ~35 fields from the real `MetaInterface`.
Port the complete interface from both source apps.

File: `packages/core-chat/src/types/message.types.ts`

Full MetaInterface (see KNKY_FRONTEND_ANALYSIS.md §4 for complete list):
- All service fields: reqId, requestAccept, serviceData, serviceId
- All media fields: media, media_fee, is_unlocked, sub_type
- All pricing fields: amount, price, paid, counter_offer_price, counter_status
- All content fields: story_id, story_data, entity_id, embed details
- All flag fields: delete_for, is_mass_message, sent_by, emp, forward, paid_by
- All payment fields: address, transaction_id, discount

### 0.3 Set up ESLint + Prettier consistently
- Copy `.eslintrc` and `.prettierrc` from knky-agency-frontend as the standard
- Apply to all packages

### 0.4 Configure Turborepo properly
- Set up `turbo.json` with correct task ordering (core-chat → business-logic → chat-ui → adapters)
- `pnpm build` from root must build all packages in correct order

**Exit criteria**: `pnpm build` from root completes with zero errors.

---

## Phase 1: Core Chat Logic (Week 2)
**Goal: `@knky-chat/core-chat` fully functional and tested**

### 1.1 ChatConnection class
Port from `knky-frontend/utils/chatSocket.ts` directly.

Required methods:
```typescript
class ChatConnection {
  isConnected: boolean
  project: ProjectInstance | null
  channel: ChannelInstance | null

  async init(config: ConnectionConfig): Promise<void>
  async connectChannel(channelId: string): Promise<void>
  disconnectChannel(): void
  disconnect(): void

  // Channel operations
  sendMessage(params: SendMessageParams): void
  getMessages(params: GetMessagesParams): Promise<void>
  getMessagesReceipts(): Promise<void>
  checkMoreMessage(params: { time: string }): Promise<void>
  seenMessage(receipts: { messageId: string; senderId: string }[]): void
  seenMessageAll(params: { time: string }): void
  addPinMessage(params: { messageId: string; forAll: boolean }): void
  unPinMessage(params: { messageId: string; pinId: string; forAll: boolean }): void
  getPinnedMessages(params: { limit: number; page: number }): void

  // Listeners (all return unsubscribe functions)
  onMessage(handler: (msg: MessageInterface) => void): () => void
  onEditMessage(handler: (msg: MessageInterface) => void): () => void
  onDeleteMessage(handler: (msg: MessageInterface) => void): () => void
  onSeenMessage(handler: (data: SeenMessagePayload) => void): () => void
  onSeenAllMessage(handler: (data: SeenAllPayload) => void): () => void
  onPinMessage(handler: (data: PinMessageResponse) => void): () => void
  onUnpinMessage(handler: (data: { pinId: string }) => void): () => void
  onTyping(handler: (data: TypingPayload) => void): () => void
  onStopTyping(handler: (data: TypingPayload) => void): () => void
  onMoreMessages(handler: (data: { haveMoreMessage: boolean }) => void): () => void
}
```

### 1.2 ConnectionManager (new — for agency multi-socket)
```typescript
class ConnectionManager {
  private connections = new Map<string, ChatConnection>()

  create(creatorId: string): ChatConnection
  get(creatorId: string): ChatConnection | null
  getOrCreate(creatorId: string): ChatConnection
  remove(creatorId: string): void
  clear(): void
}

export const connectionManager = new ConnectionManager()
```

### 1.3 API Client
Port from `knky-frontend/api/chat.ts` and `knky-agency-frontend/src/apis/chat.ts`.

All these endpoints must be in the client (see KNKY_FRONTEND_ANALYSIS.md §7 for full list). Use axios with interceptors for auth token injection.

```typescript
interface IChatApiClient {
  getChatList(params: ChatListParams): Promise<Chat[]>
  getChatById(userId: string): Promise<Chat>
  getChannelDetail(channelId: string): Promise<Chat>
  getPinnedChats(): Promise<Chat[]>
  searchChats(query: string, page?: number): Promise<Chat[]>
  requestConverseToken(): Promise<string>
  verifyConverseToken(params: VerifyTokenParams): Promise<boolean>
  getChatStats(userId: string): Promise<ChatStatsInterface>
  updateNotes(params: UpdateNotesParams): Promise<void>
  sendChatMedia(params: SendMediaParams): Promise<void>
  shareEntities(params: ShareEntitiesParams): Promise<void>
  updateConverseNote(channelId: string, params: NoteParams): Promise<void>
  deleteChat(targetId: string): Promise<void>
  getConverseMembers(): Promise<ConversePair[]>
  updatePaymentTimestamp(channelId: string): Promise<void>
  getSharedContent(params: SharedContentParams): Promise<SharedContentResponse>
  purchaseMedia(params: PurchaseMediaParams): Promise<void>
  getChatFeeServices(params: ChatFeeParams): Promise<ChatFeeResponse>
  getMassMessageHistory(page: number, type?: string): Promise<MassMessage[]>
  sendMassMessage(params: MassMessageParams): Promise<void>
  getTransactionHistory(params: TransactionParams): Promise<Transaction[]>
}
```

### 1.4 Utilities
Port these verbatim:
- `chat-list-sort.ts` — sort logic (pinned first, timestamp order)
- `sort-and-filter-chat-list.ts` (agency) — filter application
- `message-utils.ts` — message normalization helpers
- `receipt-utils.ts` — seen receipt helpers
- `chat-list-sort.ts` — deduplication logic

**Exit criteria**: `@knky-chat/core-chat` builds, types compile, utilities tested with Vitest.

---

## Phase 2: Redux Slice (Week 3)
**Goal: `@knky-chat/chat-ui` has a complete, working Redux store**

### 2.1 Chat Slice Design

Use **nested-by-creator** as canonical shape (see Architecture Decision above).

```typescript
// packages/chat-ui/src/store/chat.slice.ts

interface ChatRootState {
  currentCreatorId: string | null;
  chatDataByCreator: Record<string, CreatorChatState>;
  completeChatLoading: boolean;
  showSharedContent: boolean;
}

// initialCreatorState() factory function — used for both core and agency
function initialCreatorState(): CreatorChatState { ... }
```

All actions from both source apps must be represented (see analysis docs for full lists). Key actions:

**Navigation**: setCurrentCreatorId, setActiveChat, setTargetPerson
**Messages**: setCompleteMessages, addMessage, editMessage, deleteMessage, prependMessages, appendMessages
**Unread**: setTotalUnreadCount, setUniqueUnreadChannels, setUniqueUnreadChannelsWithActions, setTotalUnreadChannelCount
**Pinning**: setPinMessages, setPinMessageIndex
**Filters**: setFilters
**Compose**: setReplyMessage, setTemplate
**Tokens**: setConverseToken, setCreatorToken
**Loading**: setIsLoading, setIsMessagesLoading, setLoadingMoreMessages
**Members**: setConverseMembersList
**Online**: setOfflineList
**Stats**: setActiveChatStats, setShowStats
**Media**: setMediaGallery, setShowSharedContent
**Tabs**: setChatTabs, setChatListTabs, editChatListTabs
**Jump**: jumpToMessage, clearFocusMessage
**Focus**: setFirstItemIndex, decreaseFirstItemIndex
**Misc**: setEmbeds, setFilters, resetChatState

### 2.2 Selectors
Export memoized selectors (reselect) for all state:
```typescript
// packages/chat-ui/src/store/selectors.ts
export const selectCreatorState = (state: RootState, creatorId: string) =>
  state.chat.chatDataByCreator[creatorId]

export const selectChatList = (state: RootState, creatorId: string) =>
  selectCreatorState(state, creatorId)?.chatList ?? []

// ... all other selectors
```

### 2.3 Store Configuration
```typescript
// packages/chat-ui/src/store/index.ts
export const createChatStore = (extraReducers?: ReducersMapObject) =>
  configureStore({
    reducer: {
      chat: chatReducer,
      ...extraReducers,
    },
  })
```

Allow host apps to inject their own reducers so the chat store can coexist with their existing Redux stores.

**Exit criteria**: Store builds, all actions have correct TypeScript signatures, reducers handle all cases correctly.

---

## Phase 3: Business Logic Layer (Week 4)
**Goal: All managers and adapters wire to real Redux**

### 3.1 IChatStateAdapter interface
```typescript
interface IChatStateAdapter {
  // Read
  getChatList(): Chat[]
  getActiveChat(): Chat | null
  getActiveChatId(): string | null
  getMessages(channelId: string): MessageInterface[]
  getPinnedMessages(channelId: string): PinMessageResponse["pinnedMsg"][]
  getFilter(): FilterInterface
  getConverseToken(): string
  getCreatorToken(): string
  getUnreadCount(): number

  // Write
  dispatch(action: AnyAction): void
  setChatList(chats: Chat[]): void
  setActiveChat(chatId: string): void
  addMessage(channelId: string, message: MessageInterface): void
  updateMessage(channelId: string, message: MessageInterface): void
  removeMessage(channelId: string, messageId: string): void
  markSeen(channelId: string, messageIds: string[]): void
  setConverseToken(token: string): void
  setCreatorToken(token: string): void
  setLoading(value: boolean): void
  setFilter(filter: FilterInterface): void
}
```

### 3.2 CoreStateAdapter
```typescript
class CoreStateAdapter implements IChatStateAdapter {
  private readonly CREATOR_ID = "__core__"
  constructor(private store: Store) {}

  getChatList() {
    return this.store.getState().chat.chatDataByCreator[this.CREATOR_ID]?.chatList ?? []
  }
  // ...all methods dispatch with CREATOR_ID
}
```

### 3.3 AgencyStateAdapter
```typescript
class AgencyStateAdapter implements IChatStateAdapter {
  constructor(private store: Store, private creatorId: string) {}

  getChatList() {
    return this.store.getState().chat.chatDataByCreator[this.creatorId]?.chatList ?? []
  }
  // ...all methods dispatch with this.creatorId
}
```

### 3.4 CoreChatManager
Orchestrates the lifecycle for a single creator:
- Token request/verify/renewal
- Socket initialization
- Chat list fetch
- Message synchronization

### 3.5 AgencyChatManager
Same as CoreChatManager but:
- Manages multiple creators via ConnectionManager
- Handles `loginAsCreator()` → per-creator token flow
- AES decryption of converse token
- Injects `sent_by: "agency"` + `emp` into all outbound messages

**Exit criteria**: Managers can be instantiated, connect to test socket, dispatch to Redux.

---

## Phase 4: Socket Integration (Week 5)
**Goal: Real-time events fully wired to Redux state**

### 4.1 SocketEventBridge
A class that subscribes to ChatConnection events and dispatches Redux actions:

```typescript
class SocketEventBridge {
  constructor(
    private connection: ChatConnection,
    private adapter: IChatStateAdapter,
    private creatorId: string
  ) {}

  mount() {
    this.connection.onMessage(this.handleMessage)
    this.connection.onEditMessage(this.handleEditMessage)
    this.connection.onDeleteMessage(this.handleDeleteMessage)
    this.connection.onSeenMessage(this.handleSeenMessage)
    this.connection.onSeenAllMessage(this.handleSeenAllMessage)
    this.connection.onPinMessage(this.handlePinMessage)
    this.connection.onUnpinMessage(this.handleUnpinMessage)
    // ...
  }

  unmount() {
    // Remove all listeners
  }

  private handleMessage = (msg: MessageInterface) => {
    this.adapter.addMessage(msg.channel_id, msg)
    // Update unread if not active chat
    // Update chat list order
  }

  // ...all handlers
}
```

### 4.2 Seen Receipt Batching
Port the debounce logic from source apps:

```typescript
class SeenReceiptQueue {
  private pending: Map<string, { messageId: string; senderId: string }[]> = new Map()
  private flushTimer: NodeJS.Timeout | null = null
  private FLUSH_MS = 100

  enqueue(channelId: string, receipt: { messageId: string; senderId: string }) { ... }
  private flush() { ... }
  destroy() { ... }
}
```

### 4.3 Online/Offline Tracking
```typescript
class OnlineStatusManager {
  private offlineTimers: Map<string, NodeJS.Timeout> = new Map()
  private REMOVAL_DELAY = 30_000

  setOnline(userId: string, adapter: IChatStateAdapter) { ... }
  setOffline(userId: string, adapter: IChatStateAdapter) { ... }
  destroy() { ... }
}
```

**Exit criteria**: Send a message → it appears in UI. Receive a message → it appears in UI. Seen receipts update correctly.

---

## Phase 5: UI Components (Weeks 6–7)
**Goal: All components ported from source apps to Tailwind + shadcn**

### Priority Order (leaf → root)

#### Week 6: Atoms & Molecules
- `BubbleTime` — timestamp + seen status icons
- `OnlineDot` — online/offline indicator
- `Avatar` — with fallback initials
- `TimeBadge` — date separator between messages
- `LoadingSpinner` — generic
- All Shimmer components:
  - `ChatListShimmer`
  - `ChatBubblesShimmer`
  - `ChatPersonShimmer`
  - `ChatBoxShimmer`
  - `ChatStatsShimmer`

#### Week 6: Bubble Variations (15 types)
Port each directly from agency (Tailwind) — they're already the right CSS:
1. `TextBubble` — plain text with link highlighting
2. `MessageAttachment` — image/video/audio carousel
3. `SentTip` — tip received/sent
4. `RatingRequest` — star rating request
5. `VideoVoiceReceiver` + `VideoVoiceSender`
6. `CustomRequestReceiver`
7. `JoinCallBtn`
8. `ChatEmbeds` — POST/PRODUCT/CHANNEL/GROUP cards
9. `StoryReply`
10. `NewPayment`
11. `PromotionReceiver` + `PromotionSender`
12. `SetPrice` (core only, but include)
13. `TagApproval` (core only, include)
14. `FileAndMediaRenderer`

#### Week 7: Organisms
- `RenderMessage` — polymorphic router (dispatches to bubble variations based on `meta.type`)
- `ChatBubbles` — Virtuoso-backed message list
  - BASE offset = 2,000,000
  - `idToIndex` map
  - Unread divider
  - Date separators
  - rangeChanged callback (seen receipt trigger)
  - Load more (upwards/downwards)
  - Scroll-to-bottom FAB
  - Focus message with flash
- `ChatBar`
  - Textarea with @ mention support
  - Media upload (file + vault)
  - Audio recording modal
  - MediaFeeModal
  - ServicesBtn
  - Template selector
  - Send button
  - Reply context strip
- `ChatList`
  - Virtualized
  - Search
  - Context menu per item (pin, delete, mark read/unread, add to list)
- `ChatListTabs` — All/Subscribers/Followers/Custom tabs
- `ChatListFilters` — Read, Fan, Spend filter dropdowns
- `ChatPerson` (header) — name, avatar, online badge, actions menu
- `ChatStats` — drawer with spending breakdown, transactions, notes, delete
- `MediaGallery` — 5-tab overlay (Media/Audio/Posts/Services/Channels)
- `PinnedMessages` — carousel with navigation
- `DefaultChatBoxScreen`
- `ChatBox` — orchestrates the above

### Theme Strategy
All components use Tailwind by default. Bootstrap compatibility via CSS variable overrides:
```css
/* bootstrap-compat.css */
.chat-primary { @apply btn btn-primary; }
```
Not via dual class names — platforms apply their own CSS reset if needed.

**Exit criteria**: ChatBox renders with mock data, all 15 bubble types render correctly.

---

## Phase 6: Hooks (Week 7, parallel with UI)
**Goal: All hooks wired to Redux and socket**

### `useChat(creatorId: string)`
Master hook — connects to Redux state via selectors:
```typescript
const {
  messages, chatList, activeChat, targetPerson,
  loading, messagesLoading, pinned, filter,
  unreadCount, isConnected,
} = useChat(creatorId)
```

### `useChatSocket(creatorId: string)`
```typescript
const { connected, connecting, error, reconnect, disconnect } = useChatSocket(creatorId)
```

### `useMessageSend(creatorId: string, channelId: string)`
```typescript
const { sendMessage, sendMedia, editMessage, deleteMessage, loading } = useMessageSend(...)
```

### `useSeenManager(creatorId: string, channelId: string)`
```typescript
const { markSeen, markAllSeen, isSeen } = useSeenManager(...)
```

### `usePinManager(creatorId: string, channelId: string)`
```typescript
const { pinMessage, unpinMessage, unpinAll, maxPins } = usePinManager(...)
```

### `useChatServiceStatus(options)` (core feature, optional for agency)
Port from `knky-frontend/hooks/useChatServiceStatus.tsx`:
```typescript
const { loading, hasChatServices, isBuyer, freePerksActive, freeChat } = useChatServiceStatus({ ... })
```

### `useShowChat(creatorId: string)`
```typescript
const { openChat } = useShowChat(creatorId)
```
Flow: connect socket → fetch messages → set active chat

**Exit criteria**: Hooks connect correctly to Redux; `useShowChat` opens a real chat end-to-end.

---

## Phase 7: Adapters (Week 8)
**Goal: Both adapters handle the full lifecycle**

### CoreAdapter (complete implementation)
```typescript
class CoreAdapter implements IPlatformAdapter {
  readonly platformType = 'core'
  private readonly CREATOR_ID = '__core__'
  private manager: CoreChatManager
  private store: ReturnType<typeof createChatStore>

  constructor(config: CorePlatformConfig) { ... }

  async initialize(): Promise<void> {
    // 1. Request converse token
    // 2. Verify token
    // 3. Initialize ChatConnection (single)
    // 4. Register all socket listeners via SocketEventBridge
    // 5. Fetch initial chat list
    // 6. Set up unread count tracking
  }

  // All state access routes through CREATOR_ID
  getChatList() { return this.stateAdapter.getChatList() }
  // ...
}
```

### AgencyAdapter (full multi-creator support)
```typescript
class AgencyAdapter implements IPlatformAdapter {
  readonly platformType = 'agency'
  private managers: Map<string, AgencyChatManager> = new Map()
  private store: ReturnType<typeof createChatStore>

  constructor(config: AgencyPlatformConfig) { ... }

  async initialize(): Promise<void> {
    // 1. For each creator in config.creators:
    //    a. loginAsCreator() → creatorToken
    //    b. Request + decrypt converse token
    //    c. connectionManager.create(creatorId)
    //    d. socket.init(config)
    //    e. Register SocketEventBridge for this creator
    //    f. dispatch setCurrentCreatorId if first
    // 2. Load chat list for active creator
    // 3. Start token renewal loops
  }

  async switchCreator(creatorId: string): Promise<void> {
    // 1. Ensure socket exists (or create)
    // 2. dispatch setCurrentCreatorId
    // 3. Load chat list for new creator
  }

  // Meta injection for agency
  private enrichMeta(meta: Partial<MetaInterface>): Partial<MetaInterface> {
    return {
      ...meta,
      sent_by: 'agency',
      emp: btoa(JSON.stringify({ id: this.config.agentId, name: this.config.agentName })),
    }
  }
}
```

### IPlatformAdapter (complete interface)
```typescript
interface IPlatformAdapter {
  readonly platformType: 'core' | 'agency'
  readonly config: PlatformConfig

  // Lifecycle
  initialize(): Promise<void>
  destroy(): void

  // Creator management (agency only — core throws)
  switchCreator?(creatorId: string): Promise<void>
  getCreatorIds?(): string[]

  // State access
  getChatList(): Chat[]
  getActiveChat(): Chat | null
  getMessages(channelId: string): MessageInterface[]
  getConverseToken(): string

  // State mutations (go through Redux)
  openChat(channelId: string): Promise<void>
  sendMessage(params: SendMessageParams): Promise<void>
  sendMedia(params: SendMediaParams): Promise<void>
  markSeen(channelId: string, messageIds: string[]): void

  // Meta enrichment (agency adds sent_by + emp)
  enrichMeta(meta: Partial<MetaInterface>): Partial<MetaInterface>

  // Store access
  getStore(): Store
  getCreatorId(): string // '__core__' for core, active creatorId for agency

  // Config
  getMaxPinMessages(): number    // 20 for core, 5 for agency
  getFlushMs(): number           // 100 for core, 120 for agency
  isFeatureEnabled(feature: keyof Features): boolean
}
```

**Exit criteria**: `new CoreAdapter(config).initialize()` works. `new AgencyAdapter(config).switchCreator(id)` works.

---

## Phase 8: ChatProvider & Integration (Week 9)
**Goal: Single entry point that hosts can drop in**

### ChatProvider
```typescript
// packages/chat-ui/src/ChatProvider.tsx
interface ChatProviderProps {
  adapter: IPlatformAdapter
  children: React.ReactNode
  onError?: (error: Error) => void
}

export function ChatProvider({ adapter, children, onError }: ChatProviderProps) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    adapter.initialize()
      .then(() => setReady(true))
      .catch(onError)

    return () => adapter.destroy()
  }, [adapter])

  if (!ready) return <ChatInitializingScreen />

  return (
    <AdapterContext.Provider value={adapter}>
      <Provider store={adapter.getStore()}>
        {children}
      </Provider>
    </AdapterContext.Provider>
  )
}
```

### Public API of chat-ui
```typescript
// packages/chat-ui/src/index.ts
export { ChatProvider } from './ChatProvider'
export { ChatBox } from './components/ChatBox'
export { ChatList } from './components/ChatList'
export { useChat } from './hooks/useChat'
export { useShowChat } from './hooks/useShowChat'
export { useMessageSend } from './hooks/useMessageSend'
```

### Integration Test (knky-frontend)
```typescript
// In knky-frontend (test integration)
import { CoreAdapter } from '@knky-chat/adapters/core'
import { ChatProvider, ChatBox, ChatList } from '@knky-chat/chat-ui'

const adapter = new CoreAdapter({
  apiEndpoint: process.env.NEXT_PUBLIC_API_URL,
  converseProjectId: process.env.CONVERSE_PROJECT_ID,
  converseHost: process.env.CONVERSE_HOST,
  theme: 'bootstrap',
  features: {
    multiCreatorSupport: false,
    advancedFilters: true,
    statistics: true,
    sharedContent: true,
    streamMessages: true,
    sessionTracking: true,
  },
  auth: {
    getToken: () => store.getState().chat?.converseToken || '',
    verifyToken: (token) => VerifyConverseToken({ token }),
  },
})

<ChatProvider adapter={adapter}>
  <ChatList />
  <ChatBox />
</ChatProvider>
```

### Integration Test (knky-agency-frontend)
```typescript
import { AgencyAdapter } from '@knky-chat/adapters/agency'
import { ChatProvider, ChatBox, ChatList, AllCreatorsListing } from '@knky-chat/chat-ui'

const adapter = new AgencyAdapter({
  apiEndpoint: import.meta.env.VITE_API_URL,
  converseProjectId: import.meta.env.VITE_CONVERSE_PROJECT_ID,
  converseHost: import.meta.env.VITE_CONVERSE_HOST,
  theme: 'tailwind',
  agentId: agentUser._id,
  agentName: agentUser.name,
  features: {
    multiCreatorSupport: true,
    advancedFilters: true,
    statistics: true,
    sharedContent: true,
    massMessages: true,
    customFanLists: true,
  },
  auth: {
    loginAsCreator: (creatorId) => loginAsCreator({ creatorId }),
    getToken: (creatorId) => store.getState().chat.chatDataByCreator[creatorId]?.creatorToken,
    verifyToken: (token, creatorId) => VerifyConverseToken({ token, creatorId }),
  },
})

<ChatProvider adapter={adapter}>
  <AllCreatorsListing />
  <ChatList />
  <ChatBox />
</ChatProvider>
```

**Exit criteria**: Both integration tests render chat and exchange real messages.

---

## Phase 9: Testing (Week 9, parallel)
**Goal: Confidence that extraction didn't break anything**

### Unit Tests (Vitest)
- Redux slice: all reducers, all edge cases (deduplication, unread tracking)
- Utilities: sort, filter, dedup
- SeenReceiptQueue: batching, deduplication, flush timing
- ConnectionManager: create, get, remove

### Integration Tests
- CoreAdapter.initialize() → state populated correctly
- AgencyAdapter.switchCreator() → state isolated correctly
- SocketEventBridge: receive message → Redux updated → component re-renders

### E2E Tests (Playwright or Vitest + MSW)
- User opens chat → messages load
- User sends message → appears in UI
- Incoming message → unread count increments
- Mark as seen → receipt updates
- Pin message → appears in carousel
- Filter by unread → list filters

---

## Phase 10: Migration (Week 10)
**Goal: Drop knky-chat into both apps without regression**

### Migration Order

**Week 10a: knky-frontend**
1. `pnpm add` all four packages
2. Add `ChatProvider` wrapper at page level
3. Replace `ChatBox` import (feature-flagged: `USE_NEW_CHAT`)
4. Replace `ChatList` import
5. Test all features
6. Fix Bootstrap compatibility issues
7. Enable for 100% traffic
8. Remove old code

**Week 10b: knky-agency-frontend**
1. `pnpm add` all four packages
2. Add `ChatProvider` wrapper
3. Replace `AllCreatorsListing` with new version
4. Replace `ChatBox` + `ChatList`
5. Test creator switching
6. Test mass messaging
7. Enable for 100% traffic
8. Remove old code

### Feature Flag Strategy
```
// knky-frontend
NEXT_PUBLIC_USE_NEW_CHAT=true/false

// knky-agency-frontend
VITE_USE_NEW_CHAT=true/false
```

---

## Non-Negotiables (must be correct or migration will fail)

1. **Message deduplication**: `_id || messageId` — both field names
2. **Receipt field normalization**: `r.userId || r.user_id`
3. **Virtuoso BASE offset**: Must be 2,000,000 to prevent negative indices on prepend
4. **Seen receipt debounce**: 100ms (core) / 120ms (agency) — not instant
5. **Pin limit**: 5 (agency) vs 20 (core) — adapter-configurable
6. **`sent_by: "agency"`** in all agency outbound messages
7. **AES token decryption** for agency converse tokens
8. **Per-creator localStorage** for agency state persistence
9. **30s offline removal** window — exact timing matters
10. **Embed 4h cache** — fetched on mount, not on every render

---

## Risk Register

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|-----------|
| Converse SDK breaking changes | High | Low | Pin SDK version, test in isolation |
| Type drift from source apps | High | Medium | `KNKY_FRONTEND_ANALYSIS.md` as source of truth |
| Redux store conflicts with host apps | High | Medium | `createChatStore` factory, optional merge |
| Agency token renewal race conditions | High | Medium | Mutex/lock on token refresh per creator |
| Virtual scroll index corruption | High | Low | Port BASE=2M logic exactly, add regression test |
| Bootstrap + Tailwind CSS conflicts | Medium | High | CSS isolation via scoped containers |
| Seen receipt race (socket vs Redux) | Medium | Medium | Optimistic updates + reconcile on receipt |
| Bundle size too large | Medium | Low | Tree-shaking + dynamic imports for bubble types |

---

## Success Criteria

- [ ] `pnpm build` from root: zero errors
- [ ] `pnpm test`: 100% unit tests passing
- [ ] CoreAdapter integration: chat works end-to-end in knky-frontend
- [ ] AgencyAdapter integration: creator switching works in knky-agency-frontend
- [ ] All 15 message types render correctly
- [ ] Seen receipts update correctly in both directions
- [ ] Pinning works (correct limits per platform)
- [ ] Filtering works (read/fan/spend)
- [ ] Unread counts accurate across platforms
- [ ] No performance regression (Virtuoso, memoization)
- [ ] Zero regressions in either host app after migration

---

## File Output Summary

```
docs/
├── analysis/
│   ├── KNKY_FRONTEND_ANALYSIS.md      ← Full core chat analysis
│   ├── KNKY_AGENCY_ANALYSIS.md        ← Full agency chat analysis
│   ├── DELTA_ANALYSIS.md              ← What differs, what's shared
│   └── CURRENT_PACKAGE_STATE.md       ← What exists now, what's missing
└── MASTER_IMPLEMENTATION_PLAN.md      ← This file
```
