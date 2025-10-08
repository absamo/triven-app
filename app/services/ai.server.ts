import { generateText, streamText, type CoreMessage } from 'ai'
import { DEFAULT_MODELS, MODEL_CONFIGS, ollama } from '~/app/lib/ai-sdk-ollama'

/**
 * Generate text using Ollama models with improved timeout handling
 */
export async function generateTextWithOllama(
  prompt: string,
  model: string = DEFAULT_MODELS.chat,
  config: any = MODEL_CONFIGS.balanced
) {
  try {
    const result = await generateText({
      model: ollama(model),
      prompt,
      maxOutputTokens: 1000,
      ...config,
      maxRetries: 2,
      abortSignal: AbortSignal.timeout(60000), // 1 minute timeout
    })

    if ('text' in result) {
      return {
        success: true,
        text: result.text,
        usage: result.usage,
      }
    } else {
      return {
        success: false,
        error: 'Invalid result format',
      }
    }
  } catch (error) {
    console.error('AI generateText error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

/**
 * Stream text using Ollama models
 */
export async function streamTextWithOllama(
  prompt: string,
  options: {
    model?: string
    temperature?: number
    systemPrompt?: string
  } = {}
) {
  try {
    const { model = DEFAULT_MODELS.chat, temperature = 0.7, systemPrompt } = options

    const messages: CoreMessage[] = []

    if (systemPrompt) {
      messages.push({
        role: 'system',
        content: systemPrompt,
      })
    }

    messages.push({
      role: 'user',
      content: prompt,
    })

    const result = await streamText({
      model: ollama(model),
      messages,
      temperature,
      maxOutputTokens: 1000,
      abortSignal: AbortSignal.timeout(60000), // 1 minute timeout
    })

    return {
      success: true,
      stream: result.textStream,
      usage: result.usage,
    }
  } catch (error) {
    console.error('AI streamText error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

/**
 * Generate embeddings for text
 */
export async function generateEmbedding(text: string) {
  try {
    // Note: This would require a separate embedding model
    // For now, we'll return a placeholder implementation
    console.warn('Embedding generation requires a separate embedding model configuration')

    return {
      success: false,
      error: 'Embedding model not configured. Please set up nomic-embed-text or similar.',
      embedding: [],
    }
  } catch (error) {
    console.error('AI embedding error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Embedding failed',
    }
  }
}

/**
 * Analyze business data with AI - optimized version
 */
export async function analyzeBusinessData(
  data: any,
  analysisType: 'inventory' | 'sales' | 'trends' | 'summary' = 'summary'
) {
  // Simplified prompt for better performance
  const prompt = `Analyze this ${analysisType} data and provide 3 key insights with recommendations: ${JSON.stringify(data, null, 2)}`

  return generateTextWithOllama(prompt, DEFAULT_MODELS.chat, {
    // Use faster model
    temperature: MODEL_CONFIGS.precise.temperature,
    maxOutputTokens: 1000, // Reduced from 2000
  })
}

/**
 * Generate product descriptions with optimized settings
 */
export async function generateProductDescription(
  productName: string,
  features: string[],
  category?: string
) {
  // Use a more concise prompt to reduce processing time
  const prompt = `Create a professional product description for ${productName} (${category || 'General'}). Features: ${features.join(', ')}. Keep it engaging, 2-3 sentences, highlight key benefits.`

  return generateTextWithOllama(prompt, DEFAULT_MODELS.chat, {
    temperature: MODEL_CONFIGS.creative.temperature,
    maxOutputTokens: 300, // Reduced from 500
  })
}

/**
 * Chat completion with conversation history
 */
export async function chatCompletion(
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  options: {
    model?: string
    temperature?: number
    maxTokens?: number
  } = {}
) {
  try {
    const { model = DEFAULT_MODELS.chat, temperature = 0.7, maxTokens = 1000 } = options

    // Convert to CoreMessage format
    const coreMessages: CoreMessage[] = messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }))

    const result = await generateText({
      model: ollama(model),
      messages: coreMessages,
      temperature,
      maxOutputTokens: maxTokens,
      abortSignal: AbortSignal.timeout(60000), // 1 minute timeout
    })

    if ('text' in result) {
      return {
        success: true,
        message: result.text,
        usage: result.usage,
      }
    } else {
      return {
        success: false,
        error: 'Invalid result format',
      }
    }
  } catch (error) {
    console.error('AI chat completion error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Chat completion failed',
    }
  }
}

// Helper function for simple text generation (convenience function)
export async function generateAIText(prompt: string, model?: string, config?: any) {
  return generateTextWithOllama(prompt, model, config)
}

// Helper function for simple streaming (convenience function)
export async function streamAIText(
  prompt: string,
  options?: {
    model?: string
    temperature?: number
    systemPrompt?: string
  }
) {
  return streamTextWithOllama(prompt, options)
}
