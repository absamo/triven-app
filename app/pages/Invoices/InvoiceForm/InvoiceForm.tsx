import { Grid, Table, Text, Textarea, TextInput } from '@mantine/core'
import { DateInput } from '@mantine/dates'
import { useForm } from '@mantine/form'
import { zodResolver } from 'mantine-form-zod-resolver'
import { useTranslation } from 'react-i18next'
import { useSubmit } from 'react-router'

import { formatMoney } from '~/app/common/helpers/money'
import type { ICurrency } from '~/app/common/validations/currencySchema'
import { type IInvoice, invoiceSchema } from '~/app/common/validations/invoiceSchema'
import type { ISalesOrder } from '~/app/common/validations/salesOrderSchema'
import { Form } from '~/app/components'
import { SearchableSelect } from '~/app/partials/SearchableSelect'
import { Title } from '~/app/partials/Title'
import classes from './InvoiceForm.module.css'

interface InvoiceFormProps {
  invoice: IInvoice
  salesOrders: ISalesOrder[]
  currency: ICurrency
  errors: Record<string, string>
}

export default function InvoiceForm({ invoice, salesOrders, errors, currency }: InvoiceFormProps) {
  const { t } = useTranslation(['invoices', 'common'])
  const form = useForm({
    validate: zodResolver(invoiceSchema),
    initialValues: {
      id: invoice.id,
      invoiceReference: invoice.invoiceReference,
      status: invoice.status,
      invoiceDate: new Date(invoice.invoiceDate),
      dueDate: new Date(invoice.dueDate),
      salesOrderId: invoice.salesOrderId,
      salesOrderItems: invoice.salesOrder?.salesOrderItems || [],
      notes: invoice.notes,
    },
  })

  const submit = useSubmit()

  const handleSubmit = ({
    invoiceReference,
    status,
    invoiceDate,
    dueDate,
    salesOrderId,
    notes,
  }: IInvoice) => {
    const formData = new FormData()

    formData.append('invoiceReference', invoiceReference)
    formData.append('invoiceDate', JSON.stringify(invoiceDate))
    formData.append('dueDate', JSON.stringify(dueDate))
    formData.append('salesOrderId', salesOrderId)
    formData.append('status', JSON.stringify(status))
    formData.append('notes', notes || '')

    submit(formData, { method: 'post' })
  }

  const salesOrderOptions = salesOrders.map((salesOrder: ISalesOrder) => ({
    value: salesOrder.id,
    label: salesOrder.salesOrderReference,
  }))

  const totalAmount = form.values.salesOrderItems.reduce((acc, item) => acc + (item.amount || 0), 0)

  const rows = form.values.salesOrderItems.map(({ id, product, quantity, rate, tax, amount }) => {
    return (
      <Table.Tr key={product?.id || id}>
        <Table.Td>
          <Text size="sm" w={220}>
            {product?.name}
          </Text>
        </Table.Td>
        <Table.Td>
          <Text size="sm">{quantity}</Text>
        </Table.Td>
        <Table.Td>
          <Text size="sm">{formatMoney(rate)}</Text>
        </Table.Td>
        <Table.Td>
          <Text size="sm">{tax || undefined}</Text>
        </Table.Td>
        <Table.Td>
          <Text size="sm">{formatMoney(amount)}</Text>
        </Table.Td>
      </Table.Tr>
    )
  })

  return (
    <>
      <Grid>
        <Grid.Col>
          <Title backTo={'/invoices'}>
            {invoice.id ? t('invoices:editInvoice') : t('invoices:addInvoice')}
          </Title>

          <Form onSubmit={form.onSubmit(handleSubmit)} showSubmitButton={false}>
            <Grid.Col span={6}>
              <TextInput
                withAsterisk
                label={t('invoices:invoiceReferenceLabel')}
                name="invoiceReference"
                {...form.getInputProps('invoiceReference')}
                error={form.getInputProps('invoiceReference').error || errors?.invoiceReference}
              />
            </Grid.Col>

            <Grid.Col span={6}>
              <SearchableSelect
                withAsterisk
                placeholder={t('invoices:selectSalesOrder')}
                data={salesOrderOptions}
                label={t('invoices:salesOrder')}
                value={form.values.salesOrderId}
                name="salesOrderId"
                disabled={!!invoice.id}
                onChange={(currentSalesOrder: string) => {
                  form.setFieldValue('salesOrderId', currentSalesOrder)
                  form.setFieldValue(
                    'salesOrderItems',
                    salesOrders.find((salesOrder) => salesOrder.id === currentSalesOrder)
                      ?.salesOrderItems || []
                  )
                }}
                nothingFoundMessage={t('invoices:noSalesOrdersFound')}
                error={form.getInputProps('salesOrderId').error}
              />
            </Grid.Col>

            <Grid.Col span={6}>
              <DateInput
                withAsterisk
                valueFormat="DD/MM/YYYY"
                label={t('invoices:invoiceDate')}
                name="invoiceDate"
                minDate={new Date()}
                {...form.getInputProps('invoiceDate')}
              />
            </Grid.Col>

            <Grid.Col span={6}>
              <DateInput
                valueFormat="DD/MM/YYYY"
                label={t('invoices:dueDate')}
                name="dueDate"
                minDate={new Date()}
                {...form.getInputProps('dueDate')}
              />
            </Grid.Col>

            <Grid.Col>
              <Textarea
                label={t('invoices:notes')}
                name="notes"
                autosize
                minRows={4}
                {...form.getInputProps('notes')}
              />
            </Grid.Col>

            <Grid.Col>
              <Table
                verticalSpacing="xs"
                highlightOnHover={false}
                striped
                mt={'md'}
                withTableBorder
              >
                <Table.Thead fz={12}>
                  <Table.Tr>
                    <Table.Th>{t('invoices:salesOrderItem')}</Table.Th>
                    <Table.Th>{t('invoices:quantity')}</Table.Th>
                    <Table.Th>{t('invoices:rate')}</Table.Th>
                    <Table.Th>{t('invoices:tax')}</Table.Th>
                    <Table.Th>{t('invoices:amount')}</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {rows.length > 0 ? (
                    rows
                  ) : (
                    <Table.Tr>
                      <Table.Td colSpan={5} align="center">
                        <Text size="sm" c="dimmed">
                          {t('invoices:noSalesItemsFound')}
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  )}
                </Table.Tbody>
                {rows.length > 0 && !!totalAmount && (
                  <Table.Tfoot>
                    <Table.Tr className={classes.totalRow}>
                      <Table.Td colSpan={2} className={classes.totalCell}></Table.Td>
                      <Table.Td className={classes.totalCell}>
                        <Text
                          fw={500}
                          ta="right"
                        >{`${t('invoices:total')} ( ${currency.symbol} )`}</Text>
                      </Table.Td>
                      <Table.Td className={classes.totalCell}></Table.Td>
                      <Table.Td className={classes.totalCell}>
                        <Text fw={500}>{formatMoney(totalAmount)}</Text>
                      </Table.Td>
                    </Table.Tr>
                  </Table.Tfoot>
                )}
              </Table>
            </Grid.Col>
          </Form>
        </Grid.Col>
      </Grid>
    </>
  )
}
