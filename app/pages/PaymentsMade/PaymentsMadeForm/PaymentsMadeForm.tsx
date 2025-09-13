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
} from "@mantine/core"
import { DateInput } from "@mantine/dates"

import { useForm } from "@mantine/form"
import { zodResolver } from "mantine-form-zod-resolver"
import { useTranslation } from "react-i18next"
import { useSubmit } from "react-router"

import { type IBill } from "~/app/common/validations/billSchema"
import { type ICurrency } from "~/app/common/validations/currencySchema"
import {
  type IPaymentsMade,
  paymentsMadeSchema,
} from "~/app/common/validations/paymentsMadeSchema"
import { Form } from "~/app/components"
import { SearchableSelect } from "~/app/partials/SearchableSelect"
import { Title } from "~/app/partials/Title"
import classes from "./PaymentsMadeForm.module.css"

import { PAYMENT_STATUSES } from "~/app/common/constants"
import {
  getAmountPaidByBill,
  getBillStatusLabel,
  getTotalAmountDueByBill,
} from "~/app/common/helpers/bill"
import { formatMoney } from "~/app/common/helpers/money"

interface PaymentsMadeFormProps {
  paymentMade: IPaymentsMade
  bills: IBill[]
  currency: ICurrency
  errors: Record<string, string>
}

export default function PaymentsMadeFormProps({
  paymentMade,
  bills,
  errors,
  currency,
}: PaymentsMadeFormProps) {
  const { t } = useTranslation(['paymentsMade', 'forms', 'common'])

  // Helper function to get payment method labels
  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'BankTransfer':
        return t('paymentsMade:bankTransfer', 'Bank Transfer')
      case 'Cash':
        return t('paymentsMade:cash', 'Cash')
      case 'CreditCard':
        return t('paymentsMade:creditCard', 'Credit Card')
      case 'DebitCard':
        return t('paymentsMade:debitCard', 'Debit Card')
      case 'Cheque':
        return t('paymentsMade:cheque', 'Cheque')
      default:
        return method
    }
  }
  const form = useForm({
    validate: zodResolver(paymentsMadeSchema),
    initialValues: {
      id: paymentMade.id,
      paymentReference: paymentMade.paymentReference,
      paymentMethod: paymentMade.paymentMethod,
      paymentDate: new Date(paymentMade.paymentDate),
      notes: paymentMade.notes,
      billId: paymentMade.billId,
      bill: paymentMade.bill,
      amountReceived: paymentMade.amountReceived,
    },
  })

  const submit = useSubmit()

  const handleSubmit = ({
    paymentReference,
    paymentDate,
    paymentMethod,
    billId,
    notes,
    amountReceived,
  }: IPaymentsMade) => {
    const formData = new FormData()

    formData.append("paymentReference", paymentReference)
    formData.append("paymentDate", JSON.stringify(paymentDate))
    formData.append("paymentMethod", JSON.stringify(paymentMethod))
    formData.append("notes", notes || "")
    formData.append("billId", billId)
    formData.append("amountReceived", JSON.stringify(amountReceived))

    submit(formData, { method: "post" })
  }

  const billsOptions = bills.map((bill: IBill) => {
    return {
      value: bill.id,
      label: bill.billReference,
    }
  })

  const canEdit =
    !paymentMade.id || paymentMade.status !== PAYMENT_STATUSES.CANCELLED

  const status = getBillStatusLabel(form.values?.bill?.status)

  return (
    <>
      <Grid>
        <Grid.Col>
          <Title backTo={"/payments-made"}>
            {paymentMade.id ? t('paymentsMade:editPayment', 'Edit a payment') : t('paymentsMade:addPayment', 'Add payment')}
          </Title>

          <Form onSubmit={canEdit ? form.onSubmit(handleSubmit) : undefined}>
            <Grid.Col span={6}>
              <TextInput
                withAsterisk
                label={t('paymentsMade:paymentReferenceLabel', 'Payment reference')}
                name="paymentReference"
                {...form.getInputProps("paymentReference")}
                error={
                  form.getInputProps("paymentReference").error ||
                  errors?.paymentReference
                }
                disabled={!canEdit}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <DateInput
                withAsterisk
                valueFormat="DD/MM/YYYY"
                label={t('paymentsMade:paymentDateLabel', 'Payment date')}
                name="paymentDate"
                minDate={new Date()}
                {...form.getInputProps("paymentDate")}
                disabled={!canEdit}
              />
            </Grid.Col>

            <Grid.Col span={6}>
              <SearchableSelect
                withAsterisk
                placeholder={t('paymentsMade:selectBill', 'Select a bill')}
                data={billsOptions}
                label={t('paymentsMade:billLabel', 'Bill')}
                value={form.values.billId}
                name="billId"
                disabled={!!paymentMade.id}
                onChange={(currentBill: string) => {
                  form.setFieldValue("billId", currentBill || "")
                  form.setFieldValue(
                    "bill",
                    bills.find(({ id }) => id === currentBill)
                  )
                }}
                error={form.getInputProps("billId").error}
                description={
                  form.values.bill && (
                    <Group
                      justify="space-between"
                      component="span"
                      align="flex-start"
                    >
                      <Text c="dimmed" size="xs" component="span">
                        {t('paymentsMade:purchaseOrderStatus', 'Purchase Order Status')}:{" "}
                        <Badge
                          color={status.color}
                          variant="transparent"
                          p={0}
                          component="span"
                        >
                          {status.label}
                        </Badge>
                      </Text>

                      <Stack gap={0} component="span">
                        <Text c="dimmed" size="xs" component="span">
                          {t('paymentsMade:amountDueLabel', 'Amount Due')} :{" "}
                          <Text fw="bold" size="xs" component="span">
                            {currency.symbol}
                            {formatMoney(getTotalAmountDueByBill(form.values.bill as IBill))}
                          </Text>
                        </Text>
                        <Text c="dimmed" size="xs" component="span">
                          {t('paymentsMade:amountPaidLabel', 'Amount Paid')} :{" "}
                          <Text fw="bold" size="xs" component="span">
                            {currency.symbol}
                            {formatMoney(getAmountPaidByBill(
                              form.values.bill as IBill,
                              form.values.id,
                              paymentMade.amountReceived
                            ))}
                          </Text>
                        </Text>
                      </Stack>
                    </Group>
                  )
                }
                inputWrapperOrder={["label", "input", "description", "error"]}
                classNames={{
                  description: classes.description,
                }}
              />
            </Grid.Col>
            <Grid.Col span={3}>
              <NumberInput
                withAsterisk
                label={t('paymentsMade:amountReceivedLabel', 'Amount received')}
                name="amountReceived"
                hideControls
                allowNegative={false}
                {...form.getInputProps("amountReceived")}
                onChange={(amountReceived) => {
                  form
                    .getInputProps("amountReceived")
                    .onChange(
                      amountReceived === "" ? undefined : amountReceived
                    )
                }}
                disabled={!canEdit}
              />
            </Grid.Col>
            <Grid.Col span={3}>
              <Select
                label={t('paymentsMade:paymentMethodLabel', 'Payment Method')}
                placeholder={t('paymentsMade:selectPaymentMethod', 'Select a payment method')}
                name="paymentMethod"
                value={form.values.paymentMethod}
                data={[
                  { value: "BankTransfer", label: getPaymentMethodLabel("BankTransfer") },
                  { value: "Cash", label: getPaymentMethodLabel("Cash") },
                  { value: "CreditCard", label: getPaymentMethodLabel("CreditCard") },
                  { value: "DebitCard", label: getPaymentMethodLabel("DebitCard") },
                  { value: "Cheque", label: getPaymentMethodLabel("Cheque") },
                ]}
                {...form.getInputProps("paymentMethod")}
                disabled={!canEdit}
              />
            </Grid.Col>

            <Grid.Col>
              <Textarea
                label={t('paymentsMade:notesLabel', 'Notes')}
                name="notes"
                autosize
                minRows={4}
                {...form.getInputProps("notes")}
                disabled={!canEdit}
              />
            </Grid.Col>
          </Form>
        </Grid.Col>
      </Grid>
    </>
  )
}
