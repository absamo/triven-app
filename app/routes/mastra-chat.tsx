import {
  ActionIcon,
  Avatar,
  Box,
  Button,
  Center,
  Container,
  Group,
  Paper,
  ScrollArea,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  Textarea,
  UnstyledButton,
} from '@mantine/core'
import { IconRobot, IconSend, IconSparkles } from '@tabler/icons-react'
import type { CoreMessage } from 'ai'
import dayjs from 'dayjs'
import { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import type { ActionFunctionArgs, MetaFunction } from 'react-router'
import { useFetcher } from 'react-router'
import remarkGfm from 'remark-gfm'
import { getInventoryAgent } from '~/app/lib'
import classes from './mastra-chat.module.css'

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
  isStreaming?: boolean
}

const MarkdownComponents: any = {
  p: ({ children, ...props }: any) => (
    <Text size="sm" mb="xs" {...props}>
      {children}
    </Text>
  ),
  h1: ({ children, ...props }: any) => (
    <Text size="lg" fw={700} mb="md" {...props}>
      {children}
    </Text>
  ),
  h2: ({ children, ...props }: any) => (
    <Text size="md" fw={700} mb="sm" {...props}>
      {children}
    </Text>
  ),
  h3: ({ children, ...props }: any) => (
    <Text size="sm" fw={700} mb="sm" {...props}>
      {children}
    </Text>
  ),
  li: ({ children, ...props }: any) => (
    <li style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }} {...props}>
      {children}
    </li>
  ),
  table: ({ children, ...props }: any) => (
    <Box mb="lg" style={{ overflowX: 'auto', border: '1px solid var(--mantine-color-dark-4)', borderRadius: '0.5rem' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'var(--mantine-color-dark-6)' }} {...props}>
        {children}
      </table>
    </Box>
  ),
  thead: ({ children, ...props }: any) => (
    <thead style={{ backgroundColor: 'var(--mantine-color-dark-5)' }} {...props}>
      {children}
    </thead>
  ),
  th: ({ children, ...props }: any) => (
    <th style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--mantine-color-gray-1)', padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid var(--mantine-color-dark-4)' }} {...props}>
      {children}
    </th>
  ),
  td: ({ children, ...props }: any) => (
    <td style={{ fontSize: '0.875rem', color: 'var(--mantine-color-gray-2)', padding: '0.75rem', borderBottom: '1px solid var(--mantine-color-dark-4)' }} {...props}>
      {children}
    </td>
  ),
  code: ({ children, className, ...props }: any) => {
    const isInline = !className
    if (isInline) {
      return (
        <Text span style={{ backgroundColor: 'var(--mantine-color-dark-5)', color: 'var(--mantine-color-gray-1)', fontFamily: 'Monaco, Consolas, monospace', fontSize: '0.85em', padding: '0.125rem 0.25rem', borderRadius: '0.25rem' }} {...props}>
          {children}
        </Text>
      )
    }
    return (
      <Box p="md" mb="sm" style={{ backgroundColor: 'var(--mantine-color-dark-6)', border: '1px solid var(--mantine-color-dark-4)', borderRadius: '0.5rem', fontFamily: 'Monaco, Consolas, monospace', fontSize: '0.875rem' }}>
        <Text style={{ whiteSpace: 'pre-wrap', color: 'var(--mantine-color-gray-1)' }}>{children}</Text>
      </Box>
    )
  },
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
              fullResponse += '| Name | SKU | Category | Stock | Status |\n'
              fullResponse += '|------|-----|----------|-------|--------|\n'
              
              for (const product of products) {
                fullResponse += `| ${product.name} | ${product.sku} | ${product.category} | ${product.stock} | ${product.status} |\n`
              }
              
              fullResponse += `\n**Found:** ${part.output.count} low stock items (threshold: ${part.output.threshold})`
            } else if (part.type === 'tool-getOutOfStockProducts' && part.output.products) {
              const products = part.output.products
              fullResponse += '\n\n### Out of Stock Products\n\n'
              fullResponse += '| Name | SKU | Category | Price | Status |\n'
              fullResponse += '|------|-----|----------|-------|--------|\n'
              
              for (const product of products) {
                fullResponse += `| ${product.name} | ${product.sku} | ${product.category} | ${product.price} | ${product.status} |\n`
              }
              
              fullResponse += `\n**Total:** ${part.output.count} products out of stock`
            } else if (part.type === 'tool-searchProducts' && part.output.products) {
              const products = part.output.products
              const count = part.output.found || part.output.total || products.length
              fullResponse += `\n\n### Search Results for "${part.output.query || 'products'}"\n\n`
              
              if (products.length > 0) {
                fullResponse += '| Name | SKU | Category | Stock | Price | Status |\n'
                fullResponse += '|------|-----|----------|-------|-------|--------|\n'
                
                for (const product of products) {
                  fullResponse += `| ${product.name} | ${product.sku} | ${product.category} | ${product.stock} | ${product.price} | ${product.status || 'N/A'} |\n`
                }
                
                fullResponse += `\n**Found:** ${count} product${count !== 1 ? 's' : ''}`
              } else {
                fullResponse += 'No products found matching your search criteria.'
              }
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
  }, [messages.length, isLoading])

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

  const formatTimestamp = (date: Date) => {
    const messageDate = dayjs(date)
    const now = dayjs()

    if (messageDate.isSame(now, 'day')) {
      return messageDate.format('h:mm A')
    } else if (messageDate.isSame(now.subtract(1, 'day'), 'day')) {
      return 'Yesterday'
    } else {
      if (messageDate.isSame(now, 'year')) {
        return messageDate.format('MMM D')
      } else {
        return messageDate.format('MMM D, YYYY')
      }
    }
  }

  const shouldShowTimestamp = (currentMessage: Message, previousMessage?: Message) => {
    if (!previousMessage) return true

    const currentTime = dayjs(currentMessage.timestamp)
    const previousTime = dayjs(previousMessage.timestamp)

    return currentTime.diff(previousTime, 'minute') > 5
  }

  const currentHour = dayjs().hour()

  const exampleQuestions = [
    { title: 'Show me all products', icon: '📦' },
    { title: 'What are my inventory statistics?', icon: '📊' },
    { title: 'Which products are low on stock?', icon: '⚠️' },
    { title: 'Search for electronics', icon: '🔍' },
    { title: 'Show out of stock items', icon: '❌' },
    { title: 'What products need reordering?', icon: '🔄' },
  ]

  return (
    <Box className={classes.chatContainer}>
      {messages.length === 0 ? (
        <Container size="md" h="100%" p={0}>
          <Center h="100%">
            <Stack align="center" gap="xl">
              <Box ta="center">
                <IconSparkles
                  size={64}
                  style={{ color: 'var(--mantine-color-teal-4)', marginBottom: '1rem' }}
                />
                <Text size="xl" fw={600} mb="xs">
                  {currentHour < 12
                    ? 'Good Morning'
                    : currentHour < 18
                      ? 'Good Afternoon'
                      : 'Good Evening'}
                </Text>
                <Text size="md" c="dimmed" ta="center" lh={1.5}>
                  I'm your intelligent inventory assistant powered by Mastra framework. Ask me about
                  your products, inventory levels, or get insights about your stock!
                </Text>
              </Box>

              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm" w="100%">
                {exampleQuestions.map((question, index) => (
                  <UnstyledButton
                    key={index}
                    className={classes.exampleCard}
                    onClick={() => setInputValue(question.title)}
                  >
                    <Group gap="sm" align="center">
                      <Text size="lg">{question.icon}</Text>
                      <Text size="sm" c="dimmed" fw={500}>
                        {question.title}
                      </Text>
                    </Group>
                  </UnstyledButton>
                ))}
              </SimpleGrid>
            </Stack>
          </Center>
        </Container>
      ) : (
        <ScrollArea ref={viewport} className={classes.messagesScrollArea}>
          <Stack gap="lg">
            {messages.map((message, index) => {
              const previousMessage = index > 0 ? messages[index - 1] : undefined
              const showTimestamp = shouldShowTimestamp(message, previousMessage)

              return (
                <Box key={message.id}>
                  {showTimestamp && (
                    <Text size="xs" c="dimmed" ta="center" mb="md">
                      {formatTimestamp(message.timestamp)}
                    </Text>
                  )}

                  <Group align="flex-start" gap="md">
                    <Avatar
                      size="md"
                      radius="xl"
                      color={message.role === 'user' ? 'blue' : 'teal'}
                    >
                      {message.role === 'user' ? 'U' : <IconSparkles size={16} />}
                    </Avatar>

                    <Box flex={1} maw="100%">
                      {message.role === 'assistant' ? (
                        <Box>
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={MarkdownComponents}
                          >
                            {message.content || (message.isStreaming ? '' : 'No response generated')}
                          </ReactMarkdown>
                          {message.isStreaming && !message.content && (
                            <Stack gap="xs">
                              <Skeleton height={8} radius="xl" />
                              <Skeleton height={8} width="70%" radius="xl" />
                              <Skeleton height={8} width="40%" radius="xl" />
                            </Stack>
                          )}
                        </Box>
                      ) : (
                        <Text size="sm">{message.content}</Text>
                      )}
                    </Box>
                  </Group>
                </Box>
              )
            })}

            {isLoading && (
              <Group align="flex-start" gap="md">
                <Avatar size="md" radius="xl" color="teal">
                  <IconSparkles size={16} />
                </Avatar>
                <Box flex={1}>
                  <Stack gap="xs">
                    <Skeleton height={8} radius="xl" />
                    <Skeleton height={8} width="70%" radius="xl" />
                    <Skeleton height={8} width="40%" radius="xl" />
                  </Stack>
                </Box>
              </Group>
            )}
          </Stack>
        </ScrollArea>
      )}

      <Paper radius="md" withBorder p="md" className={classes.inputContainer}>
        <form onSubmit={handleSubmit}>
          <Group gap="sm" align="flex-end">
            <Textarea
              placeholder={isLoading ? 'Please wait...' : 'Ask me anything about your inventory...'}
              value={inputValue}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInputValue(e.target.value)}
              disabled={isLoading}
              autosize
              minRows={1}
              maxRows={6}
              variant="unstyled"
              size="sm"
              className={classes.messageInput}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
                  e.preventDefault()
                  handleSubmit(e)
                }
              }}
              style={{ flex: 1 }}
              autoFocus
            />
            <ActionIcon
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              variant="filled"
              color="teal"
              size="lg"
              radius="xl"
              loading={isLoading}
              className={classes.sendButton}
            >
              {!isLoading && <IconSend size={18} />}
            </ActionIcon>
          </Group>
        </form>
      </Paper>
      <Text size="xs" c="dimmed" ta="center" mt="xs">
        Press Enter to send, Shift + Enter for new line
      </Text>
    </Box>
  )
}
