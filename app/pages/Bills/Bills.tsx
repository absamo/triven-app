import { Badge, Menu, Table, Text, UnstyledButton } from '@mantine/core'
// import InvoicePDF from "~/app/PDF/InvoicePDF"
import { useForm } from '@mantine/form'
import { IconDotsVertical } from '@tabler/icons-react'
import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Form, Link, useLocation, useNavigate, useSubmit } from 'react-router'
import { BILL_STATUSES, PAYMENT_STATUSES } from '~/app/common/constants'
import {
  getBillStatusLabel,
  getTotalAmountDueByBill,
  getTotalAmountPaid,
} from '~/app/common/helpers/bill'
import { formatCurrency } from '~/app/common/helpers/money'
import type { IBill } from '~/app/common/validations/billSchema'
import type { ICurrency } from '~/app/common/validations/currencySchema'
import type { IPurchaseOrder } from '~/app/common/validations/purchaseOrderSchema'
import { PurchaseOrderFilters } from '~/app/partials/PurchaseOrderFilters'
import { Title } from '~/app/partials/Title'

interface BillsProps {
  bills: IBill[]
  currency: ICurrency
  permissions: string[]
  purchaseOrders: IPurchaseOrder[]
}

type FetcherData = {
  bills: IBill[]
}

export default function BillsPage({
  bills = [],
  currency,
  permissions = [],
  purchaseOrders,
}: BillsProps) {
  const { t } = useTranslation(['bills', 'common'])
  const [purchaseOrderReference, setPurchaseOrderReference] = useState<string>('')
  const [billReference, setBillReference] = useState<string>('')
  const [data, setData] = useState<FetcherData | null>(null)
  const location = useLocation()
  useEffect(() => {
    if (location.state?.purchaseOrderReference) {
      setPurchaseOrderReference(location.state.purchaseOrderReference)
    }

    if (location.state?.billReference) {
      setBillReference(location.state.billReference)
    }
  }, [location.state?.purchaseOrderReference, location.state?.billReference])

  const canCreate = permissions.includes('create:bills')
  const canUpdate = permissions.includes('update:bills')

  const navigate = useNavigate()

  const submit = useSubmit()
  const form = useForm()

  const handleSubmit = () => {
    const { status, billId } = form.values
    const formData = new FormData()
    formData.append('status', JSON.stringify(status))
    formData.append('billId', billId as string)
    submit(formData, { method: 'post', action: '/bills' })
  }

  const rows = (data?.bills || bills).map((bill: IBill) => {
    const status = getBillStatusLabel(bill?.status)
    const amountDue = getTotalAmountDueByBill(bill)
    const totalAmountPaid = getTotalAmountPaid(bill)

    return (
      <Table.Tr
        key={bill.id}
        onClick={() => {
          canUpdate && navigate(`/bills/${bill.id}/edit`)
        }}
      >
        <Table.Td>
          <Text size="sm">{dayjs(bill.billDate).format('DD-MM-YYYY')}</Text>
        </Table.Td>
        <Table.Td>{bill.billReference}</Table.Td>
        <Table.Td>{bill.purchaseOrder?.purchaseOrderReference}</Table.Td>
        <Table.Td>{bill.purchaseOrder?.supplier?.name}</Table.Td>
        <Table.Td>{bill.purchaseOrder?.agency?.name}</Table.Td>
        <Table.Td>
          <Text size="sm">{formatCurrency(amountDue, currency?.symbol || '$')}</Text>
        </Table.Td>
        <Table.Td>
          <Text size="sm">{formatCurrency(totalAmountPaid, currency?.symbol || '$')}</Text>
        </Table.Td>
        <Table.Td>
          <Badge color={status.color} variant="light">
            {status.label}
          </Badge>
        </Table.Td>
        <Table.Td onClick={(event) => event.stopPropagation()}>
          <Menu withArrow position="bottom-end">
            <Menu.Target>
              <UnstyledButton>
                <IconDotsVertical
                  size={16}
                  stroke={1.5}
                  onClick={(event) => event.preventDefault()}
                />
              </UnstyledButton>
            </Menu.Target>
            <Menu.Dropdown>
              <Form onSubmit={form.onSubmit(handleSubmit)}>
                <Menu.Item
                  type="submit"
                  component={Link}
                  to={`/bills/${bill.id}/pdf`}
                  reloadDocument
                >
                  {t('bills:generatePDF')}
                </Menu.Item>
                <Menu.Item
                  type="submit"
                  component={Link}
                  to={'/purchase-orders'}
                  state={{
                    purchaseOrderReference: bill.purchaseOrder?.purchaseOrderReference,
                  }}
                >
                  {t('bills:viewPurchaseOrder')}
                </Menu.Item>
                <Menu.Item
                  type="submit"
                  component={Link}
                  to={'/payments-made'}
                  state={{
                    billReference: bill.billReference,
                  }}
                >
                  {t('bills:viewPaymentMade')}
                </Menu.Item>
                <Menu.Item
                  type="submit"
                  color="red"
                  disabled={bill.status === BILL_STATUSES.CANCELLED}
                  onClick={() => {
                    form.setValues({
                      billId: bill.id,
                      status: BILL_STATUSES.CANCELLED,
                    })
                  }}
                >
                  {t('bills:cancelBill')}
                </Menu.Item>
              </Form>
            </Menu.Dropdown>
          </Menu>
        </Table.Td>
      </Table.Tr>
    )
  })

  return (
    <>
      <Title to={'/bills/create'} canCreate={canCreate} filter="bills">
        {t('bills:title')}
      </Title>

      <PurchaseOrderFilters
        searchProps={{
          description: t('bills:search'),
        }}
        statusOrderProps={{
          data: [
            { value: PAYMENT_STATUSES.UNPAID, label: t('bills:unpaid') },
            {
              value: PAYMENT_STATUSES.PARTIALLYPAID,
              label: t('bills:partiallyPaid'),
            },
            { value: PAYMENT_STATUSES.PAID, label: t('bills:paid') },
            { value: PAYMENT_STATUSES.CANCELLED, label: t('bills:cancelled') },
          ],

          description: t('bills:filterByStatus'),
        }}
        purchaseOrderProps={{
          data: purchaseOrders.map((purchaseOrder: IPurchaseOrder) => {
            return purchaseOrder?.purchaseOrderReference
          }),
          values: purchaseOrderReference ? [purchaseOrderReference] : [],
          description: t('bills:filterByPurchaseOrders'),
          purchaseOrderReference: location.state?.purchaseOrderReference,
          billReference: billReference,
        }}
        dateProps={{
          description: t('bills:filterByCreatedDate'),
        }}
        route="/api/bills-search"
        onFilter={setData}
      />

      <Table verticalSpacing="xs" highlightOnHover={canUpdate} withTableBorder striped mt={35}>
        <Table.Thead fz={12}>
          <Table.Tr>
            <Table.Th>{t('bills:date')}</Table.Th>
            <Table.Th>{t('bills:billReference')}</Table.Th>
            <Table.Th>{t('bills:purchaseOrderReference')}</Table.Th>
            <Table.Th>{t('bills:supplier')}</Table.Th>
            <Table.Th>{t('bills:agency')}</Table.Th>
            <Table.Th>{t('bills:amountDue')}</Table.Th>
            <Table.Th>{t('bills:amountPaid')}</Table.Th>
            <Table.Th>{t('bills:status')}</Table.Th>
            <Table.Th></Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {rows.length > 0 ? (
            rows
          ) : (
            <Table.Tr>
              <Table.Td colSpan={9} align="center">
                <Text size="sm" c="dimmed">
                  {t('bills:noBillsFound')}
                </Text>
              </Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>
      {/* <React.Suspense>
        <InvoicePDF bill={invoices[0]} />
      </React.Suspense> */}
    </>
  )
}
