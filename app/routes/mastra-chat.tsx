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
  useMantineColorScheme,
} from '@mantine/core'
import { IconRobot, IconSend, IconSparkles } from '@tabler/icons-react'
import type { CoreMessage } from 'ai'
import dayjs from 'dayjs'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import ReactMarkdown from 'react-markdown'
import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from 'react-router'
import remarkGfm from 'remark-gfm'
import { eventStream } from 'remix-utils/sse/server'
import ClientOnly from '~/app/components/ClientOnly'
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
    <Box
      mb="lg"
      style={{
        overflowX: 'auto',
        border: '1px solid light-dark(var(--mantine-color-gray-3), var(--mantine-color-dark-4))',
        borderRadius: '0.5rem',
      }}
    >
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          backgroundColor: 'light-dark(var(--mantine-color-white), var(--mantine-color-dark-6))',
        }}
        {...props}
      >
        {children}
      </table>
    </Box>
  ),
  thead: ({ children, ...props }: any) => (
    <thead
      style={{
        backgroundColor: 'light-dark(var(--mantine-color-gray-1), var(--mantine-color-dark-5))',
      }}
      {...props}
    >
      {children}
    </thead>
  ),
  th: ({ children, ...props }: any) => (
    <th
      style={{
        fontWeight: 600,
        fontSize: '0.875rem',
        color: 'light-dark(var(--mantine-color-dark-7), var(--mantine-color-gray-1))',
        padding: '0.75rem',
        textAlign: 'left',
        borderBottom:
          '1px solid light-dark(var(--mantine-color-gray-3), var(--mantine-color-dark-4))',
      }}
      {...props}
    >
      {children}
    </th>
  ),
  td: ({ children, ...props }: any) => (
    <td
      style={{
        fontSize: '0.875rem',
        color: 'light-dark(var(--mantine-color-dark-6), var(--mantine-color-gray-2))',
        padding: '0.75rem',
        borderBottom:
          '1px solid light-dark(var(--mantine-color-gray-3), var(--mantine-color-dark-4))',
      }}
      {...props}
    >
      {children}
    </td>
  ),
  code: ({ children, className, ...props }: any) => {
    const isInline = !className
    if (isInline) {
      return (
        <Text
          span
          style={{
            backgroundColor: 'light-dark(var(--mantine-color-gray-1), var(--mantine-color-dark-5))',
            color: 'light-dark(var(--mantine-color-dark-7), var(--mantine-color-gray-1))',
            fontFamily: 'Monaco, Consolas, monospace',
            fontSize: '0.85em',
            padding: '0.125rem 0.25rem',
            borderRadius: '0.25rem',
          }}
          {...props}
        >
          {children}
        </Text>
      )
    }
    return (
      <Box
        p="md"
        mb="sm"
        style={{
          backgroundColor: 'light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-6))',
          border: '1px solid light-dark(var(--mantine-color-gray-3), var(--mantine-color-dark-4))',
          borderRadius: '0.5rem',
          fontFamily: 'Monaco, Consolas, monospace',
          fontSize: '0.875rem',
        }}
      >
        <Text
          style={{
            whiteSpace: 'pre-wrap',
            color: 'light-dark(var(--mantine-color-dark-7), var(--mantine-color-gray-1))',
          }}
        >
          {children}
        </Text>
      </Box>
    )
  },
}

// Loader for SSE streaming (GET requests)
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url)
  const message = url.searchParams.get('message')
  const historyJson = url.searchParams.get('history')

  // If no message parameter, this is a regular page load - return null to render the component
  if (!message) {
    return null
  }

  if (!message.trim()) {
    return new Response(JSON.stringify({ error: 'Message is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Important: Return the stream response immediately, don't await anything here
  return handleStreamingRequest(message, historyJson || '[]')
}

// Separate function to handle the streaming
async function handleStreamingRequest(message: string, historyJson: string) {
  try {
    const agent = getInventoryAgent()

    if (!agent) {
      return new Response(JSON.stringify({ error: 'Agent not initialized' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Parse conversation history
    const conversationHistory: Array<{ role: string; content: string }> = historyJson
      ? JSON.parse(historyJson)
      : []

    // Build messages array in Mastra format
    const messages: CoreMessage[] = [
      ...conversationHistory.map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      { role: 'user' as const, content: message },
    ]

    /**
     * Mastra Streaming Implementation
     *
     * Uses agent.stream() with onChunk callback to handle real-time streaming:
     * - 'text-delta' chunks: Contain streaming text content from the LLM
     * - 'tool-result' chunks: Contain results from tool executions
     *
     * The format is set to 'mastra' (native Mastra format) for consistent chunk types.
     * Each chunk is processed and forwarded to the client via Server-Sent Events (SSE).
     */

    // Create a manual SSE stream using ReadableStream
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        console.log('🚀 SERVER: ReadableStream start() called!')

        try {
          console.log('🚀 SERVER: Inside try block')

          // Send connected event
          controller.enqueue(encoder.encode('event: connected\n'))
          controller.enqueue(encoder.encode('data: {"status":"connected"}\n\n'))

          console.log('🚀 SERVER: Connected event sent')

          let fullText = ''
          const toolOutputs: Map<string, any> = new Map()

          console.log('🚀 SERVER: About to call agent.stream()')

          // Stream with onChunk callback
          const streamResult = await agent.stream(messages, {
            maxSteps: 5,
            format: 'mastra',
            onChunk: async (chunk) => {
              console.log('📦 SERVER CHUNK:', {
                type: chunk.type,
                hasPayload: !!chunk.payload,
                payloadKeys: chunk.payload ? Object.keys(chunk.payload) : [],
              })

              // Handle text delta chunks (streaming text)
              if (chunk.type === 'text-delta') {
                const textContent = chunk.payload.text

                if (textContent) {
                  fullText += textContent

                  // Send chunk to client
                  controller.enqueue(encoder.encode('event: message\n'))
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ content: textContent })}\n\n`)
                  )
                }
              }

              // Handle tool-call chunks (when tool is being called)
              if (chunk.type === 'tool-call') {
                console.log('🔧 Server: Tool call detected:', chunk.payload?.toolName)
              }

              // Handle tool-result chunks (when tool execution completes)
              if (chunk.type === 'tool-result') {
                const toolName = chunk.payload.toolName
                const result = chunk.payload.result

                console.log('🎯 Server: Tool result received for:', toolName)
                console.log('📦 Server: Result data:', JSON.stringify(result, null, 2))

                // Store the result
                toolOutputs.set(toolName, result)

                // Format and send immediately
                const toolOutput = formatToolOutput(
                  toolName,
                  result,
                  (key: string, fallback?: string) => fallback || key
                )

                if (toolOutput) {
                  console.log('✅ Server: Sending formatted output, length:', toolOutput.length)
                  controller.enqueue(encoder.encode('event: message\n'))
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ content: toolOutput })}\n\n`)
                  )
                } else {
                  console.log('❌ Server: formatToolOutput returned empty for:', toolName)
                }
              }
            },
            onFinish: async (result) => {
              console.log('🎉 Server: onFinish called!')
            },
            onError: ({ error }) => {
              console.error('❌ Server: onError:', error)
              controller.enqueue(encoder.encode('event: error\n'))
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ error: error instanceof Error ? error.message : 'Streaming failed' })}\n\n`
                )
              )
            },
          })

          console.log('⏳ Server: Waiting for stream to complete...')

          // Wait for the stream to complete and capture the response
          const response = await streamResult.response

          console.log('✅ Server: AWAIT COMPLETED - Got response!')
          console.log('🎯 Server: Stream completed!')
          console.log('📊 Server: Response type:', typeof response)
          console.log(
            '📊 Server: Response keys:',
            response ? Object.keys(response) : 'null/undefined'
          )

          // Extract and format tool outputs from the final response
          if (response && response.uiMessages && Array.isArray(response.uiMessages)) {
            console.log('🔍 Server: Processing', response.uiMessages.length, 'UI messages')

            for (const message of response.uiMessages) {
              if (message.parts && Array.isArray(message.parts)) {
                console.log('🔍 Server: Processing', message.parts.length, 'parts')

                for (const part of message.parts) {
                  console.log('🔍 Server: Part type:', part.type, 'has output:', !!part.output)

                  if (part.type?.startsWith('tool-') && part.output) {
                    const toolName = part.type.replace('tool-', '')
                    console.log('🔧 Server: Extracting tool output for:', toolName)
                    console.log('📦 Server: Tool output:', JSON.stringify(part.output, null, 2))

                    const toolOutput = formatToolOutput(
                      toolName,
                      part.output,
                      (key: string, fallback?: string) => fallback || key
                    )

                    if (toolOutput) {
                      console.log(
                        '✅ Server: Sending formatted tool output, length:',
                        toolOutput.length
                      )
                      controller.enqueue(encoder.encode('event: message\n'))
                      controller.enqueue(
                        encoder.encode(`data: ${JSON.stringify({ content: toolOutput })}\n\n`)
                      )
                    } else {
                      console.log('❌ Server: formatToolOutput returned empty for:', toolName)
                    }
                  }
                }
              }
            }
          } else {
            console.log('❌ Server: No uiMessages in response')
          }

          // Send completion signal
          controller.enqueue(encoder.encode('event: done\n'))
          controller.enqueue(encoder.encode('data: {"done":true}\n\n'))

          controller.close()
        } catch (error) {
          controller.enqueue(encoder.encode('event: error\n'))
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: error instanceof Error ? error.message : 'Streaming failed' })}\n\n`
            )
          )
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to process message',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
function formatToolOutput(
  toolName: string,
  output: any,
  t: (key: string, fallback?: string) => string
): string {
  console.log('🔧 formatToolOutput called:', { toolName, output: JSON.stringify(output, null, 2) })

  let formattedOutput = ''

  // Normalize tool name (remove 'tool-' prefix if present)
  const normalizedToolName = toolName.startsWith('tool-') ? toolName : `tool-${toolName}`

  if (normalizedToolName === 'tool-getProducts' && output.products) {
    const products = output.products
    formattedOutput += `\n\n### ${t('inventory:products', 'Products')} ${t('inventory:inventory', 'Inventory')}\n\n`
    formattedOutput += `| ${t('inventory:nameHeader', 'Name')} | SKU | ${t('inventory:category', 'Category')} | ${t('inventory:stockQuantity', 'Stock')} | ${t('inventory:sellingPrice', 'Price')} | ${t('inventory:status', 'Status')} |\n`
    formattedOutput += '|------|-----|----------|-------|-------|--------|\n'

    for (const product of products) {
      formattedOutput += `| ${product.name} | ${product.sku} | ${product.category} | ${product.stock} | ${product.price} | ${product.status} |\n`
    }

    formattedOutput += `\n**${t('inventory:totalItems', 'Total')}:** ${output.total} ${t('inventory:products', 'products')}`
  } else if (normalizedToolName === 'tool-getInventoryStats' && output) {
    formattedOutput += `\n\n### ${t('inventory:inventoryReport', 'Inventory Statistics')}\n\n`
    formattedOutput += `- **${t('inventory:totalItems', 'Total Products')}:** ${output.totalProducts || 0}\n`
    formattedOutput += `- **${t('inventory:inStock', 'In Stock')}:** ${output.inStock || 0} ${t('inventory:unit', 'units')}\n`
    formattedOutput += `- **${t('inventory:totalValue', 'Estimated Value')}:** ${output.estimatedValue || '$0.00'}\n`
    formattedOutput += `- **${t('inventory:lowStock', 'Low Stock Items')}:** ${output.lowStock || 0}\n`
    formattedOutput += `- **${t('inventory:outOfStock', 'Out of Stock Items')}:** ${output.outOfStock || 0}\n`
    formattedOutput += `- **${t('inventory:categories', 'Total Categories')}:** ${output.totalCategories || 0}\n`
    formattedOutput += `- **${t('inventory:healthStatus', 'Health Status')}:** ${output.healthStatus || 'N/A'}\n`
  } else if (normalizedToolName === 'tool-getLowStockProducts' && output.products) {
    const products = output.products
    formattedOutput += `\n\n### ${t('inventory:lowStock', 'Low Stock')} ${t('inventory:products', 'Products')}\n\n`
    formattedOutput += `| ${t('inventory:nameHeader', 'Name')} | SKU | ${t('inventory:category', 'Category')} | ${t('inventory:stockQuantity', 'Stock')} | ${t('inventory:status', 'Status')} |\n`
    formattedOutput += '|------|-----|----------|-------|--------|\n'

    for (const product of products) {
      formattedOutput += `| ${product.name} | ${product.sku} | ${product.category} | ${product.stock} | ${product.status} |\n`
    }

    formattedOutput += `\n**${t('inventory:found', 'Found')}:** ${output.count} ${t('inventory:lowStock', 'low stock')} ${t('inventory:products', 'items')} (${t('inventory:reorderLevel', 'threshold')}: ${output.threshold})`
  } else if (normalizedToolName === 'tool-getOutOfStockProducts' && output.products) {
    const products = output.products
    formattedOutput += `\n\n### ${t('inventory:outOfStock', 'Out of Stock')} ${t('inventory:products', 'Products')}\n\n`
    formattedOutput += `| ${t('inventory:nameHeader', 'Name')} | SKU | ${t('inventory:category', 'Category')} | ${t('inventory:sellingPrice', 'Price')} | ${t('inventory:status', 'Status')} |\n`
    formattedOutput += '|------|-----|----------|-------|--------|\n'

    for (const product of products) {
      formattedOutput += `| ${product.name} | ${product.sku} | ${product.category} | ${product.price} | ${product.status} |\n`
    }

    formattedOutput += `\n**${t('inventory:totalItems', 'Total')}:** ${output.count} ${t('inventory:products', 'products')} ${t('inventory:outOfStock', 'out of stock')}`
  } else if (normalizedToolName === 'tool-searchProducts' && output.products) {
    const products = output.products
    const count = output.found || output.total || products.length
    formattedOutput += `\n\n### ${t('inventory:searchProducts', 'Search Results')} for "${output.query || t('inventory:products', 'products')}"\n\n`

    if (products.length > 0) {
      formattedOutput += `| ${t('inventory:nameHeader', 'Name')} | SKU | ${t('inventory:category', 'Category')} | ${t('inventory:stockQuantity', 'Stock')} | ${t('inventory:sellingPrice', 'Price')} | ${t('inventory:status', 'Status')} |\n`
      formattedOutput += '|------|-----|----------|-------|-------|--------|\n'

      for (const product of products) {
        formattedOutput += `| ${product.name} | ${product.sku} | ${product.category} | ${product.stock} | ${product.price} | ${product.status || 'N/A'} |\n`
      }

      formattedOutput += `\n**${t('inventory:found', 'Found')}:** ${count} ${t('inventory:product', 'product')}${count !== 1 ? 's' : ''}`
    } else {
      formattedOutput += t(
        'inventory:noProductsFound',
        'No products found matching your search criteria.'
      )
    }
  } else if (normalizedToolName === 'tool-listCategories' && output.categories) {
    const categories = output.categories
    formattedOutput += `\n\n### ${t('inventory:categories', 'Product Categories')}\n\n`
    formattedOutput += `| ${t('inventory:nameHeader', 'Name')} | ${t('inventory:description', 'Description')} | ${t('inventory:products', 'Products')} | ${t('inventory:status', 'Status')} |\n`
    formattedOutput += '|------|-------------|----------|--------|\n'

    for (const category of categories) {
      const status = category.active ? '✅ Active' : '❌ Inactive'
      formattedOutput += `| ${category.name} | ${category.description || 'N/A'} | ${category.productCount} | ${status} |\n`
    }

    formattedOutput += `\n**${t('inventory:totalItems', 'Total')}:** ${output.total} ${t('inventory:categories', 'categories')}`
  } else if (normalizedToolName === 'tool-listSuppliers' && output.suppliers) {
    const suppliers = output.suppliers
    formattedOutput += `\n\n### ${t('inventory:suppliers', 'Suppliers')}\n\n`
    formattedOutput += `| ${t('inventory:nameHeader', 'Name')} | ${t('inventory:email', 'Email')} | ${t('inventory:phone', 'Phone')} | ${t('inventory:products', 'Products')} |\n`
    formattedOutput += '|------|-------|-------|----------|\n'

    for (const supplier of suppliers) {
      formattedOutput += `| ${supplier.name} | ${supplier.email || 'N/A'} | ${supplier.phone || 'N/A'} | ${supplier.productCount || 0} |\n`
    }

    formattedOutput += `\n**${t('inventory:totalItems', 'Total')}:** ${output.total} ${t('inventory:suppliers', 'suppliers')}`
  } else if (normalizedToolName === 'tool-viewOrderDetails' && output.order) {
    const order = output.order
    formattedOutput += `\n\n### ${t('inventory:orderDetails', 'Order Details')}\n\n`
    formattedOutput += `- **${t('inventory:orderNumber', 'Order Number')}:** ${order.salesOrderNumber}\n`
    formattedOutput += `- **${t('inventory:customer', 'Customer')}:** ${order.customerName}\n`
    formattedOutput += `- **${t('inventory:date', 'Date')}:** ${order.orderDate}\n`
    formattedOutput += `- **${t('inventory:status', 'Status')}:** ${order.status}\n`
    formattedOutput += `- **${t('inventory:total', 'Total')}:** ${order.total}\n`

    if (order.items && order.items.length > 0) {
      formattedOutput += `\n#### ${t('inventory:orderItems', 'Order Items')}\n\n`
      formattedOutput += `| ${t('inventory:product', 'Product')} | ${t('inventory:quantity', 'Quantity')} | ${t('inventory:price', 'Price')} | ${t('inventory:subtotal', 'Subtotal')} |\n`
      formattedOutput += '|---------|----------|-------|----------|\n'

      for (const item of order.items) {
        formattedOutput += `| ${item.productName} | ${item.quantity} | ${item.unitPrice} | ${item.total} |\n`
      }
    }
  } else if (normalizedToolName === 'tool-listRecentOrders' && output.orders) {
    const orders = output.orders
    formattedOutput += `\n\n### ${t('inventory:recentOrders', 'Recent Orders')}\n\n`
    formattedOutput += `| ${t('inventory:orderNumber', 'Order #')} | ${t('inventory:customer', 'Customer')} | ${t('inventory:date', 'Date')} | ${t('inventory:total', 'Total')} | ${t('inventory:status', 'Status')} |\n`
    formattedOutput += '|----------|----------|------|-------|--------|\n'

    for (const order of orders) {
      formattedOutput += `| ${order.salesOrderNumber} | ${order.customerName} | ${order.orderDate} | ${order.total} | ${order.status} |\n`
    }

    formattedOutput += `\n**${t('inventory:totalItems', 'Total')}:** ${output.total} ${t('inventory:orders', 'orders')}`
  } else if (normalizedToolName === 'tool-getTopSellingProductsRecommendation') {
    console.log('🎯 Formatting top selling products:', { hasTopProducts: !!output.topProducts, length: output.topProducts?.length })
    
    const products = output.topProducts || []
    formattedOutput += `\n\n### ${t('inventory:topSellingProducts', 'Top Selling Products')}\n\n`

    if (products.length > 0) {
      formattedOutput += `| ${t('inventory:rank', 'Rank')} | ${t('inventory:nameHeader', 'Product')} | SKU | ${t('inventory:unitsSold', 'Units Sold')} | ${t('inventory:velocity', 'Velocity')} | ${t('inventory:revenue', 'Revenue')} |\n`
      formattedOutput += '|------|---------|-----|-----------|----------|----------|\n'

      for (const product of products) {
        const velocity = product.velocity ? `${product.velocity.toFixed(1)}/day` : 'N/A'
        const revenue = product.revenue ? `$${product.revenue.toFixed(2)}` : 'N/A'
        formattedOutput += `| ${product.rank} | ${product.name} | ${product.sku || 'N/A'} | ${product.unitsSold} | ${velocity} | ${revenue} |\n`
      }

      const totalRevenue = products.reduce(
        (sum: number, p: { revenue?: number }) => sum + (p.revenue || 0),
        0
      )
      const totalUnits = products.reduce(
        (sum: number, p: { unitsSold?: number }) => sum + (p.unitsSold || 0),
        0
      )

      formattedOutput += `\n**${t('inventory:totalRevenue', 'Total Revenue')}:** $${totalRevenue.toFixed(2)}`
      formattedOutput += `\n**${t('inventory:totalUnitsSold', 'Total Units Sold')}:** ${totalUnits}`
    } else {
      formattedOutput += t(
        'inventory:noSalesData',
        'No sales data available for the specified period.'
      )
    }
  } else if (normalizedToolName === 'tool-getReorderRecommendations') {
    console.log('🎯 Formatting reorder recommendations:', { hasRecommendations: !!output.recommendations, length: output.recommendations?.length })
    
    const recommendations = output.recommendations || []
    formattedOutput += `\n\n### ${t('inventory:reorderRecommendations', 'Reorder Recommendations')}\n\n`

    if (recommendations.length > 0) {
      formattedOutput += `| ${t('inventory:nameHeader', 'Product')} | SKU | ${t('inventory:currentStock', 'Current Stock')} | ${t('inventory:suggestedOrder', 'Suggested Order')} | ${t('inventory:reason', 'Reason')} |\n`
      formattedOutput += '|---------|-----|---------------|-----------------|--------|\n'

      for (const rec of recommendations) {
        formattedOutput += `| ${rec.productName} | ${rec.sku || 'N/A'} | ${rec.currentStock} | ${rec.suggestedQuantity} | ${rec.reason || 'Low stock'} |\n`
      }

      formattedOutput += `\n**${t('inventory:totalItems', 'Total Items to Reorder')}:** ${recommendations.length}`
    } else {
      formattedOutput += t('inventory:noReorderNeeded', 'No products need reordering at this time.')
    }
  } else if (normalizedToolName === 'tool-getInventoryHealth') {
    formattedOutput += `\n\n### ${t('inventory:inventoryHealth', 'Inventory Health Report')}\n\n`

    if (output.overview) {
      formattedOutput += `#### ${t('inventory:overview', 'Overview')}\n\n`
      formattedOutput += `- **${t('inventory:healthScore', 'Health Score')}:** ${output.overview.healthScore || 'N/A'}\n`
      formattedOutput += `- **${t('inventory:totalProducts', 'Total Products')}:** ${output.overview.totalProducts || 0}\n`
      formattedOutput += `- **${t('inventory:totalValue', 'Total Value')}:** ${output.overview.totalValue || '$0.00'}\n`
    }

    if (output.stockLevels) {
      formattedOutput += `\n#### ${t('inventory:stockLevels', 'Stock Levels')}\n\n`
      formattedOutput += `- **${t('inventory:inStock', 'In Stock')}:** ${output.stockLevels.inStock || 0}\n`
      formattedOutput += `- **${t('inventory:lowStock', 'Low Stock')}:** ${output.stockLevels.lowStock || 0}\n`
      formattedOutput += `- **${t('inventory:outOfStock', 'Out of Stock')}:** ${output.stockLevels.outOfStock || 0}\n`
    }

    if (output.insights && output.insights.length > 0) {
      formattedOutput += `\n#### ${t('inventory:insights', 'Key Insights')}\n\n`
      for (const insight of output.insights) {
        formattedOutput += `- ${insight}\n`
      }
    }
  }

  return formattedOutput
}

// Client-side function to re-translate tool outputs
function retranslateToolOutput(
  content: string,
  t: (key: string, fallback?: string) => string
): string {
  // Replace common patterns with translated versions
  return content
    .replace(
      /### Products Inventory/g,
      `### ${t('inventory:products', 'Products')} ${t('inventory:inventory', 'Inventory')}`
    )
    .replace(
      /### Inventory Statistics/g,
      `### ${t('inventory:inventoryReport', 'Inventory Statistics')}`
    )
    .replace(
      /### Low Stock Products/g,
      `### ${t('inventory:lowStock', 'Low Stock')} ${t('inventory:products', 'Products')}`
    )
    .replace(
      /### Out of Stock Products/g,
      `### ${t('inventory:outOfStock', 'Out of Stock')} ${t('inventory:products', 'Products')}`
    )
    .replace(
      /### Search Results for "([^"]*)"/g,
      `### ${t('inventory:searchProducts', 'Search Results')} "$1"`
    )
    .replace(/\| Name \|/g, `| ${t('inventory:nameHeader', 'Name')} |`)
    .replace(/\| Category \|/g, `| ${t('inventory:category', 'Category')} |`)
    .replace(/\| Stock \|/g, `| ${t('inventory:stockQuantity', 'Stock')} |`)
    .replace(/\| Price \|/g, `| ${t('inventory:sellingPrice', 'Price')} |`)
    .replace(/\| Status \|/g, `| ${t('inventory:status', 'Status')} |`)
    .replace(/\*\*Total:\*\*/g, `**${t('inventory:totalItems', 'Total')}:**`)
    .replace(/\*\*Found:\*\*/g, `**${t('inventory:found', 'Found')}:**`)
    .replace(/\*\*Total Products:\*\*/g, `**${t('inventory:totalItems', 'Total Products')}:**`)
    .replace(/\*\*In Stock:\*\*/g, `**${t('inventory:inStock', 'In Stock')}:**`)
    .replace(/\*\*Estimated Value:\*\*/g, `**${t('inventory:totalValue', 'Estimated Value')}:**`)
    .replace(/\*\*Low Stock Items:\*\*/g, `**${t('inventory:lowStock', 'Low Stock Items')}:**`)
    .replace(
      /\*\*Out of Stock Items:\*\*/g,
      `**${t('inventory:outOfStock', 'Out of Stock Items')}:**`
    )
    .replace(/\*\*Total Categories:\*\*/g, `**${t('inventory:categories', 'Total Categories')}:**`)
    .replace(/\*\*Health Status:\*\*/g, `**${t('inventory:healthStatus', 'Health Status')}:**`)
    .replace(/ units/g, ` ${t('inventory:unit', 'units')}`)
    .replace(/ products$/g, ` ${t('inventory:products', 'products')}`)
    .replace(/ product$/g, ` ${t('inventory:product', 'product')}`)
    .replace(/\bout of stock\b/g, t('inventory:outOfStock', 'out of stock'))
    .replace(/\blow stock\b/g, t('inventory:lowStock', 'low stock'))
    .replace(/threshold:/g, `${t('inventory:reorderLevel', 'threshold')}:`)
    .replace(
      /No products found matching your search criteria\./g,
      t('inventory:noProductsFound', 'No products found matching your search criteria.')
    )
}

export default function MastraChat() {
  const { t } = useTranslation(['assistant', 'inventory'])
  const { colorScheme } = useMantineColorScheme()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [streamingMessage, setStreamingMessage] = useState<string>('')
  const [isStreaming, setIsStreaming] = useState(false)
  const viewport = useRef<HTMLDivElement>(null)

  // Debug: Log messages state changes
  useEffect(() => {
    console.log('🎨 UI Messages updated:', messages.length, 'messages')
    messages.forEach((msg, i) => {
      console.log(`  ${i + 1}. ${msg.role}: ${msg.content.substring(0, 50)}...`)
    })
  }, [messages])
  const abortControllerRef = useRef<AbortController | null>(null)

  const isLoading = isStreaming || streamingMessage !== ''

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  // Auto-scroll to bottom of chat container
  const scrollToBottom = useCallback(() => {
    if (viewport.current) {
      // For Mantine ScrollArea, we need to access the actual scrollable viewport
      const scrollableElement = viewport.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollableElement) {
        // Force immediate scroll to bottom
        scrollableElement.scrollTop = scrollableElement.scrollHeight
      }
    }
  }, [])

  // Auto-scroll when messages change
  useEffect(() => {
    scrollToBottom()

    // Also scroll with a delay to handle DOM updates and markdown rendering
    const timeoutId = setTimeout(scrollToBottom, 200)
    return () => clearTimeout(timeoutId)
  }, [messages, scrollToBottom])

  // Auto-scroll when streaming message updates
  useEffect(() => {
    if (streamingMessage) {
      scrollToBottom()

      // Additional scroll for streaming updates
      const timeoutId = setTimeout(scrollToBottom, 100)
      return () => clearTimeout(timeoutId)
    }
  }, [streamingMessage, scrollToBottom])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!inputValue.trim() || isLoading) return

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue('')
    setIsStreaming(true)
    setStreamingMessage('')

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController()

    try {
      // Use EventSource for SSE
      const params = new URLSearchParams({
        message: userMessage.content,
        history: JSON.stringify(messages.map((m) => ({ role: m.role, content: m.content }))),
      })
      const url = '/api/mastra-stream?' + params.toString()

      const eventSource = new EventSource(url)

      let accumulatedMessage = ''

      eventSource.onopen = () => {
        // Connection opened
      }

      eventSource.onmessage = (event) => {
        // Default message handler
      }

      eventSource.onerror = (event) => {
        // Error handler
      }

      eventSource.addEventListener('connected', (event) => {
        // Connection confirmed
      })

      eventSource.addEventListener('message', (event) => {
        try {
          const parsed = JSON.parse(event.data)
          console.log('📥 Frontend received message:', parsed.content?.substring(0, 100) + '...')

          if (parsed.content) {
            accumulatedMessage += parsed.content
            setStreamingMessage(accumulatedMessage)
            console.log('📝 Accumulated message length:', accumulatedMessage.length)
          }
        } catch (e) {
          console.error('❌ Failed to parse SSE data:', e)
        }
      })

      eventSource.addEventListener('done', () => {
        eventSource.close()

        // Add the complete message to the messages array
        if (accumulatedMessage) {
          const assistantMessage: Message = {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: accumulatedMessage,
            timestamp: new Date(),
          }
          setMessages((prev) => [...prev, assistantMessage])
        } else {
          // If no message was accumulated, show an error message with agent icon
          const errorMessage: Message = {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: t(
              'assistant:somethingWentWrong',
              '❌ Something went wrong! I was unable to generate a response. Please try again.'
            ),
            timestamp: new Date(),
          }
          setMessages((prev) => [...prev, errorMessage])
        }

        setStreamingMessage('')
        setIsStreaming(false)
      })

      eventSource.addEventListener('error', (event) => {
        eventSource.close()

        const errorMessage: Message = {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: t(
            'assistant:failedToGetResponse',
            '❌ Error: Failed to get response from server'
          ),
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, errorMessage])
        setStreamingMessage('')
        setIsStreaming(false)
      })

      // Store event source for cleanup
      abortControllerRef.current = { abort: () => eventSource.close() } as any
    } catch (error: unknown) {
      if (!(error instanceof Error && error.name === 'AbortError')) {
        const errorMessage: Message = {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: `${error instanceof Error ? error.message : t('assistant:failedToGetResponse', 'Failed to get response')}`,
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, errorMessage])
      }
      setStreamingMessage('')
      setIsStreaming(false)
    }
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
      return t('assistant:yesterday', 'Yesterday')
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
    { title: t('assistant:showAllProducts', 'Show me all products'), icon: '📦' },
    { title: t('assistant:inventoryStatistics', 'What are my inventory statistics?'), icon: '📊' },
    { title: t('assistant:stockLevels', 'Which products are low on stock?'), icon: '⚠️' },
    { title: t('assistant:searchProducts', 'Search for electronics'), icon: '🔍' },
    { title: t('assistant:outOfStockItems', 'Show out of stock items'), icon: '❌' },
    {
      title: t('assistant:getReorderRecommendations', 'What products need reordering?'),
      icon: '🔄',
    },
  ]

  const fallbackQuestions = [
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
                  style={{ color: 'var(--mantine-color-teal-6)', marginBottom: '1rem' }}
                />
                <Text size="xl" fw={600} mb="xs">
                  <ClientOnly fallback="Good morning!">
                    {currentHour < 12
                      ? t('assistant:goodMorning', 'Good Morning')
                      : currentHour < 18
                        ? t('assistant:goodAfternoon', 'Good Afternoon')
                        : t('assistant:goodEvening', 'Good Evening')}
                  </ClientOnly>
                </Text>
                <Text size="md" c="dimmed" ta="center" lh={1.5}>
                  <ClientOnly fallback={t('assistant:welcomeMessage')}>
                    {t('assistant:welcomeMessage')}
                  </ClientOnly>
                </Text>
              </Box>

              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm" w="100%">
                <ClientOnly
                  fallback={
                    <>
                      {fallbackQuestions.map((question, index) => (
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
                    </>
                  }
                >
                  {exampleQuestions.map((question, index) => (
                    <UnstyledButton
                      key={index}
                      className={classes.exampleCard}
                      onClick={() => setInputValue(question.title)}
                    >
                      <Group gap="sm" align="center">
                        <Text size="lg">{question.icon}</Text>
                        <Text size="sm" c="dimmed" fw={500}>
                          <ClientOnly fallback={question.title.split(' ').slice(-3).join(' ')}>
                            {question.title}
                          </ClientOnly>
                        </Text>
                      </Group>
                    </UnstyledButton>
                  ))}
                </ClientOnly>
              </SimpleGrid>
            </Stack>
          </Center>
        </Container>
      ) : (
        <ScrollArea
          ref={viewport}
          className={classes.messagesScrollArea}
          offsetScrollbars
          scrollbarSize={6}
          h="100%"
        >
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

                  {message.role === 'assistant' ? (
                    <Group align="flex-start" gap="md">
                      <Avatar size="md" radius="xl" color="teal">
                        <IconSparkles size={16} />
                      </Avatar>

                      <Box flex={1} maw="100%">
                        <Box
                          style={{
                            backgroundColor:
                              colorScheme === 'dark'
                                ? 'var(--mantine-color-dark-6)'
                                : 'var(--mantine-color-gray-0)',
                            padding: '10px 16px',
                            borderRadius: '18px',
                          }}
                        >
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={MarkdownComponents}
                          >
                            {retranslateToolOutput(
                              message.content ||
                                (message.isStreaming
                                  ? ''
                                  : t('assistant:noResponseGenerated', 'No response generated')),
                              t
                            )}
                          </ReactMarkdown>
                          {message.isStreaming && !message.content && (
                            <Stack gap="xs">
                              <Skeleton height={10} radius="xl" animate />
                              <Skeleton height={10} width="80%" radius="xl" animate />
                              <Skeleton height={10} width="60%" radius="xl" animate />
                            </Stack>
                          )}
                        </Box>
                      </Box>
                    </Group>
                  ) : (
                    <Group justify="flex-end" gap="md">
                      <Box
                        style={{
                          backgroundColor:
                            colorScheme === 'dark'
                              ? 'var(--mantine-color-orange-9)'
                              : 'var(--mantine-color-blue-1)',
                          color:
                            colorScheme === 'dark'
                              ? 'var(--mantine-color-orange-1)'
                              : 'var(--mantine-color-blue-9)',
                          padding: '10px 16px',
                          borderRadius: '18px',
                          maxWidth: '70%',
                          wordBreak: 'break-word',
                        }}
                      >
                        <Text size="sm">{message.content}</Text>
                      </Box>
                    </Group>
                  )}
                </Box>
              )
            })}

            {streamingMessage && (
              <Group align="flex-start" gap="md">
                <Avatar size="md" radius="xl" color="teal">
                  <IconSparkles size={16} />
                </Avatar>
                <Box flex={1} maw="100%">
                  <Box
                    style={{
                      backgroundColor:
                        colorScheme === 'dark'
                          ? 'var(--mantine-color-dark-6)'
                          : 'var(--mantine-color-gray-0)',
                      padding: '10px 16px',
                      borderRadius: '18px',
                    }}
                  >
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={MarkdownComponents}>
                      {retranslateToolOutput(streamingMessage, t)}
                    </ReactMarkdown>
                  </Box>
                </Box>
              </Group>
            )}

            {isLoading && !streamingMessage && (
              <Group align="flex-start" gap="md">
                <Avatar size="md" radius="xl" color="teal">
                  <IconSparkles size={16} />
                </Avatar>
                <Box flex={1}>
                  <Box
                    style={{
                      backgroundColor:
                        colorScheme === 'dark'
                          ? 'var(--mantine-color-dark-6)'
                          : 'var(--mantine-color-gray-0)',
                      padding: '10px 16px',
                      borderRadius: '18px',
                    }}
                  >
                    <Stack gap="xs">
                      <Skeleton height={10} radius="xl" animate />
                      <Skeleton height={10} width="85%" radius="xl" animate />
                      <Skeleton height={10} width="70%" radius="xl" animate />
                      <Skeleton height={10} width="60%" radius="xl" animate />
                      <Box mt="xs">
                        <Skeleton height={8} width="90%" radius="xl" animate />
                        <Skeleton height={8} width="75%" radius="xl" mt="xs" animate />
                      </Box>
                    </Stack>
                  </Box>
                </Box>
              </Group>
            )}
          </Stack>
        </ScrollArea>
      )}

      <Paper radius="md" withBorder p="md" className={classes.inputContainer}>
        <form onSubmit={handleSubmit}>
          <Group gap="sm" align="flex-end">
            <ClientOnly
              fallback={
                <Textarea
                  placeholder={
                    isLoading ? 'Please wait...' : 'Ask me anything about your inventory...'
                  }
                  value={inputValue}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setInputValue(e.target.value)
                  }
                  disabled={isLoading}
                  autosize
                  minRows={1}
                  maxRows={6}
                  variant="unstyled"
                  size="sm"
                  className={classes.messageInput}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
                      e.preventDefault()
                      handleSubmit(e)
                    }
                  }}
                  style={{ flex: 1 }}
                />
              }
            >
              <Textarea
                placeholder={
                  isLoading
                    ? t('assistant:pleaseWait', 'Please wait...')
                    : t('assistant:askMeAnything', 'Ask me anything about your inventory...')
                }
                value={inputValue}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setInputValue(e.target.value)
                }
                disabled={isLoading}
                autosize
                minRows={1}
                maxRows={6}
                variant="unstyled"
                size="sm"
                className={classes.messageInput}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
                    e.preventDefault()
                    handleSubmit(e)
                  }
                }}
                style={{ flex: 1 }}
              />
            </ClientOnly>
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
        <ClientOnly fallback="Press Enter to send, Shift + Enter for new line">
          {t('assistant:pressEnterToSend', 'Press Enter to send, Shift + Enter for new line')}
        </ClientOnly>
      </Text>
    </Box>
  )
}
