import { Badge, Menu, Table, Text, UnstyledButton } from '@mantine/core'
// import InvoicePDF from "~/app/PDF/InvoicePDF"
import { useForm } from '@mantine/form'
import { IconDotsVertical } from '@tabler/icons-react'
import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Form, Link, useLocation, useNavigate, useSubmit } from 'react-router'
import { PAYMENT_STATUSES } from '~/app/common/constants'
import { getTotalAmountDueByBill } from '~/app/common/helpers/bill'
import { formatCurrency } from '~/app/common/helpers/money'
import { getPaymentMethodLabel, getPaymentStatusLabel } from '~/app/common/helpers/payment'
import type { IBill } from '~/app/common/validations/billSchema'
import type { ICurrency } from '~/app/common/validations/currencySchema'
import type { IPaymentsMade } from '~/app/common/validations/paymentsMadeSchema'
import { PurchaseOrderFilters } from '~/app/partials/PurchaseOrderFilters'
import { Title } from '~/app/partials/Title'

interface PaymentsMadeProps {
  paymentsMade: IPaymentsMade[]
  currency: ICurrency
  permissions: string[]
  bills: IBill[]
}

type FetcherData = {
  paymentsMade: IPaymentsMade[]
}

export default function PaymentsMadePage({
  paymentsMade = [],
  currency,
  permissions = [],
  bills,
}: PaymentsMadeProps) {
  const { t } = useTranslation(['paymentsMade', 'common'])

  // Helper function to get localized status label
  const getLocalizedStatusLabel = (status: string) => {
    switch (status) {
      case PAYMENT_STATUSES.UNPAID:
        return t('paymentsMade:unpaid')
      case PAYMENT_STATUSES.PARTIALLYPAID:
        return t('paymentsMade:partiallyPaid')
      case PAYMENT_STATUSES.PAID:
        return t('paymentsMade:paid')
      case PAYMENT_STATUSES.CANCELLED:
        return t('paymentsMade:cancelled')
      default:
        return status
    }
  }

  const [billReference, setBillReference] = useState<string>()
  const [data, setData] = useState<FetcherData | null>(null)
  const location = useLocation()
  useEffect(() => {
    if (location.state?.billReference) {
      setBillReference(location.state.billReference)
    }
  }, [location.state?.billReference])

  const canCreate = permissions.includes('create:paymentsMade')
  const canUpdate = permissions.includes('update:paymentsMade')

  const navigate = useNavigate()
  const form = useForm()
  const submit = useSubmit()

  const handleSubmit = () => {
    const { status, paymentMadeId } = form.values
    const formData = new FormData()
    formData.append('status', JSON.stringify(status))
    formData.append('paymentMadeId', paymentMadeId as string)
    submit(formData, { method: 'post', action: '/payments-made' })
  }

  const rows = (data?.paymentsMade || paymentsMade).map((paymentMade: IPaymentsMade) => {
    const paymentMethod = getPaymentMethodLabel(paymentMade?.paymentMethod)
    const status = getPaymentStatusLabel(paymentMade?.status)

    // const canViewActions = paymentMade.status !== PAYMENT_STATUSES.CANCELLED

    return (
      <Table.Tr
        key={paymentMade.id}
        onClick={() => {
          canUpdate && navigate(`/payments-made/${paymentMade.id}/edit`)
        }}
      >
        <Table.Td>
          <Text size="sm">{dayjs(paymentMade.paymentDate).format('DD-MM-YYYY')}</Text>
        </Table.Td>
        <Table.Td>{paymentMade.paymentReference}</Table.Td>
        <Table.Td>{paymentMade.bill?.billReference}</Table.Td>
        <Table.Td>{paymentMethod.label}</Table.Td>
        <Table.Td>
          <Text size="sm">
            {formatCurrency(
              getTotalAmountDueByBill(paymentMade.bill as IBill),
              currency?.symbol || '$'
            )}
          </Text>
        </Table.Td>
        <Table.Td>
          <Text size="sm">
            {formatCurrency(paymentMade.amountReceived, currency?.symbol || '$')}
          </Text>
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
                {/* {canViewActions && ( */}
                <Menu.Item
                  type="submit"
                  component={Link}
                  //to={`/paymentsMade/${paymentMade.id}/pdf`}
                  to={'/paymentsMade'}
                  reloadDocument
                >
                  {t('paymentsMade:generatePDF')}
                </Menu.Item>
                {/* )} */}
                <Menu.Item
                  type="submit"
                  component={Link}
                  to={'/bills'}
                  state={{
                    purchaseOrderReference: paymentMade.bill?.purchaseOrder?.purchaseOrderReference,
                    billReference: paymentMade.bill?.billReference,
                  }}
                >
                  {t('paymentsMade:viewBill')}
                </Menu.Item>
                {/* {canViewActions && ( */}
                <Menu.Item
                  type="submit"
                  color="red"
                  onClick={() => {
                    form.setValues({
                      paymentMadeId: paymentMade.id,
                      status: PAYMENT_STATUSES.CANCELLED,
                    })
                  }}
                >
                  {t('paymentsMade:cancelPaymentMade')}
                </Menu.Item>
                {/* )} */}
              </Form>
            </Menu.Dropdown>
          </Menu>
        </Table.Td>
      </Table.Tr>
    )
  })

  return (
    <>
      <Title to={'/payments-made/create'} canCreate={canCreate}>
        {t('paymentsMade:title')}
      </Title>
      <PurchaseOrderFilters
        searchProps={{
          description: t('paymentsMade:search'),
        }}
        statusOrderProps={{
          data: [
            { value: PAYMENT_STATUSES.UNPAID, label: t('paymentsMade:unpaid') },
            {
              value: PAYMENT_STATUSES.PARTIALLYPAID,
              label: t('paymentsMade:partiallyPaid'),
            },
            { value: PAYMENT_STATUSES.PAID, label: t('paymentsMade:paid') },
            { value: PAYMENT_STATUSES.CANCELLED, label: t('paymentsMade:cancelled') },
          ],

          description: t('paymentsMade:filterByStatus'),
        }}
        billsProps={{
          data: bills.map((bill: IBill) => {
            return bill?.billReference
          }),
          values: billReference ? [billReference] : [],
          description: t('paymentsMade:filterByBills'),
          billReference: location.state?.billReference,
        }}
        dateProps={{
          description: t('paymentsMade:filterByDate'),
        }}
        route="/api/payments-made-search"
        onFilter={setData}
      />
      <Table verticalSpacing="xs" highlightOnHover={canUpdate} withTableBorder striped mt={35}>
        <Table.Thead fz={12}>
          <Table.Tr>
            <Table.Th>{t('paymentsMade:date')}</Table.Th>
            <Table.Th>{t('paymentsMade:paymentReference')}</Table.Th>
            <Table.Th>{t('paymentsMade:billReference')}</Table.Th>
            <Table.Th>{t('paymentsMade:paymentMethod')}</Table.Th>
            <Table.Th>{t('paymentsMade:amountDue')}</Table.Th>
            <Table.Th>{t('paymentsMade:amountPaid')}</Table.Th>
            <Table.Th>{t('paymentsMade:status')}</Table.Th>
            <Table.Th></Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {rows.length > 0 ? (
            rows
          ) : (
            <Table.Tr>
              <Table.Td colSpan={8} align="center">
                <Text size="sm" c="dimmed">
                  {t('paymentsMade:noPaymentsFound')}
                </Text>
              </Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>
      {/* <React.Suspense>
        <InvoicePDF invoice={invoices[0]} />
      </React.Suspense> */}
    </>
  )
}
