import { Modal, Table, Text } from "@mantine/core"
import dayjs from "dayjs"
import { useTranslation } from "react-i18next"
import type { IStockAdjustmentHistory } from "~/app/common/validations"

interface StockAdjustmentHistoryProps {
  stockAdjustmentHistories: IStockAdjustmentHistory[]
  onClose: () => void
  opened: boolean
}

export default function StockAdjustmentHistory({
  stockAdjustmentHistories,
  onClose,
  opened,
}: StockAdjustmentHistoryProps) {
  const { t } = useTranslation('inventory')
  const { t: tCommon } = useTranslation('common')
  const rows = stockAdjustmentHistories.map(
    ({
      id,
      product,
      reference,
      openingStock,
      stockOnHand,
      adjustedQuantity,
      createdBy,
      createdAt,
    }) => (
      <Table.Tr key={id}>
        <Table.Td width={"300rem"}>
          <Text size="sm">{product?.name}</Text>
        </Table.Td>
        <Table.Td>
          <Text size="sm">{reference}</Text>
        </Table.Td>
        <Table.Td>
          <Text size="sm">{openingStock}</Text>
        </Table.Td>
        <Table.Td>
          <Text size="sm">{stockOnHand}</Text>
        </Table.Td>
        <Table.Td>
          <Text size="sm">{adjustedQuantity}</Text>
        </Table.Td>
        <Table.Td>
          <Text size="sm">
            {`${createdBy?.profile.firstName} ${createdBy?.profile.lastName}`}
          </Text>
        </Table.Td>
        <Table.Td>
          <Text size="sm">
            {dayjs(createdAt).format("DD-MM-YYYY HH:mm:ss")}
          </Text>
        </Table.Td>
      </Table.Tr>
    )
  )

  return (
    <>
      <Modal.Root opened={opened} onClose={onClose} size={"70rem"}>
        <Modal.Overlay />
        <Modal.Content>
          <Modal.Header>
            <Modal.Title>{t('productHistory')}</Modal.Title>
            <Modal.CloseButton />
          </Modal.Header>
          <Modal.Body>
            <Table
              verticalSpacing="xs"
              highlightOnHover
              withTableBorder
              striped
            >
              <Table.Thead fz={12}>
                <Table.Tr>
                  <Table.Th>{t('productHeader')}</Table.Th>
                  <Table.Th>{t('reference')}</Table.Th>
                  <Table.Th>{t('availableQtyHeader')}</Table.Th>
                  <Table.Th>{t('stockOnHandHeader')}</Table.Th>
                  <Table.Th>{t('adjustedQuantity')}</Table.Th>
                  <Table.Th>{t('userHeader')}</Table.Th>
                  <Table.Th>{tCommon('date')}</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <tbody>{rows}</tbody>
            </Table>
          </Modal.Body>
        </Modal.Content>
      </Modal.Root>

      {/* <Button onClick={open}>Open modal</Button> */}
    </>
  )
}
