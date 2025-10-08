// Client-side ImageKit configuration
// This file is safe to import in browser environments

// Image transformation types
export type ImageTransformation = {
  width?: number
  height?: number
  aspectRatio?: string
  crop?: 'at_least' | 'at_max' | 'force' | 'pad_resize' | 'pad_extract'
  cropMode?: 'resize' | 'extract' | 'pad_resize' | 'pad_extract'
  quality?: number
  format?: 'webp' | 'png' | 'jpg' | 'jpeg' | 'avif'
  blur?: number
  progressive?: boolean
  lossless?: boolean
  trim?: number
  border?: string
  rotation?: number
  radius?: number | string
  background?: string
  overlay?: {
    image?: string
    text?: string
    x?: number
    y?: number
    width?: number
    height?: number
    gravity?: string
    transparency?: number
  }
}

// Common image transformation presets
export const imagePresets = {
  thumbnail: { width: 150, height: 150, crop: 'force' as const },
  avatar: { width: 200, height: 200, crop: 'force' as const, radius: 'max' },
  hero: { width: 1200, height: 600, crop: 'force' as const, quality: 85, format: 'webp' as const },
  card: { width: 400, height: 300, crop: 'force' as const, quality: 80, format: 'webp' as const },
  gallery: {
    width: 800,
    height: 600,
    crop: 'at_max' as const,
    quality: 85,
    format: 'webp' as const,
  },
  preview: {
    width: 300,
    height: 200,
    crop: 'force' as const,
    quality: 70,
    format: 'webp' as const,
  },
} as const

// Client-side configuration that will be injected at runtime
declare global {
  interface Window {
    __IMAGEKIT_CONFIG__?: {
      publicKey: string
      urlEndpoint: string
    }
  }
}

/**
 * Get client-side ImageKit configuration
 * This is injected by the server during SSR
 */
export function getImagekitConfig() {
  if (typeof window !== 'undefined' && window.__IMAGEKIT_CONFIG__) {
    return window.__IMAGEKIT_CONFIG__
  }

  // Fallback for server-side rendering or if config is not injected
  return {
    publicKey: '',
    urlEndpoint: '',
  }
}

/**
 * Check if ImageKit is properly configured on the client
 */
export function isImagekitConfigured(): boolean {
  const config = getImagekitConfig()
  return Boolean(config.publicKey && config.urlEndpoint)
}

/**
 * Build transformation string for ImageKit URL
 */
function buildTransformationString(transformations: ImageTransformation): string {
  const parts: string[] = []

  if (transformations.width) parts.push(`w-${transformations.width}`)
  if (transformations.height) parts.push(`h-${transformations.height}`)
  if (transformations.aspectRatio) parts.push(`ar-${transformations.aspectRatio}`)
  if (transformations.crop) parts.push(`c-${transformations.crop}`)
  if (transformations.cropMode) parts.push(`cm-${transformations.cropMode}`)
  if (transformations.quality) parts.push(`q-${transformations.quality}`)
  if (transformations.format) parts.push(`f-${transformations.format}`)
  if (transformations.blur) parts.push(`bl-${transformations.blur}`)
  if (transformations.progressive) parts.push('pr-true')
  if (transformations.lossless) parts.push('lo-true')
  if (transformations.trim) parts.push(`t-${transformations.trim}`)
  if (transformations.border) parts.push(`b-${transformations.border}`)
  if (transformations.rotation) parts.push(`rt-${transformations.rotation}`)
  if (transformations.radius) parts.push(`r-${transformations.radius}`)
  if (transformations.background) parts.push(`bg-${transformations.background}`)

  if (transformations.overlay) {
    const overlay = transformations.overlay
    if (overlay.image) parts.push(`oi-${overlay.image}`)
    if (overlay.text) parts.push(`ot-${overlay.text}`)
    if (overlay.x !== undefined) parts.push(`ox-${overlay.x}`)
    if (overlay.y !== undefined) parts.push(`oy-${overlay.y}`)
    if (overlay.width) parts.push(`ow-${overlay.width}`)
    if (overlay.height) parts.push(`oh-${overlay.height}`)
    if (overlay.gravity) parts.push(`og-${overlay.gravity}`)
    if (overlay.transparency) parts.push(`oa-${overlay.transparency}`)
  }

  return parts.join(',')
}

/**
 * Generate ImageKit URL with transformations (client-safe)
 */
export function generateImageUrl(path: string, transformations: ImageTransformation = {}): string {
  const config = getImagekitConfig()

  // Use the specific ImageKit URL for products
  const baseUrl = config.urlEndpoint || 'https://ik.imagekit.io/snbbqb9pa'
  const transformationString = buildTransformationString(transformations)

  // Remove leading slash from path if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path

  if (transformationString) {
    return `${baseUrl}/tr:${transformationString}/${cleanPath}`
  }

  return `${baseUrl}/${cleanPath}`
}

/**
 * Generate image URL with preset transformations
 */
export function generatePresetImageUrl(
  path: string,
  preset: keyof typeof imagePresets,
  additionalTransformations: ImageTransformation = {}
): string {
  const presetTransformations = imagePresets[preset]
  const mergedTransformations = { ...presetTransformations, ...additionalTransformations }
  return generateImageUrl(path, mergedTransformations)
}

/**
 * Generate product image URL with proper path prefix
 */
export function generateProductImageUrl(
  path: string,
  preset: keyof typeof imagePresets,
  additionalTransformations: ImageTransformation = {}
): string {
  // The path from database should already include the full path including 'products/'
  // Just use it directly without adding any prefix
  return generatePresetImageUrl(path, preset, additionalTransformations)
}

/**
 * Generate responsive image srcSet for different screen sizes
 */
export function generateResponsiveSrcSet(
  path: string,
  baseTransformations: ImageTransformation = {}
): string {
  const sizes = [320, 640, 768, 1024, 1280, 1600, 1920]

  return sizes
    .map((size) => {
      const url = generateImageUrl(path, {
        ...baseTransformations,
        width: size,
        crop: 'at_max',
        format: 'webp',
      })
      return `${url} ${size}w`
    })
    .join(', ')
}
