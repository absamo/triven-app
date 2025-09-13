import { Alert, Box, Button, Group, List, Modal, Progress, Stack, Stepper, Text, ThemeIcon, rem } from '@mantine/core'
import { Dropzone, MIME_TYPES } from '@mantine/dropzone'
import { IconAlertCircle, IconCheck, IconDownload, IconFileText, IconFileTypeCsv, IconUpload, IconX } from '@tabler/icons-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

interface CategoryImportModalProps {
    opened: boolean
    onClose: () => void
    onImport: (data: any[]) => void
}

export default function CategoryImportModal({ opened, onClose, onImport }: CategoryImportModalProps) {
    const { t } = useTranslation(['inventory', 'common'])
    const [active, setActive] = useState(0)
    const [file, setFile] = useState<File | null>(null)
    const [isImporting, setIsImporting] = useState(false)
    const [isDownloading, setIsDownloading] = useState(false)
    const [importProgress, setImportProgress] = useState(0)
    const [importResults, setImportResults] = useState<{
        success: number
        errors: string[]
        warnings?: string[]
        total: number
        categories?: any[]
    } | null>(null)

    const nextStep = () => setActive((current) => (current < 3 ? current + 1 : current))
    const prevStep = () => setActive((current) => (current > 0 ? current - 1 : current))

    const handleFileChange = (selectedFile: File | null) => {
        setFile(selectedFile)
        setImportResults(null)
    }

    const handleImport = async () => {
        if (!file) return

        setIsImporting(true)
        setImportProgress(0)

        try {
            const formData = new FormData()
            formData.append('file', file)

            // Simulate progress
            const progressInterval = setInterval(() => {
                setImportProgress(prev => {
                    if (prev >= 90) {
                        clearInterval(progressInterval)
                        return prev
                    }
                    return prev + Math.random() * 10
                })
            }, 200)

            const response = await fetch('/api/categoriesImport', {
                method: 'POST',
                body: formData,
            })

            clearInterval(progressInterval)
            setImportProgress(100)

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || `Import failed: ${response.status}`)
            }

            const results = await response.json()
            setImportResults(results)

            // Move to results step
            nextStep()

            // Call the onImport callback only if there were successful imports
            if (results.success > 0) {
                onImport(results.categories || [])
            }

        } catch (error) {
            console.error('Failed to import categories:', error)
            setImportResults({
                success: 0,
                errors: [error instanceof Error ? error.message : 'Import failed'],
                total: 0
            })
            nextStep()
        } finally {
            setIsImporting(false)
        }
    }

    const handleDownloadTemplate = async () => {
        setIsDownloading(true)
        try {
            // Create a short delay to show the loading state
            await new Promise(resolve => setTimeout(resolve, 500))

            // Create download link and trigger download
            const link = document.createElement('a')
            link.href = '/templates/categories-import-template.csv'
            link.download = 'categories-import-template.csv'
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
        } catch (error) {
            console.error('Failed to download template:', error)
        } finally {
            setIsDownloading(false)
        }
    }

    const handleClose = () => {
        setActive(0)
        setFile(null)
        setIsImporting(false)
        setIsDownloading(false)
        setImportProgress(0)
        setImportResults(null)
        onClose()
    }

    // Check if modal should be closable (only blocked during import or download)
    const isModalClosable = !isImporting && !isDownloading

    return (
        <Modal
            opened={opened}
            onClose={handleClose}
            title={t('common:importData')}
            size="xxl"
            closeOnClickOutside={isModalClosable}
            closeOnEscape={isModalClosable}
            withCloseButton={isModalClosable}
        >
            <Stepper active={active} mb="xl">
                <Stepper.Step
                    label={t('inventory:selectFile')}
                    description={t('inventory:chooseDataSource')}
                    icon={<IconFileText size={18} />}
                >
                    <Stack gap="md" mt="md">
                        <Text size="sm" c="dimmed">
                            {t('inventory:selectFileDescription')}
                        </Text>

                        <Button
                            variant="light"
                            size="sm"
                            onClick={handleDownloadTemplate}
                            loading={isDownloading}
                            leftSection={!isDownloading ? <IconDownload size={16} /> : undefined}
                        >
                            {t('inventory:downloadTemplate')}
                        </Button>

                        <Dropzone
                            onDrop={(files) => handleFileChange(files[0] || null)}
                            maxSize={2 * 1024 ** 2} // 2MB
                            accept={[MIME_TYPES.csv]}
                            multiple={false}
                        >
                            <Group justify="center" gap="xl" mih={220} style={{ pointerEvents: 'none' }}>
                                <Dropzone.Accept>
                                    <IconUpload
                                        style={{
                                            width: rem(52),
                                            height: rem(52),
                                            color: 'var(--mantine-color-blue-6)',
                                        }}
                                        stroke={1.5}
                                    />
                                </Dropzone.Accept>
                                <Dropzone.Reject>
                                    <IconX
                                        style={{
                                            width: rem(52),
                                            height: rem(52),
                                            color: 'var(--mantine-color-red-6)',
                                        }}
                                        stroke={1.5}
                                    />
                                </Dropzone.Reject>
                                <Dropzone.Idle>
                                    <IconFileTypeCsv
                                        style={{
                                            width: rem(52),
                                            height: rem(52),
                                            color: 'var(--mantine-color-dimmed)',
                                        }}
                                        stroke={1.5}
                                    />
                                </Dropzone.Idle>

                                <div>
                                    <Text size="xl" inline>
                                        {t('inventory:dragDropFiles')}
                                    </Text>
                                    <Text size="sm" c="dimmed" inline mt={7}>
                                        {t('inventory:fileRequirements')}
                                    </Text>
                                </div>
                            </Group>
                        </Dropzone>

                        {file && (
                            <Alert icon={<IconCheck size={16} />} title={t('inventory:fileSelected')} color="green">
                                <Group justify="space-between" align="center">
                                    <Box>
                                        <Text size="sm" fw={500}>
                                            {file.name}
                                        </Text>
                                        <Text size="xs" c="dimmed">
                                            {(file.size / 1024).toFixed(1)} KB • {t('inventory:csvFile')}
                                        </Text>
                                    </Box>
                                    <Button
                                        variant="subtle"
                                        size="xs"
                                        color="red"
                                        onClick={() => handleFileChange(null)}
                                        leftSection={<IconX size={14} />}
                                    >
                                        {t('inventory:removeFile')}
                                    </Button>
                                </Group>
                            </Alert>
                        )}
                    </Stack>
                </Stepper.Step>

                <Stepper.Step
                    label={t('inventory:mapFields')}
                    description={t('inventory:configureFieldMapping')}
                    icon={<IconFileText size={18} />}
                >
                    <Stack gap="md" mt="md">
                        <Text size="sm" c="dimmed">
                            {t('inventory:mapFieldsDescription')}
                        </Text>

                        <Alert icon={<IconAlertCircle size={16} />} title={t('inventory:requiredFields')} color="blue">
                            <List size="sm">
                                <List.Item>{t('inventory:categoryNamesMustBeUnique')}</List.Item>
                            </List>
                        </Alert>

                        <Alert icon={<IconAlertCircle size={16} />} title={t('inventory:validationRules')} color="yellow">
                            <List size="sm">
                                <List.Item>{t('inventory:categoryNamesMustBeUnique')}</List.Item>
                                <List.Item>{t('inventory:duplicateCategoryNamesRejected')}</List.Item>
                                <List.Item>{t('inventory:invalidFieldsRejected')}</List.Item>
                                <List.Item>{t('inventory:detailedValidationResults')}</List.Item>
                            </List>
                        </Alert>
                    </Stack>
                </Stepper.Step>

                <Stepper.Step
                    label={t('inventory:reviewImport')}
                    description={t('inventory:confirmAndComplete')}
                    icon={<IconCheck size={18} />}
                >
                    <Stack gap="md" mt="md">
                        <Text size="sm" c="dimmed">
                            {t('inventory:reviewDescription')}
                        </Text>

                        {file && (
                            <Alert icon={<IconFileText size={16} />} title={t('inventory:importSummary')} color="blue">
                                <Text size="sm">
                                    {t('inventory:fileName')}: {file.name}<br />
                                    {t('inventory:fileSize')}: {(file.size / 1024).toFixed(1)} KB
                                </Text>
                            </Alert>
                        )}

                        {isImporting && (
                            <Stack gap="sm">
                                <Text size="sm" fw={500}>{t('inventory:importing')}</Text>
                                <Progress value={importProgress} animated />
                                <Text size="xs" c="dimmed">{Math.round(importProgress)}% {t('inventory:complete')}</Text>
                            </Stack>
                        )}
                    </Stack>
                </Stepper.Step>

                <Stepper.Completed>
                    <Stack gap="md" mt="md">
                        {importResults && (
                            <>
                                {importResults.errors.length === 0 && (!importResults.warnings || importResults.warnings.length === 0) ? (
                                    <Alert icon={<IconCheck size={16} />} title={t('inventory:importSuccessful')} color="green">
                                        <Text size="sm" mb="xs">
                                            {t('inventory:categoriesImported', { count: importResults.success })}
                                        </Text>
                                        {importResults.categories && importResults.categories.length > 0 && (
                                            <>
                                                <Text size="sm" fw="500" mt="sm">{t('inventory:importedCategories')}:</Text>
                                                <List size="sm" mt="xs">
                                                    {importResults.categories.map((category, index) => (
                                                        <List.Item key={index} icon={<ThemeIcon color="green" size={16} radius="xl"><IconCheck size={10} /></ThemeIcon>}>
                                                            {category.name}
                                                        </List.Item>
                                                    ))}
                                                </List>
                                            </>
                                        )}
                                    </Alert>
                                ) : importResults.success > 0 ? (
                                    <>
                                        <Alert icon={<IconCheck size={16} />} title={t('inventory:importCompleteWithIssues')} color="green">
                                            <Text size="sm" mb="xs">
                                                {t('inventory:partialCategoryImport', {
                                                    success: importResults.success,
                                                    total: importResults.total
                                                })}
                                            </Text>
                                            {importResults.categories && importResults.categories.length > 0 && (
                                                <>
                                                    <Text size="sm" fw="500" mt="sm">{t('inventory:successfullyImportedCategories')}:</Text>
                                                    <List size="sm" mt="xs">
                                                        {importResults.categories.map((category, index) => (
                                                            <List.Item key={index} icon={<ThemeIcon color="green" size={16} radius="xl"><IconCheck size={10} /></ThemeIcon>}>
                                                                {category.name}
                                                            </List.Item>
                                                        ))}
                                                    </List>
                                                </>
                                            )}
                                        </Alert>

                                        {/* Show errors for validation failures with proper formatting */}
                                        {importResults.errors.length > 0 && (
                                            <Alert icon={<IconX size={16} />} title={t('inventory:importErrors')} color="red">
                                                <Text size="sm" mb="xs">
                                                    {t('inventory:categoriesFailedValidation', { count: importResults.errors.length })}
                                                </Text>
                                                <Stack gap="xs">
                                                    {importResults.errors.map((error, index) => (
                                                        <Box key={index} style={{
                                                            whiteSpace: 'pre-line',
                                                            fontSize: '0.875rem',
                                                            lineHeight: '1.4'
                                                        }}>
                                                            • {error}
                                                        </Box>
                                                    ))}
                                                </Stack>
                                            </Alert>
                                        )}
                                    </>
                                ) : (
                                    <Alert
                                        icon={<IconX size={16} />}
                                        title={t('inventory:importFailed')}
                                        color='red'
                                    >
                                        <Text size="sm" mb="xs">
                                            {t('inventory:noCategoriesImported')}
                                        </Text>
                                        <Text size="sm" mt="xs" fw="500">{t('inventory:validationErrors')}:</Text>
                                        <Stack gap="xs" mt="xs">
                                            {importResults.errors.map((error, index) => (
                                                <Box key={index} style={{
                                                    whiteSpace: 'pre-line',
                                                    fontSize: '0.875rem',
                                                    lineHeight: '1.4'
                                                }}>
                                                    • {error}
                                                </Box>
                                            ))}
                                        </Stack>
                                    </Alert>
                                )}
                            </>
                        )}
                    </Stack>
                </Stepper.Completed>
            </Stepper>

            <Group justify="space-between" mt="xl">
                <Group>
                    {active > 0 && active < 3 && (
                        <Button variant="outline" onClick={prevStep} disabled={isImporting}>
                            {t('common:back')}
                        </Button>
                    )}
                </Group>

                <Group>
                    <Button variant="outline" onClick={handleClose} disabled={!isModalClosable}>
                        {active === 3 && importResults ? t('common:close') : t('common:cancel')}
                    </Button>

                    {active === 0 && (
                        <Button onClick={nextStep} disabled={!file}>
                            {t('common:next')}
                        </Button>
                    )}

                    {active === 1 && (
                        <Button onClick={nextStep}>
                            {t('common:next')}
                        </Button>
                    )}

                    {active === 2 && (
                        <Button onClick={handleImport} loading={isImporting} disabled={!file}>
                            {t('common:import')}
                        </Button>
                    )}
                </Group>
            </Group>
        </Modal>
    )
}
