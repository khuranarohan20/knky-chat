# knky-chat - Chat Micro Frontend

## Project Purpose

This is a platform-agnostic chat micro frontend that extracts shared chat logic and UI from `knky-frontend` (Next.js + Bootstrap) and `knky-agency-frontend` (React + Vite + Tailwind + shadcn) into a reusable package.

## Project Context

- **Created**: April 2026
- **Goal**: Reduce code duplication (~80%) between two platforms
- **Approach**: Monorepo with 4 packages (core-chat, business-logic, chat-ui, adapters)
- **Tech Stack**: React + Vite + Tailwind CSS + shadcn/ui + Redux Toolkit
- **Supported Platforms**:
  - `knky-frontend`: Next.js + Bootstrap (single creator)
  - `knky-agency-frontend`: React + Vite + Tailwind + shadcn (multi-creator)

## Architecture

```
knky-chat/
├── packages/
│   ├── core-chat/          # Pure chat logic (no UI)
│   ├── business-logic/     # Platform-agnostic business logic
│   ├── chat-ui/            # React UI components
│   └── adapters/           # Platform integration adapters
└── examples/               # Integration examples
```

## Key Design Principles

1. **Separation of Concerns**: UI, business logic, and platform-specific code are separated
2. **Composition Over Inheritance**: Use composition patterns for platform differences
3. **Dependency Inversion**: Depend on abstractions, not concrete implementations
4. **Single Responsibility**: Each component/function has one clear purpose

## Platform Differences

### Core Platform (knky-frontend)
- Single creator focus
- Flat state structure
- Bootstrap styling
- Next.js environment variables
- Single token authentication

### Agency Platform (knky-agency-frontend)
- Multi-creator support
- Nested state with creator isolation
- Tailwind + shadcn/ui styling
- Vite environment variables
- Per-creator token authentication

## Integration Approach

### As a Library (Recommended)

The knky-chat packages are distributed as npm packages and installed as dependencies:

```bash
pnpm add @knky-chat/adapters @knky-chat/chat-ui @knky-chat/business-logic @knky-chat/core-chat
```

### Configuration-Based

Platform-specific configuration is passed via adapter initialization:

```typescript
<ChatProvider
  adapter={new CoreAdapter({
    apiEndpoint: process.env.NEXT_PUBLIC_API_URL,
    converseProjectId: process.env.CONVERSE_PROJECT_ID,
    theme: 'bootstrap',
    auth: { getToken: () => getToken(), verifyToken: () => verifyToken() }
  })}
>
  <ChatBox />
</ChatProvider>
```

## Documentation Files

- **PROJECT_OVERVIEW.md**: Architecture, folder structure, package breakdown
- **IMPLEMENTATION_ROADMAP.md**: 14-week implementation timeline with phases
- **TECHNICAL_SPECIFICATIONS.md**: Technical details, types, interfaces
- **PLATFORM_DIFFERENCES.md**: Detailed comparison of platform differences
- **MIGRATION_STRATEGY.md**: How to integrate knky-chat into both platforms
- **README.md**: Quick start guide and usage examples

## When Working on This Project

1. **Understand the platform context**: Core (single creator) vs Agency (multi-creator)
2. **Follow the layered architecture**: Keep core logic separate from UI and adapters
3. **Use adapter pattern**: Abstract platform differences, don't hardcode platform-specific logic
4. **Maintain type safety**: Use TypeScript interfaces for all public APIs
5. **Test isolation**: Each package should be independently testable

## Migration Context

This project is designed to replace existing chat implementations in both platforms. The migration strategy is in MIGRATION_STRATEGY.md and includes:

1. Package installation as dependencies
2. Adapter configuration
3. Gradual component replacement
4. State migration
5. Testing and rollback procedures

## Current Status

- [x] Architecture planning
- [x] Documentation created
- [ ] Monorepo setup (pnpm workspace)
- [ ] Package skeleton creation
- [ ] Core chat logic extraction
- [ ] Business logic layer implementation
- [ ] UI components development
- [ ] Adapter implementation
- [ ] Integration testing
- [ ] Documentation updates
- [ ] Production deployment

## Key Insights from Code Review

- **~80% code similarity**: Both platforms have nearly identical chat logic
- **Main differences**: State management structure (flat vs nested) and UI framework (Bootstrap vs Tailwind)
- **Shared features**: Real-time messaging, seen receipts, pinning, filtering, etc.
- **API responses**: Identical between platforms
- **Socket client**: Same converse.svc-client SDK

## Important Notes

- All chat logic should be platform-agnostic
- UI components use Tailwind + shadcn/ui with Bootstrap compatibility layer
- Adapters handle platform-specific integration
- Configuration is injected, not hardcoded
- Backward compatibility is maintained during migration
