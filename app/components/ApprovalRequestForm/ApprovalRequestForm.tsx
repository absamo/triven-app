// T033: Approval request form component
import { useState, useEffect } from 'react'
import {
  Select,
  TextInput,
  Textarea,
  Button,
  Stack,
  Group,
  Alert,
  Loader,
  Title,
} from '@mantine/core'
import { IconAlertCircle, IconCheck } from '@tabler/icons-react'
import { useFetcher } from 'react-router'
import { useTranslation } from 'react-i18next'

interface ApprovalRequestFormProps {
  entityType: string
  entityId: string
  requestType: string
  onSuccess?: () => void
  onCancel?: () => void
}

export default function ApprovalRequestForm({
  entityType,
  entityId,
  requestType,
  onSuccess,
  onCancel,
}: ApprovalRequestFormProps) {
  const { t } = useTranslation()
  const fetcher = useFetcher()
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'Medium' as 'Low' | 'Medium' | 'High' | 'Critical' | 'Urgent',
    assignedTo: '',
    assignedRole: '',
    data: {},
  })

  const [users, setUsers] = useState<Array<{ value: string; label: string }>>([])
  const [roles, setRoles] = useState<Array<{ value: string; label: string }>>([])
  const [loading, setLoading] = useState(true)

  // Load users and roles for assignment
  useEffect(() => {
    async function loadAssignees() {
      try {
        const [usersRes, rolesRes] = await Promise.all([
          fetch('/api/users?permission=approve_workflows'),
          fetch('/api/roles?permission=approve_workflows'),
        ])

        if (usersRes.ok) {
          const usersData = await usersRes.json()
          setUsers(
            usersData.users.map((u: any) => ({
              value: u.id,
              label: u.name || u.email,
            }))
          )
        }

        if (rolesRes.ok) {
          const rolesData = await rolesRes.json()
          setRoles(
            rolesData.roles.map((r: any) => ({
              value: r.id,
              label: r.name,
            }))
          )
        }
      } catch (error) {
        console.error('Failed to load assignees:', error)
      } finally {
        setLoading(false)
      }
    }

    loadAssignees()
  }, [])

  // Handle successful submission
  useEffect(() => {
    if (fetcher.data?.success && onSuccess) {
      onSuccess()
    }
  }, [fetcher.data, onSuccess])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const payload = {
      entityType,
      entityId,
      requestType,
      title: formData.title,
      description: formData.description || undefined,
      priority: formData.priority,
      assignedTo: formData.assignedTo || undefined,
      assignedRole: formData.assignedRole || undefined,
      data: formData.data,
    }

    fetcher.submit(
      { payload: JSON.stringify(payload) },
      {
        method: 'post',
        action: '/api/approvals/create',
        encType: 'application/json',
      }
    )
  }

  const isSubmitting = fetcher.state === 'submitting'
  const hasError = fetcher.data?.error

  if (loading) {
    return (
      <Stack align="center" p="xl">
        <Loader size="lg" />
      </Stack>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap="md">
        <Title order={3}>{t('approvals.createRequest')}</Title>

        {hasError && (
          <Alert icon={<IconAlertCircle size={16} />} color="red" title={t('common.error')}>
            {fetcher.data.error}
            {fetcher.data.details && (
              <pre style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>
                {JSON.stringify(fetcher.data.details, null, 2)}
              </pre>
            )}
          </Alert>
        )}

        {fetcher.data?.success && (
          <Alert icon={<IconCheck size={16} />} color="green" title={t('common.success')}>
            {t('approvals.requestCreated')}
          </Alert>
        )}

        <TextInput
          label={t('approvals.title')}
          placeholder={t('approvals.titlePlaceholder')}
          required
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          disabled={isSubmitting}
        />

        <Textarea
          label={t('approvals.description')}
          placeholder={t('approvals.descriptionPlaceholder')}
          rows={4}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          disabled={isSubmitting}
        />

        <Select
          label={t('approvals.priority')}
          data={[
            { value: 'Low', label: t('approvals.priority.low') },
            { value: 'Medium', label: t('approvals.priority.medium') },
            { value: 'High', label: t('approvals.priority.high') },
            { value: 'Critical', label: t('approvals.priority.critical') },
            { value: 'Urgent', label: t('approvals.priority.urgent') },
          ]}
          value={formData.priority}
          onChange={(value) =>
            setFormData({ ...formData, priority: value as typeof formData.priority })
          }
          disabled={isSubmitting}
        />

        <Select
          label={t('approvals.assignToUser')}
          placeholder={t('approvals.selectUser')}
          data={users}
          searchable
          clearable
          value={formData.assignedTo}
          onChange={(value) => setFormData({ ...formData, assignedTo: value || '' })}
          disabled={isSubmitting}
        />

        <Select
          label={t('approvals.assignToRole')}
          placeholder={t('approvals.selectRole')}
          data={roles}
          searchable
          clearable
          value={formData.assignedRole}
          onChange={(value) => setFormData({ ...formData, assignedRole: value || '' })}
          disabled={isSubmitting}
        />

        <Group justify="flex-end" mt="md">
          {onCancel && (
            <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
              {t('common.cancel')}
            </Button>
          )}
          <Button type="submit" loading={isSubmitting}>
            {t('approvals.submitRequest')}
          </Button>
        </Group>
      </Stack>
    </form>
  )
}
