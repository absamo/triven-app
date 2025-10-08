import ImageKit from 'imagekit'

// Server-side ImageKit configuration
// This file should only be imported on the server

// Environment variables validation
const requiredEnvVars = {
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
}

// Check if all required environment variables are present
const missingVars = Object.entries(requiredEnvVars)
  .filter(([_, value]) => !value)
  .map(([key]) => key)

if (missingVars.length > 0) {
  console.warn(`Missing ImageKit environment variables: ${missingVars.join(', ')}`)
}

// Create ImageKit instance for server-side operations
export const imagekit = requiredEnvVars.privateKey
  ? new ImageKit({
      publicKey: requiredEnvVars.publicKey!,
      privateKey: requiredEnvVars.privateKey!,
      urlEndpoint: requiredEnvVars.urlEndpoint!,
    })
  : null

// Check if ImageKit is properly configured (server-side)
export const isImagekitConfigured = () => {
  return Boolean(
    requiredEnvVars.publicKey && requiredEnvVars.privateKey && requiredEnvVars.urlEndpoint
  )
}

/**
 * Upload file to ImageKit (server-side only)
 */
export async function uploadToImagekit(
  file: Buffer | string,
  fileName: string,
  folder?: string,
  tags?: string[]
) {
  if (!imagekit) {
    console.error('ImageKit not configured - missing credentials')
    throw new Error('ImageKit not configured')
  }

  try {
    const result = await imagekit.upload({
      file,
      fileName,
      folder: folder || 'uploads',
      tags: tags || [],
      useUniqueFileName: true,
    })

    return {
      success: true,
      data: {
        fileId: result.fileId,
        name: result.name,
        url: result.url,
        thumbnailUrl: result.thumbnailUrl,
        filePath: result.filePath,
        size: result.size,
        fileType: result.fileType,
        width: result.width,
        height: result.height,
      },
    }
  } catch (error) {
    console.error('ImageKit upload error:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    }
  }
}

/**
 * Delete file from ImageKit (server-side only)
 */
export async function deleteFromImagekit(fileId: string) {
  if (!imagekit) {
    throw new Error('ImageKit not configured')
  }

  try {
    await imagekit.deleteFile(fileId)
    return { success: true }
  } catch (error) {
    console.error('ImageKit delete error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Delete failed',
    }
  }
}

/**
 * Get authentication parameters for client-side uploads
 */
export function getImagekitAuthParams() {
  if (!imagekit) {
    throw new Error('ImageKit not configured')
  }

  return imagekit.getAuthenticationParameters()
}
