import type { ActionFunctionArgs } from "react-router"
import { deleteFromImagekit } from "~/app/lib/imagekit"

/**
 * API endpoint to delete files from ImageKit
 */
export async function action({ request }: ActionFunctionArgs) {
    if (request.method !== 'DELETE') {
        return Response.json(
            { error: 'Method not allowed' },
            { status: 405 }
        )
    }

    try {
        const { fileId } = await request.json()

        if (!fileId) {
            return Response.json(
                { error: 'File ID is required' },
                { status: 400 }
            )
        }

        const result = await deleteFromImagekit(fileId)
        return Response.json(result)
    } catch (error) {
        console.error('Error deleting file from ImageKit:', error)
        return Response.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Delete failed'
            },
            { status: 500 }
        )
    }
}
