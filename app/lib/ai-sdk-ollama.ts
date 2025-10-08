import { createOllama } from 'ai-sdk-ollama'

// Initialize Ollama with local configuration
export const ollama = createOllama({
  baseURL: 'http://127.0.0.1:11434', // Use 127.0.0.1 instead of localhost
})

// Available models - can be configured based on what's installed
export const OLLAMA_MODELS = {
  LLAMA3_1_8B: 'llama3.1:8b',
  LLAMA3_2_3B: 'llama3.2:3b',
} as const

// Default model for different use cases
export const DEFAULT_MODELS = {
  chat: OLLAMA_MODELS.LLAMA3_1_8B, // Use llama3.1:8b for all operations
  analysis: OLLAMA_MODELS.LLAMA3_1_8B, // Better for complex analysis
  embedding: 'nomic-embed-text', // For embeddings (if available)
} as const

// Common model configurations
export const MODEL_CONFIGS = {
  creative: {
    temperature: 0.8,
    topP: 0.9,
  },
  precise: {
    temperature: 0.1,
    topP: 0.3,
  },
  balanced: {
    temperature: 0.5,
    topP: 0.7,
  },
} as const
