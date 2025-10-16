import {
  Badge,
  Button,
  Card,
  Container,
  Grid,
  Group,
  Menu,
  Modal,
  Paper,
  Select,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
  Title as MantineTitle,
  useMantineColorScheme,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import {
  IconChartBar,
  IconCheck,
  IconChevronRight,
  IconCopy,
  IconFilter,
  IconGitBranch,
  IconPlus,
  IconTrash,
  IconX,
} from '@tabler/icons-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useFetcher, useLoaderData, useNavigate, useRevalidator } from 'react-router'
import { TableActionsMenu } from '~/app/components'
import WorkflowTemplateModal from '~/app/components/WorkflowTemplateModal/WorkflowTemplateModal'
import { formatLocalizedDate } from '~/app/lib/dayjs'
import { Title } from '~/app/partials/Title'

interface WorkflowStep {
  id: string
  name: string
  description?: string
  type:
    | 'approval'
    | 'review'
    | 'notification'
    | 'data_validation'
    | 'automatic_action'
    | 'conditional_logic'
    | 'parallel_approval'
    | 'sequential_approval'
    | 'escalation'
    | 'integration'
  assigneeType: 'user' | 'role' | 'creator' | 'manager' | 'department_head'
  assigneeId: string
  assigneeName: string
  order: number
  isRequired: boolean
  timeoutDays?: number
  autoApprove?: boolean
  allowParallel?: boolean
  conditions?: Record<string, any>
}

interface WorkflowTemplate {
  id: string
  name: string
  description: string
  entityType: string
  triggerType: string
  triggerConditions: any
  priority: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  createdBy: {
    email: string
    profile?: { firstName?: string; lastName?: string }
  }
  steps: WorkflowStep[]
  usageCount: number
}

interface CurrentUser {
  id: string
  email: string
  role?: { id: string; name: string } | null
}

interface UserOption {
  id: string
  email: string
  name: string
  firstName: string
  lastName: string
}

interface RoleOption {
  id: string
  name: string
  description?: string
}

export default function WorkflowTemplatesPage() {
  const { colorScheme } = useMantineColorScheme()
  const { t, i18n } = useTranslation(['workflows', 'common'])
  const navigate = useNavigate()
  const { workflowTemplates, currentUser, users, roles } = useLoaderData<{
    workflowTemplates: WorkflowTemplate[]
    currentUser: CurrentUser
    users: UserOption[]
    roles: RoleOption[]
  }>()

  const [searchQuery, setSearchQuery] = useState('')
  const [triggerTypeFilter, setTriggerTypeFilter] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string | null>(null)

  // Modal state
  const [modalOpened, setModalOpened] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<WorkflowTemplate | null>(null)
  const [actionType, setActionType] = useState<'create' | 'edit' | 'clone' | null>(null)
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null)

  // Delete dialog state
  const [deleteDialogOpened, setDeleteDialogOpened] = useState(false)
  const [templateToDelete, setTemplateToDelete] = useState<WorkflowTemplate | null>(null)

  // API interaction
  const fetcher = useFetcher()
  const revalidator = useRevalidator()
  const loading = fetcher.state === 'submitting'

  const filteredTemplates = (workflowTemplates || []).filter((template: WorkflowTemplate) => {
    if (
      searchQuery &&
      !template.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !(template.description?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    )
      return false
    if (triggerTypeFilter && template.triggerType !== triggerTypeFilter) return false
    if (statusFilter === 'active' && !template.isActive) return false
    if (statusFilter === 'inactive' && template.isActive) return false
    return true
  })

  // Modal handlers
  const openModal = (template: WorkflowTemplate | null, action: 'create' | 'edit' | 'clone') => {
    setSelectedTemplate(template)
    setActionType(action)
    setModalOpened(true)
  }

  const closeModal = () => {
    setModalOpened(false)
    setSelectedTemplate(null)
    setActionType(null)
  }

  // Handle template actions
  const handleTemplateAction = async (data: {
    action: string
    templateId?: string
    templateData?: any
  }) => {
    try {
      const formData = new FormData()
      // Convert action to intent for API compatibility
      formData.append('intent', data.action)

      Object.entries(data).forEach(([key, value]) => {
        if (key !== 'action' && value !== undefined && value !== null) {
          if (typeof value === 'object') {
            formData.append(key, JSON.stringify(value))
          } else {
            formData.append(key, value.toString())
          }
        }
      })

      fetcher.submit(formData, {
        method: 'POST',
        action: '/api/workflow-templates',
      })

      const actionVerb =
        data.action === 'create'
          ? t('workflows:messages.created', 'created')
          : data.action === 'update'
            ? t('workflows:messages.updated', 'updated')
            : data.action === 'clone'
              ? t('workflows:messages.cloned', 'cloned')
              : t('workflows:messages.processed', 'processed')

      notifications.show({
        title: t('common:success', 'Success'),
        message: t(
          'workflows:messages.templateActionSuccess',
          'Template {{action}} successfully!',
          { action: actionVerb }
        ),
        color: 'green',
        autoClose: 3000,
      })

      closeModal()
      setTimeout(() => {
        revalidator.revalidate()
      }, 500)
    } catch (error) {
      console.error('Error processing template action:', error)
      notifications.show({
        title: t('common:error', 'Error'),
        message: t(
          'workflows:messages.actionFailed',
          'Failed to process the template action. Please try again.'
        ),
        color: 'red',
      })
    }
  }

  const handleDeleteTemplate = (template: WorkflowTemplate) => {
    setTemplateToDelete(template)
    setDeleteDialogOpened(true)
  }

  const confirmDeleteTemplate = async () => {
    if (!templateToDelete) return

    try {
      const formData = new FormData()
      formData.append('intent', 'delete')
      formData.append('templateId', templateToDelete.id)

      fetcher.submit(formData, {
        method: 'POST',
        action: '/api/workflow-templates',
      })

      notifications.show({
        title: t('common:success', 'Success'),
        message: t('workflows:messages.templateDeleted', 'Template deleted successfully!'),
        color: 'green',
        autoClose: 3000,
      })

      setDeleteDialogOpened(false)
      setTemplateToDelete(null)

      setTimeout(() => {
        revalidator.revalidate()
      }, 500)
    } catch (error) {
      console.error('Error deleting template:', error)
      notifications.show({
        title: t('common:error', 'Error'),
        message: t(
          'workflows:messages.deleteFailed',
          'Failed to delete the template. Please try again.'
        ),
        color: 'red',
      })
    }
  }

  const cancelDeleteTemplate = () => {
    setDeleteDialogOpened(false)
    setTemplateToDelete(null)
  }

  const handleCloneTemplate = async (templateId: string) => {
    try {
      console.log('Cloning template:', templateId)

      // Use the same pattern as handleTemplateAction
      const formData = new FormData()
      formData.append('intent', 'duplicate')
      formData.append('templateId', templateId)

      const response = await fetch('/api/workflow-templates', {
        method: 'POST',
        body: formData,
        // Include credentials to ensure authentication
        credentials: 'same-origin',
      })

      console.log('Clone response status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Clone error response:', errorText)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const result = await response.json()
      console.log('Clone result:', result)

      if (result.success && result.template) {
        notifications.show({
          title: t('common:success', 'Success'),
          message: t(
            'workflows:messages.templateActionSuccess',
            'Template {{action}} successfully!',
            { action: t('workflows:messages.cloned', 'cloned') }
          ),
          color: 'green',
          autoClose: 3000,
        })

        // Refresh the templates list to show the new cloned template
        setTimeout(() => {
          window.location.reload()
        }, 500)
      } else {
        throw new Error(result.error || 'Clone failed')
      }
    } catch (error) {
      console.error('Error cloning template:', error)
      notifications.show({
        title: t('common:error', 'Error'),
        message: t(
          'workflows:messages.actionFailed',
          'Failed to process the template action. Please try again.'
        ),
        color: 'red',
      })
    }
  }

  const toggleTemplateStatus = async (templateId: string, isActive: boolean) => {
    try {
      const formData = new FormData()
      formData.append('intent', 'toggle-status')
      formData.append('templateId', templateId)
      formData.append('isActive', isActive.toString())

      fetcher.submit(formData, {
        method: 'POST',
        action: '/api/workflow-templates',
      })

      notifications.show({
        title: t('common:success', 'Success'),
        message: t('workflows:messages.statusUpdated', 'Template status updated successfully!'),
        color: 'green',
        autoClose: 3000,
      })

      setTimeout(() => {
        revalidator.revalidate()
      }, 500)
    } catch (error) {
      console.error('Error updating template status:', error)
      notifications.show({
        title: t('common:error', 'Error'),
        message: t(
          'workflows:messages.statusUpdateFailed',
          'Failed to update template status. Please try again.'
        ),
        color: 'red',
      })
    }
  }

  // Helper functions
  const getFilterGradient = () => {
    return colorScheme === 'dark'
      ? 'linear-gradient(135deg, var(--mantine-color-dark-7) 0%, var(--mantine-color-dark-6) 50%, var(--mantine-color-dark-5) 100%)'
      : 'linear-gradient(135deg, var(--mantine-color-gray-0) 0%, var(--mantine-color-gray-1) 50%, var(--mantine-color-gray-2) 100%)'
  }

  const getCardTextColor = () => {
    return colorScheme === 'dark' ? 'gray.0' : 'dark.8'
  }

  const getTitleColor = () => {
    return colorScheme === 'dark' ? 'gray.1' : 'gray.7'
  }

  const getTriggerTypeColor = (triggerType: string) => {
    switch (triggerType) {
      case 'purchase_order_create':
      case 'purchase_order_threshold':
        return 'blue'
      case 'sales_order_create':
      case 'sales_order_threshold':
        return 'green'
      case 'stock_adjustment_create':
        return 'orange'
      case 'transfer_order_create':
        return 'purple'
      case 'invoice_create':
        return 'cyan'
      case 'bill_create':
        return 'indigo'
      case 'customer_create':
        return 'teal'
      case 'supplier_create':
        return 'lime'
      case 'product_create':
        return 'pink'
      case 'low_stock_alert':
        return 'red'
      case 'high_value_transaction':
        return 'yellow'
      case 'manual':
        return 'gray'
      default:
        return 'gray'
    }
  }

  const formatTriggerType = (triggerType: string) => {
    return triggerType.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
  }

  return (
    <Container size="xl" py="md" w={'100%'}>
      <WorkflowTemplateModal
        opened={modalOpened}
        onClose={closeModal}
        actionType={actionType}
        template={selectedTemplate}
        onSubmit={handleTemplateAction}
        loading={loading}
        users={users}
        roles={roles}
      />
      {/* Header */}
      <Group justify="space-between" mb="xl">
        <Title
          order={2}
          description={t('workflows:description', 'Create and manage reusable approval workflow templates')}
        >
          {t('workflows:title', 'Workflow Templates')}
        </Title>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={() => navigate('/workflow-templates/create')}
          loading={loading}
        >
          {t('workflows:actions.createTemplate', 'Create Template')}
        </Button>
      </Group>

      {/* Filters */}
      <Paper p="xl" withBorder mb="xl" radius="md" style={{ background: getFilterGradient() }}>
        <Group justify="space-between" mb="md">
          <Group>
            <ThemeIcon variant="light" color={colorScheme === 'dark' ? 'blue' : 'gray'} size="lg">
              <IconFilter size={18} />
            </ThemeIcon>
            <MantineTitle order={4} c={getTitleColor()}>
              {t('workflows:filters.title', 'Filter Templates')}
            </MantineTitle>
          </Group>
          <Button
            variant="subtle"
            size="xs"
            color={colorScheme === 'dark' ? 'blue' : 'gray'}
            onClick={() => {
              setSearchQuery('')
              setTriggerTypeFilter(null)
              setStatusFilter(null)
            }}
          >
            {t('workflows:filters.clearFilters', 'Clear Filters')}
          </Button>
        </Group>
        <Grid gutter="md">
          <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
            <TextInput
              placeholder={t('workflows:filters.searchTemplates', 'Search templates...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftSection={<IconFilter size={16} />}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
            <Select
              placeholder={t('workflows:filters.filterByTrigger', 'Filter by trigger type')}
              data={[
                { value: 'manual', label: 'Manual' },
                { value: 'purchase_order_create', label: 'Purchase Order Create' },
                { value: 'purchase_order_threshold', label: 'Purchase Order Threshold' },
                { value: 'sales_order_create', label: 'Sales Order Create' },
                { value: 'sales_order_threshold', label: 'Sales Order Threshold' },
                { value: 'stock_adjustment_create', label: 'Stock Adjustment Create' },
                { value: 'transfer_order_create', label: 'Transfer Order Create' },
                { value: 'invoice_create', label: 'Invoice Create' },
                { value: 'bill_create', label: 'Bill Create' },
                { value: 'customer_create', label: 'Customer Create' },
                { value: 'supplier_create', label: 'Supplier Create' },
                { value: 'product_create', label: 'Product Create' },
                { value: 'low_stock_alert', label: 'Low Stock Alert' },
                { value: 'high_value_transaction', label: 'High Value Transaction' },
              ]}
              value={triggerTypeFilter}
              onChange={setTriggerTypeFilter}
              clearable
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
            <Select
              placeholder={t('workflows:filters.filterByStatus', 'Filter by status')}
              data={[
                { value: 'active', label: t('workflows:statuses.active', 'Active') },
                { value: 'inactive', label: t('workflows:statuses.inactive', 'Inactive') },
              ]}
              value={statusFilter}
              onChange={setStatusFilter}
              clearable
            />
          </Grid.Col>
        </Grid>
      </Paper>

      {/* Summary Cards */}
      <Grid gutter="lg" mb="xl">
        <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
          <Card
            withBorder
            padding="lg"
            radius="md"
            style={{
              backgroundColor: colorScheme === 'dark' ? 'var(--mantine-color-dark-6)' : 'var(--mantine-color-gray-0)',
              height: '120px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Group justify="space-between" align="flex-start" style={{ flex: 1 }}>
              <div style={{ flex: 1 }}>
                <Text size="xs" c="dimmed" fw={700} tt="uppercase" mb="xs">
                  {t('workflows:summary.activeTemplates', 'Active Templates')}
                </Text>
                <Text size="xl" fw={700} c={getCardTextColor()}>
                  {filteredTemplates.filter((t) => t.isActive).length}
                </Text>
              </div>
              <ThemeIcon size={40} radius="md" variant="light" color="green">
                <IconCheck size={20} />
              </ThemeIcon>
            </Group>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
          <Card
            withBorder
            padding="lg"
            radius="md"
            style={{
              backgroundColor: colorScheme === 'dark' ? 'var(--mantine-color-dark-6)' : 'var(--mantine-color-gray-0)',
              height: '120px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Group justify="space-between" align="flex-start" style={{ flex: 1 }}>
              <div style={{ flex: 1 }}>
                <Text size="xs" c="dimmed" fw={700} tt="uppercase" mb="xs">
                  {t('workflows:summary.inactiveTemplates', 'Inactive Templates')}
                </Text>
                <Text size="xl" fw={700} c={getCardTextColor()}>
                  {filteredTemplates.filter((t) => !t.isActive).length}
                </Text>
              </div>
              <ThemeIcon size={40} radius="md" variant="light" color="red">
                <IconX size={20} />
              </ThemeIcon>
            </Group>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
          <Card
            withBorder
            padding="lg"
            radius="md"
            style={{
              backgroundColor: colorScheme === 'dark' ? 'var(--mantine-color-dark-6)' : 'var(--mantine-color-gray-0)',
              height: '120px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Group justify="space-between" align="flex-start" style={{ flex: 1 }}>
              <div style={{ flex: 1 }}>
                <Text size="xs" c="dimmed" fw={700} tt="uppercase" mb="xs">
                  {t('workflows:summary.totalUsage', 'Total Usage')}
                </Text>
                <Text size="xl" fw={700} c={getCardTextColor()}>
                  {filteredTemplates.reduce((sum, t) => sum + t.usageCount, 0)}
                </Text>
              </div>
              <ThemeIcon size={40} radius="md" variant="light" color="orange">
                <IconChartBar size={20} />
              </ThemeIcon>
            </Group>
          </Card>
        </Grid.Col>
      </Grid>

      {/* Templates List */}
      {filteredTemplates.length > 0 ? (
        <Stack gap="md">
          {filteredTemplates.map((template: WorkflowTemplate) => (
            <Card
              key={template.id}
              shadow="sm"
              padding="xl"
              radius="lg"
              withBorder
              style={{
                background: getFilterGradient(),
                transition: 'all 0.2s ease',
                cursor: 'pointer',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)',
                },
              }}
              onClick={() => navigate(`/workflow-templates/${template.id}`)}
              onMouseEnter={() => setHoveredRowId(template.id)}
              onMouseLeave={() => setHoveredRowId(null)}
            >
              {/* Header */}
              <Group justify="space-between" mb="md">
                <div style={{ flex: 1 }}>
                  <Group gap="sm" align="center" mb="xs">
                    <ThemeIcon
                      size="lg"
                      radius="md"
                      variant="light"
                      color={getTriggerTypeColor(template.triggerType)}
                    >
                      <IconGitBranch size={20} />
                    </ThemeIcon>
                    <div>
                      <Text size="lg" fw={600} c={getCardTextColor()}>
                        {template.name}
                      </Text>
                    </div>
                  </Group>
                  <Group gap="xs">
                    <Badge variant="light" color={template.isActive ? 'green' : 'gray'} size="sm">
                      {template.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <Badge color="blue" variant="outline" size="sm">
                      {formatTriggerType(template.triggerType)}
                    </Badge>
                  </Group>
                </div>
                <div onClick={(e) => e.stopPropagation()}>
                  <TableActionsMenu itemId={template.id} hoveredRowId={hoveredRowId}>
                    <Menu.Item
                      onClick={() => handleCloneTemplate(template.id)}
                      leftSection={<IconCopy size={16} />}
                    >
                      {t('workflows:actions.cloneTemplate', 'Clone Template')}
                    </Menu.Item>
                    <Menu.Item
                      onClick={() => toggleTemplateStatus(template.id, template.isActive)}
                      leftSection={
                        template.isActive ? <IconX size={16} /> : <IconCheck size={16} />
                      }
                    >
                      {template.isActive
                        ? t('workflows:actions.deactivate', 'Deactivate')
                        : t('workflows:actions.activate', 'Activate')}
                    </Menu.Item>
                    <Menu.Item
                      color="red"
                      onClick={() => handleDeleteTemplate(template)}
                      leftSection={<IconTrash size={16} />}
                    >
                      {t('workflows:actions.deleteTemplate', 'Delete Template')}
                    </Menu.Item>
                  </TableActionsMenu>
                </div>
              </Group>

              {/* Description */}
              <Text size="sm" c="dimmed" lineClamp={2} mb="md">
                {template.description}
              </Text>

              {/* Steps Preview */}
              <Paper
                p="md"
                withBorder
                radius="md"
                style={{
                  backgroundColor: 'var(--mantine-color-default)',
                }}
                mb="md"
              >
                <Text size="sm" fw={500} c={getCardTextColor()} mb="sm">
                  {t('workflows:template.workflowSteps', 'Workflow Steps')} ({template.steps.length}
                  )
                </Text>
                <Group gap="xs">
                  {template.steps.slice(0, 3).map((step, index) => (
                    <Group key={step.id} gap="xs">
                      <Badge
                        variant="light"
                        color={
                          step.type === 'approval'
                            ? 'green'
                            : step.type === 'review'
                              ? 'blue'
                              : 'gray'
                        }
                        size="sm"
                      >
                        {step.name}
                      </Badge>
                      {index < Math.min(template.steps.length - 1, 2) && (
                        <IconChevronRight size={12} color="var(--mantine-color-dimmed)" />
                      )}
                    </Group>
                  ))}
                  {template.steps.length > 3 && (
                    <Text size="xs" c="dimmed">
                      +{template.steps.length - 3} {t('workflows:template.moreSteps', 'more steps')}
                    </Text>
                  )}
                </Group>
              </Paper>

              {/* Footer */}
              <Group justify="space-between" align="center">
                <Group gap="lg">
                  <div>
                    <Text size="xs" c="dimmed" fw={500}>
                      {t('workflows:template.createdBy', 'Created by')}
                    </Text>
                    <Text size="sm" fw={500} c={getCardTextColor()}>
                      {template.createdBy?.profile?.firstName || template.createdBy.email}
                    </Text>
                  </div>
                  <div>
                    <Text size="xs" c="dimmed" fw={500}>
                      {t('workflows:template.usageCount', 'Times used')}
                    </Text>
                    <Text size="sm" fw={500} c={getCardTextColor()}>
                      {template.usageCount}
                    </Text>
                  </div>
                  <div>
                    <Text size="xs" c="dimmed" fw={500}>
                      {t('workflows:template.lastUpdated', 'Last updated')}
                    </Text>
                    <Text size="sm" fw={500} c={getCardTextColor()}>
                      {formatLocalizedDate(
                        template.updatedAt || template.createdAt,
                        i18n.language,
                        'L'
                      )}
                    </Text>
                  </div>
                </Group>
              </Group>
            </Card>
          ))}
        </Stack>
      ) : (
        /* Empty State */
        <Paper p="xl" withBorder radius="md" style={{ background: getFilterGradient() }}>
          <Group justify="center" align="center" style={{ minHeight: 200 }}>
            <div style={{ textAlign: 'center' }}>
              <ThemeIcon size={60} radius="md" variant="light" color="blue" mx="auto" mb="md">
                <IconGitBranch size={30} />
              </ThemeIcon>
              <MantineTitle order={4} c={getTitleColor()} mb="xs">
                {t('workflows:messages.noTemplates', 'No Workflow Templates')}
              </MantineTitle>
              <Text c="dimmed" size="sm" mb="lg">
                {(workflowTemplates || []).length === 0
                  ? t(
                      'workflows:messages.noTemplatesDescription',
                      'Create your first workflow template to streamline approval processes.'
                    )
                  : t(
                      'workflows:messages.noMatchingTemplates',
                      'No templates match the current filters. Try adjusting your search criteria.'
                    )}
              </Text>
              {(workflowTemplates || []).length === 0 && (
                <Button
                  leftSection={<IconPlus size={16} />}
                  onClick={() => navigate('/workflow-templates/create')}
                >
                  {t('workflows:actions.createFirstTemplate', 'Create First Template')}
                </Button>
              )}
            </div>
          </Group>
        </Paper>
      )}

      {/* Delete Confirmation Dialog */}
      <Modal
        opened={deleteDialogOpened}
        onClose={cancelDeleteTemplate}
        title={t('workflows:actions.deleteTemplate', 'Delete Template')}
        size="sm"
        centered
        withCloseButton={false}
        overlayProps={{
          backgroundOpacity: 0.55,
          blur: 3,
        }}
      >
        <Text size="sm" mb="lg">
          {t(
            'workflows:messages.confirmDelete',
            'Are you sure you want to delete this workflow template?'
          )}
        </Text>
        {templateToDelete && (
          <Text size="sm" fw={500} mb="lg" c="dimmed">
            "{templateToDelete.name}"
          </Text>
        )}
        <Group justify="flex-end" gap="sm">
          <Button variant="default" onClick={cancelDeleteTemplate} size="sm">
            {t('common:cancel', 'Cancel')}
          </Button>
          <Button color="red" onClick={confirmDeleteTemplate} loading={loading} size="sm">
            {t('workflows:actions.delete', 'Delete')}
          </Button>
        </Group>
      </Modal>
    </Container>
  )
}
