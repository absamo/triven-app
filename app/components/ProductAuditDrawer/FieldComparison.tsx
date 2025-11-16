import { Box, Collapse, Divider, Group, Paper, Stack, Text } from '@mantine/core'
import type { Prisma } from '@prisma/client'
import { IconChevronDown, IconChevronRight } from '@tabler/icons-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

interface FieldComparisonProps {
  eventType: string
  changedFields: string[] | null
  beforeSnapshot: Prisma.JsonValue
  afterSnapshot: Prisma.JsonValue
}

export function FieldComparison({
  eventType,
  changedFields,
  beforeSnapshot,
  afterSnapshot,
}: FieldComparisonProps) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)

  // Only show for update events with changed fields
  if (eventType !== 'update' || !changedFields || changedFields.length === 0) {
    return null
  }

  const before = beforeSnapshot as Record<string, unknown>
  const after = afterSnapshot as Record<string, unknown>

  const formatFieldName = (field: string): string => {
    // Map IDs to human-readable names
    const fieldNameMap: Record<string, string> = {
      categoryId: 'Category',
      agencyId: 'Agency',
      siteId: 'Site',
      supplierId: 'Supplier',
      userId: 'User',
      companyId: 'Company',
      reorderPoint: 'Reorder Point',
      safetyStockLevel: 'Safety Stock Level',
      costPrice: 'Cost Price',
      sellingPrice: 'Selling Price',
      physicalStockOnHand: 'Physical Stock On Hand',
    }

    // Return mapped name if exists, otherwise convert camelCase to Title Case
    if (fieldNameMap[field]) {
      return fieldNameMap[field]
    }

    return field
      .replace(/([A-Z])/g, ' $1') // Add space before capital letters
      .replace(/^./, (str) => str.toUpperCase()) // Capitalize first letter
      .trim()
  }

  const getRelatedLabel = (fieldName: string, snapshot: Record<string, unknown>): string | null => {
    // Try to find the related entity name in the snapshot
    if (fieldName === 'categoryId' && snapshot.category && typeof snapshot.category === 'object') {
      const category = snapshot.category as Record<string, unknown>
      return category.name as string
    }
    if (fieldName === 'agencyId' && snapshot.agency && typeof snapshot.agency === 'object') {
      const agency = snapshot.agency as Record<string, unknown>
      return agency.name as string
    }
    if (fieldName === 'siteId' && snapshot.site && typeof snapshot.site === 'object') {
      const site = snapshot.site as Record<string, unknown>
      return site.name as string
    }
    return null
  }

  const formatValue = (
    value: unknown,
    fieldName?: string,
    snapshot?: Record<string, unknown>
  ): string => {
    if (value === null || value === undefined) return 'None'
    if (typeof value === 'boolean') return value ? 'Yes' : 'No'
    if (typeof value === 'number') return value.toLocaleString()
    if (typeof value === 'object') return JSON.stringify(value)

    // For ID fields, try to show the related entity name
    if (fieldName?.endsWith('Id') && snapshot) {
      const label = getRelatedLabel(fieldName, snapshot)
      if (label) return label
    }

    return String(value)
  }

  const getDelta = (oldVal: unknown, newVal: unknown): string | null => {
    // Calculate delta for numeric fields
    if (typeof oldVal === 'number' && typeof newVal === 'number') {
      const delta = newVal - oldVal
      if (delta > 0) return `+${delta.toLocaleString()}`
      if (delta < 0) return delta.toLocaleString()
    }
    return null
  }

  const sortFieldsByImportance = (fields: string[]): string[] => {
    // Filter out nested relation objects - we only want to show the ID fields
    const filteredFields = fields.filter(
      (field) => !['category', 'agency', 'site', 'supplier'].includes(field)
    )

    // Define field priority (lower number = higher priority)
    const fieldPriority: Record<string, number> = {
      name: 1,
      status: 2,
      sellingPrice: 3,
      costPrice: 4,
      physicalStockOnHand: 5,
      reorderPoint: 6,
      safetyStockLevel: 7,
      categoryId: 8,
      agencyId: 9,
      siteId: 10,
      description: 11,
      barcode: 12,
      unit: 13,
      sku: 14,
    }

    return [...filteredFields].sort((a, b) => {
      const priorityA = fieldPriority[a] ?? 999
      const priorityB = fieldPriority[b] ?? 999
      return priorityA - priorityB
    })
  }

  return (
    <Box mt="sm">
      <Paper p="xs" withBorder style={{ cursor: 'pointer' }} onClick={() => setExpanded(!expanded)}>
        <Group gap="xs" wrap="nowrap">
          {expanded ? <IconChevronDown size={16} /> : <IconChevronRight size={16} />}
          <Text size="xs" fw={500}>
            {t('audit.comparison.viewChanges', 'View field changes')}
          </Text>
        </Group>
      </Paper>

      <Collapse in={expanded}>
        <Divider my="sm" />
        <Stack gap="md">
          {sortFieldsByImportance(changedFields).map((field) => {
            const oldValue = before?.[field]
            const newValue = after?.[field]
            const delta = getDelta(oldValue, newValue)

            return (
              <Paper key={field} p="sm" withBorder>
                <Stack gap={4}>
                  <Text size="xs" fw={600} c="dimmed" tt="uppercase">
                    {t(`audit.fields.product.${field}`, formatFieldName(field))}
                  </Text>

                  <Group gap="md" align="start">
                    <Box style={{ flex: 1 }}>
                      <Text size="xs" c="dimmed" mb={2}>
                        {t('audit.comparison.before', 'Before')}
                      </Text>
                      <Text size="sm" style={{ textDecoration: 'line-through', opacity: 0.7 }}>
                        {formatValue(oldValue, field, before)}
                      </Text>
                    </Box>

                    <Text size="lg" c="dimmed" style={{ alignSelf: 'center' }}>
                      →
                    </Text>

                    <Box style={{ flex: 1 }}>
                      <Text size="xs" c="dimmed" mb={2}>
                        {t('audit.comparison.after', 'After')}
                      </Text>
                      <Group gap="xs">
                        <Text size="sm" fw={500}>
                          {formatValue(newValue, field, after)}
                        </Text>
                        {delta && (
                          <Text size="xs" c={delta.startsWith('+') ? 'green' : 'red'} fw={600}>
                            ({delta})
                          </Text>
                        )}
                      </Group>
                    </Box>
                  </Group>
                </Stack>
              </Paper>
            )
          })}
        </Stack>
      </Collapse>
    </Box>
  )
}
