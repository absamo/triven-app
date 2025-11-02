# Mastra AI Integration - Proof of Concept

## Overview

This POC demonstrates integrating **Mastra AI framework** with Triven's inventory management system using:
- ✅ **Mastra Core** (`@mastra/core`) - Agent framework
- ✅ **AI SDK v5** (`ai` package) - Model integration layer
- ✅ **Cloud Ollama** - Minimax M2 model via Ollama cloud API
- ✅ **Inventory Tools** - Real database integration with Prisma

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Mastra AI Agent                          │
│  (Inventory Assistant with Natural Language Interface)     │
└──────────────────┬──────────────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
   ┌────▼─────┐        ┌─────▼────────┐
   │ AI Model │        │ Tool System  │
   │ (Cloud)  │        │ (4 Tools)    │
   └────┬─────┘        └─────┬────────┘
        │                    │
        │              ┌─────▼────────────────────┐
        │              │ - getProducts            │
        │              │ - searchProducts         │
        │              │ - getInventoryStats      │
        │              │ - getLowStockProducts    │
        │              └──────────┬───────────────┘
        │                         │
   ┌────▼─────────────────────────▼──────┐
   │   Ollama Cloud API                  │
   │   (Minimax M2 Model)                │
   └─────────────────────────────────────┘
```

## Files Created

### 1. **`app/lib/mastra-config.ts`**
Central configuration file that:
- Configures cloud Ollama connection with API key
- Defines the `inventoryAgent` with personality and instructions
- Implements 4 inventory management tools
- Exports Mastra instance and agent getter

### 2. **`app/routes/mastra-chat.tsx`**
Full-stack chat interface that:
- Provides beautiful gradient UI with Mantine components
- Handles conversation history (multi-turn chat)
- Displays markdown-formatted responses
- Shows loading states and error handling
- Includes suggested prompts for quick start

## Environment Variables

Add to your `.env` file:

```env
# Ollama Cloud Configuration (for Mastra AI POC)
OLLAMA_API_KEY="604e131f1ce74bb09ea5f5cfa469fbb7.20xiAvKRJa9UpRAW8AEarlrJ"
OLLAMA_BASE_URL="https://ollama.com"
OLLAMA_MODEL="minimax-m2:cloud"
```

## Installation & Setup

1. **Install dependencies:**
```bash
npm install
# or
bun install
```

2. **Set environment variables:**
Copy the Ollama cloud credentials to your `.env` file (already in `.env.example`)

3. **Generate Prisma client:**
```bash
npm run db:gen
```

4. **Start the development server:**
```bash
npm run dev
```

5. **Visit the Mastra chat interface:**
```
http://localhost:3000/mastra-chat
```

## Features

### Intelligent Agent
- **Natural Language Understanding**: Responds to inventory queries in plain English or French
- **Tool Calling**: Automatically selects and executes the right tools based on user intent
- **Conversation Memory**: Maintains context across multiple messages
- **Multi-step Reasoning**: Can perform complex queries requiring multiple tool calls

### Available Tools

#### 1. `getProducts`
Retrieves products from the database with optional limit.
```typescript
// Example queries:
"Show me all products"
"List the first 20 products"
"Affiche-moi tous les produits" (French)
```

#### 2. `searchProducts`
Searches products by name, SKU, or category.
```typescript
// Example queries:
"Search for laptop"
"Find products with SKU ABC"
"Show me products in electronics category"
```

#### 3. `getInventoryStats`
Provides overall inventory statistics and health metrics.
```typescript
// Example queries:
"What are my inventory statistics?"
"Give me an overview of my inventory"
"How is my stock doing?"
```

#### 4. `getLowStockProducts`
Identifies products running low on stock.
```typescript
// Example queries:
"Which products are low on stock?"
"Show me items that need reordering"
"Alert me about low inventory"
```

## Key Differences from Original Ollama Implementation

| Feature | Original (Ollama) | Mastra AI POC |
|---------|------------------|---------------|
| **Model** | Local llama3.1:8b | Cloud Minimax M2 |
| **Framework** | Custom implementation | Mastra framework |
| **Tool Calling** | Manual with custom logic | Built-in agent tools |
| **Memory** | Session-based only | Persistent (can add DB) |
| **Error Handling** | Basic try/catch | Framework-level retries |
| **Streaming** | Custom SSE | AI SDK v5 compatible |
| **Multi-turn** | Manual history management | Automatic context |

## Advantages of Mastra

1. **🎯 Abstraction**: Higher-level API than raw Ollama
2. **🔧 Tool System**: Built-in function calling with validation
3. **🧠 Memory**: Persistent conversation history (optional DB)
4. **🔄 Reliability**: Automatic retries and error handling
5. **📊 Observability**: Built-in logging and tracing
6. **🌐 Multi-provider**: Easy to switch between OpenAI, Anthropic, Ollama, etc.
7. **🔗 Workflows**: Can orchestrate complex multi-agent tasks

## Testing the POC

Try these sample queries:

1. **Basic retrieval:**
   - "Show me all products"
   - "List 10 products"

2. **Search:**
   - "Search for [product name]"
   - "Find products with SKU [code]"

3. **Analytics:**
   - "What are my inventory statistics?"
   - "How many products do I have?"

4. **Alerts:**
   - "Which products are low on stock?"
   - "Show me out-of-stock items"

5. **French language:**
   - "Montre-moi tous les produits"
   - "Quelles sont mes statistiques d'inventaire?"

## Next Steps (Production)

To move from POC to production:

1. **Add Memory Persistence:**
```typescript
import { Memory } from '@mastra/memory'
import { LibSQLStore } from '@mastra/libsql'

const agent = new Agent({
  // ...
  memory: new Memory({
    storage: new LibSQLStore({ url: process.env.DATABASE_URL })
  })
})
```

2. **Add Model Fallbacks:**
```typescript
model: [
  {
    model: ollama('minimax-m2:cloud'),
    maxRetries: 2,
    enabled: true
  },
  {
    model: 'openai/gpt-4o-mini',
    maxRetries: 1,
    enabled: !!process.env.OPENAI_API_KEY
  }
]
```

3. **Add User Authentication:**
   - Scope conversations per user
   - Use session-based thread IDs

4. **Add Observability:**
```typescript
import { PinoLogger } from '@mastra/loggers'

const mastra = new Mastra({
  logger: new PinoLogger({
    name: 'Triven-AI',
    level: 'info'
  })
})
```

5. **Implement Streaming:**
```typescript
const stream = await agent.stream(messages, {
  format: 'aisdk',
  memory: { thread: userId }
})
return stream.toUIMessageStreamResponse()
```

## Comparison with Other AI Assistants

| Route | Framework | Model | Features |
|-------|-----------|-------|----------|
| `/simple-chat` | Custom | Local Ollama | Basic chat, manual tools |
| `/assistant/chat` | AI SDK | Local Ollama | Advanced tools, streaming |
| `/mastra-chat` | **Mastra AI** | **Cloud Ollama** | **Agent framework, built-in memory** |

## Troubleshooting

**Error: Cannot find module '@mastra/core'**
- Run `npm install` to install Mastra dependencies

**Error: Failed to connect to Ollama cloud**
- Check that `OLLAMA_API_KEY` is set correctly
- Verify `OLLAMA_BASE_URL` is `https://ollama.com`
- Ensure your API key is valid

**TypeScript errors:**
- Run `npm run typecheck` after installing packages
- The packages will be installed and types will be available

## Resources

- [Mastra Documentation](https://mastra.ai/docs)
- [Mastra GitHub](https://github.com/mastra-ai/mastra)
- [AI SDK v5 Documentation](https://sdk.vercel.ai/docs)
- [Ollama Cloud API](https://ollama.com)

---

**Built with ❤️ for Triven - AI-Powered Inventory Management**
