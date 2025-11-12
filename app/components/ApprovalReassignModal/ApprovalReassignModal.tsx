import { Button, Group, Modal, Radio, Select, Stack, Text, Textarea } from '@mantine/core'
import { IconTransferOut } from '@tabler/icons-react'
import { useEffect, useState } from 'react'
import { useFetcher } from 'react-router'

interface User {
  id: string
  name: string | null
  email: string
}

interface Role {
  id: string
  name: string
}

interface ApprovalReassignModalProps {
  approvalId: string
  currentAssignee?: { type: 'user' | 'role'; id: string; name: string }
  opened: boolean
  onClose: () => void
  users: User[]
  roles: Role[]
}

export function ApprovalReassignModal({
  approvalId,
  currentAssignee,
  opened,
  onClose,
  users,
  roles,
}: ApprovalReassignModalProps) {
  const fetcher = useFetcher()
  const [assignType, setAssignType] = useState<'user' | 'role'>('user')
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [selectedRole, setSelectedRole] = useState<string | null>(null)
  const [reason, setReason] = useState('')

  // Reset form when modal opens
  useEffect(() => {
    if (opened) {
      setAssignType('user')
      setSelectedUser(null)
      setSelectedRole(null)
      setReason('')
    }
  }, [opened])

  // Close modal on successful submission
  useEffect(() => {
    if (fetcher.state === 'idle' && fetcher.data && opened) {
      onClose()
    }
  }, [fetcher.state, fetcher.data, opened, onClose])

  const handleSubmit = () => {
    if (!reason.trim()) return

    const formData = new FormData()

    if (assignType === 'user' && selectedUser) {
      formData.append('assignedTo', selectedUser)
    } else if (assignType === 'role' && selectedRole) {
      formData.append('assignedRole', selectedRole)
    } else {
      return // No assignee selected
    }

    formData.append('reason', reason.trim())

    fetcher.submit(formData, {
      method: 'POST',
      action: `/api/approvals/${approvalId}/reassign`,
    })
  }

  const isFormValid = () => {
    if (!reason.trim()) return false
    if (assignType === 'user' && !selectedUser) return false
    if (assignType === 'role' && !selectedRole) return false
    return true
  }

  const userOptions = users
    .filter((u) => u.id !== currentAssignee?.id) // Don't show current assignee
    .map((u) => ({
      value: u.id,
      label: u.name || u.email,
    }))

  const roleOptions = roles
    .filter((r) => r.id !== currentAssignee?.id) // Don't show current assignee
    .map((r) => ({
      value: r.id,
      label: r.name,
    }))

  return (
    <Modal opened={opened} onClose={onClose} title="Reassign Approval" size="md" centered>
      <Stack gap="md">
        {currentAssignee && (
          <Text size="sm" c="dimmed">
            Currently assigned to: <strong>{currentAssignee.name}</strong> ({currentAssignee.type})
          </Text>
        )}

        <Radio.Group
          value={assignType}
          onChange={(value) => setAssignType(value as 'user' | 'role')}
          label="Reassign to"
          required
        >
          <Group mt="xs">
            <Radio value="user" label="Specific User" />
            <Radio value="role" label="Role" />
          </Group>
        </Radio.Group>

        {assignType === 'user' && (
          <Select
            label="Select User"
            placeholder="Choose a user"
            data={userOptions}
            value={selectedUser}
            onChange={setSelectedUser}
            searchable
            required
            disabled={fetcher.state === 'submitting'}
            nothingFoundMessage="No users available"
          />
        )}

        {assignType === 'role' && (
          <Select
            label="Select Role"
            placeholder="Choose a role"
            data={roleOptions}
            value={selectedRole}
            onChange={setSelectedRole}
            searchable
            required
            disabled={fetcher.state === 'submitting'}
            nothingFoundMessage="No roles available"
          />
        )}

        <Textarea
          label="Reason for Reassignment"
          placeholder="Explain why this approval is being reassigned..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          minRows={3}
          maxRows={6}
          required
          disabled={fetcher.state === 'submitting'}
          error={fetcher.data?.message}
        />

        <Group justify="flex-end" mt="md">
          <Button variant="subtle" onClick={onClose} disabled={fetcher.state === 'submitting'}>
            Cancel
          </Button>
          <Button
            leftSection={<IconTransferOut size={16} />}
            onClick={handleSubmit}
            disabled={!isFormValid() || fetcher.state === 'submitting'}
            loading={fetcher.state === 'submitting'}
          >
            Reassign
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}
