# Delta Analysis: Core vs Agency — What Differs and What's Shared

> This document maps every difference and every similarity between
> knky-frontend (core) and knky-agency-frontend (agency) chat systems.
> The micro frontend must bridge all of these.

---

## SHARED (identical or near-identical)

| Category | Shared Element |
|----------|---------------|
| Types | `Chat`, `MessageInterface`, `MetaInterface` (all meta.type values) |
| Types | `ChatPerson`, `Receipt`, `Media`, `BuyerInterface`, `FilterInterface` |
| API | All endpoints (same paths, same params) |
| Socket SDK | `converse.svc-client` — identical event names and payloads |
| Socket Events | All listener names: `listenMessage`, `listenSeenMessage`, `listenPinMessage`, etc. |
| Message Types | All 15+ meta.type variants and their rendering logic |
| Components | ChatBubbles, ChatBar, ChatList, ChatListTabs, ChatListFilters, BubbleTime |
| Components | All bubble variations (VideoVoice, Rating, Tip, CustomRequest, StoryReply, etc.) |
| Components | MediaGallery structure and all sub-components |
| Business Logic | Seen receipt system (3-layer) |
| Business Logic | Filtering (readStatus, conversationStatus, fanType, spendRanks) |
| Business Logic | Chat list sort (pinned first, then by timestamp) |
| Business Logic | Message deduplication strategy (`_id || messageId`) |
| Business Logic | Online/offline tracking (30s removal window) |
| Business Logic | Embed caching (4h TTL) |
| Business Logic | Pinned message carousel navigation |
| Business Logic | Unread count tracking (3 levels) |
| Business Logic | Chat fee system (ChatFeeType enum, isChatEnabled check) |
| Business Logic | Message pagination (reverse + forward) |
| Business Logic | Reply message state |
| Business Logic | Template state |
| Business Logic | Mass messaging (send, schedule, unsend) |
| Business Logic | Shared content / media gallery |
| Shimmers | ChatBubblesShimmer, ChatListShimmer |

---

## DIFFERENCES — STATE STRUCTURE

| Aspect | Core (knky-frontend) | Agency (knky-agency-frontend) |
|--------|---------------------|-------------------------------|
| State shape | Flat: `state.chat.X` | Nested: `state.chat.chatDataByCreator[creatorId].X` |
| Creator scope | Single implicit creator | Multiple explicit creators |
| Selectors | Inline in components | Explicit memoized selectors |
| `completeChatLoading` | Not present | Global loading across all creators |
| `showSharedContent` | In main chat slice | Top-level (not per-creator) |
| `streamMessages` | Present | Not present |
| `promotionMessage` | Present | Not present |
| `messagesSelected` | Present | Not present |
| `hasChatServices` | Present | Not present |
| `isBuyer` | Present | Not present |
| `callToken` | Present | Not present |
| `requestId` | Present | Not present |
| `startedAt` | Present | Not present |

---

## DIFFERENCES — AUTH & TOKENS

| Aspect | Core | Agency |
|--------|------|--------|
| Token source | Single `converseToken` from Redux | Per-creator `chatDataByCreator[id].converseToken` |
| Creator token | Single `creatorToken` in Redux | Per-creator `chatDataByCreator[id].creatorToken` |
| Token renewal | Single renewal | Per-creator renewal loop (`ensureCreatorTokenRenewal`) |
| Token encryption | None (plain) | AES decryption via `KNKY_DECRYPT_KEY` |
| Auth context | User's own token | Agency logs in as each creator separately |

---

## DIFFERENCES — SOCKET

| Aspect | Core | Agency |
|--------|------|--------|
| Socket instances | Single ChatConnection | One per creator (connectionManager Map) |
| `sent_by` in meta | Not set | Always `"agency"` |
| `emp` in meta | Not set | Always `btoa({id, name})` |
| Socket init | Single init on login | Parallel init for all creators |
| Connection manager | Global singleton | `Map<creatorId, ChatSocket>` |

---

## DIFFERENCES — COMPONENTS

| Component | Core | Agency |
|-----------|------|--------|
| AllCreatorsListing | ❌ Not present | ✅ Manages all creator sessions |
| SingleCreatorList | ❌ | ✅ Single-creator fallback |
| DefaultChatBoxScreen | ❌ | ✅ Empty state |
| ChatBubbleContextMenu | Inline JSX | Dedicated component |
| PromotionReceiver | Not separate | Dedicated component |
| useChatServiceStatus | ✅ | ❌ |
| useChatSession | ✅ (GA4) | ❌ |
| useChatNotification | ✅ | ❌ |
| useBlockUser | ❌ | ✅ |

---

## DIFFERENCES — BUSINESS RULES

| Rule | Core | Agency |
|------|------|--------|
| MAX_PIN_ALLOWED | 20 | 5 |
| FLUSH_MS | 100ms | 120ms |
| Permission gating | ❌ | ✅ (`getPermissionType`) |
| Custom fan lists (tabs) | ❌ | ✅ |
| Creator switching | ❌ | ✅ |
| GA4 session tracking | ✅ | ❌ |
| Stream messages | ✅ (live) | ❌ |
| Per-creator localStorage | ❌ | ✅ |

---

## ADAPTER STRATEGY

The micro frontend must expose a single `IPlatformAdapter` interface that abstracts all differences above.

### State Access
```typescript
// Core: flat
store.getState().chat.chatList

// Agency: nested
store.getState().chat.chatDataByCreator[creatorId].chatList

// Abstracted via adapter:
adapter.getChatList()  // handles routing internally
```

### Token Management
```typescript
// Core: single token
config.auth.getToken() → store.getState().chat.converseToken

// Agency: per-creator token
config.auth.getToken() → store.getState().chat.chatDataByCreator[creatorId].creatorToken
```

### Socket Connection
```typescript
// Core: single instance
chatConnection.init()

// Agency: per-creator
connectionManager.get(creatorId).init()
```

### Message Meta
```typescript
// Core: bare meta
{ type: "message", text }

// Agency: enriched meta
{ type: "message", text, sent_by: "agency", emp: btoa(...) }
```

### Pin Limit
```typescript
// Core: 20
// Agency: 5
// → Adapter config: maxPinMessages: 5 | 20
```

---

## RISK AREAS FOR MICRO FRONTEND

1. **State nesting**: The biggest structural difference. The Redux slice must support BOTH flat and nested modes, or the adapter must normalize before dispatch.

2. **Multi-socket management**: Agency's `connectionManager` Map is not trivial to abstract — need to either expose it or wrap it.

3. **Token lifecycle**: Agency's per-creator token renewal loops must be managed externally (by the host app) or internally with a lifecycle hook.

4. **`sent_by: "agency"` injection**: Must happen in the ChatBar/send logic, driven by adapter config.

5. **Pin limit config**: Must be configurable (5 vs 20).

6. **GA4 session tracking**: Core-only feature — must be optional and hook-based.

7. **Stream messages**: Core-only — needs to be a feature flag.

8. **Permission gating**: Agency-only — must be injectable via adapter.

9. **AllCreatorsListing lifecycle**: This component owns the initialization of all creators — its logic must move into the adapter's `initialize()` method.

10. **Custom fan list tabs**: Agency-only tab injection — must be configurable.
