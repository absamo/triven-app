import { PrismaClient } from '@prisma/client'

let prisma: PrismaClient

declare global {
  var __db__: PrismaClient
}

// Context tracking for Ollama-related operations
class OllamaContext {
  private static instance: OllamaContext
  private isOllamaRequest = false
  private requestStack: string[] = []

  static getInstance(): OllamaContext {
    if (!OllamaContext.instance) {
      OllamaContext.instance = new OllamaContext()
    }
    return OllamaContext.instance
  }

  enableOllamaLogging(source: string = 'unknown') {
    this.isOllamaRequest = true
    this.requestStack.push(source)
  }

  disableOllamaLogging() {
    this.requestStack.pop()
    this.isOllamaRequest = this.requestStack.length > 0
  }

  isOllamaActive(): boolean {
    return this.isOllamaRequest
  }

  getCurrentSource(): string {
    return this.requestStack[this.requestStack.length - 1] || 'unknown'
  }
}

// Export the context instance for use in Ollama services
export const ollamaContext = OllamaContext.getInstance()

// this is needed because in development we don't want to restart
// the server with every change, but we want to make sure we don't
// create a new connection to the DB with every change either.
// in production we'll have a single connection to the DB.
if (process.env.NODE_ENV === 'production') {
  prisma = getClient()
} else {
  if (!global.__db__) {
    global.__db__ = getClient()
  }
  prisma = global.__db__
}

function getClient() {
  const DATABASE_URL = process.env.DATABASE_URL

  if (typeof DATABASE_URL !== 'string') {
    throw new Error('DATABASE_URL env var not set')
  }

  const databaseUrl = new URL(DATABASE_URL)

  // NOTE: during development if you change anything in this function, remember
  // that this only runs once per server restart and won't automatically be
  // re-run per request like everything else is. So if you need to change
  // something in this file, you'll need to manually restart the server.
  const client = new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl.toString(),
      },
    },
    errorFormat: 'pretty',
    log: [
      {
        emit: 'event',
        level: 'query',
      },
      {
        emit: 'stdout',
        level: 'error',
      },
      {
        emit: 'stdout',
        level: 'info',
      },
      {
        emit: 'stdout',
        level: 'warn',
      },
    ],
  })

  // Add conditional query logging - only when called from Ollama
  client.$on('query', (e) => {
    const context = OllamaContext.getInstance()

    // Only log when called from Ollama services
    if (context.isOllamaActive()) {
      const source = context.getCurrentSource()
      console.log(
        `[${new Date().toISOString()}] ⏱️ OLLAMA-PRISMA [${source}] DURATION: ${e.duration}ms`
      )

      // Log slow queries (over 100ms) with special attention for Ollama
      if (e.duration > 100) {
        console.log(
          `[${new Date().toISOString()}] 🐌 OLLAMA SLOW QUERY [${source}]: ${e.duration}ms`
        )
      }
    }
  })

  // connect eagerly
  client.$connect()

  return client
}

export { prisma }
