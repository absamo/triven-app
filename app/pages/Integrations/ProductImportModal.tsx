import { Button, Group, Modal, Text } from '@mantine/core'

interface ProductImportModalProps {
    opened: boolean
    onClose: () => void
    onImport: (data: any[]) => void
}

export default function ProductImportModal({ opened, onClose, onImport }: ProductImportModalProps) {
    const handleImport = () => {
        // Placeholder implementation
        onImport([])
        onClose()
    }

    return (
        <Modal opened={opened} onClose={onClose} title="Import Products">
            <Text mb="md">Product import functionality will be implemented here.</Text>
            <Group justify="flex-end">
                <Button variant="outline" onClick={onClose}>
                    Cancel
                </Button>
                <Button onClick={handleImport}>
                    Import
                </Button>
            </Group>
        </Modal>
    )
}
