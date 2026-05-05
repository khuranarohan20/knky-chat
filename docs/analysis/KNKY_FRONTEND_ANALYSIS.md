# knky-frontend Chat System — Complete Technical Analysis

> Source: `/Users/admin/Desktop/Development/knky-frontend`
> Platform: Next.js + Bootstrap + Redux Toolkit
> Role: Single-creator chat (creator ↔ fans)

---

## 1. REDUX STATE — Full ChatState Shape

```typescript
interface ChatState {
  // Navigation
  chatItemIndex: number;
  chatList: Chat[];
  activeChatId: string | null;
  activeChat: Chat | null;
  targetPerson: ChatPerson | null;

  // Messages
  completeMessagesByChatId: Record<string, MessageInterface[]>;
  total_unread_count: number;
  uniqueUnreadCountChannels: Record<string, number>;
  totalUnreadChannelCount: number;
  messagesSelected: string[];
  loadingMoreMessages: { upwards: boolean; downwards: boolean };
  focusMessageId?: string;
  focusMessageTime?: string;
  hasMoreMessagesByChatId: Record<string, boolean>;

  // Pinned
  pinMessageIndex: number;
  pinnedMessagesByChatId: Record<string, PinMessageResponse["pinnedMsg"][]>;

  // Receipts
  seenMessages: ReceiptStore; // {[channelId]: {[messageId]: {[userId]: Receipt}}}

  // Tabs
  chatTabs: { title: string; is_enabled: boolean; _id: string; users_count: number }[];
  chatListTabs: Record<string, ChatListCountInterface>;

  // Filtering
  filter: FilterInterface;

  // Monetization
  chatFeeData: Record<string, ChatFeeDataInterface[]>;
  hasChatServices: boolean;
  isBuyer: boolean;
  template: { message: string; vault_media_ids?: Media[]; price?: number };

  // Media
  showMediaGallery: [string, boolean]; // [channelId, isOpen]
  showSharedContent: boolean;
  embeds: any[];

  // Streaming
  streamMessages: any[]; // max 200
  promotionMessage?: MessageInterface;

  // Compose State
  replyMessage: { message: MessageInterface; channel_id: string } | null;

  // Tokens
  converseToken: string;
  creatorToken: string;
  callToken: string;
  requestId?: string;
  startedAt?: string;

  // Loading
  isLoading: boolean;
  isMessagesLoading: boolean;

  // Stats
  activeChatStats: ChatStatsInterface;
  showStats: boolean;

  // Lookup Maps
  userToChannel: Record<string, string>;
  channelToUser: Record<string, string>;
  offlineList: Record<string, string>; // userId → ISO timestamp

  // Extra
  hasChatServices: boolean;
  isBuyer: boolean;
}
```

### ChatSession State (separate slice)

```typescript
interface ChatSessionState {
  sessions: Record<string, ChatSession>;
  inactivityTimeoutMs: number; // 90_000
}
interface ChatSession {
  chatId: string;
  creatorId: string;
  startTime: number;
  lastInteractionTime: number;
  messages: { total: number; sender: number; receiver: number };
  interactions: { mediaOpened: number; serviceClicks: number; tipInteractions: number };
  isActive: boolean;
}
```

---

## 2. CORE TYPE: Chat

```typescript
interface Chat {
  _id: string;
  target: ChatPerson;
  initiator: ChatPerson;
  converse_channel_id: string;
  unreadCount: number;
  message: MessageInterface;         // Last message
  lastmessage: string | { message: string };
  is_subscriber?: boolean;
  is_subscribed?: boolean;
  is_following?: boolean;
  is_matched?: boolean;
  package?: { type: keyof typeof SubscriptionPlans };
  free_perks?: { type: "FREE-SUB-CHAT"; expires_on: string };
  notes?: Record<string, string>;
  buyers: BuyerInterface[];
  payment_reminder: boolean;
  complete_messages: MessageInterface[];
  converse_consumable: { buyer: string; available_message: number; _id: string }[];
  is_pinned?: Record<string, boolean>; // [creatorId]: true
  tags: string[];                     // ConverseTagType[]
  total_spent: Record<string, number>;
  mark_as_unread: boolean;
  lastHumanMessage?: MessageInterface;
  lastNonHumanMessage?: MessageInterface;
  totalSpentAmount: number;
  latest_payment_msg_timestamp?: Record<string, string>;
  lastSeenMessage?: MessageInterface;
}
```

---

## 3. CORE TYPE: MessageInterface

```typescript
interface MessageInterface {
  _id: string;
  messageId: string;
  channel_id: string;
  sender_id: string;
  message: string;
  url: string;
  og_msg: string;
  name: string;
  meta: MetaInterface;
  isHuman: boolean;
  sid?: string;
  message_deleted_by: string[];
  reactions: any[];
  createdAt: string;
  updatedAt: string;
  receipts: Receipt[];
  seen_count: number;
  tags: string[];
}
```

---

## 4. CORE TYPE: MetaInterface (exhaustive)

```typescript
interface MetaInterface {
  // Discriminator
  type: "ACCEPT_CALL" | "RATING" | "VIDEO" | "VOICE" | "message" |
        "direct-message" | "auto-message" | "chat-unlock" |
        "message-attachment" | "stream" | "story-reply" | "SENT-TIP" |
        "CUSTOM-SERVICE" | "SET-PRICE" | "EMBEDS" | "MASS-MESSAGE" |
        "TAG-APPROVAL" | "NEW-PAYMENT";
  sub_type?: "POST" | "PRODUCT" | "CHANNEL" | "GROUP" | "VAULT";
  subtype?: "VIDEO" | "VOICE" | "RATING" | "CUSTOM-SERVICE" | "";

  // Service Requests
  reqId: string;
  requestAccept?: true | false | "sent";
  entity_id?: string;

  // Media
  media?: Media | Media[];
  media_fee?: number;
  is_unlocked?: boolean;

  // Pricing
  amount?: number | string;
  price?: number;
  paid?: boolean;
  counter_offer_price?: number;
  counter_status?: "pending" | "accepted" | "rejected";
  counter_offer_accepted?: boolean;
  offered_amount?: number;
  free_service?: boolean;

  // Rating/Video/Voice
  ratingType?: string;
  rateText?: string;
  stars?: number;
  duration?: number;
  is_flexible?: boolean;

  // Service
  serviceData?: GetServiceResponse;
  serviceId?: string;
  hasSetPrice?: boolean;

  // Story
  story_id?: string;
  story_data?: StoryMedia;

  // Discount
  has_discount?: boolean;
  discount?: { discount_type: "percentage" | "amount"; discount_value: number };

  // Address (physical orders)
  address?: { transaction_id: string; street: string; city: string; state: string; zip_code: string; country: string };

  // Metadata
  author?: string;
  name: string;
  displayName?: string;
  replyMessage?: MessageInterface;
  reactions?: { emote: string; userId: string; channel_id?: string }[];
  emp?: string; // base64({id, name})

  // Flags
  delete_for?: string;
  forward?: boolean;
  partial_accept?: boolean;
  is_audio?: boolean;
  paid_by?: string;
  is_mass_message?: true;
  isCompleted?: boolean;

  // Links
  url?: string;
  token?: string;
  expiry_date?: string;

  // Request context
  request_note?: string;
  custom_info?: string;
  converseId?: string;
  avatar?: any[];
  title?: string;
  chat_list_message?: string;
  entity_type?: "channel" | "collab";
  channel_name?: string;
  channel_id?: string;
  tag_name?: string;
  subscription_type?: string;
  sent_by?: "agency" | "creator";
  transaction_id?: string;
  buyers?: BuyerInterface;
}
```

---

## 5. ALL REDUX ACTIONS

```
// Chat list
setChatList({ creatorId, chatList, senderId?, chatId?, inject?, queryUser?, userRole })
setChatListTabs(Record<string, ChatListCountInterface>)
editChatListTabs({ channelId, tabs?, task, count? })

// Active chat
setActiveChat({ chatId, chat? })

// Messages
setCompleteMessages({ chatId, messages, add_to_list? })
appendMessages({ chatId, messages })
prependMessages({ chatId, messages })
addMessage({ chatId, message, senderId, creatorId, userRole, channel, isHuman })
editMessage({ chatId, message })
deleteMessage({ chatId, messageId, creatorId, userRole })

// Navigation
jumpToMessage({ chatId, messageId, messageTime })
clearFocusMessage()

// Pinning
setPinMessages({ channelId, messages })
setPinMessageIndex(index)

// Reply
setReplyMessage({ message | null, channelId })

// Template
setTemplate({ message, vault_media_ids?, price? })

// Tabs
setChatTabs({ tabs })

// Media Gallery
setMediaGallery({ value, channelId })

// Loading
setIsLoading({ value })
setIsMessagesLoading({ value })
setLoadingMoreMessages({ direction, value })

// Stats
setActiveChatStats({ stats })

// Unread
setTotalUnreadCount({ count })
setUniqueUnreadChannels({ channels })
setTotalUnreadChannelCount({ count })
setUniqueUnreadChannelsWithActions({ action, channelId })

// Tokens
setConverseToken(token)
setCallToken({ token })
setRequestId({ requestId })
setStartedAt({ startedAt })
setExtraData({ hasChatFeeServices?, isBuyer? })

// Streaming
setPrevStreamChatMsgs(messages)
setStreamChat(message)
clearStreamChat()

// Promo
setPromotionMessage(message)

// Filtering
setFilters(FilterInterface)
setMessagesSelected({ messageIds, append?, remove?, unset? })

// Chat Fee
setChatFeeData({ channelId, chatFeeData })

// Members
setConverseMembersList(ConversePair[])

// Online
setOfflineList({ value: { userId, timestamp? }, remove? })

// Shared Content
setShowSharedContent(value)

// Reset
resetChatState()
```

---

## 6. SOCKET EVENTS (Converse SDK)

### Initialization Flow
```
RequestConverseToken() / VerifyConverseToken()
  → Converse.init({ projectId, converseToken, serverUrl })
  → Converse.connectProject() → project instance
  → setupProjectListeners()
```

### Project-Level Listeners
| Event | Payload |
|-------|---------|
| `listenNewMessage` | `{ message, message.meta.converseId: channelId }` |
| `listenEditMessage` | `{ channelId, message, messageId, meta }` |
| `listenUserOnline` | `{ userId }` |
| `listenUserOffline` | `{ userId }` |

### Channel-Level Listeners
| Event | Payload |
|-------|---------|
| `listenMessage` | `MessageInterface` |
| `listenCheckMoreMessage` | `{ haveMoreMessage: boolean }` |
| `listenEditMessage` | `MessageInterface` |
| `listenMessageDelete` | `MessageInterface` |
| `listenMessageDeleteMe` | `MessageInterface` |
| `listenSeenMessage` | `{ messageId, receipt: Receipt }` |
| `listenSeenAllMessage` | `{ firstUnSeenMessage: string }` |
| `listenPinMessage` | `PinMessageResponse` |
| `listenUnPinMessage` | `{ pinId: string }` |
| `listenTyping` | `{ uid, name }` |
| `listenStopTyping` | `{ uid, name }` |

### Channel Methods (emit)
```
channel.sendMessage({ message, meta })
channel.getMessages({ time?, reversePaginate?, fetchAll? })
channel.getMessagesReceipts()
channel.checkMoreMessage({ time })
channel.seenMessage([{ messageId, senderId }])
channel.seenMessageAll({ time: ISO8601 })
channel.addPinMessage({ messageId, forAll })
channel.unPinMessage({ messageId, pinId, forAll })
channel.getPinnedMessages({ limit, page })
```

---

## 7. API ENDPOINTS

```
GET  /users/chat/get-converse-channel         Chat list (page, limit, filters)
GET  /users/fetch-pinned-converse-channel      Pinned chats
GET  /users/request-converse-token             Socket token
POST /users/verify-converse-token              Validate token
GET  /users/get-converse-channel/:userId       Single chat
GET  /users/services                           Chat fee services (user_id, chat_fee_type)
POST /users/generate-signed-urls               Asset URLs
POST /users/generate-chat-signed-urls          Chat media URLs
GET  /users/chat-stats                         User spending (userId)
PATCH /users/update-notes                      Save notes (userId, notes)
POST /users/chat-media                         Send media message
POST /users/share-entities                     Share posts/channels
POST /requests/calls-and-ratings               Request service (FormData)
PUT  /requests/respond-to-request/:reqId       Accept/decline service
POST /users/mass-message                       Mass message
GET  /users/mass-message                       History
PATCH /users/mass-message/:id                  Edit scheduled
DELETE /users/mass-message/:id                 Delete scheduled
POST /users/mass-message/unsend                Unsend (UNSEEN | UNPAID)
POST /users/mass-message/distinct-count        Count recipients
GET  /users/chat/fetch-chat-media              Shared content
GET  /users/search-converse-channel            Search chats
GET  /users/get-converse-channel-detail/:id    Chat details
PATCH /users/update-converse-note/:channelId   Pin / add note
DELETE /users/delete-converse-channel/:id      Delete chat
GET  /users/chat/get-coverse-members           Channel members
PATCH /users/chat/update-payment-timestamp     Clear payment badge
GET  /handler/transactions/user-to-user        Transaction history
POST /users/purchase-chat-media                Purchase locked media
```

---

## 8. COMPONENT TREE

```
ChatPage (/app/(user)/chat/page.tsx)
├── ChatList
│   ├── ChatListTabs
│   ├── ChatListFilters
│   ├── Search UI
│   └── ChatListItem (per chat, context menu)
│
└── ChatBox (chat/index.tsx)
    ├── ChatHeader
    ├── PinnedMessages carousel
    ├── ChatBubbles (Virtuoso)
    │   ├── DateSeparator
    │   └── SingleMessage
    │       ├── RenderMessage (polymorphic router)
    │       │   ├── VideoVoiceReceiver / VideoVoiceSender
    │       │   ├── RatingRequestNew
    │       │   ├── MessageAttachment
    │       │   ├── SentTip
    │       │   ├── ChatEmbeds
    │       │   ├── SetPrice
    │       │   ├── JoinCallBtn
    │       │   ├── CustomRequest
    │       │   ├── PromotionSender / PromotionReceiver
    │       │   ├── StoryReply
    │       │   └── NewPayment
    │       └── BubbleTime (receipt icons)
    ├── ChatFeeBanner
    ├── ChatBar
    │   ├── Textarea
    │   ├── Media upload
    │   ├── ServicesBtn
    │   ├── MediaFeeModal
    │   ├── AudioRecordModal
    │   └── EditMediaModal
    └── ChatStats drawer
```

---

## 9. MESSAGE TYPE ROUTING

| meta.type | Render Component | Notes |
|-----------|-----------------|-------|
| `VIDEO` | VideoVoiceReceiver/Sender | duration, price |
| `VOICE` | VideoVoiceReceiver/Sender | duration, price |
| `RATING` | RatingRequestNew | stars, rateText |
| `CUSTOM-SERVICE` | CustomRequest Receiver/Sender | request_note, price |
| `ACCEPT_CALL` | JoinCallBtn | isCompleted flag |
| `SENT-TIP` | SentTip | amount, paid_by |
| `message-attachment` | MessageAttachment | media[] carousel |
| `MASS-MESSAGE` | MessageAttachment | is_mass_message |
| `story-reply` | StoryReply | story_id, story_data |
| `EMBEDS` | ChatEmbeds | entity_id, sub_type |
| `SET-PRICE` | SetPrice | price, media_fee |
| `NEW-PAYMENT` | NewPayment | transaction_id |
| `TAG-APPROVAL` | TagApproval | tag_name |
| `message` / `direct-message` | RenderMessage | plain text |
| `auto-message` | RenderMessage | isHuman=false |

---

## 10. HOOKS

### `useChatSession()`
- Tracks session lifecycle (start/end/inactivity)
- Sends GA4 `chat_session_summary` on session end
- 90s inactivity timeout
- Tracks: messages sent/received, media opened, service clicks, tip interactions, scroll

### `useChatServiceStatus({ targetUser, currentUserId, activeChat })`
- Returns: `{ loading, hasChatServices, isBuyer, freePerksActive, freeChat }`
- Checks `converse_consumable`, `buyers`, `free_perks`, then API

### `useShowChat()`
- Returns: `{ openChat(channelId) }`
- Flow: queue → load from list or API → connect socket → clear unread → set active chat

### `useChatNotification(prevMessages, currMessages)`
- Listens EventBridge for `ChatMessageUpdate` notifications
- Updates meta fields on existing messages

---

## 11. BUSINESS LOGIC

### Chat Fee System
```
ChatFeeType: OneOff | Minute | Hour | Day | Week | Month | PerMessage | Free

isChatEnabled = hasChatServices ∨ isBuyer ∨ freePerksActive ∨ freeChat

If not enabled → SubscriptionPrompt with:
  - Channel subscription options
  - Chat fee purchase options
```

### Seen Receipt Flow
```
1. Range change detected → add messages to seenQueue
2. Debounced 100ms → channel.seenMessage([...])
3. listenSeenMessage fires → update message.receipts in Redux
4. BubbleTime renders ✓✓ icon
```

### Pinning (MAX 20 per channel)
```
- Carousel at top, 1 message visible
- Click jumps to message (jumpToMessage action)
- Arrows cycle, dots show position
```

### Filtering
```
readStatus: "read" | "unread" | "online"
conversationStatus: "active" (lastHumanMessage) | "shy" (auto-message only)
fanType: ConverseTagType[]
spendRanks: { min, max } | "all"
Sort: pinned first, then by latest message timestamp
```

### Unread Count
```
Increment: new message from different sender + not currently viewing channel
Decrement: rangeChanged scroll callback → seenMessage API → receipt update
Mark as unread: mark_as_unread flag via AddNotesToChat API
```

### Creator vs User Roles
| Aspect | Creator | User |
|--------|---------|------|
| Chat filters | Full (read/unread/active/shy) | None |
| Stats panel | Yes | No |
| Can pin | Yes (MAX 20) | No |
| Online filter | Yes | No |
| Chat fees | Receives | Pays |
| Service requests | Receives | Sends |
| Message limits | Unlimited | Per-message limit possible |

---

## 12. EDGE CASES & GOTCHAS

1. **Message ID inconsistency**: Use `_id || messageId` — both field names exist
2. **Receipt field inconsistency**: `receipt.userId || receipt.user_id` — both exist
3. **Template leaks across chats**: Must manually clear setTemplate on chat switch
4. **Stream messages capped at 200**: Oldest shift out (display-only, not persisted)
5. **Chat fee cache not invalidated on subscription change**: Potential stale data bug
6. **Focus message flash**: 3s highlight timeout must clear; can fail if Virtuoso index unmapped
7. **Online filter needs socket room join**: `listenOnlineUsersRoom` required
8. **Unread divider shows once per 5s**: Ref-tracked to prevent re-render loops
9. **Deleted messages**: `meta.delete_for` hides (soft); `listenMessageDelete` removes (hard)
10. **Virtuoso BASE offset = 2,000,000**: Prevents negative indices on prepend

---

## 13. CONSTANTS

```
MAX_PIN_ALLOWED: 20
FLUSH_MS: 100 (receipt debounce)
SESSION_INACTIVITY: 90_000ms
MESSAGE_FETCH_LIMIT: 50
CHAT_LIST_FETCH_LIMIT: 50
VIRTUOSO_BASE: 2_000_000
```
