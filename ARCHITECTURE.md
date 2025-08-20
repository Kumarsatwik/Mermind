# Mermind - Architecture & Code Organization

This document outlines the improved architecture and code organization of the Mermind application.

## 📁 Folder Structure

```
mermaid-nextjs/
├── app/                          # Next.js App Router
│   ├── actions/                  # Server Actions (organized by feature)
│   │   ├── diagram-actions.ts    # Diagram generation actions
│   │   └── index.ts              # Action exports
│   ├── auth/                     # Authentication pages
│   ├── dashboard/                # Dashboard pages
│   └── ...
├── components/                   # React Components
│   ├── chat/                     # Chat feature components
│   │   ├── ChatContainer.tsx     # Main chat container
│   │   ├── ChatHeader.tsx        # Chat header with status
│   │   ├── ChatInput.tsx         # Message input component
│   │   ├── ChatWelcome.tsx       # Welcome screen
│   │   └── index.ts              # Chat exports
│   ├── ui/                       # shadcn/ui components
│   ├── shared/                   # Shared/reusable components
│   └── ...
├── lib/                          # Core library code
│   ├── services/                 # Business logic services
│   │   ├── ai-client.ts          # AI API clients (Groq, DeepSeek)
│   │   ├── conversation-service.ts # Conversation management
│   │   ├── diagram-service.ts    # Diagram generation logic
│   │   └── index.ts              # Service exports
│   ├── utils/                    # Utility functions
│   │   ├── storage.ts            # LocalStorage management
│   │   ├── id-generator.ts       # ID generation utilities
│   │   ├── validation.ts         # Data validation
│   │   ├── cn.ts                 # Class name utility
│   │   └── index.ts              # Utility exports
│   ├── constants/                # Application constants
│   │   └── index.ts              # Configuration constants
│   └── hooks/                    # Custom React hooks
│       ├── use-chat.ts           # Chat state management hook
│       └── index.ts              # Hook exports
├── types/                        # TypeScript type definitions
│   ├── chat.ts                   # Chat-related types
│   ├── diagram.ts                # Diagram-related types
│   ├── api.ts                    # API-related types
│   └── index.ts                  # Type exports
└── ...
```

## 🏗️ Architecture Principles

### 1. **Separation of Concerns**

- **Components**: UI logic and presentation
- **Services**: Business logic and external API calls
- **Utils**: Pure utility functions
- **Types**: Type definitions and interfaces
- **Constants**: Configuration and static values

### 2. **Feature-Based Organization**

- Components are organized by feature (e.g., `chat/`, `editor/`)
- Related functionality is grouped together
- Easy to locate and maintain feature-specific code

### 3. **Layered Architecture**

```
┌─────────────────┐
│   Components    │ ← UI Layer
├─────────────────┤
│     Hooks       │ ← State Management Layer
├─────────────────┤
│    Services     │ ← Business Logic Layer
├─────────────────┤
│     Utils       │ ← Utility Layer
└─────────────────┘
```

### 4. **Dependency Direction**

- Components depend on hooks and services
- Services depend on utils and constants
- Utils have no dependencies on higher layers
- Clean, unidirectional dependency flow

## 🔧 Key Services

### DiagramService

Handles all diagram-related operations:

- Diagram type identification
- Prompt improvement
- Mermaid code generation
- Conversation context integration

```typescript
const diagramService = new DiagramService();
const result = await diagramService.generateMermaidDiagram({
  prompt: "Create a flowchart for user login",
  conversationHistory: messages,
});
```

### ConversationService

Manages conversation state and context:

- Conversation type detection (new, continuation, resumed, topic switch)
- Context formatting for AI models
- Session metadata management

```typescript
const conversationService = new ConversationService();
const detection = conversationService.detectConversationType(
  messages,
  metadata
);
```

### AIClients (GroqClient, DeepSeekClient)

Abstracted AI API clients:

- Error handling and retry logic
- Configuration management
- Response validation

## 🎣 Custom Hooks

### useChat

Centralized chat state management:

- Message handling
- Conversation detection
- Diagram generation
- Storage persistence

```typescript
const { messages, isLoading, sendMessage, clearChat } =
  useChat(onDiagramGenerated);
```

## 📝 Type System

### Comprehensive Type Coverage

- **Chat Types**: Messages, state, actions, metadata
- **Diagram Types**: Generation requests, results, configurations
- **API Types**: Responses, configurations, error handling

### Type Safety Benefits

- Compile-time error detection
- Better IDE support and autocomplete
- Self-documenting code
- Easier refactoring

## 🔧 Utilities

### Storage Service

Abstracted localStorage operations:

- Type-safe storage operations
- Error handling
- Data serialization/deserialization

### Validation

Input validation utilities:

- Prompt validation
- Message validation
- Type guards

### ID Generation

Consistent ID generation:

- Message IDs
- Session IDs
- Request IDs

## 📊 Constants

Centralized configuration:

- API settings
- UI configuration
- Storage keys
- Diagram types and directives

## 🚀 Benefits of New Structure

### 1. **Maintainability**

- Clear separation of concerns
- Easy to locate specific functionality
- Reduced code duplication

### 2. **Scalability**

- Easy to add new features
- Modular architecture
- Independent testing of components

### 3. **Developer Experience**

- Better IDE support
- Clearer code organization
- Easier onboarding for new developers

### 4. **Type Safety**

- Comprehensive type coverage
- Compile-time error detection
- Better refactoring support

### 5. **Testability**

- Isolated business logic in services
- Pure utility functions
- Mockable dependencies

## 🔄 Migration Guide

### Old vs New Imports

**Before:**

```typescript
import { ChatMessage } from "@/lib/types/chat";
import { generateMermaidDiagram } from "@/app/actions";
import { cn } from "@/lib/utils";
```

**After:**

```typescript
import type { ChatMessage } from "@/types";
import { generateMermaidDiagram } from "@/app/actions";
import { cn } from "@/lib/utils";
```

### Component Usage

**Before:**

```typescript
// Large, monolithic Chat component
<Chat onDiagramGenerated={handleDiagram} />
```

**After:**

```typescript
// Composed, modular chat components
<ChatContainer onDiagramGenerated={handleDiagram} />
```

## 📈 Performance Improvements

1. **Code Splitting**: Modular structure enables better code splitting
2. **Tree Shaking**: Unused code is eliminated more effectively
3. **Bundle Size**: Reduced bundle size through better organization
4. **Loading**: Faster initial load times

## 🛠️ Development Workflow

1. **Adding New Features**: Follow the established patterns and folder structure
2. **Modifying Existing Code**: Update the relevant service or component
3. **Adding Types**: Add to the appropriate type file in `/types`
4. **Configuration Changes**: Update constants in `/lib/constants`

This improved architecture provides a solid foundation for continued development and maintenance of the Mermind application.
