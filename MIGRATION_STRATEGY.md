# Migration Strategy: Integrating knky-chat into Platform Repositories

## Overview

This document outlines the strategy for migrating both `knky-frontend` and `knky-agency-frontend` from their current chat implementations to use the new `knky-chat` micro frontend library.

## Migration Philosophy

- **Gradual Migration**: Replace components incrementally, not all at once
- **Backward Compatibility**: Keep old code during transition
- **Feature Parity**: Ensure all existing features work before removing old code
- **Parallel Development**: Both implementations coexist during migration
- **Rollback Capability**: Easy to revert if issues arise

## Approach: Library Integration

The knky-chat packages will be distributed as npm libraries and installed as dependencies in both platform repositories.

### Distribution Method

```bash
# Option 1: Public npm registry
pnpm add @knky-chat/adapters @knky-chat/chat-ui @knky-chat/business-logic @knky-chat/core-chat

# Option 2: Private registry or monorepo (development)
pnpm add @knky-chat/adapters@file:../knky-chat/packages/adapters
```

### Configuration-Based Integration

Platform-specific configuration is passed as parameters during initialization. All logic resides within knky-chat, with platforms providing only:

1. **Configuration**: API endpoints, project IDs, feature flags
2. **Authentication**: Token retrieval and verification functions
3. **Theme**: Platform-specific styling preferences
4. **State Integration**: Redux store or state manager references

## Migration Phases

### Phase 1: Setup & Integration (Week 1)

#### 1.1 Install Packages

**For knky-frontend:**
```bash
cd /path/to/knky-frontend
pnpm add @knky-chat/adapters @knky-chat/chat-ui @knky-chat/business-logic @knky-chat/core-chat
```

**For knky-agency-frontend:**
```bash
cd /path/to/knky-agency-frontend
pnpm add @knky-chat/adapters @knky-chat/chat-ui @knky-chat/business-logic @knky-chat/core-chat
```

#### 1.2 Create Adapter Configuration

**knky-frontend configuration:**
```typescript
// src/config/chatConfig.ts
import { CorePlatformConfig } from '@knky-chat/adapters';

export const chatConfig: CorePlatformConfig = {
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
      return store.getState().chat?.converseToken || '';
    },
    verifyToken: async (token) => {
      try {
        await VerifyConverseToken({
          projectId: process.env.CONVERSE_PROJECT_ID,
          token,
        });
        return true;
      } catch {
        return false;
      }
    },
  },
};
```

**knky-agency-frontend configuration:**
```typescript
// src/config/chatConfig.ts
import { AgencyPlatformConfig } from '@knky-chat/adapters';

export const createChatConfig = (creatorId: string): AgencyPlatformConfig => ({
  apiEndpoint: import.meta.env.VITE_API_URL,
  converseProjectId: import.meta.env.VITE_CONVERSE_PROJECT_ID,
  converseHost: import.meta.env.VITE_CONVERSE_HOST,
  theme: 'tailwind',
  creatorId,
  features: {
    multiCreatorSupport: true,
    advancedFilters: true,
    statistics: true,
    sharedContent: true,
  },
  auth: {
    getToken: async () => {
      return store.getState().chat?.chatDataByCreator[creatorId]?.creatorToken || '';
    },
    verifyToken: async (token) => {
      try {
        await VerifyConverseToken({
          projectId: import.meta.env.VITE_CONVERSE_PROJECT_ID,
          token,
          creatorId,
        });
        return true;
      } catch {
        return false;
      }
    },
  },
});
```

#### 1.3 Set Up Provider

**knky-frontend:**
```typescript
// src/providers/ChatProvider.tsx
'use client';

import { CoreAdapter } from '@knky-chat/adapters/core';
import { ChatProvider as KnkyChatProvider } from '@knky-chat/chat-ui';
import { chatConfig } from '@/config/chatConfig';

const adapter = new CoreAdapter(chatConfig);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  return (
    <KnkyChatProvider adapter={adapter}>
      {children}
    </KnkyChatProvider>
  );
}
```

**knky-agency-frontend:**
```typescript
// src/providers/ChatProvider.tsx
import { AgencyAdapter } from '@knky-chat/adapters/agency';
import { ChatProvider as KnkyChatProvider } from '@knky-chat/chat-ui';
import { createChatConfig } from '@/config/chatConfig';

export function ChatProvider({ children, creatorId }: ChatProviderProps) {
  const adapter = new AgencyAdapter(createChatConfig(creatorId));

  return (
    <KnkyChatProvider adapter={adapter}>
      {children}
    </KnkyChatProvider>
  );
}
```

### Phase 2: Component Replacement (Week 2-4)

#### 2.1 Parallel Setup Strategy

Keep both implementations running side-by-side with feature flags:

```typescript
// src/pages/chat/index.tsx (knky-frontend)
const USE_NEW_CHAT = process.env.NEXT_PUBLIC_USE_NEW_CHAT === 'true';

export default function ChatPage() {
  return USE_NEW_CHAT ? <NewChatPage /> : <OldChatPage />;
}
```

```typescript
// src/pages/Chat.tsx (knky-agency-frontend)
const USE_NEW_CHAT = import.meta.env.VITE_USE_NEW_CHAT === 'true';

export function Chat() {
  return USE_NEW_CHAT ? <NewChat /> : <OldChat />;
}
```

#### 2.2 Component Replacement Order

Replace components in this order (from leaf to root):

1. **Week 2: Small Components**
   - `Avatar` → `@knky-chat/chat-ui/Avatar`
   - `OnlineDot` → `@knky-chat/chat-ui/OnlineDot`
   - `TimeBadge` → `@knky-chat/chat-ui/TimeBadge`

2. **Week 3: Message Components**
   - `TextBubble` → `@knky-chat/chat-ui/TextBubble`
   - `MediaBubble` → `@knky-chat/chat-ui/MediaBubble`
   - `PromotionBubble` → `@knky-chat/chat-ui/PromotionBubble`
   - `RatingBubble` → `@knky-chat/chat-ui/RatingBubble`
   - All other bubble variations

3. **Week 4: Major Components**
   - `ChatBar` → `@knky-chat/chat-ui/ChatBar`
   - `ChatBubbles` → `@knky-chat/chat-ui/ChatBubbles`
   - `ChatBox` → `@knky-chat/chat-ui/ChatBox`
   - `ChatList` → `@knky-chat/chat-ui/ChatList`

#### 2.3 Component Integration Example

**Old Implementation (knky-frontend):**
```typescript
// components/common/chat/chat-box/index.tsx
import ChatBubbles from './ChatBubbles';
import ChatBar from '../chatbar';

const ChatBox = () => {
  const messages = useAppSelector(s => s.chat?.completeMessagesByChatId[channelId] || []);
  
  return (
    <div className="d-flex flex-column h-100">
      <ChatBubbles messages={messages} />
      <ChatBar />
    </div>
  );
};
```

**New Implementation (with knky-chat):**
```typescript
// components/common/chat/chat-box/index.tsx
import { ChatBox as KnkyChatBox } from '@knky-chat/chat-ui';

const ChatBox = () => {
  return (
    <div className="d-flex flex-column h-100">
      <KnkyChatBox theme="bootstrap" />
    </div>
  );
};
```

### Phase 3: State Migration (Week 5-6)

#### 3.1 State Adapter Integration

Replace platform-specific state management with adapter-based approach:

**knky-frontend:**
```typescript
// Old: Direct Redux store access
const messages = store.getState().chat.completeMessagesByChatId[channelId];

// New: Adapter-based access
const messages = chatAdapter.getMessages(channelId);
```

**knky-agency-frontend:**
```typescript
// Old: Direct Redux store access
const messages = store.getState().chat.chatDataByCreator[creatorId]?.completeMessagesByChatId[channelId];

// New: Adapter-based access
const messages = chatAdapter.getMessages(channelId);
```

#### 3.2 Redux Store Migration

Gradually migrate Redux actions and reducers:

```typescript
// Old: Direct dispatch
store.dispatch(chatActions.addMessage({ channelId, message }));

// New: Adapter dispatch (internal to knky-chat)
chatAdapter.addMessage(channelId, message);
```

#### 3.3 State Persistence

Migrate persisted state to new format:

```typescript
// Migration utility
function migrateChatState() {
  const oldState = localStorage.getItem('chat-state');
  if (oldState) {
    const parsed = JSON.parse(oldState);
    // Transform old state to new adapter format
    const newState = transformState(parsed);
    // Save new state
    chatAdapter.restoreState(newState);
    // Remove old state
    localStorage.removeItem('chat-state');
  }
}
```

### Phase 4: Hooks Migration (Week 7)

#### 4.1 Replace Custom Hooks

**Old Implementation:**
```typescript
// hooks/useShowChat.tsx
const useShowChat = (userId: string) => {
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);

  const showChat = useCallback(async () => {
    setLoading(true);
    // ... custom logic
    setLoading(false);
  }, [userId]);

  return { showChat, loading };
};
```

**New Implementation (with knky-chat):**
```typescript
import { useChat } from '@knky-chat/chat-ui';

const ChatPage = () => {
  const { showChat, loading } = useChat();
  // Use knky-chat hook
};
```

### Phase 5: Socket Integration (Week 8)

#### 5.1 Socket Connection Migration

**Old Implementation:**
```typescript
// utils/chatSocket.ts
import socketChannel from '@/utils/chatSocket';

// Initialize socket
await socketChannel.init();
```

**New Implementation:**
```typescript
// Socket initialization is handled internally by adapter
import { ChatProvider } from '@knky-chat/chat-ui';
import { CoreAdapter } from '@knky-chat/adapters/core';

const adapter = new CoreAdapter(config);
// Socket is automatically initialized when provider mounts
<ChatProvider adapter={adapter}>
  {/* Chat components */}
</ChatProvider>
```

#### 5.2 Socket Event Handling

Old socket event handlers can be removed as they're handled internally:

```typescript
// Remove these old event handlers:
socketChannel.listenForNewMessage(handler);
socketChannel.listenForSeenMessages(handler);
socketChannel.listenForPinMessage(handler);
// ... etc

// New: Events are handled internally by knky-chat
```

### Phase 6: API Integration (Week 9)

#### 6.1 API Call Migration

**Old Implementation:**
```typescript
import { getChannelId, getChatUserList } from '@/api/chat';

const channelId = await getChannelId(userId);
const chats = await getChatUserList({ page: 1, limit: 10 });
```

**New Implementation:**
```typescript
import { useChat } from '@knky-chat/chat-ui';

const { getChannelId, getChatList } = useChat();

const channelId = await getChannelId(userId);
const chats = await getChatList({ page: 1, limit: 10 });
```

#### 6.2 API Configuration

All API endpoints and authentication are configured in the adapter, not called directly:

```typescript
// Old: Direct API calls
import API from '@/api';

const response = await API.get('/api/chat/channels');

// New: API calls through adapter
const response = await adapter.getChannelList();
```

### Phase 7: Testing & Validation (Week 10)

#### 7.1 Feature Validation Checklist

**Core Features:**
- [ ] Send/receive messages
- [ ] Message editing
- [ ] Message deletion
- [ ] Seen receipts
- [ ] Pinned messages
- [ ] Online/offline status

**Advanced Features:**
- [ ] Media attachments
- [ ] Chat fee system
- [ ] Message templates
- [ ] Statistics
- [ ] Advanced filtering
- [ ] Search functionality

**Platform-Specific:**
- [ ] Core: Single creator chat works
- [ ] Agency: Multi-creator switching works
- [ ] Agency: Creator isolation maintained
- [ ] Both: State persistence works

#### 7.2 Performance Testing

- [ ] Message loading performance (initial and pagination)
- [ ] Socket reconnection reliability
- [ ] State update performance
- [ ] Memory usage comparison
- [ ] Bundle size comparison

#### 7.3 Browser Testing

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile Safari
- [ ] Chrome Mobile

#### 7.4 E2E Testing

Run comprehensive E2E tests:

```bash
# Run E2E tests for new implementation
pnpm test:e2e:new

# Run E2E tests for old implementation (baseline)
pnpm test:e2e:old

# Compare results
pnpm test:e2e:compare
```

### Phase 8: Feature Flag Removal (Week 11)

#### 8.1 Gradual Rollout

Increase feature flag rollout gradually:

```bash
# Week 1: 10% of users
NEXT_PUBLIC_USE_NEW_CHAT=0.1

# Week 2: 25% of users
NEXT_PUBLIC_USE_NEW_CHAT=0.25

# Week 3: 50% of users
NEXT_PUBLIC_USE_NEW_CHAT=0.5

# Week 4: 100% of users
NEXT_PUBLIC_USE_NEW_CHAT=1.0
```

#### 8.2 Monitor Metrics

Key metrics to monitor:

- **Error rates**: Compare new vs old
- **Performance**: Page load times, interaction latency
- **User engagement**: Messages sent, time spent in chat
- **Support tickets**: Increase in chat-related issues

#### 8.3 Rollback Plan

If issues are detected:

```bash
# Immediate rollback
NEXT_PUBLIC_USE_NEW_CHAT=0.0

# Deploy rollback
pnpm deploy:rollback
```

### Phase 9: Cleanup (Week 12)

#### 9.1 Remove Old Code

Once confident in new implementation:

```bash
# Remove old chat components
rm -rf components/common/chat/old

# Remove old chat utilities
rm -rf utils/oldChat*

# Remove old chat types
rm -rf types/oldChat*

# Remove old chat API
rm -rf api/oldChat*
```

#### 9.2 Update Imports

```typescript
// Remove old imports
// import { ChatBox } from '@/components/common/chat/chat-box';
// import { useShowChat } from '@/hooks/useShowChat';
// import socketChannel from '@/utils/chatSocket';

// Use new imports (already done in previous phases)
import { ChatBox, useChat } from '@knky-chat/chat-ui';
```

#### 9.3 Clean Up Dependencies

```bash
# Remove unused dependencies
pnpm remove old-chat-dependency-1 old-chat-dependency-2

# Update package.json
pnpm install
```

#### 9.4 Update Documentation

- Update project README
- Update component documentation
- Update API documentation
- Create migration guide for future developers
- Archive old implementation (if needed for reference)

## Post-Migration

### Monitoring & Maintenance

1. **Error Tracking**: Monitor for knky-chat specific errors
2. **Performance**: Track bundle size and runtime performance
3. **Usage Metrics**: Monitor feature usage to guide future development
4. **User Feedback**: Collect feedback on new implementation

### Ongoing Development

- All new chat features go into knky-chat
- Platform-specific features added to adapters
- Regular dependency updates for knky-chat packages
- Backward compatibility maintained for major version updates

## Rollback Procedures

### Immediate Rollback

If critical issues are detected:

1. **Disable feature flag:**
   ```bash
   NEXT_PUBLIC_USE_NEW_CHAT=false
   ```

2. **Deploy old version:**
   ```bash
   git revert <migration-commit>
   pnpm deploy
   ```

3. **Notify team** of rollback
4. **Investigate issue**
5. **Fix and re-migrate**

### Partial Rollback

If specific features have issues:

```typescript
// Mix old and new implementations
const USE_NEW_CHATBOX = false;
const USE_NEW_CHATLIST = true;

const ChatPage = () => (
  <div>
    {USE_NEW_CHATLIST ? <NewChatList /> : <OldChatList />}
    {USE_NEW_CHATBOX ? <NewChatBox /> : <OldChatBox />}
  </div>
);
```

## Success Criteria

Migration is considered successful when:

- [ ] All chat features work correctly in both platforms
- [ ] No regression in performance
- [ ] Error rates are lower or equal to old implementation
- [ ] User satisfaction is maintained or improved
- [ ] Development velocity for new features increases
- [ ] Code duplication is reduced by ~80%
- [ ] Both platforms can use the same knky-chat version
- [ ] Documentation is complete and accurate
- [ ] Team is trained on new architecture

## Timeline Summary

| Phase | Duration | Key Activities |
|-------|----------|---------------|
| 1. Setup & Integration | 1 week | Install packages, create config, set up provider |
| 2. Component Replacement | 3 weeks | Replace UI components incrementally |
| 3. State Migration | 2 weeks | Migrate Redux store and state management |
| 4. Hooks Migration | 1 week | Replace custom hooks with knky-chat hooks |
| 5. Socket Integration | 1 week | Migrate socket connection and events |
| 6. API Integration | 1 week | Migrate API calls to adapter-based |
| 7. Testing & Validation | 1 week | Comprehensive testing across platforms |
| 8. Feature Flag Removal | 1 week | Gradual rollout and monitoring |
| 9. Cleanup | 1 week | Remove old code and documentation |

**Total Duration**: 12 weeks

## Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|-------|---------|--------------|------------|
| Breaking changes in knky-chat | High | Medium | Version management, backward compatibility |
| Performance regression | High | Low | Performance testing, gradual rollout |
| User resistance | Medium | Low | UI/UX consistency, user training |
| Integration bugs | High | Medium | Comprehensive testing, rollback plan |
| Dependency conflicts | Medium | Low | Strict version management, peer dependencies |
| State migration issues | High | Medium | Migration utilities, state transformation |
| Bundle size increase | Medium | Low | Tree-shaking, code splitting |

## Support During Migration

### Developer Resources

- Migration guide (this document)
- Component migration examples
- API reference documentation
- Storybook for UI components
- Troubleshooting guide

### Support Channels

- Technical lead office hours
- Slack channel for migration questions
- Regular progress meetings
- Emergency rollback procedures

## Conclusion

This migration strategy provides a systematic approach to integrating knky-chat into both platforms with minimal risk and maximum control. The gradual, phased approach ensures that:

1. Both platforms remain functional throughout migration
2. Issues can be detected and resolved early
3. Rollback is always possible
4. Team can adapt to new architecture incrementally
5. Knowledge transfer happens naturally during the process

The configuration-based approach ensures that knky-chat remains truly platform-agnostic, with all logic residing within the micro frontend and platforms providing only configuration parameters.
