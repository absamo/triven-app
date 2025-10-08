import {
  ActionIcon,
  Anchor,
  Breadcrumbs,
  Button,
  Card,
  Checkbox,
  Container,
  Grid,
  Group,
  JsonInput,
  NumberInput,
  Paper,
  Select,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
  useMantineColorScheme,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import {
  IconArrowLeft,
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
import { Link, useFetcher, useLoaderData, useNavigate, useRevalidator } from 'react-router'
import {
  type IWorkflowStep,
  type IWorkflowTemplate,
} from '~/app/common/validations/workflowTemplateSchema'
import ClientOnly from '~/app/components/ClientOnly'
import Form from '~/app/components/Form'
import TriggerConditions from '~/app/components/TriggerConditions'
import classes from './WorkflowTemplateForm.module.css'

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

export default function WorkflowTemplateFormPage() {
  const { colorScheme } = useMantineColorScheme()
  const { t } = useTranslation(['workflows', 'workflowTemplates', 'common'])
  const navigate = useNavigate()
  const { workflowTemplate, currentUser, users, roles } = useLoaderData<{
    workflowTemplate: WorkflowTemplate | null
    currentUser: CurrentUser
    users: UserOption[]
    roles: RoleOption[]
  }>()

  // API interaction
  const fetcher = useFetcher()
  const revalidator = useRevalidator()
  const loading = fetcher.state === 'submitting'

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

  // Default template data for create mode
  const defaultTemplate = {
    id: '',
    name: '',
    description: '',
    entityType: 'purchase_order',
    triggerType: 'manual',
    triggerConditions: undefined,
    priority: 'Medium',
    isActive: true,
    steps: [],
  }

  // Use template data or defaults for create mode
  const templateData = workflowTemplate || defaultTemplate

  // Mantine form with simplified validation for debugging
  const form = useForm<IWorkflowTemplate>({
    mode: 'uncontrolled',
    validate: {
      name: (value) =>
        !value ? t('workflows:validation.templateNameRequired', 'Template name is required') : null,
      entityType: (value) =>
        !value ? t('workflows:validation.entityTypeRequired', 'Entity type is required') : null,
      steps: (value) =>
        !value || value.length === 0
          ? t('workflows:validation.stepsRequired', 'At least one workflow step is required')
          : null,
    },
    initialValues: {
      name: templateData.name || '',
      description: templateData.description || '',
      entityType: (templateData.entityType as IWorkflowTemplate['entityType']) || 'purchase_order',
      triggerType: (templateData.triggerType as IWorkflowTemplate['triggerType']) || 'manual',
      triggerConditions: templateData.triggerConditions || undefined,
      priority: (templateData.priority as IWorkflowTemplate['priority']) || 'Medium',
      isActive: templateData.isActive ?? true,
      steps:
        templateData.steps?.map(
          (step) =>
            ({
              id: step.id,
              name: step.name || '',
              description: step.description || '',
              type: step.type,
              assigneeType: step.assigneeType,
              assigneeId: step.assigneeId || '',
              assigneeName: step.assigneeName || '',
              order: step.order || 1,
              isRequired: step.isRequired ?? true,
              timeoutDays: step.timeoutDays || 7,
              autoApprove: step.autoApprove ?? false,
              allowParallel: step.allowParallel ?? false,
              conditions: step.conditions || {},
            }) as IWorkflowStep
        ) || [],
    },
  })

  // Track if user has made changes to prevent unwanted resets
  const [hasUserChanges, setHasUserChanges] = useState(false)

  // Sync form data when template changes - but only if user hasn't made changes
  useEffect(() => {
    if (!hasUserChanges && workflowTemplate) {
      // Only update if template exists (edit mode)
      form.setValues({
        name: workflowTemplate.name,
        description: workflowTemplate.description || '',
        entityType: workflowTemplate.entityType as any,
        triggerType: workflowTemplate.triggerType as any,
        triggerConditions: workflowTemplate.triggerConditions,
        priority: workflowTemplate.priority as any,
        isActive: workflowTemplate.isActive,
        steps: workflowTemplate.steps.map((step) => ({
          ...step,
          type: step.type === 'review' ? 'approval' : step.type, // Fix legacy 'review' type
        })),
      })
    }
  }, [workflowTemplate?.id, hasUserChanges])

  // Handle redirect after successful submission
  useEffect(() => {
    if (fetcher.state === 'idle' && fetcher.data && !loading) {
      const responseData = fetcher.data as any
      if (responseData?.success) {
        notifications.show({
          title: t('common:success', 'Success'),
          message: workflowTemplate
            ? t('workflows:messages.templateUpdated', 'Template updated successfully!')
            : t('workflows:messages.templateCreated', 'Template created successfully!'),
          color: 'green',
          autoClose: 3000,
        })

        // Redirect to workflow templates list
        navigate('/workflow-templates')
      } else if (responseData?.error) {
        notifications.show({
          title: t('common:error', 'Error'),
          message:
            responseData.error ||
            t(
              'workflows:messages.updateFailed',
              'Failed to update the template. Please try again.'
            ),
          color: 'red',
        })
      }
    }
  }, [fetcher.state, fetcher.data, loading, navigate, t, workflowTemplate])

  const generateStepId = () => {
    return `step_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Helper to convert entityType to triggerType
  const getTriggerType = (entityType: string) => {
    switch (entityType) {
      case 'purchase_order':
        return 'purchase_order_create'
      case 'sales_order':
        return 'sales_order_create'
      case 'invoice':
        return 'invoice_create'
      case 'bill':
        return 'bill_create'
      case 'stock_adjustment':
        return 'stock_adjustment_create'
      case 'transfer_order':
        return 'transfer_order_create'
      case 'customer':
        return 'customer_create'
      case 'supplier':
        return 'supplier_create'
      case 'product':
        return 'product_create'
      default:
        return 'manual'
    }
  }

  // Drag and drop handler
  const handleDragEnd = (result: any) => {
    if (!result.destination) return

    const items = Array.from(form.values.steps)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    // Update step orders
    const reorderedSteps = items.map((step, index) => ({
      ...step,
      order: index + 1,
    }))

    form.setFieldValue('steps', reorderedSteps)
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
    const newStep: IWorkflowStep = {
      id: generateStepId(),
      name: '',
      description: '',
      type: 'approval',
      assigneeType: 'role',
      assigneeId: '',
      assigneeName: '',
      order: form.values.steps.length + 1,
      isRequired: true,
      timeoutDays: 7,
      autoApprove: false,
      allowParallel: false,
      conditions: {},
    }
    form.setFieldValue('steps', [...form.values.steps, newStep])
    // Clear steps validation error when adding a step
    form.clearFieldError('steps')
  }

  const removeStep = (stepId: string) => {
    const updatedSteps = form.values.steps
      .filter((step: IWorkflowStep) => step.id !== stepId)
      .map((step: IWorkflowStep, index: number) => ({ ...step, order: index + 1 }))

    form.setFieldValue('steps', updatedSteps)

    // Validate steps field after removal to show error if no steps remain
    setTimeout(() => {
      form.validateField('steps')
    }, 0)
  }

  const updateStep = (stepId: string, updates: Partial<IWorkflowStep>) => {
    const updatedSteps = form.values.steps.map((step: IWorkflowStep) => {
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
    form.setFieldValue('steps', updatedSteps)
  }

  // Handle template actions
  const handleTemplateAction = async (data: {
    action: string
    templateId?: string
    templateData?: any
  }) => {
    try {
      const formData = new FormData()

      // Map the action to intent for the API
      formData.append('intent', data.action)

      if (data.templateId) {
        formData.append('templateId', data.templateId)
      }

      if (data.templateData) {
        formData.append('data', JSON.stringify(data.templateData))
      }

      fetcher.submit(formData, {
        method: 'POST',
        action: '/api/workflow-templates',
      })
    } catch (error) {
      notifications.show({
        title: t('common:error', 'Error'),
        message: t(
          'workflows:messages.updateFailed',
          'Failed to update the template. Please try again.'
        ),
        color: 'red',
      })
    }
  }

  const handleSubmit = form.onSubmit((values) => {
    // Prepare template data for submission
    const templateData = {
      ...values,
      // Use form values instead of deriving from entityType
      triggerType: values.triggerType,
      triggerConditions: values.triggerConditions,
    }

    // Submit to API
    handleTemplateAction({
      action: workflowTemplate ? 'update' : 'create',
      templateId: workflowTemplate?.id,
      templateData,
    })
  })

  // Handle form submission and validate manually
  const handleFormSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    event.stopPropagation()

    // Trigger validation manually
    const validationResults = form.validate()

    if (!validationResults.hasErrors) {
      // If validation passes, call our submit handler
      handleSubmit()
    }
  }

  const breadcrumbItems = [
    { title: t('workflows:title', 'Workflow Templates'), href: '/workflow-templates' },
  ].map((item, index) => (
    <Anchor component={Link} to={item.href} key={index}>
      {item.title}
    </Anchor>
  ))

  return (
    <Container size="xl" py="md" w={'100%'}>
      {/* Header with Breadcrumbs */}
      <Stack gap="md" mb="xl">
        <Group>
          <ActionIcon
            variant="light"
            onClick={() => navigate('/workflow-templates')}
            title={t('common:back', 'Back')}
          >
            <IconArrowLeft size={16} />
          </ActionIcon>
          <Breadcrumbs>{breadcrumbItems}</Breadcrumbs>
        </Group>

        <Group justify="space-between">
          <div>
            <Group gap="sm" align="center" mb="xs">
              <IconGitBranch size={24} />
              <Title order={2}>
                {workflowTemplate
                  ? t('workflows:actions.editTemplate', 'Edit Template')
                  : t('workflows:actions.createTemplate', 'Create Template')}
              </Title>
            </Group>
            <Text c="dimmed" size="sm">
              {workflowTemplate
                ? t(
                    'workflows:descriptions.editTemplate',
                    'Modify the workflow template configuration, steps, and settings.'
                  )
                : t(
                    'workflows:descriptions.createTemplate',
                    'Create a new workflow template with steps and settings.'
                  )}
            </Text>
          </div>
        </Group>
      </Stack>

      {/* Form */}
      <Form onSubmit={handleFormSubmit} showSubmitButton={false}>
        {/* Basic Information */}
        <Grid.Col span={12}>
          <Paper p="xl" withBorder radius="md">
            <Text size="lg" fw={600} mb="md">
              {t('workflows:modal.basicInformation', 'Basic Information')}
            </Text>
            <Grid gutter="md">
              <Grid.Col span={12}>
                <TextInput
                  label={t('workflows:fields.templateName', 'Template Name')}
                  placeholder={t('workflows:placeholders.templateName', 'Enter template name...')}
                  {...form.getInputProps('name')}
                  onChange={(e) => {
                    form.getInputProps('name').onChange(e)
                    setHasUserChanges(true)
                  }}
                  onBlur={() => {
                    form.validateField('name')
                  }}
                  withAsterisk
                />
              </Grid.Col>
              <Grid.Col span={12}>
                <Textarea
                  label={t('workflows:fields.description', 'Description')}
                  placeholder={t(
                    'workflows:placeholders.description',
                    'Enter template description...'
                  )}
                  {...form.getInputProps('description')}
                  minRows={2}
                  maxRows={4}
                  autosize
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Select
                  label={t('workflows:fields.entityType', 'Entity Type')}
                  placeholder={t('workflows:placeholders.entityType', 'Select entity type...')}
                  data={[
                    { value: 'purchase_order', label: 'Purchase Orders' },
                    { value: 'sales_order', label: 'Sales Orders' },
                    { value: 'invoice', label: 'Invoices' },
                    { value: 'bill', label: 'Bills' },
                    { value: 'stock_adjustment', label: 'Stock Adjustments' },
                    { value: 'transfer_order', label: 'Transfer Orders' },
                    { value: 'customer', label: 'Customers' },
                    { value: 'supplier', label: 'Suppliers' },
                    { value: 'product', label: 'Products' },
                    { value: 'custom', label: 'Custom' },
                  ]}
                  {...form.getInputProps('entityType')}
                  onBlur={() => {
                    form.validateField('entityType')
                  }}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Select
                  label={t('workflows:fields.triggerType', 'Trigger Type')}
                  placeholder={t('workflows:placeholders.triggerType', 'Select trigger type...')}
                  data={[
                    { value: 'manual', label: t('workflows:triggerTypes.manual', 'Manual') },
                    {
                      value: 'purchase_order_create',
                      label: t(
                        'workflows:triggerTypes.purchase_order_create',
                        'Purchase Order Created'
                      ),
                    },
                    {
                      value: 'purchase_order_threshold',
                      label: t(
                        'workflows:triggerTypes.purchase_order_threshold',
                        'Purchase Order Threshold'
                      ),
                    },
                    {
                      value: 'sales_order_create',
                      label: t('workflows:triggerTypes.sales_order_create', 'Sales Order Created'),
                    },
                    {
                      value: 'sales_order_threshold',
                      label: t(
                        'workflows:triggerTypes.sales_order_threshold',
                        'Sales Order Threshold'
                      ),
                    },
                    {
                      value: 'stock_adjustment_create',
                      label: t(
                        'workflows:triggerTypes.stock_adjustment_create',
                        'Stock Adjustment Created'
                      ),
                    },
                    {
                      value: 'transfer_order_create',
                      label: t(
                        'workflows:triggerTypes.transfer_order_create',
                        'Transfer Order Created'
                      ),
                    },
                    {
                      value: 'customer_create',
                      label: t('workflows:triggerTypes.customer_create', 'Customer Created'),
                    },
                    {
                      value: 'high_value_transaction',
                      label: t(
                        'workflows:triggerTypes.high_value_transaction',
                        'High Value Transaction'
                      ),
                    },
                    {
                      value: 'custom_condition',
                      label: t('workflows:triggerTypes.custom_condition', 'Custom Condition'),
                    },
                  ]}
                  {...form.getInputProps('triggerType')}
                  onChange={(value) => {
                    form.getInputProps('triggerType').onChange(value)
                    setHasUserChanges(true)
                  }}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Select
                  label={t('workflows:fields.priority', 'Priority')}
                  placeholder={t('workflows:placeholders.priority', 'Select priority...')}
                  data={[
                    { value: 'Low', label: t('workflows:priorities.low', 'Low') },
                    { value: 'Medium', label: t('workflows:priorities.medium', 'Medium') },
                    { value: 'High', label: t('workflows:priorities.high', 'High') },
                  ]}
                  {...form.getInputProps('priority')}
                />
              </Grid.Col>
              <Grid.Col span={12}>
                <Checkbox
                  label={t('workflows:fields.isActive', 'Template is active')}
                  description={t(
                    'workflows:descriptions.isActive',
                    'Active templates can be used for new workflows'
                  )}
                  {...form.getInputProps('isActive', { type: 'checkbox' })}
                  onChange={(e) => {
                    form.getInputProps('isActive', { type: 'checkbox' }).onChange(e)
                    setHasUserChanges(true)
                  }}
                />
              </Grid.Col>
            </Grid>
          </Paper>
        </Grid.Col>

        {/* Trigger Conditions */}
        <Grid.Col span={12}>
          <TriggerConditions
            triggerType={form.values.triggerType}
            triggerConditions={form.values.triggerConditions}
            entityType={form.values.entityType}
            onChange={(conditions) => {
              form.setFieldValue('triggerConditions', conditions)
              setHasUserChanges(true)
            }}
          />
        </Grid.Col>

        {/* Workflow Steps */}
        <Grid.Col span={12}>
          <Paper p="xl" withBorder radius="md">
            <div className={classes.stepsHeader}>
              <div className={classes.stepsTitle}>
                <IconGitBranch size={20} />
                {t('workflows:modal.workflowSteps', 'Workflow Steps')}
                {form.values.steps.length > 0 && (
                  <span className={classes.stepsCount}>
                    {form.values.steps.length} {form.values.steps.length === 1 ? 'step' : 'steps'}
                  </span>
                )}
              </div>
              <Button
                leftSection={<IconPlus size={16} />}
                variant="filled"
                onClick={addStep}
                size="sm"
                className={classes.addStepButton}
              >
                {t('workflows:actions.addStep', 'Add Step')}
              </Button>
            </div>

            {form.values.steps.length > 0 ? (
              <ClientOnly
                fallback={
                  <Stack gap="md">
                    {form.values.steps.map((step: IWorkflowStep, index: number) => {
                      const StepIcon = getStepTypeIcon(step.type)
                      return (
                        <Card
                          key={step.id}
                          withBorder
                          p="md"
                          radius="md"
                          className={classes.stepCard}
                        >
                          <div className={classes.stepHeader}>
                            <Group gap="sm" justify="space-between" w="100%">
                              <Group gap="sm">
                                <ActionIcon
                                  variant="subtle"
                                  color="gray"
                                  size="md"
                                  disabled
                                  className={classes.dragHandle}
                                >
                                  <IconGripVertical size={24} />
                                </ActionIcon>
                                <div className={classes.stepNumber}>{index + 1}</div>
                                <Text size="sm" fw={600} c="var(--mantine-color-text)">
                                  {step.name || `Step ${index + 1}`}
                                </Text>
                              </Group>
                              <ActionIcon
                                color="red"
                                variant="light"
                                size="md"
                                onClick={() => removeStep(step.id)}
                                className={classes.removeButton}
                              >
                                <IconX size={22} />
                              </ActionIcon>
                            </Group>
                          </div>
                          <Text c="dimmed" size="sm" mt="sm">
                            Loading drag functionality...
                          </Text>
                        </Card>
                      )
                    })}
                  </Stack>
                }
              >
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable
                    droppableId="workflow-steps"
                    isDropDisabled={false}
                    isCombineEnabled={false}
                    ignoreContainerClipping={false}
                  >
                    {(provided) => (
                      <Stack gap="md" {...provided.droppableProps} ref={provided.innerRef}>
                        {form.values.steps.map((step: IWorkflowStep, index: number) => {
                          const StepIcon = getStepTypeIcon(step.type)
                          return (
                            <Draggable
                              key={step.id}
                              draggableId={step.id}
                              index={index}
                              isDragDisabled={false}
                            >
                              {(provided, snapshot) => (
                                <Card
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  withBorder
                                  p="md"
                                  radius="md"
                                  className={`${classes.stepCard} ${
                                    snapshot.isDragging ? classes.stepCardDragging : ''
                                  }`}
                                  style={{
                                    ...provided.draggableProps.style,
                                  }}
                                >
                                  <div className={classes.stepHeader}>
                                    <Group gap="sm" justify="space-between" w="100%">
                                      <Group gap="sm">
                                        <ActionIcon
                                          {...provided.dragHandleProps}
                                          variant="subtle"
                                          color="gray"
                                          size="md"
                                          className={classes.dragHandle}
                                        >
                                          <IconGripVertical size={24} />
                                        </ActionIcon>
                                        <div className={classes.stepNumber}>{index + 1}</div>
                                        <Text size="sm" fw={600} c="var(--mantine-color-text)">
                                          {step.name || `Step ${index + 1}`}
                                        </Text>
                                      </Group>
                                      <ActionIcon
                                        color="red"
                                        variant="light"
                                        size="md"
                                        onClick={() => removeStep(step.id)}
                                        className={classes.removeButton}
                                      >
                                        <IconX size={22} />
                                      </ActionIcon>
                                    </Group>
                                  </div>

                                  <Grid gutter="md">
                                    <Grid.Col span={{ base: 12, sm: 6 }}>
                                      <TextInput
                                        label={t('workflows:fields.stepName', 'Step Name')}
                                        placeholder={t(
                                          'workflows:placeholders.stepName',
                                          'Enter step name...'
                                        )}
                                        value={step.name}
                                        onChange={(e) => {
                                          const newValue = e.target.value
                                          updateStep(step.id, { name: newValue })
                                        }}
                                      />
                                    </Grid.Col>
                                    <Grid.Col span={{ base: 12, sm: 6 }}>
                                      <Select
                                        label={t('workflows:fields.stepType', 'Step Type')}
                                        placeholder={t(
                                          'workflows:placeholders.stepType',
                                          'Select step type...'
                                        )}
                                        data={stepTypeOptions.map((option) => ({
                                          value: option.value,
                                          label: option.label,
                                        }))}
                                        value={step.type}
                                        onChange={(value) =>
                                          updateStep(step.id, { type: value as any })
                                        }
                                      />
                                    </Grid.Col>
                                    <Grid.Col span={12}>
                                      <Textarea
                                        label={t(
                                          'workflows:fields.stepDescription',
                                          'Step Description'
                                        )}
                                        placeholder={t(
                                          'workflows:placeholders.stepDescription',
                                          'Enter step description...'
                                        )}
                                        value={step.description || ''}
                                        onChange={(e) =>
                                          updateStep(step.id, { description: e.target.value })
                                        }
                                        minRows={2}
                                        maxRows={3}
                                        autosize
                                      />
                                    </Grid.Col>
                                    <Grid.Col span={{ base: 12, sm: 6 }}>
                                      <Select
                                        label={t('workflows:fields.assigneeType', 'Assignee Type')}
                                        placeholder={t(
                                          'workflows:placeholders.assigneeType',
                                          'Select assignee type...'
                                        )}
                                        data={assigneeTypeOptions}
                                        value={step.assigneeType}
                                        onChange={(value) =>
                                          updateStep(step.id, {
                                            assigneeType: value as any,
                                            assigneeId: '',
                                            assigneeName: '',
                                          })
                                        }
                                      />
                                    </Grid.Col>
                                    {(step.assigneeType === 'user' ||
                                      step.assigneeType === 'role') && (
                                      <Grid.Col span={{ base: 12, sm: 6 }}>
                                        <Select
                                          label={
                                            step.assigneeType === 'user'
                                              ? t('workflows:fields.assigneeUser', 'Assignee User')
                                              : t('workflows:fields.assigneeRole', 'Assignee Role')
                                          }
                                          placeholder={
                                            step.assigneeType === 'user'
                                              ? t(
                                                  'workflows:placeholders.assigneeUser',
                                                  'Select user...'
                                                )
                                              : t(
                                                  'workflows:placeholders.assigneeRole',
                                                  'Select role...'
                                                )
                                          }
                                          data={getAssigneeOptions(step.assigneeType)}
                                          value={step.assigneeId}
                                          onChange={(value) =>
                                            updateStep(step.id, { assigneeId: value || '' })
                                          }
                                          searchable
                                        />
                                      </Grid.Col>
                                    )}
                                    <Grid.Col span={{ base: 12, sm: 6 }}>
                                      <NumberInput
                                        label={t('workflows:fields.timeoutDays', 'Timeout (Days)')}
                                        placeholder={t(
                                          'workflows:placeholders.timeoutDays',
                                          'Enter timeout in days...'
                                        )}
                                        value={step.timeoutDays || 7}
                                        onChange={(value) => {
                                          const numValue = Number(value) || 7
                                          updateStep(step.id, { timeoutDays: numValue })
                                        }}
                                        min={1}
                                        max={365}
                                      />
                                    </Grid.Col>
                                    <Grid.Col span={{ base: 12, sm: 6 }}>
                                      <Group gap="md" mt="lg">
                                        <Checkbox
                                          label={t('workflows:fields.isRequired', 'Required')}
                                          checked={step.isRequired}
                                          onChange={(e) =>
                                            updateStep(step.id, { isRequired: e.target.checked })
                                          }
                                        />
                                        <Checkbox
                                          label={t('workflows:fields.autoApprove', 'Auto Approve')}
                                          checked={step.autoApprove || false}
                                          onChange={(e) =>
                                            updateStep(step.id, { autoApprove: e.target.checked })
                                          }
                                        />
                                      </Group>
                                    </Grid.Col>

                                    {step.type === 'conditional_logic' && (
                                      <Grid.Col span={12}>
                                        <JsonInput
                                          label={t(
                                            'workflows:fields.conditions',
                                            'Conditions (JSON)'
                                          )}
                                          placeholder={t(
                                            'workflows:placeholders.conditions',
                                            'Enter conditions in JSON format...'
                                          )}
                                          value={JSON.stringify(step.conditions || {}, null, 2)}
                                          onChange={(value) => {
                                            try {
                                              const conditions = JSON.parse(value)
                                              updateStep(step.id, { conditions })
                                            } catch (error) {
                                              // Invalid JSON, don't update
                                            }
                                          }}
                                          minRows={4}
                                          maxRows={8}
                                          autosize
                                          formatOnBlur
                                        />
                                      </Grid.Col>
                                    )}
                                  </Grid>
                                </Card>
                              )}
                            </Draggable>
                          )
                        })}
                        {provided.placeholder}
                      </Stack>
                    )}
                  </Droppable>
                </DragDropContext>
              </ClientOnly>
            ) : (
              <>
                <Paper
                  p="lg"
                  withBorder
                  radius="md"
                  className={`${classes.noStepsContainer} ${form.errors.steps ? classes.errorBorder : ''}`}
                >
                  <Text c="dimmed" mb="md">
                    {t('workflows:modal.noSteps', 'No workflow steps defined')}
                  </Text>
                </Paper>

                {/* Steps validation error - displayed below the no steps section */}
                {form.errors.steps && (
                  <Text size="xs" mt="xs" className={classes.errorText}>
                    {form.errors.steps}
                  </Text>
                )}
              </>
            )}
          </Paper>
        </Grid.Col>
      </Form>
    </Container>
  )
}
