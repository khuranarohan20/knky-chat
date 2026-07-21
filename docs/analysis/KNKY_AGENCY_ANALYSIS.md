# knky-agency-frontend Chat System — Complete Technical Analysis

> Source: `/Users/admin/Desktop/Development/knky-agency-frontend`
> Platform: React + Vite + Tailwind CSS + shadcn/ui + Redux Toolkit
> Role: Multi-creator agency chat (agents managing multiple creators)

---

> ### ⚠️ 2026-07-21 REFRESH — corrections to the 2026-05-05 baseline below
> Re-analyzed @ `053d717` (~23 commits since). Architecture shape unchanged (nested per-creator state, per-creator sockets, agency tagging), but the baseline had factual errors. Full narrative in `docs/MASTER_IMPLEMENTATION_PLAN.md` → "2026-07-21 REFRESH".
> **Corrections (baseline was wrong):**
> - Socket class is **`ChatConnection(creatorId, token)`** (`src/utils/chat-socket.ts`), NOT `ChatSocket(creatorId)`. Manager: `connectionManager.ts` (`Map<creatorId, ChatConnection>`).
> - §4 selector list is largely **fictional** — actual ~15 selectors (`selectChatListByCreator`, `selectActiveChat`, `selectSortedChatListByLastMessage`, `selectUnreadChats`, …); most access is inline `useAppSelector`.
> - `CreatorChatState` includes **`seenMessages: ReceiptStore`** (omitted in §1).
> - Outbound `meta.emp` = `btoa({ id: user.id, name: user.profile.username })` (not agent name).
> - `useShowChat()` takes **no arg** (reads `currentCreatorId`); `useBlockUser`'s `isLoading` is a per-user function `(userId)=>boolean`.
> **Deltas since baseline:** per-creator token renewal now `ensureCreatorTokenRenewal(creatorId)` (AES via `crypto-js`+`KNKY_DECRYPT_KEY`) + Vitest suite; `MIN_MEDIA_PRICE` 5→**1**, `MAX_MEDIA_PRICE=10000`; "Pay-to-view/PTV" relabeled **"Clips"** (value still `Premium`); `DeleteMassMessage` path → `/mass-message/delete/:id`; new APIs `GetMessageTemplateCatogories`, `FetchFansListV2`, `SharePayload.auto_expire_after_duration(_type)`.
> **Known latent bug (don't replicate):** online/offline handlers in `chat-socket.ts` read `store.getState().chat[creatorId]` instead of `chat.chatDataByCreator[creatorId]` and dispatch `setChatList` with `creatorId: user.id` — broken against the nested state shape.

---

## 1. REDUX STATE — Full ChatState Shape

The agency uses **nested state** — all chat data is scoped under `chatDataByCreator[creatorId]`:

```typescript
interface ChatState {
  currentCreatorId: string | null;
  chatDataByCreator: Record<string, CreatorChatState>;
  completeChatLoading: boolean;
  showSharedContent: boolean;
}

interface CreatorChatState {
  // Navigation
  chatItemIndex: number;
  chatList: Chat[];
  activeChatId: string | null;
  activeChat: Chat | null;
  targetPerson: ChatPerson | null;

  // Tokens
  converseToken: string;
  creatorToken: string;

  // Loading
  isLoading: boolean;
  isMessagesLoading: boolean;

  // Messages
  completeMessagesByChatId: Record<string, MessageInterface[]>;
  hasMoreMessagesByChatId: Record<string, boolean>;
  loadingMoreMessages: { upwards: boolean; downwards: boolean };
  focusMessageId?: string;
  focusMessageTime?: string;

  // Stats
  activeChatStats: ChatStatsInterface;
  showStats: boolean;

  // Media
  embeds: any[];
  showMediaGallery: [string, boolean];

  // Compose
  template: { message: string; vault_media_ids?: Media[]; price?: number };
  replyMessage: { message: MessageInterface; channel_id: string } | null;

  // Pinned
  pinnedMessagesByChatId: Record<string, PinMessageResponse["pinnedMsg"][]>;
  pinMessageIndex: number;

  // Tabs
  chatTabs: { title: string; is_enabled: boolean; _id: string; users_count: number }[];
  chatListTabs: Record<string, ChatListCountInterface>;

  // Unread
  total_unread_count: number;
  uniqueUnreadCountChannels: Record<string, number>;
  totalUnreadChannelCount: number;

  // Filtering
  filter: FilterInterface;

  // Lookup Maps
  userToChannel: Record<string, string>;
  channelToUser: Record<string, string>;

  // Online/Offline
  offlineList: Record<string, string>; // userId → ISO timestamp
}
```

---

## 2. KEY DIFFERENCE FROM CORE: NESTED STATE

### Core (knky-frontend) — Flat
```typescript
state.chat.chatList
state.chat.completeMessagesByChatId[channelId]
state.chat.converseToken
```

### Agency (knky-agency-frontend) — Nested by Creator
```typescript
state.chat.chatDataByCreator[creatorId].chatList
state.chat.chatDataByCreator[creatorId].completeMessagesByChatId[channelId]
state.chat.chatDataByCreator[creatorId].converseToken
state.chat.currentCreatorId    // which creator is active
```

This enables **multiple creators to be loaded simultaneously** without data collision.

---

## 3. ALL REDUX ACTIONS

Every action takes `creatorId` as scope:

```
setCurrentCreatorId(creatorId)          Creates state slot if missing
setOtherCreatorId(creatorId)            Adds creator without switching active
setConverseToken({ creatorId, token })
setCreatorToken({ creatorId, token })
setChatList({ creatorId, chatList, senderId?, chatId? })
setActiveChat({ creatorId, chatId })
jumpToMessage({ creatorId, chatId, messageId, messageTime })
clearFocusMessage({ creatorId })
setCompleteMessages({ creatorId, chatId, messages, add_to_list? })
addMessage({ creatorId, chatId, message, senderId, channel, isHuman })
editMessage({ creatorId, chatId, message })
deleteMessage({ creatorId, chatId, messageId })
prependMessages({ creatorId, chatId, messages })
appendMessages({ creatorId, chatId, messages })
markMessagesAsSeen({ creatorId, chatId, messageIds })
markChatAsRead({ creatorId, channelId })
markChatAsUnread({ creatorId, channelId })
setIsLoading({ creatorId, value })
setIsMessagesLoading({ creatorId, value })
setLoadingMoreMessages({ creatorId, direction, value })
setTargetPerson({ creatorId, person })
setActiveChatStats({ creatorId, stats })
setShowStats({ creatorId, value })
setEmbeds({ creatorId, embed })
setTemplate({ creatorId, message, vault_media_ids?, price? })
setTotalUnreadCount({ creatorId, count })
setFirstItemIndex({ creatorId, index })
decreaseFirstItemIndex({ creatorId, amount })
setCompleteChatLoading(boolean)
setMediaGallery({ creatorId, value, channelId })
setUniqueUnreadChannels({ creatorId, channels })
setUniqueUnreadChannelsWithActions({ creatorId, action, channelId })
setChatTabs({ creatorId, tabs })
setPinMessageIndex({ creatorId, index })
setPinMessages({ creatorId, channelId, messages })
setReplyMessage({ creatorId, message, channelId })
setChatListTabs(Record<string, ChatListCountInterface>)
editChatListTabs({ channelId, tabs?, task, count? })
setConverseMembersList(ConversePair[])
setOfflineList({ creatorId, value, remove? })
setFilters({ creatorId, filter })
setShowSharedContent(boolean)
setTotalUnreadChannelCount({ creatorId, count })
resetChatState()
```

---

## 4. SELECTORS (chat.selectors.ts)

The agency has explicit memoized selectors — core does not:

```typescript
selectCurrentCreatorId(state)
selectCreatorChatData(state, creatorId)         // Full CreatorChatState
selectChatList(state, creatorId)
selectActiveChatId(state, creatorId)
selectActiveChat(state, creatorId)
selectTargetPerson(state, creatorId)
selectCompleteMessages(state, creatorId, chatId)
selectIsLoading(state, creatorId)
selectIsMessagesLoading(state, creatorId)
selectConverseToken(state, creatorId)
selectCreatorToken(state, creatorId)
selectFilter(state, creatorId)
selectPinnedMessages(state, creatorId, channelId)
selectUnreadChannels(state, creatorId)
```

---

## 5. SOCKET EVENTS (Converse SDK — same as core)

### Connection Architecture (DIFFERENT from core)

Agency manages **multiple simultaneous socket connections** — one per creator:

```
connectionManager = Map<creatorId, ChatSocket>

createConnection(creatorId, converseToken)
  → new ChatSocket(creatorId)
  → socket.init(config)
  → connectionManager.set(creatorId, socket)

getConnection(creatorId)
  → connectionManager.get(creatorId)
```

### Socket Events — identical to core
Same `listenNewMessage`, `listenEditMessage`, `listenSeenMessage`, etc.

### Key Agency Difference: `sent_by` & `emp` in Meta
```typescript
// All agency messages include:
meta.sent_by = "agency"
meta.emp = btoa(JSON.stringify({ id: agentId, name: agentName }))
```

---

## 6. API ENDPOINTS

| Endpoint | Purpose |
|----------|---------|
| `POST /users/chat/get-converse-channel` | Chat list (page, limit, all filters) |
| `GET /users/fetch-pinned-converse-channel` | Pinned chats |
| `GET /users/request-converse-token` | Socket auth token (per creator bearer) |
| `POST /users/verify-converse-token` | Validate socket token |
| `GET /users/get-converse-channel/:userId` | Single chat detail |
| `GET /users/services` | Chat fee services |
| `POST /users/generate-signed-urls` | Asset signed URLs |
| `POST /users/generate-chat-signed-urls` | Chat media signed URLs |
| `GET /users/media-consent/:entity_id` | Consent status |
| `POST /users/media-consent` | Approve/reject consent |
| `GET /users/chat-stats` | User spending |
| `PATCH /users/update-notes` | Save notes |
| `POST /users/chat-media` | Send media message |
| `POST /users/share-entities` | Share posts/channels/products |
| `POST /requests/calls-and-ratings` | Service request (FormData) |
| `PUT /requests/respond-to-request/:reqId` | Accept/decline service |
| `GET/POST/PATCH/DELETE /users/message-template` | Templates CRUD |
| `GET/POST/PATCH /users/custom-fan-list` | Custom fan lists |
| `POST /users/fetch-all-fans` | Fan list with filters |
| `POST /users/mass-message` | Send mass message |
| `GET /users/mass-message` | Message history |
| `PATCH /users/mass-message/:id` | Edit scheduled |
| `DELETE /users/mass-message/:id` | Delete scheduled |
| `POST /users/mass-message/unsend` | Unsend (UNSEEN/UNPAID) |
| `POST /users/mass-message/distinct-count` | Count recipients |
| `GET /users/chat/fetch-chat-media` | Shared content |
| `GET /users/search-converse-channel` | Search chats |
| `GET /users/get-converse-channel-detail/:id` | Chat details |
| `PATCH /users/update-converse-note/:channelId` | Pin/note |
| `DELETE /users/delete-converse-channel/:id` | Delete chat |
| `GET /users/chat/get-coverse-members` | Channel members |
| `POST /users/mass-message/unsend` | Unsend by condition |
| `PATCH /users/chat/update-payment-timestamp` | Clear payment badge |
| `GET /handler/transactions/user-to-user` | Transaction history |

---

## 7. COMPONENT TREE

```
AgencyChatSystem
├── AllCreatorsListing            Login as each creator, init tokens & sockets
│   └── For each creator:
│       ├── loginAsCreator() → creatorToken
│       ├── RequestConverseToken() → converseToken
│       └── createConnection(creatorId, converseToken)
│
├── SingleCreatorList             Single-creator fallback
│
└── ChatPage (main layout)
    ├── ChatList                  Left sidebar
    │   ├── ChatListTabs          Default + Custom Fan List tabs
    │   ├── ChatListFilters       Read/Fan/Spend filters
    │   └── VirtualizedList
    │       └── ChatPerson (per item)
    │           └── ContextMenu (pin, delete, block, note, add to list)
    │
    ├── DefaultChatBoxScreen      No chat selected
    │
    ├── ChatBox                   Right panel
    │   ├── ChatPerson (header)
    │   │   ├── Online/offline badge
    │   │   └── Search dialog
    │   │
    │   ├── PinnedMessages carousel (MAX 5)
    │   │   └── unPinAll button
    │   │
    │   ├── ChatBubbles (Virtuoso)
    │   │   ├── ScrollToUnreadDivider
    │   │   ├── SingleMessage x N
    │   │   │   ├── ChatBubbleContextMenu
    │   │   │   ├── RenderMessage (polymorphic router)
    │   │   │   │   ├── MessageAttachment
    │   │   │   │   ├── ChatEmbeds
    │   │   │   │   ├── PromotionReceiver / PromotionSender
    │   │   │   │   ├── VideoVoiceReceiver / VideoVoiceSender
    │   │   │   │   ├── CustomRequestReceiver
    │   │   │   │   ├── JoinCallBtn
    │   │   │   │   ├── SentTip
    │   │   │   │   ├── RatingRequest
    │   │   │   │   ├── StoryReply
    │   │   │   │   └── NewPayment
    │   │   │   └── BubbleTime
    │   │   └── Load more spinners (top/bottom)
    │   │
    │   └── ChatBar
    │       ├── Reply context
    │       ├── Textarea
    │       ├── Media/Vault upload
    │       ├── Price modal
    │       ├── Template selector
    │       └── Send button
    │
    ├── ChatStats drawer
    │   ├── Spending breakdown
    │   ├── Transactions (infinite scroll)
    │   ├── Notes editor
    │   └── Delete entire chat
    │
    └── MediaGallery overlay
        ├── Category tabs: Media, Audio, Posts, Services, Channels
        ├── DateWiseMedia
        ├── RenderPosts
        ├── RenderServices
        └── RenderSubscriptions
```

---

## 8. MESSAGE TYPES — Same as Core

Same meta.type discriminator, same message components. Minor differences:

- **PromotionReceiver** is a separate component in agency (vs inline in core)
- **ChatBubbleContextMenu** is its own component (not inline JSX)
- MAX_PIN_ALLOWED = **5** in agency vs **20** in core

---

## 9. AGENCY-EXCLUSIVE FEATURES

### Multi-Creator Architecture
- `AllCreatorsListing` initializes all creators on load
- Each creator gets: creatorToken → converseToken → ChatSocket instance
- Token renewal runs on interval per creator
- `currentCreatorId` tracks active creator in UI

### Creator Switching
```
1. User selects creator in AllCreatorsListing
2. dispatch setCurrentCreatorId(creatorId)
3. State slot auto-created if not exists
4. Socket already initialized (parallel init on load)
5. Load chatList for that creator
6. Reset activeChatId
```

### Agency Message Tagging
```typescript
// Every outbound message includes:
meta.sent_by = "agency"
meta.emp = btoa(JSON.stringify({ id: agentUser._id, name: agentUser.name }))
```

### Permission Gating
```typescript
getPermissionType(Subject.MESSAGE)     // Gate for sending
getPermissionType(Subject.PURCHASE_*)  // Gate for transactions
```

### Custom Fan Lists
```
GetMassCustomList() → { _id, title, users_count, is_enabled }[]
EditCustomList({ list_id, add_user_ids, remove_user_ids, title })
Shown as tabs in ChatListTabs alongside defaults
```

### Mass Messaging (agency-first feature)
```
Target: Followers | Subscribers | ExpiredSubscribers | Custom Lists
Content: Text | Vault media | Posts | Services
Payment: Free | Pay-to-view
Schedule: Immediate | Scheduled datetime
AutoUnsend: UNSEEN | UNPAID condition
Exclude: Custom lists from send
DistinctCount: Preview count before send
```

### Per-Creator State Persistence
```
Agency: localStorage key = `chat-state-${creatorId}`
Core:   localStorage key = `chat-state`
```

---

## 10. HOOKS

### `useShowChat(creatorId)`
```
1. dispatch setIsLoading({ creatorId, value: true })
2. getConnection(creatorId) — waits if socket not ready
3. socketChannel.connectChannel(channelId)
4. socketChannel.getChannelMessages()
5. dispatch setCompleteMessages, setTargetPerson, setFirstItemIndex
6. dispatch setIsLoading({ creatorId, value: false })
```

### `useBlockUser(creatorId)`
```
Returns: { blockedByMe, toggleBlock, unblock, isLoading }
Fetches block status on mount
```

---

## 11. FILTERING (identical logic to core)

```
readStatus: "all" | ["read"] | ["unread"] | ["online"]
conversationStatus: "all" | "active" | "shy"
fanType: "all" | FanType[]
spendRanks: "all" | { min: number; max: number }

Sort: pinned first (is_pinned[creatorId]) → lastHumanMessage → lastNonHumanMessage → createdAt

Online filter: Requires joinOnlineUsersRoom() socket call
Offline tracking: 30s removal window via startProcessRemoval() interval
```

---

## 12. SEEN RECEIPTS — SAME AS CORE

Three-layer system (identical to core):
1. `listenSeenMessage` → per-message receipt
2. `listenSeenAllMessage` → bulk seen before timestamp
3. `markMessagesAsSeen()` → optimistic update

Receipt field handling: `r.userId || r.user_id` (dual format support)

---

## 13. CONSTANTS (agency)

```
MAX_PIN_ALLOWED: 5        (vs 20 in core!)
FLUSH_MS: 120             (vs 100 in core)
MESSAGE_FETCH_LIMIT: 50
CHAT_LIST_FETCH_LIMIT: 50
BASE_VIRTUOSO: 100,000
MIN_MEDIA_PRICE: 5
IMAGE_MAX: 40MB
VIDEO_MAX: 1GB
```

---

## 14. EDGE CASES & GOTCHAS

1. **Message deduplication**: `_id || messageId` — same as core
2. **Receipt dual format**: `userId || user_id` — same as core
3. **Multiple socket instances**: Each creator has own ChatSocket; must not cross-contaminate
4. **Token renewal**: Creator tokens expire; `ensureCreatorTokenRenewal()` runs per creator
5. **AllCreatorsListing init race**: All creators init in parallel; some may fail silently
6. **Pin limit 5** (not 20 like core): Different business rules
7. **Pinned messages unpin all**: `unPinAllMessages()` bulk operation — no confirmation
8. **Embed cache 4h TTL**: `Date.now() - lastFetchTime < 4 * 60 * 60 * 1000`
9. **Search**: Uses `project.searchMessage({ search, channelIds })` — active channel only
10. **Payment badge**: Cleared 10s after view via `UnsetDollarTimestamp()` + scroll

---

## 15. WHAT'S IN AGENCY BUT NOT IN CORE

| Feature | Agency | Core |
|---------|--------|------|
| Multi-creator state | ✅ | ❌ |
| AllCreatorsListing | ✅ | ❌ |
| Creator switching | ✅ | ❌ |
| Per-creator socket | ✅ | ❌ |
| Explicit selectors | ✅ | ❌ |
| ChatBubbleContextMenu component | ✅ | Inline |
| PromotionReceiver separate component | ✅ | Inline |
| DefaultChatBoxScreen | ✅ | ❌ |
| DeleteEntireChat modal | ✅ | ❌ |
| Block user hook | ✅ | ❌ |
| `sent_by: "agency"` in meta | ✅ | ❌ |
| `emp` (employee) in meta | ✅ | ❌ |
| Permission gating | ✅ | ❌ |
| Mass message scheduling UI | ✅ | Basic |
| Custom fan list tabs | ✅ | ❌ |
| ChatStats shimmer | ✅ | ❌ |
| Per-creator localStorage key | ✅ | ❌ |

## 16. WHAT'S IN CORE BUT NOT IN AGENCY

| Feature | Core | Agency |
|---------|------|--------|
| ChatSession tracking (GA4) | ✅ | ❌ |
| useChatServiceStatus | ✅ | ❌ |
| Stream messages (live) | ✅ | ❌ |
| useChatNotification | ✅ | ❌ |
| ChatFeeBanner component | ✅ | ❌ |
| MAX_PIN_ALLOWED = 20 | ✅ | 5 |
| chatSession Redux slice | ✅ | ❌ |
| BootstrapMediaCarousel | ✅ | ❌ |
