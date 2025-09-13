import { Badge, Menu, Table, Text, UnstyledButton } from "@mantine/core"
import { IconDotsVertical } from "@tabler/icons-react"
import dayjs from "dayjs"
import { useTranslation } from 'react-i18next'
import { Form, Link, useLocation, useNavigate, useSubmit } from "react-router"

import { formatCurrency } from "~/app/common/helpers/money"
import {
  getPaymentMethodLabel,
  getPaymentStatusLabel
} from "~/app/common/helpers/payment"
import { Title } from "~/app/partials/Title"
// import InvoicePDF from "~/app/PDF/InvoicePDF"
import { useForm } from "@mantine/form"
import { useEffect, useState } from "react"
import { PAYMENT_STATUSES } from "~/app/common/constants"
import { type ICurrency } from "~/app/common/validations/currencySchema"
import type { IInvoice } from "~/app/common/validations/invoiceSchema"
import { type IPaymentsReceived } from "~/app/common/validations/paymentsReceivedSchema"
import { SalesOrderFilters } from "~/app/partials/SalesOrderFilters"

interface PaymentsReceivedProps {
  paymentsReceived: IPaymentsReceived[]
  currency: ICurrency
  permissions: string[]
  invoices: IInvoice[]
}

type FetcherData = {
  paymentsReceived: IPaymentsReceived[]
}

export default function PaymentsReceivedPage({
  paymentsReceived = [],
  currency,
  permissions = [],
  invoices = [],
}: PaymentsReceivedProps) {
  const { t } = useTranslation(['paymentsReceived', 'common']);
  const [invoiceReference, setInvoiceReference] = useState<string>()
  const [data, setData] = useState<FetcherData | null>(null)
  const location = useLocation()
  useEffect(() => {
    if (location.state?.billReference) {
      setInvoiceReference(location.state.billReference)
    }
  }, [location.state?.billReference])

  const canCreate = permissions.includes("create:paymentsReceived")
  const canUpdate = permissions.includes("update:paymentsReceived")

  const form = useForm()
  const navigate = useNavigate()

  const submit = useSubmit()

  const handleSubmit = () => {
    const { status, paymentReceivedId } = form.values
    const formData = new FormData()
    formData.append("status", JSON.stringify(status))
    formData.append("paymentReceivedId", paymentReceivedId as string)
    submit(formData, { method: "post", action: "/payments-received" })
  }

  const rows = (data?.paymentsReceived || paymentsReceived).map(
    (paymentReceived: IPaymentsReceived) => {
      const paymentMethod = getPaymentMethodLabel(
        paymentReceived?.paymentMethod,
        t
      )

      const status = getPaymentStatusLabel(paymentReceived?.status, t)

      return (
        <Table.Tr
          key={paymentReceived.id}
          onClick={() => {
            canUpdate &&
              navigate(`/payments-received/${paymentReceived.id}/edit`)
          }}
        >
          <Table.Td>
            <Text size="sm">
              {dayjs(paymentReceived.paymentDate).format("DD-MM-YYYY")}
            </Text>
          </Table.Td>
          <Table.Td>{paymentReceived.paymentReference}</Table.Td>
          <Table.Td>{paymentReceived.invoice?.invoiceReference}</Table.Td>
          <Table.Td>{paymentMethod.label}</Table.Td>
          <Table.Td>
            <Text size="sm">{formatCurrency(paymentReceived.balanceDue, currency?.symbol || '$')}</Text>
          </Table.Td>
          <Table.Td>
            <Text size="sm">{formatCurrency(paymentReceived.amountReceived, currency?.symbol || '$')}</Text>
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
                    to={`/payments-received/${paymentReceived.id}/pdf`}
                    reloadDocument
                  >
                    {t('paymentsReceived:generatePDF', 'Generate PDF')}
                  </Menu.Item>
                  <Menu.Item
                    type="submit"
                    component={Link}
                    to={"/invoices"}
                    state={{
                      salesOrderReference:
                        paymentReceived.invoice?.salesOrder
                          ?.salesOrderReference,
                      invoiceReference:
                        paymentReceived.invoice?.invoiceReference,
                    }}
                  >
                    {t('paymentsReceived:viewInvoice', 'View Invoice')}
                  </Menu.Item>
                  <Menu.Item
                    type="submit"
                    color="red"
                    onClick={() => {
                      form.setValues({
                        paymentReceivedId: paymentReceived.id,
                        status: PAYMENT_STATUSES.CANCELLED,
                      })
                    }}
                    disabled={
                      paymentReceived.status === PAYMENT_STATUSES.CANCELLED
                    }
                  >
                    {t('paymentsReceived:cancelPaymentReceived', 'Cancel Payment Received')}
                  </Menu.Item>
                </Form>
              </Menu.Dropdown>
            </Menu>
          </Table.Td>
        </Table.Tr>
      )
    }
  )

  return (
    <>
      <Title to={"/payments-received/create"} canCreate={canCreate}>
        {t('paymentsReceived:title', 'Payments Received')}
      </Title>
      <SalesOrderFilters
        searchProps={{
          description: t('common:search', 'Search'),
        }}
        statusOrderProps={{
          data: [
            { value: PAYMENT_STATUSES.UNPAID, label: t('paymentsReceived:unpaid', 'Unpaid') },
            {
              value: PAYMENT_STATUSES.PARTIALLYPAID,
              label: t('paymentsReceived:partiallyPaid', 'Partially paid'),
            },
            { value: PAYMENT_STATUSES.PAID, label: t('paymentsReceived:paid', 'Paid') },
            { value: PAYMENT_STATUSES.CANCELLED, label: t('paymentsReceived:cancelled', 'Cancelled') },
          ],

          description: t('paymentsReceived:filterByStatus', 'Filter by status'),
        }}
        invoicesProps={{
          data: invoices.map((invoice: IInvoice) => {
            return invoice?.invoiceReference
          }),
          values: invoiceReference ? [invoiceReference] : [],
          description: t('paymentsReceived:filterByInvoices', 'Filter by invoices'),
          invoiceReference: location.state?.invoiceReference,
        }}
        dateProps={{
          description: t('paymentsReceived:filterByDate', 'Filter by date'),
        }}
        route="/api/payments-received-search"
        onFilter={setData}
      />
      <Table
        verticalSpacing="xs"
        highlightOnHover={canUpdate}
        withTableBorder
        striped
        mt={35}
      >
        <Table.Thead fz={12}>
          <Table.Tr>
            <Table.Th>{t('common:date', 'DATE')}</Table.Th>
            <Table.Th>{t('paymentsReceived:paymentReference', 'PAYMENT#')}</Table.Th>
            <Table.Th>{t('paymentsReceived:invoiceReference', 'INVOICE#')}</Table.Th>
            <Table.Th>{t('paymentsReceived:paymentMethod', 'PAYMENT METHOD')}</Table.Th>
            <Table.Th>{t('paymentsReceived:amountDue', 'AMOUNT DUE')}</Table.Th>
            <Table.Th>{t('paymentsReceived:amountPaid', 'AMOUNT PAID')}</Table.Th>
            <Table.Th>{t('common:status', 'STATUS')}</Table.Th>
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
                  {t('paymentsReceived:noPaymentsFound', 'No Payments found')}
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
