import type { CoreMessage } from 'ai'
import type { LoaderFunctionArgs } from 'react-router'
import { PRODUCT_STATUSES } from '~/app/common/constants'
import { getInventoryAgent } from '~/app/lib'

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url)
  const message = url.searchParams.get('message')
  const historyJson = url.searchParams.get('history')
  const language = url.searchParams.get('lng') || 'en' // Get language from URL parameter

  if (!message?.trim()) {
    return new Response(JSON.stringify({ error: 'Message is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  console.log('🌐 Using language:', language)

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

    console.log('💬 Sending', messages.length, 'messages to agent')
    console.log('📝 Messages:', JSON.stringify(messages, null, 2))

    // Create a manual SSE stream using ReadableStream
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send connected event
          controller.enqueue(encoder.encode('event: connected\n'))
          controller.enqueue(encoder.encode('data: {"status":"connected"}\n\n'))

          let fullText = ''
          const toolOutputs: string[] = []

          // Stream with onChunk callback
          const streamResult = await agent.stream(messages, {
            maxSteps: 5,
            format: 'mastra',
            onChunk: async (chunk: any) => {
              console.log('📦 Chunk type:', chunk.type)

              // Handle tool calls (when tools are invoked)
              if (chunk.type === 'tool-call') {
                console.log(
                  '🔧 Tool called:',
                  chunk.payload?.toolName || chunk.payload?.name || 'unknown'
                )
              }

              // Handle tool results
              if (chunk.type === 'tool-result') {
                console.log('🔧 Tool result:', chunk.payload.toolName, chunk.payload.result)
                const toolOutput = formatToolOutput(
                  chunk.payload.toolName,
                  chunk.payload.result,
                  language
                )
                if (toolOutput) {
                  toolOutputs.push(toolOutput)
                }
              }

              // Handle other possible tool result chunk types
              if (chunk.type === 'tool-call-result' || chunk.type === 'function-call-result') {
                console.log('🔧 Tool result (alt):', chunk.payload)
              }

              // Handle text delta chunks (streaming text)
              if (chunk.type === 'text-delta') {
                const textContent = chunk.payload.text

                if (textContent) {
                  fullText += textContent
                  console.log('📤 Streaming text chunk:', textContent)

                  // Send chunk to client
                  controller.enqueue(encoder.encode('event: message\n'))
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ content: textContent })}\n\n`)
                  )
                }
              }
            },
            onError: ({ error }: any) => {
              controller.enqueue(encoder.encode('event: error\n'))
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ error: error instanceof Error ? error.message : 'Streaming failed' })}\n\n`
                )
              )
            },
          })

          // Wait for the stream to complete
          const finalResult = await streamResult.response
          console.log('✅ Stream completed')
          console.log('🔍 Final result keys:', Object.keys(finalResult))

          // Try to access tool results from different possible locations
          const possibleToolPaths = ['toolCalls', 'toolResults', 'steps', 'tools', 'invocations']
          for (const path of possibleToolPaths) {
            if (finalResult[path]) {
              console.log(`🔧 Found ${path}:`, finalResult[path])
            }
          }

          // Check uiMessages for formatted tool results
          if (finalResult.uiMessages && Array.isArray(finalResult.uiMessages)) {
            console.log('🎨 Found uiMessages:', finalResult.uiMessages.length, 'messages')

            // Process each UI message and extract tool outputs
            for (const uiMessage of finalResult.uiMessages) {
              if (uiMessage.parts && Array.isArray(uiMessage.parts)) {
                console.log('🔍 Processing', uiMessage.parts.length, 'parts')

                for (const part of uiMessage.parts) {
                  const partAny = part as any
                  console.log('🔍 Part type:', partAny.type, 'has output:', !!partAny.output)

                  // Check if this part contains tool output
                  if (partAny.type && partAny.type.startsWith('tool-') && partAny.output) {
                    const toolName = partAny.type.replace('tool-', '')
                    console.log('🔧 Found tool output for:', toolName)

                    // Format the tool output using our existing formatter
                    const formattedOutput = formatToolOutput(toolName, partAny.output, language)
                    console.log('📤 Formatted output:', formattedOutput ? 'success' : 'empty')

                    if (formattedOutput) {
                      console.log('✅ Sending formatted tool output to client')

                      // Send the formatted tool output to the frontend
                      controller.enqueue(encoder.encode('event: message\n'))
                      controller.enqueue(
                        encoder.encode(`data: ${JSON.stringify({ content: formattedOutput })}\n\n`)
                      )
                    } else {
                      console.log('⚠️ No formatted output generated for:', toolName)
                    }
                  }
                }
              }
            }
          }

          // Check if we have text content with tool results
          if (
            finalResult.text &&
            typeof finalResult.text === 'string' &&
            finalResult.text.includes('|')
          ) {
            console.log('📊 Final text appears to contain table data')
            // Send the final text as a message chunk
            controller.enqueue(encoder.encode('event: message\n'))
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ content: '\n\n' + finalResult.text })}\n\n`)
            )
          }

          // Send any accumulated tool outputs
          for (const toolOutput of toolOutputs) {
            controller.enqueue(encoder.encode('event: message\n'))
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ content: toolOutput })}\n\n`)
            )
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

// Helper function to translate product status
function translateStatus(status: string, language: string = 'en'): string {
  const statusTranslations: Record<string, Record<string, string>> = {
    [PRODUCT_STATUSES.AVAILABLE]: {
      en: 'Available',
      fr: 'Disponible',
    },
    [PRODUCT_STATUSES.CRITICAL]: {
      en: 'Critical',
      fr: 'Critique',
    },
    [PRODUCT_STATUSES.LOWSTOCK]: {
      en: 'Low Stock',
      fr: 'Stock Faible',
    },
    [PRODUCT_STATUSES.OUTOFSTOCK]: {
      en: 'Out of Stock',
      fr: 'En Rupture',
    },
    [PRODUCT_STATUSES.DAMAGED]: {
      en: 'Damaged',
      fr: 'Endommagé',
    },
    [PRODUCT_STATUSES.DISCONTINUED]: {
      en: 'Discontinued',
      fr: 'Discontinué',
    },
    [PRODUCT_STATUSES.INTRANSIT]: {
      en: 'In Transit',
      fr: 'En Transit',
    },
    [PRODUCT_STATUSES.RESERVED]: {
      en: 'Reserved',
      fr: 'Réservé',
    },
    [PRODUCT_STATUSES.ARCHIVED]: {
      en: 'Archived',
      fr: 'Archivé',
    },
    [PRODUCT_STATUSES.ONORDER]: {
      en: 'On Order',
      fr: 'Commandé',
    },
  }

  const translations = statusTranslations[status]
  if (translations && translations[language]) {
    return translations[language]
  }

  // Fallback to original status if no translation found
  return status
}

// Helper function to format tool output
function formatToolOutput(toolName: string, output: any, language: string = 'en'): string {
  console.log('🎨 formatToolOutput called with:', {
    toolName,
    hasOutput: !!output,
    outputKeys: Object.keys(output || {}),
  })

  let formattedOutput = ''

  // Normalize tool name (remove 'tool-' prefix if present)
  const normalizedToolName = toolName.startsWith('tool-') ? toolName : `tool-${toolName}`
  console.log('🔧 Normalized tool name:', normalizedToolName)

  if (normalizedToolName === 'tool-getProducts' && output.products) {
    const products = output.products
    formattedOutput += '\n\n### Products Inventory\n\n'
    formattedOutput += '| Name | SKU | Category | Stock | Price | Status |\n'
    formattedOutput += '|------|-----|----------|-------|-------|--------|\n'

    for (const product of products) {
      const translatedStatus = translateStatus(product.status, language)
      formattedOutput += `| ${product.name} | ${product.sku} | ${product.category} | ${product.stock} | ${product.price} | ${translatedStatus} |\n`
    }

    formattedOutput += `\n**Total:** ${output.total} products`
  } else if (normalizedToolName === 'tool-getInventoryStats' && output) {
    formattedOutput += '\n\n### Inventory Statistics\n\n'
    formattedOutput += `- **Total Products:** ${output.totalProducts}\n`
    formattedOutput += `- **Total Stock:** ${output.totalStock} units\n`
    formattedOutput += `- **Low Stock Items:** ${output.lowStockCount}\n`
    formattedOutput += `- **Out of Stock Items:** ${output.outOfStockCount}\n`
  } else if (normalizedToolName === 'tool-getLowStockProducts' && output.products) {
    const products = output.products
    formattedOutput += '\n\n### Low Stock Products\n\n'
    formattedOutput += '| Name | SKU | Category | Stock | Status |\n'
    formattedOutput += '|------|-----|----------|-------|--------|\n'

    for (const product of products) {
      const translatedStatus = translateStatus(product.status, language)
      formattedOutput += `| ${product.name} | ${product.sku} | ${product.category} | ${product.stock} | ${translatedStatus} |\n`
    }

    formattedOutput += `\n**Found:** ${output.count} low stock items (threshold: ${output.threshold})`
  } else if (normalizedToolName === 'tool-getOutOfStockProducts' && output.products) {
    const products = output.products
    formattedOutput += '\n\n### Out of Stock Products\n\n'
    formattedOutput += '| Name | SKU | Category | Price | Status |\n'
    formattedOutput += '|------|-----|----------|-------|--------|\n'

    for (const product of products) {
      const translatedStatus = translateStatus(product.status, language)
      formattedOutput += `| ${product.name} | ${product.sku} | ${product.category} | ${product.price} | ${translatedStatus} |\n`
    }

    formattedOutput += `\n**Total:** ${output.count} products out of stock`
  } else if (normalizedToolName === 'tool-searchProducts' && output.products) {
    const products = output.products
    const count = output.found || output.total || products.length
    formattedOutput += `\n\n### Search Results for "${output.query || 'products'}"\n\n`

    if (products.length > 0) {
      formattedOutput += '| Name | SKU | Category | Stock | Price | Status |\n'
      formattedOutput += '|------|-----|----------|-------|-------|--------|\n'

      for (const product of products) {
        const translatedStatus = translateStatus(product.status || 'N/A', language)
        formattedOutput += `| ${product.name} | ${product.sku} | ${product.category} | ${product.stock} | ${product.price} | ${translatedStatus} |\n`
      }

      formattedOutput += `\n**Found:** ${count} product${count !== 1 ? 's' : ''}`
    } else {
      formattedOutput += 'No products found matching your search criteria.'
    }
  } else if (normalizedToolName === 'tool-listCategories' && output.categories) {
    const categories = output.categories
    formattedOutput += '| Name | Description | Products | Status |\n'
    formattedOutput += '|------|-------------|----------|--------|\n'

    for (const category of categories) {
      const status = category.active ? '✅ Active' : '❌ Inactive'
      const description = category.description || 'No description'
      formattedOutput += `| ${category.name} | ${description} | ${category.productCount || 0} | ${status} |\n`
    }

    formattedOutput += `\n**Total:** ${output.total || categories.length} categories`
  } else if (normalizedToolName === 'tool-listSuppliers' && output.suppliers) {
    const suppliers = output.suppliers
    formattedOutput += '| Name | Contact | Email | Phone | Status |\n'
    formattedOutput += '|------|---------|-------|-------|--------|\n'

    for (const supplier of suppliers) {
      const status = supplier.active ? '✅ Active' : '❌ Inactive'
      formattedOutput += `| ${supplier.name} | ${supplier.contactPerson || 'N/A'} | ${supplier.email || 'N/A'} | ${supplier.phone || 'N/A'} | ${status} |\n`
    }

    formattedOutput += `\n**Total:** ${output.total || suppliers.length} suppliers`
  } else if (normalizedToolName === 'tool-viewOrderDetails' && output.message) {
    // The tool already provides a formatted message with order details and items table
    // Just return it as-is since it's already nicely formatted
    console.log('📋 viewOrderDetails - has message:', !!output.message)
    console.log('📋 viewOrderDetails - message preview:', output.message?.substring(0, 100))
    return output.message
  } else if (normalizedToolName === 'tool-listRecentOrders' && output.orders) {
    const orders = output.orders
    formattedOutput += '| Order # | Customer | Date | Status | Total |\n'
    formattedOutput += '|---------|----------|------|--------|-------|\n'

    for (const order of orders) {
      const date = order.orderDate ? new Date(order.orderDate).toLocaleDateString() : 'N/A'
      const total = order.totalAmount ? `$${order.totalAmount.toFixed(2)}` : 'N/A'
      formattedOutput += `| ${order.salesOrderNumber} | ${order.customer} | ${date} | ${order.status} | ${total} |\n`
    }

    formattedOutput += `\n**Total:** ${output.total || orders.length} orders`
  } else if (normalizedToolName === 'tool-getTopSellingProductsRecommendation' && output.message) {
    // This tool already returns a formatted message with table
    formattedOutput += '\n\n' + output.message
  } else if (normalizedToolName === 'tool-getReorderRecommendations' && output.message) {
    // This tool already returns a formatted message with table
    formattedOutput += '\n\n' + output.message
  } else if (normalizedToolName === 'tool-getInventoryHealth' && output.message) {
    // This tool already returns a formatted message
    formattedOutput += '\n\n' + output.message
  }

  return formattedOutput
}
