import { Table, Text } from '@mantine/core'
import dayjs from 'dayjs'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { ADJUSTMENT_REASONS } from '~/app/common/constants'
import { getStockAdjustmentReasonLabel } from '~/app/common/helpers/stockAdjustment'
import type { ISite } from '~/app/common/validations/siteSchema'
import type { IStockAdjustment } from '~/app/common/validations/stockAdjustmentsSchema'
import StockAdjustmentFilters from '~/app/partials/StockAdjustmentFilters/StockAdjustmentFilters'
import { Title } from '~/app/partials/Title'

interface AdjustmentsProps {
  adjustments: IStockAdjustment[]
  sites: ISite[]
  permissions: string[]
}

export default function StockAdjustments({
  adjustments: adjustmentsProp = [],
  sites = [],
  permissions = [],
}: AdjustmentsProps) {
  const { t } = useTranslation(['inventory', 'common'])
  const navigate = useNavigate()

  const [adjustments, setAdjustments] = useState<IStockAdjustment[]>(adjustmentsProp)
  const [filteredAdjustments, setFilteredAdjustments] = useState<IStockAdjustment[]>([])
  const [isFiltered, setIsFiltered] = useState(false)

  const canEdit = permissions.includes('update:stockAdjustments')
  const canCreate = permissions.includes('create:stockAdjustments')

  // Convert adjustment reasons to filter options
  const reasonFilterOptions = Object.entries(ADJUSTMENT_REASONS).map(([key, value]) => ({
    value,
    label: getStockAdjustmentReasonLabel(value, t),
  }))

  // Convert sites to filter options
  const siteFilterOptions = sites
    .filter((site) => site.id)
    .map((site) => ({
      value: site.id!,
      label: site.name,
    }))

  const handleFilter = (data: { stockAdjustments: IStockAdjustment[] }) => {
    if (data && data.stockAdjustments) {
      setFilteredAdjustments(data.stockAdjustments)
      setIsFiltered(true)
    } else {
      setFilteredAdjustments([])
      setIsFiltered(false)
    }
  }

  // Use filtered adjustments if filtering is active, otherwise use regular adjustments
  const displayAdjustments = isFiltered ? filteredAdjustments : adjustments

  const rows = (displayAdjustments || []).map(({ id, date, reason, site, reference }) => (
    <Table.Tr key={id} onClick={() => canEdit && navigate(`/stock-adjustments/${id}/edit`)}>
      <Table.Td>
        <Text size="sm"> {reference}</Text>
      </Table.Td>
      <Table.Td>
        <Text size="sm"> {dayjs(date).format('DD-MM-YYYY')}</Text>
      </Table.Td>
      <Table.Td>
        <Text size="sm"> {getStockAdjustmentReasonLabel(reason, t)}</Text>
      </Table.Td>
      <Table.Td>
        <Text size="sm">{site?.name}</Text>
      </Table.Td>
      {/* <Table.Td>
        <Group justify="flex-end">
          <Form method="post" action={`/adjustments/${id}/delete`}>
            <ActionIcon
              variant="subtle"
              color="red"
              component={Link}
              to={`/adjustments/${id}/edit`}
            >
              <IconTrash
                style={{ width: rem(16), height: rem(16) }}
                stroke={1.5}
              />
            </ActionIcon>
          </Form>
        </Group>
      </Table.Td> */}
    </Table.Tr>
  ))

  return (
    <>
      <Title to={'/stock-adjustments/create'} canCreate={canCreate}>
        {t('inventory:stockAdjustments', 'Stock adjustments')}
      </Title>

      <StockAdjustmentFilters
        searchProps={{
          description: t('inventory:searchProducts', 'Search Stock Adjustments'),
        }}
        reasonProps={{
          description: t('inventory:filterByReason', 'Filter by Reason'),
          data: reasonFilterOptions,
        }}
        siteProps={{
          description: t('inventory:filterByLocation', 'Filter by Site'),
          data: siteFilterOptions,
        }}
        dateProps={{
          description: t('stockAdjustments:filterByDate', 'Filter by Date'),
        }}
        onFilter={handleFilter}
        route="/api/stock-adjustments-search"
      />

      <Table verticalSpacing="xs" highlightOnHover={canEdit} withTableBorder striped mt={35}>
        <Table.Thead fz={12}>
          <Table.Tr>
            <Table.Th>{t('inventory:reference', 'REFERENCE')}</Table.Th>
            <Table.Th>{t('common:date', 'DATE')}</Table.Th>
            <Table.Th>{t('inventory:reason', 'REASON')}</Table.Th>
            <Table.Th>{t('inventory:site', 'SITE')}</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
      </Table>
    </>
  )
}
