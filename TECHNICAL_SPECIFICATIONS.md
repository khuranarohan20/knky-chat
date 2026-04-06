# Technical Specifications

## Package Dependencies

### @knky-chat/core-chat
```json
{
  "dependencies": {
    "converse.svc-client": "^x.x.x",
    "axios": "^1.x.x"
  },
  "peerDependencies": {},
  "devDependencies": {
    "typescript": "^5.x.x",
    "vitest": "^1.x.x"
  }
}
```

### @knky-chat/business-logic
```json
{
  "dependencies": {
    "@knky-chat/core-chat": "workspace:*"
  },
  "peerDependencies": {},
  "devDependencies": {
    "typescript": "^5.x.x",
    "vitest": "^1.x.x"
  }
}
```

### @knky-chat/chat-ui
```json
{
  "dependencies": {
    "@knky-chat/business-logic": "workspace:*",
    "@radix-ui/react-dialog": "^1.x.x",
    "@radix-ui/react-dropdown-menu": "^2.x.x",
    "@radix-ui/react-scroll-area": "^1.x.x",
    "@radix-ui/react-toast": "^1.x.x",
    "class-variance-authority": "^0.7.x",
    "clsx": "^2.x.x",
    "framer-motion": "^11.x.x",
    "lucide-react": "^0.x.x",
    "react": "^18.x.x",
    "react-dom": "^18.x.x",
    "react-redux": "^9.x.x",
    "redux": "^5.x.x",
    "redux-persist": "^6.x.x",
    "sonner": "^1.x.x",
    "tailwind-merge": "^2.x.x",
    "tailwindcss-animate": "^1.x.x"
  },
  "peerDependencies": {
    "react": "^18.x.x",
    "react-dom": "^18.x.x",
    "redux": "^5.x.x"
  },
  "devDependencies": {
    "@types/react": "^18.x.x",
    "@types/react-dom": "^18.x.x",
    "typescript": "^5.x.x",
    "vite": "^5.x.x"
  }
}
```

### @knky-chat/adapters
```json
{
  "dependencies": {
    "@knky-chat/chat-ui": "workspace:*"
  },
  "peerDependencies": {
    "react": "^18.x.x",
    "react-dom": "^18.x.x",
    "redux": "^5.x.x"
  },
  "devDependencies": {
    "typescript": "^5.x.x",
    "vitest": "^1.x.x"
  }
}
```

## Type Definitions

### Core Types

```typescript
// packages/core-chat/src/types/chat.types.ts
export interface Chat {
  _id: string;
  converse_channel_id: string;
  converse_id: string;
  user_id: string;
  name: string;
  avatar: Media[];
  last_message?: MessageInterface;
  unread_count: number;
  tags: ConverseTagType[];
  is_online: boolean;
  is_shy: boolean;
  is_active: boolean;
  spent_amount: number;
  created_at: string;
  updated_at: string;
}

export interface MessageInterface {
  _id: string;
  channel_id: string;
  sender_id: string;
  text: string;
  media: Media[];
  meta: MetaInterface;
  created_at: string;
  updated_at: string;
  seen_by: Receipt[];
}

export interface MetaInterface {
  converseId?: string;
  channel_id?: string;
  delete_for?: string[];
  pinned?: boolean;
  reply_to?: string;
  mention?: string[];
  // ... other meta fields
}

export interface Receipt {
  user_id: string;
  timestamp: string;
  message_id: string;
}

export enum ConverseTagType {
  FollowerXSubscriber = "FollowerXSubscriber",
  SubscriberXFollower = "SubscriberXFollower",
  ExpiredSubscriber = "ExpiredSubscriber",
  Following = "Following",
  Subscribed = "Subscribed",
  MatchProfile = "MatchProfile",
}
```

### State Types

```typescript
// packages/chat-ui/src/store/types.ts
export interface ChatState {
  chatItemIndex: number;
  chatList: Chat[];
  activeChatId: string | null;
  targetPerson: ChatPerson | null;
  converseToken: string;
  isLoading: boolean;
  isMessagesLoading: boolean;
  activeChatStats: ChatStatsInterface;
  showStats: boolean;
  embeds: any[];
  template: MessageTemplate;
  replyMessage: ReplyMessage | null;
  activeChat: Chat | null;
  seenMessages: ReceiptStore;
  total_unread_count: number;
  completeMessagesByChatId: Record<string, MessageInterface[]>;
  showMediaGallery: [string, boolean];
  creatorToken: string;
  hasMoreMessagesByChatId: Record<string, boolean>;
  totalUnreadChannelCount: number;
  loadingMoreMessages: LoadingMoreMessages;
  focusMessageId?: string;
  focusMessageTime?: string;
  uniqueUnreadCountChannels: Record<string, number>;
  chatTabs: ChatTab[];
  pinMessageIndex: number;
  pinnedMessagesByChatId: Record<string, PinMessageResponse[]>;
  chatListTabs: Record<string, ChatListCountInterface>;
  filter: FilterInterface;
  messagesSelected: string[];
  chatFeeData: Record<string, ChatFeeDataInterface[]>;
  userToChannel: Record<string, string>;
  channelToUser: Record<string, string>;
  offlineList: Record<string, string>;
  showSharedContent: boolean;
}
```

## Component Props Interfaces

```typescript
// packages/chat-ui/src/components/ChatBox/types.ts
export interface ChatBoxProps {
  className?: string;
  onSendMessage?: (message: SendMessageParams) => void;
  onMessageEdit?: (messageId: string, newText: string) => void;
  onMessageDelete?: (messageId: string) => void;
  onPinMessage?: (messageId: string) => void;
  onUnpinMessage?: (messageId: string) => void;
  showPinnedMessages?: boolean;
  theme?: 'bootstrap' | 'tailwind';
}

export interface ChatBubblesProps {
  messages: MessageInterface[];
  loading?: boolean;
  hasMore?: boolean;
  onLoadMore?: (direction: 'up' | 'down') => void;
  focusMessageId?: string;
  onMessageClick?: (message: MessageInterface) => void;
  onMessageLongPress?: (message: MessageInterface) => void;
}

export interface MessageBubbleProps {
  message: MessageInterface;
  isMine: boolean;
  showAvatar?: boolean;
  showTimestamp?: boolean;
  showSeen?: boolean;
  theme?: 'bootstrap' | 'tailwind';
}
```

## Hook Interfaces

```typescript
// packages/chat-ui/src/hooks/useChat/types.ts
export interface UseChatReturn {
  messages: MessageInterface[];
  sendMessage: (params: SendMessageParams) => Promise<void>;
  editMessage: (messageId: string, newText: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  pinMessage: (messageId: string) => Promise<void>;
  unpinMessage: (messageId: string) => Promise<void>;
  markSeen: (messageId: string) => Promise<void>;
  loadMoreMessages: (direction: 'up' | 'down') => Promise<void>;
  loading: boolean;
  error: Error | null;
}

export interface UseChatSocketReturn {
  connected: boolean;
  connecting: boolean;
  error: Error | null;
  disconnect: () => void;
  reconnect: () => Promise<void>;
}

export interface UseMessageSendParams {
  channelId: string;
  text?: string;
  media?: Media[];
  meta?: Partial<MetaInterface>;
  replyTo?: string;
}
```

## Adapter Interfaces

```typescript
// packages/adapters/src/types/platform-adapter.types.ts
export interface IPlatformAdapter {
  readonly platformType: 'core' | 'agency';
  readonly config: PlatformConfig;

  // State management
  getState(): ChatState;
  dispatch(action: AnyAction): void;
  subscribe(listener: () => void): Unsubscribe;

  // API integration
  getChannelId(userId: string): Promise<ChannelIdResponse>;
  getChatList(params: ChatListParams): Promise<ChatListResponse>;
  getChannelMessages(params: GetMessagesParams): Promise<MessagesResponse>;

  // Authentication
  getToken(): Promise<string>;
  verifyToken(token: string): Promise<boolean>;

  // Theming
  getTheme(): Theme;
  applyTheme(theme: Theme): void;

  // Lifecycle
  initialize(): Promise<void>;
  destroy(): void;
}

export interface PlatformConfig {
  apiEndpoint: string;
  converseProjectId: string;
  converseHost: string;
  theme: 'bootstrap' | 'tailwind';
  features: {
    multiCreatorSupport: boolean;
    advancedFilters: boolean;
    statistics: boolean;
    sharedContent: boolean;
  };
  auth: {
    getToken(): Promise<string>;
    verifyToken(token: string): Promise<boolean>;
  };
}

export interface CorePlatformConfig extends PlatformConfig {
  platformType: 'core';
  features: PlatformConfig['features'] & {
    multiCreatorSupport: false;
  };
}

export interface AgencyPlatformConfig extends PlatformConfig {
  platformType: 'agency';
  features: PlatformConfig['features'] & {
    multiCreatorSupport: true;
    creatorId: string;
  };
}
```

## Redux Slice Structure

```typescript
// packages/chat-ui/src/store/chat.slice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export const chatSlice = createSlice({
  name: 'chat',
  initialState: initialChatState,
  reducers: {
    // Chat list operations
    setChatList: (state, action: PayloadAction<Chat[]>) => {
      state.chatList = action.payload;
    },
    setActiveChatId: (state, action: PayloadAction<string | null>) => {
      state.activeChatId = action.payload;
    },

    // Message operations
    addMessage: (state, action: PayloadAction<{channelId: string, message: MessageInterface}>) => {
      const { channelId, message } = action.payload;
      if (!state.completeMessagesByChatId[channelId]) {
        state.completeMessagesByChatId[channelId] = [];
      }
      state.completeMessagesByChatId[channelId].push(message);
    },
    updateMessage: (state, action: PayloadAction<{channelId: string, messageId: string, updates: Partial<MessageInterface>}>) => {
      const { channelId, messageId, updates } = action.payload;
      const messages = state.completeMessagesByChatId[channelId];
      if (messages) {
        const index = messages.findIndex(m => m._id === messageId);
        if (index !== -1) {
          messages[index] = { ...messages[index], ...updates };
        }
      }
    },

    // Seen operations
    markMessageSeen: (state, action: PayloadAction<{channelId: string, messageId: string}>) => {
      const { channelId, messageId } = action.payload;
      const messages = state.completeMessagesByChatId[channelId];
      if (messages) {
        const message = messages.find(m => m._id === messageId);
        if (message) {
          // Update seen status
        }
      }
    },

    // Pin operations
    setPinMessages: (state, action: PayloadAction<{channelId: string, messages: PinMessageResponse[]}>) => {
      const { channelId, messages } = action.payload;
      state.pinnedMessagesByChatId[channelId] = messages;
    },

    // Loading states
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setMessagesLoading: (state, action: PayloadAction<boolean>) => {
      state.isMessagesLoading = action.payload;
    },

    // Statistics
    setTotalUnreadCount: (state, action: PayloadAction<number>) => {
      state.total_unread_count = action.payload;
    },
  },
});
```

## Component Styling Strategy

### Tailwind + shadcn Base Classes

```typescript
// packages/chat-ui/src/styles/tailwind-variants.ts
import { cva, type VariantProps } from 'class-variance-authority';

export const chatBubbleVariants = cva(
  "max-w-[70%] p-3 rounded-2xl break-words",
  {
    variants: {
      variant: {
        sent: "bg-primary text-white rounded-br-md",
        received: "bg-gray-100 text-gray-900 rounded-bl-md",
      },
      size: {
        small: "text-sm",
        medium: "text-base",
        large: "text-lg",
      },
    },
    defaultVariants: {
      variant: "received",
      size: "medium",
    },
  }
);

export type ChatBubbleVariants = VariantProps<typeof chatBubbleVariants>;
```

### Bootstrap Compatibility Layer

```typescript
// packages/chat-ui/src/styles/bootstrap-overrides.ts
export const bootstrapClassMap = {
  container: 'd-flex flex-column h-100',
  chatBox: 'd-flex flex-grow-1 flex-column',
  messageList: 'd-flex flex-column overflow-auto',
  inputArea: 'd-flex align-items-center gap-2 p-3',
};

export const getBootstrapClasses = (component: keyof typeof bootstrapClassMap) => {
  return bootstrapClassMap[component];
};
```

## Testing Strategy

### Unit Tests

```typescript
// packages/core-chat/src/__tests__/ChatConnection.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChatConnection } from '../ChatConnection';

describe('ChatConnection', () => {
  let chatConnection: ChatConnection;

  beforeEach(() => {
    chatConnection = new ChatConnection();
  });

  it('should initialize converse connection', async () => {
    await chatConnection.init();
    expect(chatConnection.isConnected).toBe(true);
  });

  it('should send message', async () => {
    const message = {
      channelId: 'test-channel',
      text: 'Hello',
    };
    await chatConnection.sendMessage(message);
    // Assert message was sent
  });

  it('should handle connection errors', async () => {
    // Mock connection error
    const initPromise = chatConnection.init();
    await expect(initPromise).rejects.toThrow();
  });
});
```

### Integration Tests

```typescript
// packages/adapters/src/__tests__/CoreAdapter.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { CoreAdapter } from '../CoreAdapter';

describe('CoreAdapter Integration', () => {
  let adapter: CoreAdapter;

  beforeEach(() => {
    adapter = new CoreAdapter({
      apiEndpoint: 'http://localhost:3000',
      converseProjectId: 'test-project',
      converseHost: 'ws://localhost:8080',
      theme: 'tailwind',
      features: {
        multiCreatorSupport: false,
        advancedFilters: true,
        statistics: true,
        sharedContent: true,
      },
      auth: {
        getToken: async () => 'test-token',
        verifyToken: async () => true,
      },
    });
  });

  it('should initialize correctly', async () => {
    await adapter.initialize();
    expect(adapter.getState()).toBeDefined();
  });

  it('should fetch chat list', async () => {
    const chats = await adapter.getChatList({ page: 1, limit: 10 });
    expect(Array.isArray(chats)).toBe(true);
  });
});
```

## Performance Optimizations

### 1. Virtual Scrolling
- Use `@tanstack/react-virtual` for chat lists
- Implement windowed rendering for messages
- Lazy loading of bubble components

### 2. Memoization
- Use `React.memo` for expensive components
- Implement custom comparison functions
- Memoize computed values with `useMemo`

### 3. Code Splitting
- Dynamic imports for bubble variations
- Lazy load platform-specific adapters
- Split vendor bundles

### 4. State Optimization
- Use Redux Toolkit's `createSlice` for efficient updates
- Implement immer for immutable state updates
- Use selectors for derived state

## Browser Support

| Browser | Minimum Version | Notes |
|---------|----------------|-------|
| Chrome | 90+ | Full support |
| Firefox | 88+ | Full support |
| Safari | 14+ | Full support |
| Edge | 90+ | Full support |
| Mobile Safari | 14+ | Full support |
| Chrome Mobile | 90+ | Full support |

## Accessibility Standards

- WCAG 2.1 Level AA compliant
- Keyboard navigation support
- Screen reader support (ARIA attributes)
- Focus management
- High contrast mode support
- Reduced motion support
