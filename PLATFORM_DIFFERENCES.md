# Platform Differences & Adapter Strategy

## Core vs Agency Platform Comparison

This document outlines the key differences between the core (knky-frontend) and agency (knky-agency-frontend) platforms and how the adapter pattern handles them.

## 1. State Management Differences

### Core Platform (knky-frontend)

```typescript
// Single flat state structure
interface ChatState {
  chatList: Chat[];
  activeChatId: string | null;
  completeMessagesByChatId: {
    [chatId: string]: MessageInterface[];
  };
  total_unread_count: number;
  // ... other properties
}

// Direct store access
const messages = store.getState().chat.completeMessagesByChatId[channelId];
```

### Agency Platform (knky-agency-frontend)

```typescript
// Nested state structure with creator isolation
interface ChatState {
  currentCreatorId: string | null;
  chatDataByCreator: {
    [creatorId: string]: {
      chatList: Chat[];
      activeChatId: string | null;
      completeMessagesByChatId: {
        [chatId: string]: MessageInterface[];
      };
      total_unread_count: number;
      // ... other properties
    };
  };
}

// Store access with creator isolation
const messages = store.getState().chat
  .chatDataByCreator[creatorId]?.completeMessagesByChatId[channelId] || [];
```

### Adapter Solution

```typescript
// Unified interface
interface IChatStateAdapter {
  getMessages(channelId: string): MessageInterface[];
  addMessage(channelId: string, message: MessageInterface): void;
  markSeen(channelId: string, messageId: string): void;
  // ... other operations
}

// Core implementation
class CoreStateAdapter implements IChatStateAdapter {
  getMessages(channelId: string): MessageInterface[] {
    return this.store.getState().chat.completeMessagesByChatId[channelId] || [];
  }
}

// Agency implementation
class AgencyStateAdapter implements IChatStateAdapter {
  getMessages(channelId: string): MessageInterface[] {
    return this.store.getState().chat
      .chatDataByCreator[this.creatorId]?.completeMessagesByChatId[channelId] || [];
  }
}
```

## 2. Authentication Differences

### Core Platform

```typescript
// Single token for all chats
const converseToken = store.getState().chat?.converseToken;

// Token request
const response = await RequestConverseToken();
```

### Agency Platform

```typescript
// Token per creator
const converseToken = store.getState().chat?.chatDataByCreator[creatorId]?.creatorToken;

// Token request with creator context
const response = await RequestConverseToken({ creatorId });
```

### Adapter Solution

```typescript
interface PlatformConfig {
  auth: {
    getToken(): Promise<string>;
    verifyToken(token: string): Promise<boolean>;
  };
}

// Core adapter config
const coreConfig = {
  auth: {
    getToken: async () => {
      return store.getState().chat?.converseToken || '';
    }
  }
};

// Agency adapter config
const agencyConfig = {
  auth: {
    getToken: async () => {
      return store.getState().chat?.chatDataByCreator[this.creatorId]?.creatorToken || '';
    }
  }
};
```

## 3. API Endpoint Differences

### Core Platform

```typescript
// Single API base
const API_BASE = process.env.NEXT_PUBLIC_API_URL;

// Direct API calls
const chats = await getChatUserList({ page: 1, limit: 10 });
```

### Agency Platform

```typescript
// Multiple API bases (creator-specific)
const API_BASE = import.meta.env.VITE_API_URL;

// API calls with creator context
const chats = await GetChatList({
  page: 1,
  limit: 10,
  token: creatorToken
});
```

### Adapter Solution

```typescript
interface IChatApiClient {
  getChatList(params: ChatListParams): Promise<ChatListResponse>;
  getChannelMessages(params: GetMessagesParams): Promise<MessagesResponse>;
  // ... other methods
}

// Core API client
class CoreChatApiClient implements IChatApiClient {
  async getChatList(params: ChatListParams): Promise<ChatListResponse> {
    return await getChatUserList(params);
  }
}

// Agency API client
class AgencyChatApiClient implements IChatApiClient {
  async getChatList(params: ChatListParams): Promise<ChatListResponse> {
    return await GetChatList({
      ...params,
      token: await this.config.auth.getToken()
    });
  }
}
```

## 4. Socket Initialization Differences

### Core Platform

```typescript
// Initialize once for all chats
const connection = new ChatConnection();
await connection.init({
  projectId: process.env.converse_project_id,
  token: converseToken,
  serverUrl: process.env.converse_host,
});
```

### Agency Platform

```typescript
// Initialize per creator
const connection = new ChatConnection(creatorId, token);
await connection.init({
  projectId: import.meta.env.KNKY_CONVERSE_PROJECT_ID,
  token: token,
  serverUrl: import.meta.env.KNKY_CONVERSE_HOST,
});
```

### Adapter Solution

```typescript
// Abstract initialization in ChatConnection
class ChatConnection {
  async init(config: ConnectionConfig) {
    this.converse = new Converse();
    await this.converse.init(config);
    // ... rest of initialization
  }
}

// Core adapter usage
const connection = new ChatConnection();
await adapter.connection.init({
  projectId: config.converseProjectId,
  token: await config.auth.getToken(),
  serverUrl: config.converseHost,
});

// Agency adapter usage
const connection = new ChatConnection(this.creatorId);
await adapter.connection.init({
  projectId: config.converseProjectId,
  token: await config.auth.getToken(),
  serverUrl: config.converseHost,
});
```

## 5. UI/Styling Differences

### Core Platform (Bootstrap)

```typescript
// Bootstrap classes
<div className="d-flex flex-column h-100">
  <div className="btn btn-primary">Send</div>
  <div className="form-control">Message</div>
</div>

// Bootstrap modals
<Modal show={showModal} onHide={handleClose}>
  <Modal.Header closeButton>
    <Modal.Title>Chat Options</Modal.Title>
  </Modal.Header>
  <Modal.Body>...</Modal.Body>
</Modal>
```

### Agency Platform (Tailwind + shadcn/ui)

```typescript
// Tailwind classes
<div className="flex flex-col h-full">
  <button className="bg-primary text-white px-4 py-2 rounded">Send</button>
  <input className="border p-2 rounded">Message</input>
</div>

// shadcn/ui Dialog
<Dialog open={showModal} onOpenChange={handleClose}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Chat Options</DialogTitle>
    </DialogHeader>
    <DialogBody>...</DialogBody>
  </DialogContent>
</Dialog>
```

### Adapter Solution

```typescript
// Theme abstraction
interface ThemeConfig {
  type: 'bootstrap' | 'tailwind';
  components: {
    Button: string | React.ComponentType<any>;
    Input: string | React.ComponentType<any>;
    Modal: string | React.ComponentType<any>;
  };
}

// Theme providers
const bootstrapTheme = {
  type: 'bootstrap',
  components: {
    Button: 'btn btn-primary',
    Input: 'form-control',
    Modal: BootstrapModal,
  }
};

const tailwindTheme = {
  type: 'tailwind',
  components: {
    Button: TailwindButton,
    Input: TailwindInput,
    Modal: Dialog,
  }
};

// Component with theme support
const ChatInput = ({ theme }: { theme: ThemeConfig }) => {
  if (theme.type === 'bootstrap') {
    return <input className={theme.components.Input} />;
  }
  return <Input />;
};
```

## 6. Feature Flag Differences

### Core Platform

```typescript
// No multi-creator support
const features = {
  multiCreatorSupport: false,
  advancedFilters: true,
  statistics: true,
  sharedContent: true,
};
```

### Agency Platform

```typescript
// Multi-creator support required
const features = {
  multiCreatorSupport: true,
  advancedFilters: true,
  statistics: true,
  sharedContent: true,
};
```

### Adapter Solution

```typescript
interface PlatformConfig {
  features: {
    multiCreatorSupport: boolean;
    advancedFilters: boolean;
    statistics: boolean;
    sharedContent: boolean;
  };
}

// Feature-aware components
const ChatList = ({ features }: { features: PlatformConfig['features'] }) => {
  return (
    <div>
      {features.multiCreatorSupport && <CreatorSelector />}
      {features.advancedFilters && <ChatFilters />}
      <ChatItems />
    </div>
  );
};
```

## 7. Environment Variable Differences

### Core Platform (Next.js)

```typescript
// process.env usage
const API_URL = process.env.NEXT_PUBLIC_API_URL;
const CONVERSE_PROJECT_ID = process.env.CONVERSE_PROJECT_ID;
const CONVERSE_HOST = process.env.CONVERSE_HOST;
```

### Agency Platform (Vite)

```typescript
// import.meta.env usage
const API_URL = import.meta.env.VITE_API_URL;
const CONVERSE_PROJECT_ID = import.meta.env.VITE_CONVERSE_PROJECT_ID;
const CONVERSE_HOST = import.meta.env.VITE_CONVERSE_HOST;
```

### Adapter Solution

```typescript
// Environment abstraction
interface EnvConfig {
  apiEndpoint: string;
  converseProjectId: string;
  converseHost: string;
}

// Core adapter uses process.env
class CoreAdapter {
  constructor() {
    this.config = {
      apiEndpoint: process.env.NEXT_PUBLIC_API_URL,
      converseProjectId: process.env.CONVERSE_PROJECT_ID,
      converseHost: process.env.CONVERSE_HOST,
    };
  }
}

// Agency adapter uses import.meta.env
class AgencyAdapter {
  constructor() {
    this.config = {
      apiEndpoint: import.meta.env.VITE_API_URL,
      converseProjectId: import.meta.env.VITE_CONVERSE_PROJECT_ID,
      converseHost: import.meta.env.VITE_CONVERSE_HOST,
    };
  }
}
```

## 8. Creator Switching (Agency Only)

### Agency Platform

```typescript
// Switch between creators
const switchCreator = (creatorId: string) => {
  store.dispatch(chatActions.setCurrentCreatorId(creatorId));
  // Reinitialize socket for new creator
  socketChannel?.disconnect();
  await socketChannel?.init(creatorId);
};
```

### Core Platform

```typescript
// No creator switching needed
// N/A
```

### Adapter Solution

```typescript
// Agency adapter implements creator switching
class AgencyAdapter {
  async switchCreator(creatorId: string): Promise<void> {
    await this.connection?.disconnect();
    this.creatorId = creatorId;
    await this.initialize();
  }
}

// Core adapter throws error
class CoreAdapter {
  async switchCreator(creatorId: string): Promise<void> {
    throw new Error('Creator switching not supported in core platform');
  }
}
```

## 9. Data Persistence Differences

### Core Platform

```typescript
// Single persistence layer
const persistedChat = localStorage.getItem('chat-state');
```

### Agency Platform

```typescript
// Per-creator persistence
const persistedChat = localStorage.getItem(`chat-state-${creatorId}`);
```

### Adapter Solution

```typescript
// Persistence abstraction
interface IPersistenceAdapter {
  save(key: string, data: any): void;
  load(key: string): any;
  remove(key: string): void;
}

// Core persistence
class CorePersistenceAdapter implements IPersistenceAdapter {
  save(key: string, data: any): void {
    localStorage.setItem(key, JSON.stringify(data));
  }
}

// Agency persistence
class AgencyPersistenceAdapter implements IPersistenceAdapter {
  save(key: string, data: any): void {
    const storageKey = `${key}-${this.creatorId}`;
    localStorage.setItem(storageKey, JSON.stringify(data));
  }
}
```

## Summary Table

| Feature | Core Platform | Agency Platform | Adapter Strategy |
|---------|--------------|------------------|-----------------|
| State Structure | Flat | Nested (per creator) | State Adapter Interface |
| Authentication | Single token | Per-creator tokens | Config-based auth functions |
| API Client | Direct calls | Context-aware calls | API Client Interface |
| Socket Init | Single instance | Per-creator instances | Config-based initialization |
| UI Framework | Bootstrap | Tailwind + shadcn/ui | Theme abstraction layer |
| Multi-creator | No | Yes | Feature flag + conditional rendering |
| Environment Vars | `process.env` | `import.meta.env` | Config abstraction |
| Creator Switching | N/A | Required | Agency-only method |
| Data Persistence | Single key | Per-creator keys | Persistence adapter |

## Benefits of This Approach

1. **Clean Separation**: Platform-specific logic isolated in adapters
2. **Type Safety**: Strong interfaces prevent integration errors
3. **Testability**: Each adapter can be tested independently
4. **Maintainability**: Changes to one platform don't affect the other
5. **Extensibility**: New platforms can be added by creating new adapters
6. **Code Reuse**: Common logic shared between both adapters
