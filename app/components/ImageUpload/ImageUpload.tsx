import { Alert, Button, Group, Progress, Stack, Text } from '@mantine/core'
import { Dropzone, type FileWithPath } from '@mantine/dropzone'
import { IconPhoto, IconUpload, IconX } from '@tabler/icons-react'
import { useCallback, useRef, useState } from 'react'
import { generateImageUrl, isImagekitConfigured } from '~/app/lib/imagekit.client-config'

export interface ImageUploadProps {
    onUpload?: (files: UploadedFile[]) => void
    onError?: (error: string) => void
    folder?: string
    tags?: string[]
    maxFiles?: number
    maxSize?: number
    acceptedFormats?: string[]
    preview?: boolean
    disabled?: boolean
}

export interface UploadedFile {
    fileId: string
    name: string
    url: string
    thumbnailUrl?: string
    filePath: string
    size: number
    fileType: string
    width?: number
    height?: number
}

export function ImageUpload({
    onUpload,
    onError,
    folder = 'uploads',
    tags = [],
    maxFiles = 1,
    maxSize = 2 * 1024 * 1024, // 2MB
    acceptedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
    preview = true,
    disabled = false,
}: ImageUploadProps) {
    const [uploading, setUploading] = useState(false)
    const [progress, setProgress] = useState(0)
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])

    const openRef = useRef<() => void>(null)

    const handleDrop = useCallback(async (files: FileWithPath[]) => {
        if (!isImagekitConfigured()) {
            onError?.('ImageKit is not configured')
            return
        }

        setUploading(true)
        setProgress(0)

        try {
            const uploadPromises = files.map(async (file) => {
                const formData = new FormData()
                formData.append('file', file)
                formData.append('fileName', file.name)
                formData.append('folder', folder)
                formData.append('tags', JSON.stringify(tags))

                const response = await fetch('/api/imagekit/upload', {
                    method: 'POST',
                    body: formData,
                })

                if (!response.ok) {
                    throw new Error(`Upload failed: ${response.statusText}`)
                }

                return response.json()
            })

            const results = await Promise.all(uploadPromises)
            const successful = results.filter(result => result.success)
            const failed = results.filter(result => !result.success)

            if (failed.length > 0) {
                onError?.(failed.map(f => f.error).join(', '))
            }

            if (successful.length > 0) {
                const newFiles = successful.map(result => result.data)
                setUploadedFiles(prev => [...prev, ...newFiles])
                onUpload?.(newFiles)
            }

            setProgress(100)
        } catch (error) {
            console.error('Upload error:', error)
            onError?.(error instanceof Error ? error.message : 'Upload failed')
        } finally {
            setUploading(false)
            setTimeout(() => setProgress(0), 1000)
        }
    }, [folder, tags, onUpload, onError])

    const handleReject = useCallback((rejectedFiles: any[]) => {
        const errors = rejectedFiles.map(file => {
            if (file.errors) {
                return file.errors.map((error: any) => error.message).join(', ')
            }
            return 'File rejected'
        })
        onError?.(errors.join('; '))
    }, [onError])

    if (!isImagekitConfigured()) {
        return (
            <Alert color="yellow" title="ImageKit Configuration Required">
                Please configure ImageKit environment variables to enable image uploads.
            </Alert>
        )
    }

    return (
        <Stack gap="sm">
            <Dropzone
                openRef={openRef}
                onDrop={handleDrop}
                onReject={handleReject}
                maxSize={maxSize}
                accept={acceptedFormats}
                maxFiles={maxFiles}
                loading={uploading}
                disabled={disabled}
            >
                <Group justify="center" gap="xl" mih={220} style={{ pointerEvents: 'none' }}>
                    <Dropzone.Accept>
                        <IconUpload size={52} color="var(--mantine-color-blue-6)" stroke={1.5} />
                    </Dropzone.Accept>
                    <Dropzone.Reject>
                        <IconX size={52} color="var(--mantine-color-red-6)" stroke={1.5} />
                    </Dropzone.Reject>
                    <Dropzone.Idle>
                        <IconPhoto size={52} color="var(--mantine-color-dimmed)" stroke={1.5} />
                    </Dropzone.Idle>

                    <div>
                        <Text size="xl" inline>
                            Drag images here or click to select files
                        </Text>
                        <Text size="sm" c="dimmed" inline mt={7}>
                            Attach up to {maxFiles} file{maxFiles !== 1 ? 's' : ''}, each file should not exceed{' '}
                            {Math.round(maxSize / 1024 / 1024)}MB
                        </Text>
                    </div>
                </Group>
            </Dropzone>

            {uploading && (
                <Progress value={progress} size="sm" animated />
            )}

            {preview && uploadedFiles.length > 0 && (
                <Stack gap="xs">
                    <Text size="sm" fw={500}>Uploaded Files:</Text>
                    {uploadedFiles.map((file) => (
                        <Group key={file.fileId} gap="sm">
                            <img
                                src={generateImageUrl(file.filePath, { width: 50, height: 50, crop: 'force' })}
                                alt={file.name}
                                style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 4 }}
                            />
                            <div>
                                <Text size="sm" fw={500}>{file.name}</Text>
                                <Text size="xs" c="dimmed">
                                    {(file.size / 1024).toFixed(1)} KB
                                    {file.width && file.height && ` • ${file.width}×${file.height}`}
                                </Text>
                            </div>
                        </Group>
                    ))}
                </Stack>
            )}

            <Group gap="sm">
                <Button
                    onClick={() => openRef.current?.()}
                    loading={uploading}
                    disabled={disabled}
                    variant="light"
                    leftSection={<IconUpload size={16} />}
                >
                    Select Files
                </Button>
            </Group>
        </Stack>
    )
}
