# knky-chat Micro Frontend Architecture

## Overview

A platform-agnostic chat micro frontend built with React + Vite + Tailwind CSS + shadcn/ui that supports both `knky-frontend` (Next.js + Bootstrap) and `knky-agency-frontend` (React + Vite + Tailwind + shadcn).

## Project Goal

Extract shared chat logic and UI into a reusable micro frontend that:
- Supports both single-creator (core) and multi-creator (agency) business logic
- Maintains platform independence for seamless integration
- Uses consistent UI components (Tailwind + shadcn)
- Provides clear abstraction layers for business logic differences

## Architecture Principles

1. **Separation of Concerns**: UI, business logic, and platform-specific code are separated
2. **Composition Over Inheritance**: Use composition patterns to handle platform differences
3. **Dependency Inversion**: Depend on abstractions, not concrete implementations
4. **Single Responsibility**: Each component/function has one clear purpose

## 📊 Implementation Progress

### ✅ Phase 1: Foundation Setup (COMPLETED)
- Monorepo structure created with pnpm workspace
- All 4 package skeletons created and configured
- TypeScript base configurations established
- Testing infrastructure set up
- **Committed**: Monorepo foundation ready

### ✅ Phase 2: Core Chat Logic (COMPLETED)
- Complete type definitions extracted and unified
- Abstract API client with base implementation
- Abstract socket connection with retry logic
- Comprehensive utility functions created
- **Committed**: Core-chat package ready

### ✅ Phase 3: Business Logic Layer (COMPLETED)
- CoreChatManager for single-creator flat state
- AgencyChatManager for multi-creator nested state with creator isolation
- Shared business logic (MessageHandler, SeenManager, PinManager, etc.)
- Platform-specific state adapters implemented
- **Committed**: Business logic layer complete

### ⏳ Phase 4: UI Components (70% COMPLETE)
- Major chat components migrated (ChatBar, ChatBox, ChatBubbles, etc.)
- UI components and custom hooks moved
- Theme system with Bootstrap/Tailwind support
- Loading states (shimmers) included
- **Pending**: Some message bubble variations still needed
- **Committed**: Core UI components ready

### ⏳ Phase 5: Hooks & State Management (PENDING)
- Custom hooks need to be created
- Redux store integration needed
- State management tests pending

### ⏳ Phase 6: Adapters (COMPLETED)
- IPlatformAdapter interface defined
- CoreAdapter implemented (Next.js + Bootstrap)
- AgencyAdapter implemented (React + Vite + Tailwind)
- Creator switching support added
- **Committed**: Adapter layer complete

### ⏳ Phase 7: Integration (PENDING)
- Install dependencies and test builds
- Update imports in existing app
- Test integration with both platforms

### ⏳ Phase 8: Documentation (30% COMPLETE)
- All architecture docs created and committed
- Implementation roadmap updated with progress
- README updated with current status
- **Pending**: Integration examples and API docs

## Tech Stack

- **Framework**: React 18+
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **State Management**: Redux Toolkit
- **Socket Client**: converse.svc-client
- **TypeScript**: Strict mode enabled
- **Package Manager**: pnpm (workspace compatible)

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  knky-chat (Micro Frontend)                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           Integration Layer (Adapters)              │   │
│  │  - Platform Adapter Interface                       │   │
│  │  - Core Platform Adapter                            │   │
│  │  - Agency Platform Adapter                          │   │
│  └─────────────────────────────────────────────────────┘   │
│                          ↕                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │         Business Logic Layer (Abstracted)            │   │
│  │  - ChatState Management (Abstract)                   │   │
│  │  - Platform-specific Business Logic                 │   │
│  │  - Shared Business Logic                            │   │
│  └─────────────────────────────────────────────────────┘   │
│                          ↕                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Core Chat Logic Layer                   │   │
│  │  - ChatConnection (Socket Management)                │   │
│  │  - API Services                                     │   │
│  │  - Utilities (sorting, filtering, etc.)            │   │
│  │  - Type Definitions                                 │   │
│  └─────────────────────────────────────────────────────┘   │
│                          ↕                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   UI Layer (React)                   │   │
│  │  - ChatBox                                          │   │
│  │  - ChatList                                         │   │
│  │  - ChatBar                                          │   │
│  │  - Message Components                               │   │
│  │  - Bubble Variations                                │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
         ↕                                      ↕
┌─────────────────────┐          ┌─────────────────────┐
│   knky-frontend     │          │ knky-agency-frontend│
│   (Next.js +        │          │  (React + Vite)      │
│    Bootstrap)       │          │  (Direct Import)     │
└─────────────────────┘          └─────────────────────┘
```

## Folder Structure

```
knky-chat/
├── packages/
│   ├── core-chat/                    # Pure chat logic (no UI)
│   │   ├── src/
│   │   │   ├── socket/
│   │   │   │   └── ChatConnection.ts
│   │   │   ├── api/
│   │   │   │   ├── chat-api.ts
│   │   │   │   └── types.ts
│   │   │   ├── utils/
│   │   │   │   ├── chat-list-sort.ts
│   │   │   │   ├── message-utils.ts
│   │   │   │   └── receipt-utils.ts
│   │   │   ├── types/
│   │   │   │   ├── chat.types.ts
│   │   │   │   ├── message.types.ts
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── business-logic/               # Platform-agnostic business logic
│   │   ├── src/
│   │   │   ├── core/               # Core platform logic
│   │   │   │   ├── CoreChatManager.ts
│   │   │   │   ├── CoreStateAdapter.ts
│   │   │   │   └── index.ts
│   │   │   ├── agency/             # Agency platform logic
│   │   │   │   ├── AgencyChatManager.ts
│   │   │   │   ├── AgencyStateAdapter.ts
│   │   │   │   └── index.ts
│   │   │   ├── shared/             # Shared business logic
│   │   │   │   ├── MessageHandler.ts
│   │   │   │   ├── SeenManager.ts
│   │   │   │   ├── PinManager.ts
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── chat-ui/                      # React UI components
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── ChatBox/
│   │   │   │   │   ├── index.tsx
│   │   │   │   │   ├── ChatBubbles.tsx
│   │   │   │   │   └── ChatBox.tsx
│   │   │   │   ├── ChatList/
│   │   │   │   │   ├── index.tsx
│   │   │   │   │   ├── ChatList.tsx
│   │   │   │   │   └── ChatListFilters.tsx
│   │   │   │   ├── ChatBar/
│   │   │   │   │   ├── index.tsx
│   │   │   │   │   ├── ChatBar.tsx
│   │   │   │   │   └── MessageInput.tsx
│   │   │   │   ├── messages/
│   │   │   │   │   ├── bubbles/
│   │   │   │   │   │   ├── TextBubble.tsx
│   │   │   │   │   │   ├── MediaBubble.tsx
│   │   │   │   │   │   ├── PromotionBubble.tsx
│   │   │   │   │   │   ├── RatingBubble.tsx
│   │   │   │   │   │   └── index.ts
│   │   │   │   │   └── index.ts
│   │   │   │   └── shared/
│   │   │   │       ├── Avatar.tsx
│   │   │   │       ├── OnlineDot.tsx
│   │   │   │       └── TimeBadge.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useChat.ts
│   │   │   │   ├── useChatSocket.ts
│   │   │   │   ├── useMessageSend.ts
│   │   │   │   └── useSeenManager.ts
│   │   │   ├── store/
│   │   │   │   ├── chat.slice.ts
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── adapters/                     # Platform integration adapters
│       ├── src/
│       │   ├── types/
│       │   │   ├── platform-adapter.types.ts
│       │   │   └── index.ts
│       │   ├── core/
│       │   │   ├── CoreAdapter.ts
│       │   │   ├── CoreConfig.ts
│       │   │   └── index.ts
│       │   ├── agency/
│       │   │   ├── AgencyAdapter.ts
│       │   │   ├── AgencyConfig.ts
│       │   │   └── index.ts
│       │   └── index.ts
│       ├── package.json
│       └── tsconfig.json
│
├── examples/
│   ├── core-integration/            # Example: Next.js integration
│   └── agency-integration/         # Example: Direct Vite integration
│
├── apps/
│   ├── dev-playground/              # Development playground
│   └── storybook/                  # Component documentation
│
├── .npmrc                          # Registry configuration
├── pnpm-workspace.yaml             # Monorepo configuration
├── package.json                    # Root package.json
├── tsconfig.base.json             # Base TypeScript config
├── turbo.json                    # Turborepo config (optional)
└── README.md
```

## Package Architecture

### 1. `@knky-chat/core-chat`

**Purpose**: Pure chat logic, zero dependencies on UI frameworks

**Exports**:
- `ChatConnection` class (socket management)
- API client functions
- Utility functions (sorting, filtering, etc.)
- TypeScript types

**Dependencies**: `converse.svc-client`, `axios` (for API calls)

### 2. `@knky-chat/business-logic`

**Purpose**: Platform-agnostic business logic layer

**Exports**:
- `CoreChatManager` - Manages core platform chat logic
- `AgencyChatManager` - Manages agency platform chat logic
- Shared business logic utilities (seen, pin, message handling)

**Dependencies**: `@knky-chat/core-chat`

### 3. `@knky-chat/chat-ui`

**Purpose**: React UI components using Tailwind + shadcn/ui

**Exports**:
- React components (ChatBox, ChatList, ChatBar, etc.)
- Custom hooks (useChat, useChatSocket, etc.)
- Redux store configuration

**Dependencies**: `@knky-chat/business-logic`, React, Redux Toolkit, shadcn/ui

### 4. `@knky-chat/adapters`

**Purpose**: Integration adapters for different platforms

**Exports**:
- `CoreAdapter` - Adapter for core platform
- `AgencyAdapter` - Adapter for agency platform
- Platform configuration interfaces

**Dependencies**: `@knky-chat/chat-ui`

## Integration Strategies

### For knky-frontend (Next.js + Bootstrap)

```typescript
// pages/chat/index.tsx
import { CoreAdapter } from '@knky-chat/adapters/core';
import { ChatProvider } from '@knky-chat/chat-ui';

export default function ChatPage() {
  return (
    <ChatProvider
      adapter={new CoreAdapter({
        // Platform-specific configuration
        apiEndpoint: process.env.NEXT_PUBLIC_API_URL,
        converseProjectId: process.env.CONVERSE_PROJECT_ID,
        // Bootstrap theming overrides
        theme: 'bootstrap',
      })}
    >
      <ChatBox />
    </ChatProvider>
  );
}
```

### For knky-agency-frontend (React + Vite + Tailwind)

```typescript
// src/pages/Chat.tsx
import { AgencyAdapter } from '@knky-chat/adapters/agency';
import { ChatProvider } from '@knky-chat/chat-ui';

export function Chat() {
  return (
    <ChatProvider
      adapter={new AgencyAdapter({
        // Platform-specific configuration
        apiEndpoint: import.meta.env.VITE_API_URL,
        converseProjectId: import.meta.env.VITE_CONVERSE_PROJECT_ID,
        // Tailwind theming
        theme: 'tailwind',
      })}
    >
      <ChatBox />
    </ChatProvider>
  );
}
```

## State Management Strategy

### Abstracted State Pattern

```typescript
// business-logic/shared/ChatStateAdapter.ts
export interface IChatStateAdapter {
  getState(): any;
  dispatch(action: any): void;
  subscribe(listener: () => void): () => void;
  getMessages(channelId: string): MessageInterface[];
  addMessage(channelId: string, message: MessageInterface): void;
  markSeen(channelId: string, messageId: string): void;
  // ... other state operations
}
```

### Core Platform State

```typescript
// business-logic/core/CoreStateAdapter.ts
export class CoreStateAdapter implements IChatStateAdapter {
  constructor(private store: Store) {
    // Direct store access for core platform
  }

  getMessages(channelId: string): MessageInterface[] {
    return this.store.getState().chat.completeMessagesByChatId[channelId] || [];
  }
  // ... implementations
}
```

### Agency Platform State

```typescript
// business-logic/agency/AgencyStateAdapter.ts
export class AgencyStateAdapter implements IChatStateAdapter {
  constructor(private store: Store, private creatorId: string) {
    // State accessor with creator isolation
  }

  getMessages(channelId: string): MessageInterface[] {
    return this.store.getState().chat
      .chatDataByCreator[this.creatorId]?.completeMessagesByChatId[channelId] || [];
  }
  // ... implementations
}
```

## API Layer Abstraction

```typescript
// core-chat/api/chat-api.ts
export interface IChatApiClient {
  getChannelId(userId: string): Promise<ChannelIdResponse>;
  getChatList(params: ChatListParams): Promise<ChatListResponse>;
  getChannelMessages(params: GetMessagesParams): Promise<MessagesResponse>;
  sendMessage(params: SendMessageParams): Promise<MessageResponse>;
  // ... other API methods
}

// Platform-specific implementations
export class CoreChatApiClient implements IChatApiClient {
  // Core platform API calls
}

export class AgencyChatApiClient implements IChatApiClient {
  // Agency platform API calls
}
```

## Configuration System

### Platform Configuration Interface

```typescript
// adapters/types/platform-config.types.ts
export interface PlatformConfig {
  apiEndpoint: string;
  converseProjectId: string;
  converseHost: string;
  theme: 'bootstrap' | 'tailwind';
  features: {
    multiCreatorSupport: boolean;
    advancedFilters: boolean;
    statistics: boolean;
  };
  auth: {
    getToken(): Promise<string>;
    verifyToken(token: string): Promise<boolean>;
  };
}
```

## Theming Strategy

### Tailwind + shadcn Base Theme

```typescript
// chat-ui/src/theme/index.ts
export const chatTheme = {
  colors: {
    primary: 'var(--knky-primary)',
    secondary: 'var(--knky-secondary)',
    background: 'var(--knky-bg)',
    surface: 'var(--knky-surface)',
  },
  // ... other theme properties
};

// Platform-specific overrides
export const bootstrapThemeOverride = {
  // Bootstrap class mappings
  btnPrimary: 'btn btn-primary',
  // ...
};

export const tailwindTheme = {
  // Tailwind class mappings
  btnPrimary: 'bg-primary text-white px-4 py-2 rounded',
  // ...
};
```

## Deployment Strategy

### Package Publishing

```json
// package.json (root)
{
  "scripts": {
    "build": "turbo run build",
    "test": "turbo run test",
    "lint": "turbo run lint",
    "publish": "changeset publish"
  },
  "private": true
}
```

### Version Management

Use Changesets for version management:
- Independent versioning for each package
- Automatic changelog generation
- Semantic versioning

## Benefits of This Architecture

1. **Code Reuse**: ~80% reduction in duplicate code across platforms
2. **Consistent UX**: Same UI components across all platforms
3. **Easier Maintenance**: Single source of truth for chat logic
4. **Flexibility**: Easy to add new platforms
5. **Testing**: Isolated packages are easier to test
6. **Performance**: Tree-shaking eliminates unused code
7. **Type Safety**: Strong TypeScript integration across packages

## Migration Strategy

### Phase 1: Extract Core Logic
- Move shared utilities and types to `@knky-chat/core-chat`
- Create adapter interfaces

### Phase 2: Build UI Components
- Develop UI components with Tailwind + shadcn
- Create hooks and state management

### Phase 3: Business Logic Abstraction
- Extract platform-specific business logic
- Implement adapters

### Phase 4: Integration
- Integrate with knky-frontend (gradual migration)
- Integrate with knky-agency-frontend

### Phase 5: Deprecation
- Remove old chat code from both platforms
- Full migration complete

## Next Steps

1. **Initialize monorepo** with pnpm workspace
2. **Set up package structure** with base configurations
3. **Extract shared types** from both projects
4. **Create adapter interfaces** for platform abstraction
5. **Build core-chat package** (socket, API, utilities)
6. **Develop UI components** with Tailwind + shadcn
7. **Implement business logic layer**
8. **Create adapters** for both platforms
9. **Test integration** with both platforms
10. **Document usage** and migration guide
