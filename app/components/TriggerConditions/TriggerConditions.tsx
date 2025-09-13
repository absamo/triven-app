import {
    ActionIcon,
    Button,
    Card,
    Collapse,
    Group,
    NumberInput,
    Paper,
    Select,
    Stack,
    Text,
    TextInput,
    Title
} from "@mantine/core"
import { IconChevronDown, IconChevronUp, IconPlus, IconTrash } from "@tabler/icons-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import type { IFieldCondition, IThresholdCondition, ITriggerConditions } from "~/app/common/validations/workflowTemplateSchema"

interface TriggerConditionsProps {
    triggerType: string
    triggerConditions?: ITriggerConditions
    onChange: (conditions: ITriggerConditions) => void
    entityType: string
}

export default function TriggerConditions({
    triggerType,
    triggerConditions,
    onChange,
    entityType
}: TriggerConditionsProps) {
    const { t } = useTranslation(['workflows', 'common'])
    const [opened, setOpened] = useState(false)

    // Helper to determine if trigger type requires conditions
    const requiresConditions = [
        'purchase_order_threshold',
        'sales_order_threshold',
        'high_value_transaction',
        'custom_condition'
    ].includes(triggerType)

    // Helper to determine if threshold conditions should be shown
    const showThreshold = [
        'purchase_order_threshold',
        'sales_order_threshold',
        'high_value_transaction'
    ].includes(triggerType)

    const operators = [
        { value: 'gt', label: t('workflows:operators.gt', 'Greater than') },
        { value: 'gte', label: t('workflows:operators.gte', 'Greater than or equal') },
        { value: 'lt', label: t('workflows:operators.lt', 'Less than') },
        { value: 'lte', label: t('workflows:operators.lte', 'Less than or equal') },
        { value: 'eq', label: t('workflows:operators.eq', 'Equal to') },
        { value: 'ne', label: t('workflows:operators.ne', 'Not equal to') },
        { value: 'contains', label: t('workflows:operators.contains', 'Contains') },
        { value: 'not_contains', label: t('workflows:operators.not_contains', 'Does not contain') }
    ]

    const fieldOptions = getFieldOptionsForEntity(entityType)

    const updateThreshold = (threshold: Partial<IThresholdCondition> | null) => {
        onChange({
            ...triggerConditions,
            threshold: threshold ? {
                field: 'amount',
                operator: 'gt' as const,
                value: 0,
                currency: 'EUR',
                ...threshold
            } : undefined
        })
    }

    const updateFieldConditions = (fieldConditions: IFieldCondition[]) => {
        onChange({
            ...triggerConditions,
            fieldConditions
        })
    }

    const addFieldCondition = () => {
        const newCondition: IFieldCondition = {
            field: fieldOptions[0]?.value || '',
            operator: 'eq',
            value: ''
        }

        const current = triggerConditions?.fieldConditions || []
        updateFieldConditions([...current, newCondition])
    }

    const removeFieldCondition = (index: number) => {
        const current = triggerConditions?.fieldConditions || []
        updateFieldConditions(current.filter((_, i) => i !== index))
    }

    const updateFieldCondition = (index: number, updates: Partial<IFieldCondition>) => {
        const current = triggerConditions?.fieldConditions || []
        const updated = current.map((condition, i) =>
            i === index ? { ...condition, ...updates } : condition
        )
        updateFieldConditions(updated)
    }

    // Don't show anything for simple trigger types
    if (!requiresConditions && triggerType !== 'custom_condition') {
        return null
    }

    return (
        <Card withBorder radius="md" p="md">
            <Group justify="space-between" mb="sm" style={{ cursor: 'pointer' }} onClick={() => setOpened(!opened)}>
                <Group gap="xs">
                    <Title order={5}>{t('workflows:triggerConditions.title', 'Trigger Conditions')}</Title>
                    {requiresConditions && (
                        <Text size="xs" c="red">*</Text>
                    )}
                </Group>
                <ActionIcon variant="subtle" size="sm">
                    {opened ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
                </ActionIcon>
            </Group>

            <Text size="sm" c="dimmed" mb="md">
                {t('workflows:triggerConditions.description', 'Define when this workflow should be triggered automatically')}
            </Text>

            <Collapse in={opened}>
                <Stack gap="md">
                    {/* Threshold Conditions */}
                    {showThreshold && (
                        <Paper p="md" withBorder radius="sm">
                            <Group justify="space-between" mb="sm">
                                <Text fw={500}>{t('workflows:triggerConditions.threshold', 'Amount Threshold')}</Text>
                                <Button
                                    size="xs"
                                    variant={triggerConditions?.threshold ? "filled" : "outline"}
                                    onClick={() => updateThreshold(triggerConditions?.threshold ? null : {})}
                                >
                                    {triggerConditions?.threshold ? t('common:remove', 'Remove') : t('common:add', 'Add')}
                                </Button>
                            </Group>

                            {triggerConditions?.threshold && (
                                <Group gap="sm">
                                    <Select
                                        label={t('workflows:triggerConditions.operator', 'Operator')}
                                        data={operators.filter(op => ['gt', 'gte', 'lt', 'lte', 'eq'].includes(op.value))}
                                        value={triggerConditions.threshold.operator}
                                        onChange={(value) => updateThreshold({ operator: value as any })}
                                        style={{ flex: '0 0 150px' }}
                                    />
                                    <NumberInput
                                        label={t('workflows:triggerConditions.amount', 'Amount')}
                                        value={triggerConditions.threshold.value}
                                        onChange={(value) => updateThreshold({ value: Number(value) || 0 })}
                                        min={0}
                                        step={100}
                                        style={{ flex: 1 }}
                                    />
                                    <TextInput
                                        label={t('workflows:triggerConditions.currency', 'Currency')}
                                        value={triggerConditions.threshold.currency || 'EUR'}
                                        onChange={(e) => updateThreshold({ currency: e.target.value })}
                                        style={{ flex: '0 0 80px' }}
                                    />
                                </Group>
                            )}
                        </Paper>
                    )}

                    {/* Field Conditions */}
                    <Paper p="md" withBorder radius="sm">
                        <Group justify="space-between" mb="sm">
                            <Text fw={500}>{t('workflows:triggerConditions.fieldConditions', 'Field Conditions')}</Text>
                            <Button
                                size="xs"
                                variant="outline"
                                leftSection={<IconPlus size={14} />}
                                onClick={addFieldCondition}
                            >
                                {t('workflows:triggerConditions.addCondition', 'Add Condition')}
                            </Button>
                        </Group>

                        <Stack gap="sm">
                            {(triggerConditions?.fieldConditions || []).map((condition, index) => (
                                <Group key={index} gap="sm" align="end">
                                    <Select
                                        label={t('workflows:triggerConditions.field', 'Field')}
                                        data={fieldOptions}
                                        value={condition.field}
                                        onChange={(value) => updateFieldCondition(index, { field: value || '' })}
                                        style={{ flex: '1' }}
                                    />
                                    <Select
                                        label={t('workflows:triggerConditions.operator', 'Operator')}
                                        data={operators}
                                        value={condition.operator}
                                        onChange={(value) => updateFieldCondition(index, { operator: value as any })}
                                        style={{ flex: '0 0 150px' }}
                                    />
                                    <TextInput
                                        label={t('workflows:triggerConditions.value', 'Value')}
                                        value={String(condition.value)}
                                        onChange={(e) => updateFieldCondition(index, { value: e.target.value })}
                                        style={{ flex: '1' }}
                                    />
                                    <ActionIcon
                                        color="red"
                                        variant="subtle"
                                        onClick={() => removeFieldCondition(index)}
                                        style={{ marginBottom: '2px' }}
                                    >
                                        <IconTrash size={16} />
                                    </ActionIcon>
                                </Group>
                            ))}

                            {(!triggerConditions?.fieldConditions || triggerConditions.fieldConditions.length === 0) && (
                                <Text size="sm" c="dimmed" ta="center" py="md">
                                    {t('workflows:triggerConditions.noConditions', 'No field conditions defined')}
                                </Text>
                            )}
                        </Stack>
                    </Paper>
                </Stack>
            </Collapse>
        </Card>
    )
}

function getFieldOptionsForEntity(entityType: string) {
    const commonFields = [
        { value: 'status', label: 'Status' },
        { value: 'priority', label: 'Priority' },
        { value: 'createdBy', label: 'Created By' }
    ]

    const entitySpecificFields: Record<string, { value: string; label: string }[]> = {
        purchase_order: [
            { value: 'amount', label: 'Amount' },
            { value: 'supplier', label: 'Supplier' },
            { value: 'paymentTerms', label: 'Payment Terms' },
            ...commonFields
        ],
        sales_order: [
            { value: 'amount', label: 'Amount' },
            { value: 'customer', label: 'Customer' },
            { value: 'shippingMethod', label: 'Shipping Method' },
            ...commonFields
        ],
        stock_adjustment: [
            { value: 'reason', label: 'Reason' },
            { value: 'site', label: 'Site' },
            { value: 'itemsCount', label: 'Items Count' },
            ...commonFields
        ],
        customer: [
            { value: 'type', label: 'Customer Type' },
            { value: 'creditLimit', label: 'Credit Limit' },
            { value: 'region', label: 'Region' },
            ...commonFields
        ]
    }

    return entitySpecificFields[entityType] || commonFields
}