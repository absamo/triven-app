import { type ActionFunctionArgs } from 'react-router'
import { createBackorderFromSalesOrder } from '~/app/services/sales.server'

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const body = await request.json()
    const { salesOrderId, outOfStockItems } = body

    if (!salesOrderId || !outOfStockItems || !Array.isArray(outOfStockItems)) {
      return new Response(
        JSON.stringify({
          error: 'Invalid request data',
          message: 'salesOrderId and outOfStockItems array are required',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Create backorder from sales order using existing service function
    const result = await createBackorderFromSalesOrder(request, {
      salesOrderId,
      outOfStockItems,
    })

    return new Response(
      JSON.stringify({
        success: true,
        backorder: result.backorder,
        backorderItems: result.backorderItems,
        notification: result.notification,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error creating backorder from sales order:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to create backorder',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}
