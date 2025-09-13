import {
    Alert,
    Badge,
    Button,
    Card,
    Container,
    Group,
    Paper,
    Text,
    Textarea,
    Timeline,
    Title
} from "@mantine/core"
import {
    IconCheck,
    IconClock,
    IconInfoCircle,
    IconX
} from "@tabler/icons-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useFetcher, useLoaderData, useNavigate } from "react-router"
import { formatLocalizedDate } from "~/app/lib/dayjs"

interface WorkflowStepExecutionPageData {
    workflowInstance: {
        id: string
        entityType: string
        entityId: string
        status: string
        data: Record<string, any>
        workflowTemplate: {
            name: string
            description: string
        }
        stepExecutions: Array<{
            id: string
            status: string
            workflowStep: {
                stepNumber: number
                name: string
                description: string
                stepType: string
            }
        }>
    }
    currentStepExecution: {
        id: string
        status: string
        timeoutAt?: string
        workflowStep: {
            name: string
            description: string
            stepType: string
            stepNumber: number
        }
    }
    canApprove: boolean
}

export default function WorkflowStepExecutionPage() {
    const { t, i18n } = useTranslation(['workflows', 'common'])
    const navigate = useNavigate()
    const { workflowInstance, currentStepExecution, canApprove } = useLoaderData<WorkflowStepExecutionPageData>()

    const [decision, setDecision] = useState<'approved' | 'rejected' | null>(null)
    const [notes, setNotes] = useState('')

    const fetcher = useFetcher()
    const isSubmitting = fetcher.state === 'submitting'

    const handleSubmit = () => {
        if (!decision) return

        const formData = new FormData()
        formData.append('stepExecutionId', currentStepExecution.id)
        formData.append('decision', decision)
        formData.append('notes', notes)

        fetcher.submit(formData, {
            method: 'POST',
            action: '/api/workflow-step-execution'
        })
    }

    const getStepStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'pending': return 'gray'
            case 'assigned': return 'blue'
            case 'in_progress': return 'orange'
            case 'completed': return 'green'
            case 'skipped': return 'yellow'
            case 'failed': return 'red'
            case 'timeout': return 'red'
            default: return 'gray'
        }
    }

    const formatEntityType = (entityType: string) => {
        return entityType.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
    }

    return (
        <Container size="md" py="md">
            {/* Header */}
            <Group justify="space-between" mb="xl">
                <div>
                    <Title order={2}>
                        Workflow Step Approval
                    </Title>
                    <Text c="dimmed" size="sm">
                        {workflowInstance.workflowTemplate.name} - {formatEntityType(workflowInstance.entityType)} #{workflowInstance.entityId}
                    </Text>
                </div>
                <Button
                    variant="subtle"
                    onClick={() => navigate('/workflow-instances')}
                >
                    Back to Workflows
                </Button>
            </Group>

            {/* Current Step */}
            <Card shadow="sm" padding="xl" radius="md" withBorder mb="xl">
                <Group justify="space-between" align="flex-start" mb="md">
                    <div>
                        <Title order={3} mb="xs">
                            {currentStepExecution.workflowStep.name}
                        </Title>
                        <Badge color={getStepStatusColor(currentStepExecution.status)} size="sm">
                            {currentStepExecution.status.replace('_', ' ')}
                        </Badge>
                    </div>
                    <Badge variant="outline" size="sm">
                        Step {currentStepExecution.workflowStep.stepNumber}
                    </Badge>
                </Group>

                {currentStepExecution.workflowStep.description && (
                    <Text size="sm" c="dimmed" mb="md">
                        {currentStepExecution.workflowStep.description}
                    </Text>
                )}

                {currentStepExecution.timeoutAt && (
                    <Alert icon={<IconClock size={16} />} color="orange" mb="md">
                        <Text size="sm">
                            This step will timeout on {formatLocalizedDate(currentStepExecution.timeoutAt, i18n.language, 'LLL')}
                        </Text>
                    </Alert>
                )}

                {!canApprove && (
                    <Alert icon={<IconInfoCircle size={16} />} color="blue" mb="md">
                        <Text size="sm">
                            You are not authorized to approve this step, or it has already been processed.
                        </Text>
                    </Alert>
                )}

                {canApprove && currentStepExecution.status === 'assigned' && (
                    <Paper p="md" withBorder radius="md" style={{ backgroundColor: 'var(--mantine-color-default)' }}>
                        <Title order={4} mb="md">Make Decision</Title>

                        <Group gap="md" mb="md">
                            <Button
                                variant={decision === 'approved' ? 'filled' : 'outline'}
                                color="green"
                                leftSection={<IconCheck size={16} />}
                                onClick={() => setDecision('approved')}
                                disabled={isSubmitting}
                            >
                                Approve
                            </Button>
                            <Button
                                variant={decision === 'rejected' ? 'filled' : 'outline'}
                                color="red"
                                leftSection={<IconX size={16} />}
                                onClick={() => setDecision('rejected')}
                                disabled={isSubmitting}
                            >
                                Reject
                            </Button>
                        </Group>

                        <Textarea
                            label="Notes (Optional)"
                            placeholder="Add any comments or reasons for your decision..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            minRows={3}
                            maxRows={6}
                            autosize
                            mb="md"
                        />

                        <Group justify="flex-end">
                            <Button
                                variant="outline"
                                onClick={() => navigate('/workflow-instances')}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={!decision || isSubmitting}
                                loading={isSubmitting}
                                color={decision === 'approved' ? 'green' : decision === 'rejected' ? 'red' : 'blue'}
                            >
                                Submit {decision === 'approved' ? 'Approval' : decision === 'rejected' ? 'Rejection' : 'Decision'}
                            </Button>
                        </Group>
                    </Paper>
                )}
            </Card>

            {/* Entity Data */}
            <Card shadow="sm" padding="xl" radius="md" withBorder mb="xl">
                <Title order={4} mb="md">
                    {formatEntityType(workflowInstance.entityType)} Details
                </Title>
                <Paper p="md" withBorder radius="md" style={{ backgroundColor: 'var(--mantine-color-default)' }}>
                    <pre style={{ margin: 0, fontSize: '0.875rem', whiteSpace: 'pre-wrap' }}>
                        {JSON.stringify(workflowInstance.data, null, 2)}
                    </pre>
                </Paper>
            </Card>

            {/* Workflow Progress */}
            <Card shadow="sm" padding="xl" radius="md" withBorder>
                <Title order={4} mb="md">
                    Workflow Progress
                </Title>
                <Timeline active={currentStepExecution.workflowStep.stepNumber - 1}>
                    {workflowInstance.stepExecutions.map((execution) => {
                        const isCompleted = execution.status === 'completed'
                        const isCurrent = execution.id === currentStepExecution.id

                        return (
                            <Timeline.Item
                                key={execution.id}
                                bullet={isCompleted ? <IconCheck size={12} /> : isCurrent ? <IconClock size={12} /> : undefined}
                                title={execution.workflowStep.name}
                                color={isCompleted ? 'green' : isCurrent ? 'blue' : 'gray'}
                            >
                                <Group gap="xs" mt="xs">
                                    <Badge size="xs" variant="outline">
                                        {execution.workflowStep.stepType.replace('_', ' ')}
                                    </Badge>
                                    <Badge size="xs" color={getStepStatusColor(execution.status)}>
                                        {execution.status.replace('_', ' ')}
                                    </Badge>
                                </Group>
                            </Timeline.Item>
                        )
                    })}
                </Timeline>
            </Card>
        </Container>
    )
}