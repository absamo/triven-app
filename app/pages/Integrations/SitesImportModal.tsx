import { Button, Group, Modal, Text } from '@mantine/core'

interface SitesImportModalProps {
  opened: boolean
  onClose: () => void
  onImport: (data: any[]) => void
}

export default function SitesImportModal({ opened, onClose, onImport }: SitesImportModalProps) {
  const handleImport = () => {
    // Placeholder implementation
    onImport([])
    onClose()
  }

  return (
    <Modal opened={opened} onClose={onClose} title="Import Sites">
      <Text mb="md">Sites import functionality will be implemented here.</Text>
      <Group justify="flex-end">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleImport}>Import</Button>
      </Group>
    </Modal>
  )
}
