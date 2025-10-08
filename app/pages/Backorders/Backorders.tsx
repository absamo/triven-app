import { Badge, Menu, Table, Text } from '@mantine/core'
import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'
import { Form, useLocation, useNavigate, useSubmit } from 'react-router'

import { useForm } from '@mantine/form'
import { useEffect, useState } from 'react'
import { BACKORDER_STATUSES } from '~/app/common/constants'
import { getBackorderStatusLabel } from '~/app/common/helpers/backorders'
import { formatCurrency } from '~/app/common/helpers/money'
import type { IBackorderItem } from '~/app/common/validations/backorderItemSchema'
import type { IBackorder } from '~/app/common/validations/backorderSchema'
import type { ICurrency } from '~/app/common/validations/currencySchema'
import { TableActionsMenu } from '~/app/components'
import { Title } from '~/app/partials/Title'
import BackorderFilters from '../../partials/BackorderFilters'

interface BackordersProps {
  backorders: IBackorder[]
  permissions: string[]
}

type FetcherData = {
  backorders: IBackorder[]
}

export default function BackordersPage({ backorders = [], permissions = [] }: BackordersProps) {
  const { t } = useTranslation(['backorders', 'inventory', 'common'])
  const [backorderReference, setBackorderReference] = useState<string>()
  const [data, setData] = useState<FetcherData | null>(null)
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null)
  const location = useLocation()

  useEffect(() => {
    if (location.state?.backorderReference) {
      setBackorderReference(location.state.backorderReference)
    }
  }, [location.state?.backorderReference])

  const canCreate = permissions.includes('create:backorders')
  const canUpdate = permissions.includes('update:backorders')

  const navigate = useNavigate()
  const submit = useSubmit()
  const form = useForm()

  const handleSubmit = () => {
    const formData = new FormData()
    formData.append('status', JSON.stringify(form.values.status))
    formData.append('backorderId', form.values.backorderId)
    submit(formData, { method: 'post', action: '/backorders' })
  }

  const rows = (data?.backorders || backorders).map((backorder: IBackorder) => {
    const status = getBackorderStatusLabel(backorder?.status || '')

    const totalAmount = backorder.backorderItems?.reduce(
      (acc: number, item: IBackorderItem) => acc + (item.amount || 0),
      0
    ) as number

    const baseCurrency = backorder.company?.currencies?.find((currency: ICurrency) => currency.base)

    return (
      <Table.Tr
        key={backorder.id}
        onClick={() => {
          canUpdate && navigate(`/backorders/${backorder.id}/edit`)
        }}
        style={{ position: 'relative' }}
        onMouseEnter={() => setHoveredRowId(backorder.id ?? null)}
        onMouseLeave={() => setHoveredRowId(null)}
      >
        <Table.Td>
          <Text size="sm">{dayjs(backorder.originalOrderDate).format('DD-MM-YYYY')}</Text>
        </Table.Td>
        <Table.Td>{backorder.backorderReference}</Table.Td>
        <Table.Td>{`${backorder.customer?.firstName} ${backorder.customer?.lastName}`}</Table.Td>
        <Table.Td>{backorder.agency?.name}</Table.Td>
        <Table.Td>
          <Badge color={status.color} variant="light">
            {status.label}
          </Badge>
        </Table.Td>
        <Table.Td>
          <Text size="sm">{formatCurrency(totalAmount, baseCurrency?.symbol || '$')}</Text>
        </Table.Td>
        <Table.Td style={{ textAlign: 'center', position: 'relative', padding: 0 }}>
          <div onClick={(event) => event.stopPropagation()}>
            <TableActionsMenu itemId={backorder.id} hoveredRowId={hoveredRowId}>
              <Form onSubmit={form.onSubmit(handleSubmit)}>
                <Menu.Item
                  type="submit"
                  disabled={
                    backorder.status === BACKORDER_STATUSES.FULFILLED ||
                    backorder.status === BACKORDER_STATUSES.CANCELLED
                  }
                  onClick={() => {
                    form.setValues({
                      backorderId: backorder.id,
                      status: BACKORDER_STATUSES.FULFILLED,
                    })
                  }}
                >
                  {t('fulfillOrder')}
                </Menu.Item>
                <Menu.Item
                  type="submit"
                  color="red"
                  disabled={
                    backorder.status === BACKORDER_STATUSES.FULFILLED ||
                    backorder.status === BACKORDER_STATUSES.CANCELLED
                  }
                  onClick={() => {
                    form.setValues({
                      backorderId: backorder.id,
                      status: BACKORDER_STATUSES.CANCELLED,
                    })
                  }}
                >
                  {t('cancelOrder')}
                </Menu.Item>
              </Form>
            </TableActionsMenu>
          </div>
        </Table.Td>
      </Table.Tr>
    )
  })

  return (
    <>
      <Title to={'/backorders/create'} canCreate={canCreate}>
        Backorders
      </Title>

      <BackorderFilters
        searchProps={{
          description: t('search'),
        }}
        statusOrderProps={{
          data: [
            { value: BACKORDER_STATUSES.PENDING, label: t('pending') },
            { value: BACKORDER_STATUSES.PARTIAL, label: t('partial') },
            { value: BACKORDER_STATUSES.FULFILLED, label: t('fulfilled') },
            { value: BACKORDER_STATUSES.CANCELLED, label: t('cancelled') },
          ],
          description: t('filterByOrderStatuses'),
        }}
        backorderProps={{
          data: backorders.map((backorder: IBackorder) => {
            return backorder?.backorderReference
          }),
          values: backorderReference ? [backorderReference] : [],
          description: t('filterByBackorder'),
          backorderReference: location.state?.backorderReference,
        }}
        dateProps={{
          description: t('filterByOrderDate'),
        }}
        route="/api/backorders-search"
        onFilter={setData}
      />
      <Table verticalSpacing="xs" highlightOnHover={canUpdate} withTableBorder striped mt={35}>
        <Table.Thead fz={12}>
          <Table.Tr>
            <Table.Th>{t('orderDate')}</Table.Th>
            <Table.Th>{t('backorderReference')}</Table.Th>
            <Table.Th>{t('customerName')}</Table.Th>
            <Table.Th>{t('agency')}</Table.Th>
            <Table.Th>{t('orderStatus')}</Table.Th>
            <Table.Th>{t('amount')}</Table.Th>
            <Table.Th></Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {rows.length > 0 ? (
            rows
          ) : (
            <Table.Tr>
              <Table.Td colSpan={7} align="center">
                <Text size="sm" c="dimmed">
                  {t('noBackordersFound')}
                </Text>
              </Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>

      <Text size="sm" c="dimmed" mt="md" ta="center">
        {rows.length === 1
          ? t('showingCountSingular', 'Showing {{count}} backorder').replace('{{count}}', '1')
          : t('showingCount', 'Showing {{count}} backorders').replace(
              '{{count}}',
              rows.length.toString()
            )}
      </Text>
    </>
  )
}
