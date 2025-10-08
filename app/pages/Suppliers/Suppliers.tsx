import { Table, Text } from '@mantine/core'
import { useTranslation } from 'react-i18next'
import { useFetcher, useNavigate } from 'react-router'

import { type ISupplier } from '~/app/common/validations/supplierSchema'
import { Title } from '~/app/partials/Title'

interface SuppliersProps {
  suppliers: ISupplier[]
  permissions: string[]
}

type FetcherData = {
  suppliers: ISupplier[]
}

export default function SuppliersPage({ suppliers = [], permissions = [] }: SuppliersProps) {
  const { t } = useTranslation(['suppliers', 'common'])
  const navigate = useNavigate()

  const canEdit = permissions.includes('update:suppliers')
  const canCreate = permissions.includes('create:suppliers')

  const fetcher = useFetcher()
  const data = fetcher.data as FetcherData

  const rows = (data?.suppliers || suppliers).map(({ id, name, companyName }) => (
    <Table.Tr key={id} onClick={() => canEdit && navigate(`/suppliers/${id}/edit`)}>
      <Table.Td>
        <Text size="sm">{name}</Text>
      </Table.Td>
      <Table.Td>
        <Text size="sm">{companyName}</Text>
      </Table.Td>
    </Table.Tr>
  ))

  const displaySuppliers = data?.suppliers || suppliers

  return (
    <>
      <Title to={'/suppliers/create'} canCreate={canCreate}>
        {t('suppliers:title', 'Suppliers')}
      </Title>

      {displaySuppliers.length === 0 ? (
        <Text ta="center" mt="xl" c="dimmed">
          {t('suppliers:noSuppliersFound', 'No suppliers found')}
        </Text>
      ) : (
        <Table
          verticalSpacing="xs"
          highlightOnHover={canEdit}
          withColumnBorders
          withTableBorder
          striped
        >
          <Table.Thead>
            <Table.Tr>
              <Table.Th>{t('common:name', 'Name')}</Table.Th>
              <Table.Th>{t('suppliers:companyName', 'Company Name')}</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>{rows}</Table.Tbody>
        </Table>
      )}
    </>
  )
}
