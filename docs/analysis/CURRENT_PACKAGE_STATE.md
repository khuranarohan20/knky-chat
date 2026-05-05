# Current State of knky-chat Packages

> As of: 2026-05-05
> Branch: master

---

## Git Status Summary

- `packages/core-chat/src/types/index.ts` — Modified (TypeScript fixes in progress)
- `packages/core-chat/dist/` — Untracked (build output, not committed)
- `packages/core-chat/tsconfig.tsbuildinfo` — Untracked

---

## Package Completion Status

### `@knky-chat/core-chat`
**Status: ~80% complete**

What exists:
- `ChatConnection.ts` — socket management class
- `api/chat-api.ts` — API client
- `utils/chat-list-sort.ts` — sorting utilities
- `utils/message-utils.ts` — message helpers
- `utils/receipt-utils.ts` — receipt helpers
- `types/chat.types.ts` — core types
- `types/message.types.ts` — message types
- `types/index.ts` — unified exports (currently has TS errors)

What's missing:
- Unit tests
- Type versioning strategy
- Full MetaInterface (the current types are simplified)

**Critical fix needed**: TypeScript compilation errors in `types/index.ts`

---

### `@knky-chat/business-logic`
**Status: ~70% complete (scaffolded, not verified)**

What exists:
- `core/CoreChatManager.ts`
- `core/CoreStateAdapter.ts`
- `agency/AgencyChatManager.ts`
- `agency/AgencyStateAdapter.ts`
- `shared/MessageHandler.ts`
- `shared/SeenManager.ts`
- `shared/PinManager.ts`

What's missing:
- Integration tests
- Mock implementations for testing
- Actual connection to real Redux store

---

### `@knky-chat/chat-ui`
**Status: ~60% complete (scaffolded)**

What exists (claimed in docs):
- ChatBox, ChatBubbles, ChatBar, ChatList — skeletons
- hooks: useChat, useChatSocket, useMessageSend, useSeenManager
- store/chat.slice.ts — Redux slice

What's actually needed (based on real code analysis):
- Full MetaInterface rendering (15+ message types)
- Real Virtuoso integration
- Complete seen receipt system
- All bubble variations (VideoVoice, Rating, Tip, CustomRequest, StoryReply, etc.)
- MediaGallery
- ChatStats
- Shimmers
- ChatBar with audio recording, media upload, vault selection
- ChatListTabs with custom fan list support
- ChatListFilters (read/fan/spend)
- ChatPerson header

The current UI skeleton is far from the complexity of the real implementations.

---

### `@knky-chat/adapters`
**Status: ~50% complete (interfaces defined, implementations shallow)**

What exists:
- `IPlatformAdapter` interface
- `CoreAdapter` — basic implementation
- `AgencyAdapter` — basic implementation

What's missing:
- Multi-socket connection manager in AgencyAdapter
- Token renewal lifecycle
- `sent_by: "agency"` meta injection
- Per-creator state initialization
- `AllCreatorsListing`-equivalent logic
- State integration with real Redux store
- Creator switching with socket reconnection

---

## Critical Gaps (Blocking Issues)

1. **TypeScript compilation fails** in `core-chat` — nothing can build until fixed
2. **Types are simplified** — real MetaInterface has 40+ fields; current types miss most
3. **No Redux store** wired to anything real — hooks exist but connect to nothing
4. **No Virtuoso integration** — message list performance depends on this
5. **No actual Converse SDK integration** tested end-to-end
6. **Agency multi-socket not implemented** — biggest structural gap

---

## What Must Be Built From Scratch (not in current packages)

- Complete `MetaInterface` with all 40+ fields from real code
- `AgencyChatManager.switchCreator()` with socket reconnect
- Connection manager (`Map<creatorId, ChatSocket>`)
- Token renewal loop (per creator for agency)
- `AllCreatorsListing` equivalent in AgencyAdapter
- `useChatServiceStatus` hook (chat fee gating)
- `useChatSession` hook (GA4 tracking — optional/pluggable)
- `ChatBubbleContextMenu` component
- All 15 bubble variation components (fully ported)
- Real Virtuoso-backed ChatBubbles with BASE offset
- Seen receipt batching with FLUSH_MS debounce
- Online/offline tracking with 30s removal
- Media gallery with all 5 tabs
- ChatBar with audio recording, media fee modal, vault picker
- Mass message UI components
- Custom fan list tab support
