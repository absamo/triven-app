import type { ActionFunctionArgs } from 'react-router'
import { uploadToImagekit } from '~/app/lib/imagekit'

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const fileName = formData.get('fileName') as string
    const folder = (formData.get('folder') as string) || 'uploads'
    const tags = JSON.parse((formData.get('tags') as string) || '[]')

    console.log('Upload request received:', {
      fileName: fileName || file?.name,
      fileSize: file?.size,
      folder,
      tags,
    })

    if (!file) {
      console.error('No file provided in upload request')
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    console.log('File converted to buffer, size:', buffer.length)

    // Upload to ImageKit
    const result = await uploadToImagekit(buffer, fileName || file.name, folder, tags)

    console.log('ImageKit upload result:', result)

    if (!result.success) {
      console.error('ImageKit upload failed:', result.error)
      return new Response(JSON.stringify({ error: result.error }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    console.log('Upload successful, returning result')
    return new Response(
      JSON.stringify({
        success: true,
        data: result.data,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Upload API error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
