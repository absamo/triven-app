import { Box, Button, Group, Paper, ScrollArea, Stack, Text, TextInput, Title } from '@mantine/core'
import { IconRobot, IconSend, IconSparkles, IconUser } from '@tabler/icons-react'
import type { CoreMessage } from 'ai'
import { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import type { ActionFunctionArgs, MetaFunction } from 'react-router'
import { useFetcher } from 'react-router'
import remarkGfm from 'remark-gfm'
import { getInventoryAgent } from '~/app/lib'

export const meta: MetaFunction = () => {
  return [
    { title: 'Mastra AI Chat - Triven App' },
    { name: 'description', content: 'AI-powered inventory assistant using Mastra framework' },
  ]
}

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData()
  const message = formData.get('message') as string
  const conversationHistory = formData.get('history') as string

  console.log('📨 Received message:', message)

  if (!message?.trim()) {
    return { error: 'Message is required' }
  }

  try {
    console.log('🤖 Getting agent...')
    const agent = getInventoryAgent()

    console.log('🔍 Agent check:', agent ? 'Agent found' : 'Agent is null')

    if (!agent) {
      console.error('❌ Agent not initialized')
      return {
        error: 'Agent not initialized',
        details: 'The inventory agent could not be loaded',
      }
    }

    // Parse conversation history
    const history: Message[] = conversationHistory ? JSON.parse(conversationHistory) : []
    console.log('📜 History length:', history.length)

    // Build messages array in Mastra format (CoreMessage from AI SDK)
    const messages: CoreMessage[] = [
      ...history.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      { role: 'user', content: message },
    ]

    console.log('💬 Sending', messages.length, 'messages to agent')

    // Generate response using Mastra agent
    const result = await agent.generate(messages, {
      maxSteps: 5, // Allow multiple tool calls if needed
    })

    console.log('✅ Agent response received:', result.text?.substring(0, 100))
    console.log('🔧 Tool calls made:', result.steps?.length || 0)
    
    // Build complete response with tool outputs
    let fullResponse = result.text || ''
    
    // Extract tool results from response.uiMessages (runtime property not in TypeScript types)
    const responseWithUI = result.response as typeof result.response & { uiMessages?: any[] }
    
    if (responseWithUI?.uiMessages && responseWithUI.uiMessages.length > 0) {
      console.log('✅ Found uiMessages, count:', responseWithUI.uiMessages.length)
      const lastMessage = responseWithUI.uiMessages[responseWithUI.uiMessages.length - 1]
      
      if (lastMessage.parts) {
        for (const part of lastMessage.parts) {
          // Check for tool output parts
          if (part.type?.startsWith('tool-') && part.state === 'output-available' && part.output) {
            console.log('� Found tool output:', part.type)
            
            // Format the tool output based on the tool type
            if (part.type === 'tool-getProducts' && part.output.products) {
              const products = part.output.products
              fullResponse += '\n\n### Products Inventory\n\n'
              fullResponse += '| Name | SKU | Category | Stock | Price | Status |\n'
              fullResponse += '|------|-----|----------|-------|-------|--------|\n'
              
              for (const product of products) {
                fullResponse += `| ${product.name} | ${product.sku} | ${product.category} | ${product.stock} | ${product.price} | ${product.status} |\n`
              }
              
              fullResponse += `\n**Total:** ${part.output.total} products`
            } else if (part.type === 'tool-getInventoryStats' && part.output) {
              fullResponse += '\n\n### Inventory Statistics\n\n'
              fullResponse += `- **Total Products:** ${part.output.totalProducts}\n`
              fullResponse += `- **Total Stock:** ${part.output.totalStock} units\n`
              fullResponse += `- **Low Stock Items:** ${part.output.lowStockCount}\n`
              fullResponse += `- **Out of Stock Items:** ${part.output.outOfStockCount}\n`
            } else if (part.type === 'tool-getLowStockProducts' && part.output.products) {
              const products = part.output.products
              fullResponse += '\n\n### Low Stock Products\n\n'
              fullResponse += '| Name | SKU | Stock | Status |\n'
              fullResponse += '|------|-----|-------|--------|\n'
              
              for (const product of products) {
                fullResponse += `| ${product.name} | ${product.sku} | ${product.stock} | ${product.status} |\n`
              }
            } else if (part.type === 'tool-searchProducts' && part.output.products) {
              const products = part.output.products
              fullResponse += '\n\n### Search Results\n\n'
              fullResponse += '| Name | SKU | Category | Stock | Price | Status |\n'
              fullResponse += '|------|-----|----------|-------|-------|--------|\n'
              
              for (const product of products) {
                fullResponse += `| ${product.name} | ${product.sku} | ${product.category} | ${product.stock} | ${product.price} | ${product.status} |\n`
              }
              
              fullResponse += `\n**Found:** ${part.output.total} products`
            }
          }
        }
      }
    }

    return {
      success: true,
      response: fullResponse,
      toolCalls: result.steps?.length || 0,
    }
  } catch (error) {
    console.error('❌ Mastra chat error:', error)
    return {
      error: error instanceof Error ? error.message : 'Failed to process message',
      details:
        error instanceof Error
          ? error.stack
          : 'Make sure Ollama cloud connection is configured correctly',
    }
  }
}

export default function MastraChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const viewport = useRef<HTMLDivElement>(null)
  const fetcher = useFetcher()

  const isLoading = fetcher.state !== 'idle'

  // Handle fetcher response
  useEffect(() => {
    if (fetcher.data && fetcher.state === 'idle') {
      const data = fetcher.data as { error?: string; details?: string; response?: string }

      if (data.error) {
        const errorMessage: Message = {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: `❌ Error: ${data.error}\n\n${data.details || ''}`,
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, errorMessage])
      } else if (data.response) {
        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: data.response,
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, assistantMessage])
      }
    }
  }, [fetcher.data, fetcher.state])

  // Auto-scroll to bottom when new messages arrive
  // biome-ignore lint/correctness/useExhaustiveDependencies: Only scroll when message count changes
  useEffect(() => {
    if (viewport.current) {
      viewport.current.scrollTo({ top: viewport.current.scrollHeight, behavior: 'smooth' })
    }
  }, [messages.length])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!inputValue.trim() || isLoading) return

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])

    const formData = new FormData()
    formData.append('message', userMessage.content)
    formData.append('history', JSON.stringify(messages))

    fetcher.submit(formData, { method: 'POST' })
    setInputValue('')
  }

  const handleClear = () => {
    setMessages([])
    setInputValue('')
  }

  return (
    <Box
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--mantine-color-dark-7)',
      }}
    >
      {/* Header */}
      <Paper
        shadow="md"
        p="md"
        style={{
          borderRadius: 0,
          background: 'var(--mantine-color-dark-6)',
          borderBottom: '1px solid var(--mantine-color-dark-4)',
        }}
      >
        <Group justify="space-between" align="center">
          <Group gap="sm">
            <IconSparkles size={32} style={{ color: 'var(--mantine-color-violet-4)' }} />
            <div>
              <Title order={3} style={{ margin: 0, color: 'var(--mantine-color-violet-4)' }}>
                Mastra AI Assistant
              </Title>
              <Text size="sm" c="dimmed">
                Powered by Minimax M2 Cloud via Ollama
              </Text>
            </div>
          </Group>
          {messages.length > 0 && (
            <Button variant="light" color="red" onClick={handleClear} size="sm">
              Clear Chat
            </Button>
          )}
        </Group>
      </Paper>

      {/* Messages Area */}
      <ScrollArea flex={1} viewportRef={viewport} style={{ padding: '1rem' }} scrollbarSize={8}>
        {messages.length === 0 ? (
          <Stack align="center" justify="center" gap="xl" style={{ minHeight: '400px' }}>
            <IconRobot size={80} style={{ color: 'var(--mantine-color-violet-4)' }} opacity={0.6} />
            <Stack align="center" gap="xs">
              <Text size="xl" fw={600} style={{ color: 'var(--mantine-color-gray-2)' }}>
                Welcome to Mastra AI Chat! 🚀
              </Text>
              <Text size="md" style={{ color: 'var(--mantine-color-gray-4)' }} ta="center" maw={600}>
                I'm your intelligent inventory assistant powered by Mastra framework. Ask me about
                your products, inventory levels, or get insights about your stock!
              </Text>
            </Stack>
            <Stack gap="xs" style={{ marginTop: '1rem' }}>
              <Text size="sm" style={{ color: 'var(--mantine-color-gray-5)' }} fw={500}>
                Try asking:
              </Text>
              <Group gap="xs">
                <Button
                  variant="light"
                  color="violet"
                  size="xs"
                  onClick={() => setInputValue('Show me all products')}
                >
                  📦 Show me all products
                </Button>
                <Button
                  variant="light"
                  color="violet"
                  size="xs"
                  onClick={() => setInputValue('What are my inventory statistics?')}
                >
                  📊 Inventory statistics
                </Button>
                <Button
                  variant="light"
                  color="violet"
                  size="xs"
                  onClick={() => setInputValue('Which products are low on stock?')}
                >
                  ⚠️ Low stock items
                </Button>
              </Group>
            </Stack>
          </Stack>
        ) : (
          <Stack gap="md" maw={900} mx="auto">
            {messages.map((message) => (
              <Paper
                key={message.id}
                p="md"
                shadow="sm"
                style={{
                  alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '80%',
                  background: message.role === 'user' ? 'var(--mantine-color-violet-6)' : 'var(--mantine-color-dark-5)',
                  color: message.role === 'user' ? 'white' : 'var(--mantine-color-gray-2)',
                  border: message.role === 'assistant' ? '1px solid var(--mantine-color-dark-4)' : 'none',
                }}
              >
                <Group gap="xs" mb="xs">
                  {message.role === 'user' ? (
                    <IconUser size={20} />
                  ) : (
                    <IconRobot size={20} style={{ color: 'var(--mantine-color-violet-4)' }} />
                  )}
                  <Text size="sm" fw={600}>
                    {message.role === 'user' ? 'You' : 'Mastra AI'}
                  </Text>
                  <Text size="xs" opacity={0.7}>
                    {message.timestamp.toLocaleTimeString()}
                  </Text>
                </Group>
                <div style={{ lineHeight: 1.6 }}>
                  {message.role === 'assistant' ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                  ) : (
                    <Text>{message.content}</Text>
                  )}
                </div>
              </Paper>
            ))}
            {isLoading && (
              <Paper
                p="md"
                shadow="sm"
                style={{
                  alignSelf: 'flex-start',
                  maxWidth: '80%',
                  background: 'var(--mantine-color-dark-5)',
                  border: '1px solid var(--mantine-color-dark-4)',
                }}
              >
                <Group gap="xs">
                  <IconRobot size={20} style={{ color: 'var(--mantine-color-violet-4)' }} />
                  <Text size="sm" fw={600}>
                    Mastra AI
                  </Text>
                </Group>
                <Text size="sm" c="dimmed" mt="xs">
                  Thinking... 🤔
                </Text>
              </Paper>
            )}
          </Stack>
        )}
      </ScrollArea>

      {/* Input Area */}
      <Paper
        p="md"
        shadow="md"
        style={{
          borderRadius: 0,
          background: 'var(--mantine-color-dark-6)',
          borderTop: '1px solid var(--mantine-color-dark-4)',
        }}
      >
        <form onSubmit={handleSubmit}>
          <Group gap="xs" align="flex-end" maw={900} mx="auto">
            <TextInput
              flex={1}
              size="lg"
              placeholder="Ask me anything about your inventory..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isLoading}
              styles={{
                input: {
                  borderRadius: '24px',
                  paddingLeft: '1.5rem',
                },
              }}
            />
            <Button
              type="submit"
              size="lg"
              loading={isLoading}
              disabled={!inputValue.trim()}
              leftSection={<IconSend size={20} />}
              color="violet"
              variant="filled"
              style={{
                borderRadius: '24px',
              }}
            >
              Send
            </Button>
          </Group>
        </form>
      </Paper>
    </Box>
  )
}
