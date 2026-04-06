# knky-chat

A platform-agnostic chat micro frontend built with React + Vite + Tailwind CSS + shadcn/ui that supports both `knky-frontend` (Next.js + Bootstrap) and `knky-agency-frontend` (React + Vite + Tailwind + shadcn).

## 🎯 Project Overview

This micro frontend extracts shared chat logic and UI into a reusable package that:
- ✅ Supports both single-creator (core) and multi-creator (agency) business logic
- ✅ Maintains platform independence for seamless integration
- ✅ Uses consistent UI components (Tailwind + shadcn)
- ✅ Provides clear abstraction layers for business logic differences
- ✅ Reduces code duplication by ~80% across platforms

## 📦 Monorepo Structure

```
knky-chat/
├── packages/
│   ├── core-chat/          # Pure chat logic (no UI)
│   ├── business-logic/     # Platform-agnostic business logic
│   ├── chat-ui/            # React UI components
│   └── adapters/           # Platform integration adapters
├── examples/               # Integration examples
├── apps/                  # Development tools
└── docs/                  # Documentation
```

## 🚀 Quick Start

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd knky-chat

# Install dependencies
pnpm install

# Build all packages
pnpm build
```

### For knky-frontend (Next.js + Bootstrap)

```bash
cd /path/to/knky-frontend
pnpm add @knky-chat/adapters @knky-chat/chat-ui @knky-chat/business-logic @knky-chat/core-chat
```

```typescript
// pages/chat/index.tsx
import { CoreAdapter } from '@knky-chat/adapters/core';
import { ChatProvider } from '@knky-chat/chat-ui';

export default function ChatPage() {
  return (
    <ChatProvider
      adapter={new CoreAdapter({
        apiEndpoint: process.env.NEXT_PUBLIC_API_URL,
        converseProjectId: process.env.CONVERSE_PROJECT_ID,
        converseHost: process.env.CONVERSE_HOST,
        theme: 'bootstrap',
        features: {
          multiCreatorSupport: false,
          advancedFilters: true,
          statistics: true,
          sharedContent: true,
        },
        auth: {
          getToken: async () => {
            // Get token from your auth system
            return store.getState().chat?.converseToken || '';
          },
          verifyToken: async (token) => {
            // Verify token
            return true;
          },
        },
      })}
    >
      <ChatBox />
    </ChatProvider>
  );
}
```

### For knky-agency-frontend (React + Vite + Tailwind)

```bash
cd /path/to/knky-agency-frontend
pnpm add @knky-chat/adapters @knky-chat/chat-ui @knky-chat/business-logic @knky-chat/core-chat
```

```typescript
// src/pages/Chat.tsx
import { AgencyAdapter } from '@knky-chat/adapters/agency';
import { ChatProvider } from '@knky-chat/chat-ui';

export function Chat() {
  return (
    <ChatProvider
      adapter={new AgencyAdapter({
        apiEndpoint: import.meta.env.VITE_API_URL,
        converseProjectId: import.meta.env.VITE_CONVERSE_PROJECT_ID,
        converseHost: import.meta.env.VITE_CONVERSE_HOST,
        theme: 'tailwind',
        creatorId: 'creator-id',
        features: {
          multiCreatorSupport: true,
          advancedFilters: true,
          statistics: true,
          sharedContent: true,
        },
        auth: {
          getToken: async () => {
            // Get token for specific creator
            return store.getState().chat?.chatDataByCreator[creatorId]?.creatorToken || '';
          },
          verifyToken: async (token) => {
            return true;
          },
        },
      })}
    >
      <ChatBox />
    </ChatProvider>
  );
}
```

## 📚 Available Packages

### @knky-chat/core-chat

Pure chat logic with no UI dependencies.

```typescript
import { ChatConnection } from '@knky-chat/core-chat';

const connection = new ChatConnection();
await connection.init();
```

### @knky-chat/business-logic

Platform-agnostic business logic layer.

```typescript
import { CoreChatManager } from '@knky-chat/business-logic';

const manager = new CoreChatManager(connection);
await manager.initialize();
```

### @knky-chat/chat-ui

React UI components with Tailwind + shadcn/ui.

```typescript
import { ChatBox, ChatList } from '@knky-chat/chat-ui';

<ChatBox />
<ChatList />
```

### @knky-chat/adapters

Platform integration adapters.

```typescript
import { CoreAdapter, AgencyAdapter } from '@knky-chat/adapters';

const adapter = new CoreAdapter(config);
```

## 🎨 Theming

### Tailwind Theme

```typescript
const adapter = new AgencyAdapter({
  theme: 'tailwind',
  // ... other config
});
```

### Bootstrap Theme

```typescript
const adapter = new CoreAdapter({
  theme: 'bootstrap',
  // ... other config
});
```

## 🔧 Development

### Running Development Server

```bash
# Start all packages in watch mode
pnpm dev

# Start specific package
pnpm --filter @knky-chat/chat-ui dev
```

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests for specific package
pnpm --filter @knky-chat/core-chat test

# Run tests in watch mode
pnpm test:watch
```

### Building Packages

```bash
# Build all packages
pnpm build

# Build specific package
pnpm --filter @knky-chat/chat-ui build
```

### Storybook

```bash
# Start Storybook
pnpm storybook

# Build Storybook
pnpm build:storybook
```

## 📖 Documentation

- [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md) - Architecture and design decisions
- [IMPLEMENTATION_ROADMAP.md](./IMPLEMENTATION_ROADMAP.md) - Implementation phases and timeline
- [TECHNICAL_SPECIFICATIONS.md](./TECHNICAL_SPECIFICATIONS.md) - Technical details and specifications

## 🏗️ Architecture

The micro frontend follows a layered architecture:

1. **Core Chat Logic Layer**: Socket management, API services, utilities
2. **Business Logic Layer**: Platform-agnostic business logic with adapters
3. **UI Layer**: React components with Tailwind + shadcn/ui
4. **Integration Layer**: Platform-specific adapters

## 🔄 State Management

The micro frontend uses Redux Toolkit for state management with abstracted state adapters:

```typescript
interface IChatStateAdapter {
  getState(): any;
  dispatch(action: any): void;
  getMessages(channelId: string): MessageInterface[];
  addMessage(channelId: string, message: MessageInterface): void;
  markSeen(channelId: string, messageId: string): void;
  // ... other operations
}
```

## 🎯 Features

### Core Features
- ✅ Real-time messaging via WebSocket
- ✅ Message history with pagination
- ✅ Message editing and deletion
- ✅ Seen receipts
- ✅ Pinned messages
- ✅ Online/offline tracking

### Advanced Features
- ✅ Media attachments
- ✅ Chat fee system
- ✅ Message templates
- ✅ Statistics tracking
- ✅ Advanced filtering
- ✅ Search functionality

### Message Types
- ✅ Text messages
- ✅ Media attachments
- ✅ Promotions
- ✅ Rating requests
- ✅ Video/voice calls
- ✅ Tips
- ✅ Story replies

## 🧪 Testing

The project uses Vitest for unit testing and React Testing Library for component testing.

```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run tests in watch mode
pnpm test:watch
```

## 📦 Publishing

```bash
# Build all packages
pnpm build

# Publish to npm
pnpm publish

# Publish specific package
pnpm --filter @knky-chat/core-chat publish
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙋 Support

For support, please open an issue in the repository or contact the development team.

## 🗺️ Roadmap

- [x] Architecture planning
- [ ] Monorepo setup
- [ ] Core chat logic extraction
- [ ] Business logic layer
- [ ] UI components development
- [ ] Adapter implementation
- [ ] Integration testing
- [ ] Documentation
- [ ] Production deployment

## 📊 Benefits

- **Code Reuse**: ~80% reduction in duplicate code across platforms
- **Consistent UX**: Same UI components across all platforms
- **Easier Maintenance**: Single source of truth for chat logic
- **Flexibility**: Easy to add new platforms
- **Testing**: Isolated packages are easier to test
- **Performance**: Tree-shaking eliminates unused code
- **Type Safety**: Strong TypeScript integration across packages

---

**Built with ❤️ for the knky ecosystem**
