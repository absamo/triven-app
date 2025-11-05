import type React from 'react'
import { useEffect, useRef, useState } from 'react'
import {
  generateImageUrl,
  generateResponsiveSrcSet,
  type ImageTransformation,
} from '~/app/lib/imagekit.client-config'

export interface OptimizedImageProps
  extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src' | 'srcSet'> {
  src: string
  alt: string
  width?: number
  height?: number
  transformations?: ImageTransformation
  responsive?: boolean
  lazy?: boolean
  placeholder?: 'blur' | 'color' | string
  onLoad?: () => void
  onError?: () => void
  fallback?: string
  priority?: boolean
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  transformations = {},
  responsive = false,
  lazy = true,
  placeholder,
  onLoad,
  onError,
  fallback,
  priority = false,
  className,
  style,
  ...props
}: OptimizedImageProps) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)
  const [inView, setInView] = useState(!lazy || priority)
  const imgRef = useRef<HTMLImageElement>(null)

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy || priority || inView) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => observer.disconnect()
  }, [lazy, priority, inView])

  const handleLoad = () => {
    setLoaded(true)
    onLoad?.()
  }

  const handleError = () => {
    setError(true)
    onError?.()
  }

  // Build transformations with dimensions
  const finalTransformations = {
    ...transformations,
    ...(width && { width }),
    ...(height && { height }),
  }

  // Generate URLs
  const optimizedSrc = generateImageUrl(src, finalTransformations)
  const srcSet = responsive ? generateResponsiveSrcSet(src, finalTransformations) : undefined

  // Generate placeholder
  let placeholderSrc: string | undefined
  if (placeholder === 'blur') {
    placeholderSrc = generateImageUrl(src, {
      ...finalTransformations,
      width: Math.min(finalTransformations.width || 50, 50),
      height: Math.min(finalTransformations.height || 50, 50),
      blur: 10,
      quality: 20,
    })
  }

  // Styles for container and image
  const containerStyle: React.CSSProperties = {
    position: 'relative',
    display: 'inline-block',
    width: width || 'auto',
    height: height || 'auto',
    backgroundColor:
      placeholder === 'color' || typeof placeholder === 'string'
        ? typeof placeholder === 'string' && placeholder !== 'color'
          ? placeholder
          : '#f0f0f0'
        : undefined,
    ...style,
  }

  const imgStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'opacity 0.3s ease',
    opacity: loaded ? 1 : 0,
  }

  const placeholderStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    opacity: loaded ? 0 : 1,
    transition: 'opacity 0.3s ease',
    filter: placeholder === 'blur' ? 'blur(10px)' : undefined,
  }

  if (error && fallback) {
    return (
      <img
        ref={imgRef}
        src={fallback}
        alt={alt}
        className={className}
        style={{ ...containerStyle, ...imgStyle }}
        {...props}
      />
    )
  }

  return (
    <div style={containerStyle} className={className}>
      {/* Placeholder image */}
      {placeholder === 'blur' && placeholderSrc && (
        <img src={placeholderSrc} alt="" style={placeholderStyle} aria-hidden="true" />
      )}

      {/* Main image */}
      {inView && (
        <img
          ref={imgRef}
          src={optimizedSrc}
          srcSet={srcSet}
          sizes={
            responsive ? '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw' : undefined
          }
          alt={alt}
          loading={lazy && !priority ? 'lazy' : 'eager'}
          onLoad={handleLoad}
          onError={handleError}
          style={imgStyle}
          {...props}
        />
      )}
    </div>
  )
}

// Preset components for common use cases
export function Avatar({
  src,
  alt,
  size = 40,
  ...props
}: {
  src: string
  alt: string
  size?: number
} & Omit<OptimizedImageProps, 'width' | 'height' | 'transformations'>) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={size}
      height={size}
      transformations={{ crop: 'force', radius: 'max' }}
      {...props}
    />
  )
}

export function Thumbnail({ src, alt, ...props }: Omit<OptimizedImageProps, 'transformations'>) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={150}
      height={150}
      transformations={{ crop: 'force', quality: 80, format: 'webp' }}
      {...props}
    />
  )
}

export function HeroImage({
  src,
  alt,
  ...props
}: Omit<OptimizedImageProps, 'transformations' | 'responsive'>) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={1200}
      height={600}
      transformations={{ crop: 'force', quality: 85, format: 'webp' }}
      responsive={true}
      priority={true}
      {...props}
    />
  )
}

export function CardImage({ src, alt, ...props }: Omit<OptimizedImageProps, 'transformations'>) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={400}
      height={300}
      transformations={{ crop: 'force', quality: 80, format: 'webp' }}
      responsive={true}
      {...props}
    />
  )
}
