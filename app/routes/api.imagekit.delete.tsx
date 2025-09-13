import type { ActionFunctionArgs } from 'react-router'
import { deleteFromImagekit } from '~/app/lib/imagekit'

export async function action({ request }: ActionFunctionArgs) {
    if (request.method !== 'DELETE') {
        return new Response(
            JSON.stringify({ error: 'Method not allowed' }),
            {
                status: 405,
                headers: { 'Content-Type': 'application/json' }
            }
        )
    }

    try {
        const { fileId } = await request.json()

        if (!fileId) {
            return new Response(
                JSON.stringify({ error: 'File ID is required' }),
                {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                }
            )
        }

        const result = await deleteFromImagekit(fileId)

        if (!result.success) {
            return new Response(
                JSON.stringify({ error: result.error }),
                {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' }
                }
            )
        }

        return new Response(
            JSON.stringify({ success: true }),
            {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            }
        )

    } catch (error) {
        console.error('Delete API error:', error)
        return new Response(
            JSON.stringify({ error: 'Internal server error' }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        )
    }
}
