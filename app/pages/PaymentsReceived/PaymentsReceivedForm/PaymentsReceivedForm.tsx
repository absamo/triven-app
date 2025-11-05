import {
  Badge,
  Grid,
  Group,
  NumberInput,
  Select,
  Stack,
  Text,
  Textarea,
  TextInput,
} from '@mantine/core'
import { DateInput } from '@mantine/dates'
import { useForm } from '@mantine/form'
import { zodResolver } from 'mantine-form-zod-resolver'
import { useTranslation } from 'react-i18next'
import { useSubmit } from 'react-router'

import {
  getAmountPaidByInvoice,
  getInvoiceStatusLabel,
  getTotalAmountDueByInvoice,
} from '~/app/common/helpers/invoice'
import { formatMoney } from '~/app/common/helpers/money'
import type { ICurrency } from '~/app/common/validations/currencySchema'
import type { ICustomer } from '~/app/common/validations/customerSchema'
import type { IInvoice } from '~/app/common/validations/invoiceSchema'
import {
  type IPaymentsReceived,
  paymentsReceivedSchema,
} from '~/app/common/validations/paymentsReceivedSchema'
import { Form } from '~/app/components'
import { SearchableSelect } from '~/app/partials/SearchableSelect'
import { Title } from '~/app/partials/Title'
import classes from './PaymentsReceivedForm.module.css'

interface PaymentsReceivedFormProps {
  paymentReceived: IPaymentsReceived
  customers: ICustomer[]
  invoices: IInvoice[]
  currency: ICurrency
  errors: Record<string, string>
}

export default function PaymentsReceivedFormProps({
  paymentReceived,
  customers,
  invoices,
  errors,
  currency,
}: PaymentsReceivedFormProps) {
  const { t } = useTranslation(['forms', 'paymentsReceived', 'common'])

  const form = useForm({
    validate: zodResolver(paymentsReceivedSchema),
    initialValues: {
      id: paymentReceived.id,
      paymentReference: paymentReceived.paymentReference,
      paymentMethod: paymentReceived.paymentMethod,
      paymentDate: new Date(paymentReceived.paymentDate),
      customerId: paymentReceived.customerId,
      customer: paymentReceived.customer,
      notes: paymentReceived.notes,
      invoiceId: paymentReceived.invoiceId,
      invoice: paymentReceived.invoice,
      amountReceived: paymentReceived.amountReceived,
    },
  })

  const submit = useSubmit()

  const handleSubmit = ({
    paymentReference,
    paymentDate,
    paymentMethod,
    customerId,
    invoiceId,
    notes,
    amountReceived,
  }: IPaymentsReceived) => {
    const formData = new FormData()

    formData.append('paymentReference', paymentReference)
    formData.append('customerId', customerId)
    formData.append('paymentDate', JSON.stringify(paymentDate))
    formData.append('paymentMethod', JSON.stringify(paymentMethod))
    formData.append('notes', notes || '')
    formData.append('invoiceId', invoiceId)
    formData.append('amountReceived', JSON.stringify(amountReceived))

    submit(formData, { method: 'post' })
  }

  const customerOptions = customers.map((cutomer: ICustomer) => ({
    value: cutomer.id,
    label: `${cutomer.firstName} (${cutomer.lastName})`,
  }))

  const invoicesOptions = invoices.map((invoice: IInvoice) => {
    return {
      value: invoice.id,
      label: invoice.invoiceReference,
    }
  })

  // const balanceDue = amountDue - amountPaid

  const status = getInvoiceStatusLabel(form.values?.invoice?.status || '')

  return (
    <>
      <Grid>
        <Grid.Col>
          <Title backTo={'/payments-received'}>
            {paymentReceived.id
              ? t('forms:editPayment', 'Edit a payment')
              : t('forms:addPayment', 'Add payment')}
          </Title>

          <Form onSubmit={form.onSubmit(handleSubmit)} showSubmitButton={false}>
            <Grid.Col span={6}>
              <TextInput
                withAsterisk
                label={t('forms:paymentReference', 'Payment reference')}
                name="paymentReference"
                {...form.getInputProps('paymentReference')}
                error={form.getInputProps('paymentReference').error || errors?.paymentReference}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <DateInput
                withAsterisk
                valueFormat="DD/MM/YYYY"
                label={t('forms:paymentDate', 'Payment date')}
                name="paymentDate"
                minDate={new Date()}
                {...form.getInputProps('paymentDate')}
              />
            </Grid.Col>

            <Grid.Col span={6}>
              <SearchableSelect
                withAsterisk
                placeholder={t('forms:selectCustomer', 'Select a customer')}
                data={customerOptions}
                label={t('paymentsReceived:customer', 'Customer')}
                value={form.values.customerId}
                name="customerId"
                disabled={!!paymentReceived.id}
                onChange={(currentCustomer: string) => {
                  form.setFieldValue('customerId', currentCustomer)
                  form.setFieldValue(
                    'customer',
                    customers.find(({ id }) => id === currentCustomer)
                  )
                }}
                error={form.getInputProps('customerId').error}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <SearchableSelect
                withAsterisk
                placeholder={t('forms:selectInvoice', 'Select an invoice')}
                data={invoicesOptions}
                label={t('paymentsReceived:invoice', 'Invoice')}
                value={form.values.invoiceId}
                name="invoiceId"
                disabled={!!paymentReceived.id}
                onChange={(currentInvoice: string) => {
                  form.setFieldValue('invoiceId', currentInvoice || '')
                  form.setFieldValue(
                    'invoice',
                    (invoices || []).find(({ id }) => id === currentInvoice)
                  )
                }}
                error={form.getInputProps('invoiceId').error}
                description={
                  form.values.invoice && (
                    <Group justify="space-between" component="span" align="flex-start">
                      <Text c="dimmed" size="xs" component="span">
                        {t('common:status', 'Sale Order Status')} :{' '}
                        <Badge color={status.color} variant="transparent" p={0} component="span">
                          {status.label}
                        </Badge>
                      </Text>

                      <Stack gap={0} component="span">
                        <Text c="dimmed" size="xs" component="span">
                          {t('paymentsReceived:amountDue', 'Amount Due')} :{' '}
                          <Text fw="bold" size="xs" component="span">
                            {currency.symbol}
                            {formatMoney(
                              getTotalAmountDueByInvoice(form.values.invoice as IInvoice)
                            )}
                          </Text>
                        </Text>
                        <Text c="dimmed" size="xs" component="span">
                          {t('paymentsReceived:amountPaid', 'Amount Paid')} :{' '}
                          <Text fw="bold" size="xs" component="span">
                            {currency.symbol}
                            {formatMoney(
                              getAmountPaidByInvoice(
                                form.values.invoice as IInvoice,
                                form.values.id,
                                paymentReceived.amountReceived
                              )
                            )}
                          </Text>
                        </Text>
                      </Stack>
                    </Group>
                  )
                }
                inputWrapperOrder={['label', 'input', 'description', 'error']}
                classNames={{
                  description: classes.description,
                }}
                nothingFoundMessage={t('paymentsReceived:noInvoicesFound', 'No invoices found')}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <NumberInput
                withAsterisk
                label={t('forms:amountReceived', 'Amount received')}
                name="amountReceived"
                // disabled={!!paymentReceived.id}
                hideControls
                allowNegative={false}
                {...form.getInputProps('amountReceived')}
                onChange={(amountReceived) => {
                  form
                    .getInputProps('amountReceived')
                    .onChange(amountReceived === '' ? undefined : amountReceived)
                }}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <Select
                label={t('forms:paymentMethod', 'Payment Method')}
                placeholder={t('forms:selectPaymentMethod', 'Select a payment method')}
                name="paymentMethod"
                value={form.values.paymentMethod}
                data={[
                  { value: 'BankTransfer', label: t('forms:bankTransfer', 'Bank Transfer') },
                  { value: 'Cash', label: t('forms:cash', 'Cash') },
                  { value: 'CreditCard', label: t('forms:creditCard', 'Credit Card') },
                  { value: 'DebitCard', label: t('forms:debitCard', 'Debit Card') },
                  { value: 'Cheque', label: t('forms:cheque', 'Cheque') },
                ]}
                {...form.getInputProps('paymentMethod')}
              />
            </Grid.Col>

            <Grid.Col>
              <Textarea
                label={t('forms:notes', 'Notes')}
                name="notes"
                autosize
                minRows={4}
                {...form.getInputProps('notes')}
              />
            </Grid.Col>
          </Form>
        </Grid.Col>
      </Grid>
    </>
  )
}
