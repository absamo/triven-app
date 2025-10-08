import {
  ActionIcon,
  Badge,
  Button,
  Checkbox,
  Grid,
  Group,
  JsonInput,
  Modal,
  NumberInput,
  Paper,
  Select,
  Stack,
  Text,
  Textarea,
  TextInput,
  useMantineColorScheme,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import {
  IconBell,
  IconCheck,
  IconChevronDown,
  IconGitBranch,
  IconGripVertical,
  IconPlug,
  IconPlus,
  IconRocket,
  IconShieldCheck,
  IconTrendingUp,
  IconUsers,
  IconX,
} from '@tabler/icons-react'
import { useEffect, useState } from 'react'
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd'
import { useTranslation } from 'react-i18next'

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
  isActive: boolean
  priority: string
  createdAt: string
  updatedAt: string
  createdBy: {
    email: string
    profile?: { firstName?: string; lastName?: string }
  }
  steps: WorkflowStep[]
  usageCount: number
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

interface WorkflowTemplateModalProps {
  opened: boolean
  onClose: () => void
  template: WorkflowTemplate | null
  actionType: 'create' | 'edit' | 'clone' | null
  onSubmit: (data: any) => void
  loading: boolean
  users: UserOption[]
  roles: RoleOption[]
}

export default function WorkflowTemplateModal({
  opened,
  onClose,
  template,
  actionType,
  onSubmit,
  loading,
  users,
  roles,
}: WorkflowTemplateModalProps) {
  const { colorScheme } = useMantineColorScheme()
  const { t } = useTranslation(['workflows', 'common'])

  // Step type options with icons and descriptions
  const stepTypeOptions = [
    {
      value: 'approval',
      label: t('workflows:stepTypes.approval', 'Approval'),
      icon: IconCheck,
      color: 'green',
    },
    {
      value: 'notification',
      label: t('workflows:stepTypes.notification', 'Notification'),
      icon: IconBell,
      color: 'blue',
    },
    {
      value: 'data_validation',
      label: t('workflows:stepTypes.data_validation', 'Data Validation'),
      icon: IconShieldCheck,
      color: 'orange',
    },
    {
      value: 'automatic_action',
      label: t('workflows:stepTypes.automatic_action', 'Automatic Action'),
      icon: IconRocket,
      color: 'purple',
    },
    {
      value: 'conditional_logic',
      label: t('workflows:stepTypes.conditional_logic', 'Conditional Logic'),
      icon: IconGitBranch,
      color: 'cyan',
    },
    {
      value: 'parallel_approval',
      label: t('workflows:stepTypes.parallel_approval', 'Parallel Approval'),
      icon: IconUsers,
      color: 'teal',
    },
    {
      value: 'sequential_approval',
      label: t('workflows:stepTypes.sequential_approval', 'Sequential Approval'),
      icon: IconChevronDown,
      color: 'indigo',
    },
    {
      value: 'escalation',
      label: t('workflows:stepTypes.escalation', 'Escalation'),
      icon: IconTrendingUp,
      color: 'red',
    },
    {
      value: 'integration',
      label: t('workflows:stepTypes.integration', 'Integration'),
      icon: IconPlug,
      color: 'dark',
    },
  ]

  // Assignee type options
  const assigneeTypeOptions = [
    { value: 'user', label: t('workflows:assigneeTypes.user', 'User') },
    { value: 'role', label: t('workflows:assigneeTypes.role', 'Role') },
    { value: 'creator', label: t('workflows:assigneeTypes.creator', 'Creator') },
    { value: 'manager', label: t('workflows:assigneeTypes.manager', 'Manager') },
    {
      value: 'department_head',
      label: t('workflows:assigneeTypes.department_head', 'Department Head'),
    },
  ]

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    entityType: '',
    priority: 'Medium',
    isActive: true,
    steps: [] as WorkflowStep[],
  })

  // Initialize form data
  useEffect(() => {
    if (template && (actionType === 'edit' || actionType === 'clone')) {
      setFormData({
        name: actionType === 'clone' ? `${template.name} (Copy)` : template.name,
        description: template.description,
        entityType: template.entityType,
        priority: template.priority,
        isActive: template.isActive,
        steps: template.steps.map((step) => ({ ...step, id: generateStepId() })),
      })
    } else {
      // Reset for create
      setFormData({
        name: '',
        description: '',
        entityType: '',
        priority: 'Medium',
        isActive: true,
        steps: [],
      })
    }
  }, [template, actionType, opened])

  const generateStepId = () => {
    return `step_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Drag and drop handler
  const handleDragEnd = (result: any) => {
    if (!result.destination) return

    const items = Array.from(formData.steps)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    // Update step orders
    const reorderedSteps = items.map((step, index) => ({
      ...step,
      order: index + 1,
    }))

    setFormData({
      ...formData,
      steps: reorderedSteps,
    })
  }

  // Helper to get user/role options based on assignee type
  const getAssigneeOptions = (assigneeType: string) => {
    switch (assigneeType) {
      case 'user':
        return users.map((user) => ({
          value: user.id,
          label: `${user.name} (${user.email})`,
        }))
      case 'role':
        return roles.map((role) => ({
          value: role.id,
          label: role.name,
        }))
      default:
        return []
    }
  }

  // Helper to get step type icon
  const getStepTypeIcon = (type: string) => {
    const option = stepTypeOptions.find((opt) => opt.value === type)
    return option?.icon || IconCheck
  }

  // Helper to get step type color
  const getStepTypeColor = (type: string) => {
    const option = stepTypeOptions.find((opt) => opt.value === type)
    return option?.color || 'gray'
  }

  const addStep = () => {
    const newStep: WorkflowStep = {
      id: generateStepId(),
      name: '',
      description: '',
      type: 'approval',
      assigneeType: 'role',
      assigneeId: '',
      assigneeName: '',
      order: formData.steps.length + 1,
      isRequired: true,
      timeoutDays: 7,
      autoApprove: false,
      allowParallel: false,
      conditions: {},
    }
    setFormData({
      ...formData,
      steps: [...formData.steps, newStep],
    })
  }

  const removeStep = (stepId: string) => {
    const updatedSteps = formData.steps
      .filter((step) => step.id !== stepId)
      .map((step, index) => ({ ...step, order: index + 1 }))

    setFormData({
      ...formData,
      steps: updatedSteps,
    })
  }

  const updateStep = (stepId: string, updates: Partial<WorkflowStep>) => {
    const updatedSteps = formData.steps.map((step) => {
      if (step.id === stepId) {
        const updatedStep = { ...step, ...updates }

        // Update assignee name when assignee changes
        if (updates.assigneeId || updates.assigneeType) {
          const assigneeType = updates.assigneeType || step.assigneeType
          const assigneeId = updates.assigneeId || step.assigneeId

          if (assigneeType === 'user') {
            const user = users.find((u) => u.id === assigneeId)
            updatedStep.assigneeName = user ? user.name : ''
          } else if (assigneeType === 'role') {
            const role = roles.find((r) => r.id === assigneeId)
            updatedStep.assigneeName = role ? role.name : ''
          } else {
            updatedStep.assigneeName =
              assigneeType === 'creator'
                ? 'Creator'
                : assigneeType === 'manager'
                  ? 'Manager'
                  : assigneeType === 'department_head'
                    ? 'Department Head'
                    : ''
          }
        }

        return updatedStep
      }
      return step
    })
    setFormData({
      ...formData,
      steps: updatedSteps,
    })
  }

  const handleSubmit = () => {
    // Validation
    if (!formData.name.trim()) {
      notifications.show({
        title: t('common:error', 'Error'),
        message: t('workflows:validation.nameRequired', 'Template name is required'),
        color: 'red',
      })
      return
    }

    if (!formData.entityType) {
      notifications.show({
        title: t('common:error', 'Error'),
        message: t('workflows:validation.entityTypeRequired', 'Entity type is required'),
        color: 'red',
      })
      return
    }

    if (formData.steps.length === 0) {
      notifications.show({
        title: t('common:error', 'Error'),
        message: t('workflows:validation.stepsRequired', 'At least one workflow step is required'),
        color: 'red',
      })
      return
    }

    // Validate steps
    for (const step of formData.steps) {
      if (!step.name.trim()) {
        notifications.show({
          title: t('common:error', 'Error'),
          message: t('workflows:validation.stepNameRequired', 'All steps must have a name'),
          color: 'red',
        })
        return
      }
      if ((step.assigneeType === 'user' || step.assigneeType === 'role') && !step.assigneeId) {
        notifications.show({
          title: t('common:error', 'Error'),
          message: t('workflows:validation.assigneeRequired', 'Assignee is required'),
          color: 'red',
        })
        return
      }
      if (
        step.type === 'conditional_logic' &&
        (!step.conditions || Object.keys(step.conditions).length === 0)
      ) {
        notifications.show({
          title: t('common:error', 'Error'),
          message: 'Conditional steps must have conditions defined',
          color: 'red',
        })
        return
      }
    }

    const submitData = {
      action: actionType === 'create' || actionType === 'clone' ? 'create' : 'update',
      templateId: actionType === 'edit' ? template?.id : undefined,
      templateData: formData,
    }

    onSubmit(submitData)
  }

  const getModalTitle = () => {
    switch (actionType) {
      case 'create':
        return t('workflows:modal.createTemplate', 'Create Workflow Template')
      case 'edit':
        return t('workflows:modal.editTemplate', 'Edit Workflow Template')
      case 'clone':
        return t('workflows:modal.cloneTemplate', 'Clone Workflow Template')
      default:
        return t('workflows:modal.workflowTemplate', 'Workflow Template')
    }
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={getModalTitle()}
      size="xl"
      centered
      styles={{
        content: {
          backgroundColor: colorScheme === 'dark' ? 'var(--mantine-color-dark-7)' : 'white',
        },
        header: {
          backgroundColor: colorScheme === 'dark' ? 'var(--mantine-color-dark-7)' : 'white',
        },
      }}
    >
      <Stack gap="md">
        {/* Basic Information */}
        <Paper p="md" withBorder radius="md">
          <Text size="sm" fw={600} mb="md">
            {t('workflows:modal.basicInformation', 'Basic Information')}
          </Text>
          <Grid gutter="md">
            <Grid.Col span={12}>
              <TextInput
                label={t('workflows:fields.templateName', 'Template Name')}
                placeholder={t('workflows:placeholders.templateName', 'Enter template name...')}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid.Col>
            <Grid.Col span={12}>
              <Textarea
                label={t('workflows:fields.description', 'Description')}
                placeholder={t(
                  'workflows:placeholders.description',
                  'Enter template description...'
                )}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                minRows={2}
                maxRows={4}
                autosize
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <Select
                label={t('workflows:fields.entityType', 'Entity Type')}
                placeholder={t('workflows:placeholders.entityType', 'Select entity type...')}
                data={[
                  {
                    value: 'purchase_order',
                    label: t('workflows:entityTypes.purchase_order', 'Purchase Order'),
                  },
                  {
                    value: 'stock_adjustment',
                    label: t('workflows:entityTypes.stock_adjustment', 'Stock Adjustment'),
                  },
                  { value: 'customer', label: t('workflows:entityTypes.customer', 'Customer') },
                  {
                    value: 'transfer_order',
                    label: t('workflows:entityTypes.transfer_order', 'Transfer Order'),
                  },
                ]}
                value={formData.entityType}
                onChange={(value) => setFormData({ ...formData, entityType: value || '' })}
                required
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <Select
                label={t('workflows:fields.priority', 'Priority')}
                data={[
                  { value: 'Critical', label: t('workflows:priorities.critical', 'Critical') },
                  { value: 'High', label: t('workflows:priorities.high', 'High') },
                  { value: 'Medium', label: t('workflows:priorities.medium', 'Medium') },
                  { value: 'Low', label: t('workflows:priorities.low', 'Low') },
                ]}
                value={formData.priority}
                onChange={(value) => setFormData({ ...formData, priority: value || 'Medium' })}
              />
            </Grid.Col>
          </Grid>
        </Paper>

        {/* Workflow Steps */}
        <Paper p="md" withBorder radius="md">
          <Group justify="space-between" mb="md">
            <Text size="sm" fw={600}>
              {t('workflows:modal.workflowSteps', 'Workflow Steps')} ({formData.steps.length})
            </Text>
            <Button
              size="xs"
              variant="light"
              leftSection={<IconPlus size={14} />}
              onClick={addStep}
            >
              {t('workflows:actions.addStep', 'Add Step')}
            </Button>
          </Group>

          {formData.steps.length === 0 ? (
            <Paper
              p="lg"
              style={{
                backgroundColor:
                  colorScheme === 'dark'
                    ? 'var(--mantine-color-dark-6)'
                    : 'var(--mantine-color-gray-0)',
              }}
            >
              <Text size="sm" c="dimmed" ta="center">
                {t('workflows:actions.addFirstStep', 'Add First Step')}
              </Text>
            </Paper>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="workflow-steps">
                {(provided) => (
                  <Stack gap="sm" {...provided.droppableProps} ref={provided.innerRef}>
                    {formData.steps.map((step, index) => (
                      <Draggable key={step.id} draggableId={step.id} index={index}>
                        {(provided, snapshot) => (
                          <Paper
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            p="md"
                            withBorder
                            radius="md"
                            style={{
                              backgroundColor:
                                colorScheme === 'dark'
                                  ? 'var(--mantine-color-dark-6)'
                                  : 'var(--mantine-color-gray-0)',
                              transform: snapshot.isDragging ? 'rotate(5deg)' : 'none',
                              boxShadow: snapshot.isDragging
                                ? '0 8px 16px rgba(0,0,0,0.2)'
                                : undefined,
                              ...provided.draggableProps.style,
                            }}
                          >
                            {/* Step Header */}
                            <Group justify="space-between" mb="md">
                              <Group gap="xs">
                                <ActionIcon
                                  size="sm"
                                  variant="subtle"
                                  {...provided.dragHandleProps}
                                  style={{ cursor: 'grab' }}
                                >
                                  <IconGripVertical size={14} />
                                </ActionIcon>
                                <Badge
                                  size="sm"
                                  variant="light"
                                  color={getStepTypeColor(step.type)}
                                >
                                  {t('workflows:step.stepNumber', 'Step {{number}}', {
                                    number: index + 1,
                                  })}
                                </Badge>
                                <Badge size="xs" variant="outline">
                                  {step.type.replace('_', ' ')}
                                </Badge>
                              </Group>
                              <Group gap="xs">
                                <ActionIcon
                                  size="sm"
                                  variant="light"
                                  color="blue"
                                  onClick={() => {
                                    /* Toggle expand/collapse */
                                  }}
                                  title="Toggle Details"
                                >
                                  <IconChevronDown size={14} />
                                </ActionIcon>
                                <ActionIcon
                                  size="sm"
                                  variant="light"
                                  color="red"
                                  onClick={() => removeStep(step.id)}
                                  title="Remove Step"
                                >
                                  <IconX size={14} />
                                </ActionIcon>
                              </Group>
                            </Group>

                            {/* Step Configuration */}
                            <Grid gutter="sm">
                              <Grid.Col span={6}>
                                <TextInput
                                  label={t('workflows:fields.stepName', 'Step Name')}
                                  placeholder={t(
                                    'workflows:placeholders.stepName',
                                    'Enter step name...'
                                  )}
                                  value={step.name}
                                  onChange={(e) => updateStep(step.id, { name: e.target.value })}
                                  size="xs"
                                  required
                                />
                              </Grid.Col>
                              <Grid.Col span={6}>
                                <Select
                                  label={t('workflows:fields.stepType', 'Step Type')}
                                  data={stepTypeOptions.map((opt) => ({
                                    value: opt.value,
                                    label: opt.label,
                                  }))}
                                  value={step.type}
                                  onChange={(value) => updateStep(step.id, { type: value as any })}
                                  size="xs"
                                />
                              </Grid.Col>

                              <Grid.Col span={12}>
                                <Textarea
                                  label={t('workflows:fields.stepDescription', 'Step Description')}
                                  placeholder={t(
                                    'workflows:placeholders.stepDescription',
                                    'Enter step description...'
                                  )}
                                  value={step.description || ''}
                                  onChange={(e) =>
                                    updateStep(step.id, { description: e.target.value })
                                  }
                                  size="xs"
                                  autosize
                                  minRows={2}
                                  maxRows={4}
                                />
                              </Grid.Col>

                              <Grid.Col span={6}>
                                <Select
                                  label={t('workflows:fields.assigneeType', 'Assignee Type')}
                                  data={assigneeTypeOptions}
                                  value={step.assigneeType}
                                  onChange={(value) =>
                                    updateStep(step.id, {
                                      assigneeType: value as any,
                                      assigneeId: '',
                                      assigneeName: '',
                                    })
                                  }
                                  size="xs"
                                />
                              </Grid.Col>

                              {(step.assigneeType === 'user' || step.assigneeType === 'role') && (
                                <Grid.Col span={6}>
                                  <Select
                                    label={
                                      step.assigneeType === 'user'
                                        ? t('workflows:fields.selectUser', 'Select User')
                                        : t('workflows:fields.selectRole', 'Select Role')
                                    }
                                    placeholder={
                                      step.assigneeType === 'user'
                                        ? t('workflows:placeholders.selectUser', 'Select a user...')
                                        : t('workflows:placeholders.selectRole', 'Select a role...')
                                    }
                                    data={getAssigneeOptions(step.assigneeType)}
                                    value={step.assigneeId}
                                    onChange={(value) =>
                                      updateStep(step.id, { assigneeId: value || '' })
                                    }
                                    size="xs"
                                    searchable
                                    clearable
                                    required
                                  />
                                </Grid.Col>
                              )}

                              <Grid.Col span={4}>
                                <NumberInput
                                  label={t('workflows:fields.timeoutDays', 'Timeout (Days)')}
                                  placeholder="7"
                                  value={step.timeoutDays}
                                  onChange={(value) =>
                                    updateStep(step.id, { timeoutDays: Number(value) })
                                  }
                                  min={1}
                                  max={90}
                                  size="xs"
                                />
                              </Grid.Col>

                              <Grid.Col span={4}>
                                <Checkbox
                                  label={t('workflows:fields.isRequired', 'Is Required')}
                                  checked={step.isRequired}
                                  onChange={(e) =>
                                    updateStep(step.id, { isRequired: e.currentTarget.checked })
                                  }
                                  size="xs"
                                  mt="xl"
                                />
                              </Grid.Col>

                              <Grid.Col span={4}>
                                <Checkbox
                                  label={t('workflows:fields.autoApprove', 'Auto Approve')}
                                  checked={step.autoApprove || false}
                                  onChange={(e) =>
                                    updateStep(step.id, { autoApprove: e.currentTarget.checked })
                                  }
                                  size="xs"
                                  mt="xl"
                                />
                              </Grid.Col>

                              {/* Conditional Logic */}
                              {step.type === 'conditional_logic' && (
                                <Grid.Col span={12}>
                                  <JsonInput
                                    label="Step Conditions"
                                    placeholder='{"amount": {"gt": 10000}, "department": "Finance"}'
                                    value={JSON.stringify(step.conditions || {}, null, 2)}
                                    onChange={(value) => {
                                      try {
                                        const conditions = JSON.parse(value)
                                        updateStep(step.id, { conditions })
                                      } catch (e) {
                                        // Invalid JSON, don't update
                                      }
                                    }}
                                    validationError="Invalid JSON format"
                                    formatOnBlur
                                    autosize
                                    minRows={4}
                                    maxRows={8}
                                    size="xs"
                                  />
                                </Grid.Col>
                              )}
                            </Grid>
                          </Paper>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </Stack>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </Paper>

        {/* Actions */}
        <Group justify="flex-end" gap="sm">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            {t('common:cancel', 'Cancel')}
          </Button>
          <Button onClick={handleSubmit} loading={loading}>
            {actionType === 'create' || actionType === 'clone'
              ? t('workflows:actions.createTemplate', 'Create Template')
              : t('workflows:actions.updateTemplate', 'Update Template')}
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}
