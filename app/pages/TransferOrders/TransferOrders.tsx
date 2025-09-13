import { Badge, Table, Text } from "@mantine/core"
import { useTranslation } from 'react-i18next'
import { useNavigate } from "react-router"

import { getTransferOrderReasonLabel, getTransferOrderStatusLabel } from "~/app/common/helpers/transferOrder"
import type { ITransferOrder } from "~/app/common/validations/transferOrderSchema"
import { Title } from "~/app/partials/Title"

interface TransferOrdersProps {
  transferOrders: ITransferOrder[]
  permissions: string[]
}

export default function SitesPage({
  transferOrders = [],
  permissions = [],
}: TransferOrdersProps) {
  const { t } = useTranslation('inventory');
  const canCreate = permissions.includes("create:transferOrders")
  const canUpdate = permissions.includes("update:transferOrders")

  const navigate = useNavigate()

  const rows = transferOrders.map(
    ({ id, transferOrderReference, siteFrom, siteTo, reason, status }) => {
      const transferOrderReason = getTransferOrderReasonLabel(reason, t)
      const transferOrderStatus = getTransferOrderStatusLabel(status, t)
      return (
        <Table.Tr
          key={id}
          onClick={() => canUpdate && navigate(`/transfer-orders/${id}/edit`)}
        >
          <Table.Td>
            <Text size="sm">{transferOrderReference}</Text>
          </Table.Td>
          <Table.Td>
            <Text size="sm">{siteFrom?.name}</Text>
          </Table.Td>
          <Table.Td>
            <Text size="sm">{siteTo?.name}</Text>
          </Table.Td>
          <Table.Td>
            <Text size="sm">{transferOrderReason}</Text>
          </Table.Td>
          <Table.Td>
            <Badge color={transferOrderStatus.color} variant="light">
              {transferOrderStatus.label}
            </Badge>
          </Table.Td>

          <Table.Td></Table.Td>
        </Table.Tr>
      )
    }
  )

  return (
    <>
      <Title to={"/transfer-orders/create"} canCreate={canCreate}>
        {t('transferOrders')}
      </Title>

      <Table
        verticalSpacing="xs"
        highlightOnHover={canUpdate}
        withTableBorder
        striped
        mt={20}
      >
        <Table.Thead fz={12}>
          <Table.Tr>
            <Table.Th>{t('reference')}</Table.Th>
            <Table.Th>{t('fromSite')}</Table.Th>
            <Table.Th>{t('toSite')}</Table.Th>
            <Table.Th>{t('reason')}</Table.Th>
            <Table.Th>{t('status')}</Table.Th>
            <Table.Th></Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {rows.length > 0 ? (
            rows
          ) : (
            <Table.Tr>
              <Table.Td colSpan={6} align="center">
                <Text size="sm" c="dimmed">
                  {t('noTransferOrdersFound')}
                </Text>
              </Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>
    </>
  )
}
