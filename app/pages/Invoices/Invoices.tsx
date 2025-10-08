import { Badge, Menu, Table, Text, UnstyledButton } from '@mantine/core'
import { IconDotsVertical } from '@tabler/icons-react'
import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'
import { Form, Link, useLocation, useNavigate, useSubmit } from 'react-router'

import { INVOICE_STATUSES } from '~/app/common/constants'
import { getInvoiceStatusLabel } from '~/app/common/helpers/invoice'
import { formatCurrency } from '~/app/common/helpers/money'
import type { IInvoice } from '~/app/common/validations/invoiceSchema'
import { Title } from '~/app/partials/Title'
// import InvoicePDF from "~/app/PDF/InvoicePDF"
import { useForm } from '@mantine/form'
import { useEffect, useState } from 'react'
import { type ICurrency } from '~/app/common/validations/currencySchema'
import { type IPaymentsReceived } from '~/app/common/validations/paymentsReceivedSchema'
import type { ISalesOrder } from '~/app/common/validations/salesOrderSchema'
import { SalesOrderFilters } from '~/app/partials/SalesOrderFilters'

interface InvoicesProps {
  invoices: IInvoice[]
  currency: ICurrency
  permissions: string[]
  salesOrders: ISalesOrder[]
}

type FetcherData = {
  invoices: IInvoice[]
}

export default function InvoicesPage({
  invoices = [],
  currency,
  permissions = [],
  salesOrders = [],
}: InvoicesProps) {
  const { t } = useTranslation(['invoices', 'common'])
  const [salesOrderReference, setSalesOrderReference] = useState<string>('')
  const [invoiceReference, setInvoiceReference] = useState<string>('')
  const [data, setData] = useState<FetcherData | null>(null)
  const location = useLocation()
  useEffect(() => {
    if (location.state?.salesOrderReference) {
      setSalesOrderReference(location.state.salesOrderReference)
    }

    if (location.state?.invoiceReference) {
      setInvoiceReference(location.state.invoiceReference)
    }
  }, [location.state?.salesOrderReference, location.state?.invoiceReference])

  const canCreate = permissions.includes('create:invoices')
  const canUpdate = permissions.includes('update:invoices')

  const navigate = useNavigate()
  const form = useForm()
  const submit = useSubmit()

  const handleSubmit = () => {
    const { status, invoiceId } = form.values
    const formData = new FormData()
    formData.append('status', JSON.stringify(status))
    formData.append('invoiceId', invoiceId)
    submit(formData, { method: 'post', action: '/invoices' })
  }

  const rows = (data?.invoices || invoices).map((invoice: IInvoice) => {
    const status = getInvoiceStatusLabel(invoice?.status, t)

    const invoiceAmount = (invoice?.salesOrder?.salesOrderItems || []).reduce(
      (acc, item) => acc + (item.amount || 0),
      0
    ) as number
    const amountPaid = ((invoice?.paymentsReceived as IPaymentsReceived[]) || []).reduce(
      (acc, item) => acc + (item.amountReceived || 0),
      0
    ) as number

    return (
      <Table.Tr
        key={invoice.id}
        onClick={() => {
          canUpdate && navigate(`/invoices/${invoice.id}/edit`)
        }}
      >
        <Table.Td>
          <Text size="sm">{dayjs(invoice.invoiceDate).format('DD-MM-YYYY')}</Text>
        </Table.Td>
        <Table.Td>{invoice.invoiceReference}</Table.Td>
        <Table.Td>{invoice.salesOrder?.salesOrderReference}</Table.Td>
        <Table.Td>
          <Text size="sm">{formatCurrency(invoiceAmount, currency?.symbol || '$')}</Text>
        </Table.Td>
        <Table.Td>
          <Text size="sm">{formatCurrency(amountPaid, currency?.symbol || '$')}</Text>
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
                  to={`/invoices/${invoice.id}/pdf`}
                  reloadDocument
                >
                  {t('invoices:generatePDF')}
                </Menu.Item>
                <Menu.Item
                  type="submit"
                  component={Link}
                  to={'/sales-orders'}
                  state={{
                    salesOrderReference: invoice.salesOrder?.salesOrderReference,
                  }}
                >
                  {t('invoices:viewPurchaseOrder')}
                </Menu.Item>
                <Menu.Item
                  type="submit"
                  component={Link}
                  to={'/payments-received'}
                  state={{
                    invoiceReference: invoice.invoiceReference,
                  }}
                >
                  {t('invoices:viewPaymentsReceived')}
                </Menu.Item>
                <Menu.Item
                  type="submit"
                  color="red"
                  disabled={invoice.status === INVOICE_STATUSES.CANCELLED}
                  onClick={() => {
                    form.setValues({
                      invoiceId: invoice.id,
                      status: INVOICE_STATUSES.CANCELLED,
                    })
                  }}
                >
                  {t('invoices:cancelInvoice')}
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
      <Title to={'/invoices/create'} canCreate={canCreate}>
        {t('invoices:title')}
      </Title>

      <SalesOrderFilters
        searchProps={{
          description: t('invoices:search'),
        }}
        statusOrderProps={{
          data: [
            { value: INVOICE_STATUSES.UNPAID, label: t('invoices:unpaid') },
            {
              value: INVOICE_STATUSES.PARTIALLYPAID,
              label: t('invoices:partiallyPaid'),
            },
            { value: INVOICE_STATUSES.PAID, label: t('invoices:paid') },
            { value: INVOICE_STATUSES.CANCELLED, label: t('invoices:cancelled') },
          ],

          description: t('invoices:filterByStatus'),
        }}
        salesOrderProps={{
          data: salesOrders.map((salesOrder: ISalesOrder) => {
            return salesOrder?.salesOrderReference
          }),
          values: salesOrderReference ? [salesOrderReference] : [],
          description: t('invoices:filterBySalesOrders'),
          salesOrderReference: location.state?.salesOrderReference,
          invoiceReference: invoiceReference,
        }}
        dateProps={{
          description: t('invoices:filterByCreatedDate'),
        }}
        route="/api/invoices-search"
        onFilter={setData}
      />
      <Table verticalSpacing="xs" highlightOnHover={canUpdate} withTableBorder striped mt={35}>
        <Table.Thead fz={12}>
          <Table.Tr>
            <Table.Th>{t('invoices:date')}</Table.Th>
            <Table.Th>{t('invoices:invoiceReference')}</Table.Th>
            <Table.Th>{t('invoices:salesOrderReference')}</Table.Th>
            <Table.Th>{t('invoices:amountDue')}</Table.Th>
            <Table.Th>{t('invoices:amountPaid')}</Table.Th>
            <Table.Th>{t('invoices:status')}</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {rows.length > 0 ? (
            rows
          ) : (
            <Table.Tr>
              <Table.Td colSpan={8} align="center">
                <Text size="sm" c="dimmed">
                  {t('invoices:noInvoicesFound')}
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
