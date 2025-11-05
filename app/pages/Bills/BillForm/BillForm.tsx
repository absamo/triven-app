import {
  Grid,
  Group,
  Paper,
  Table,
  Text,
  Textarea,
  TextInput,
  useMantineTheme,
} from '@mantine/core'
import { DateInput } from '@mantine/dates'

import { useForm } from '@mantine/form'
import { zodResolver } from 'mantine-form-zod-resolver'
import { useTranslation } from 'react-i18next'
import { useSubmit } from 'react-router'

import { billSchema, type IBill } from '~/app/common/validations/billSchema'
import type { ICurrency } from '~/app/common/validations/currencySchema'
import type { IPurchaseOrder } from '~/app/common/validations/purchaseOrderSchema'
import { Form } from '~/app/components'
import { SearchableSelect } from '~/app/partials/SearchableSelect'
import { Title } from '~/app/partials/Title'

interface BillFormProps {
  bill: IBill
  purchaseOrders: IPurchaseOrder[]
  currency: ICurrency
  errors: Record<string, string>
}

export default function BillForm({ bill, purchaseOrders, errors, currency }: BillFormProps) {
  const { t } = useTranslation(['bills', 'common'])

  const form = useForm({
    validate: zodResolver(billSchema),
    initialValues: {
      id: bill.id,
      billReference: bill.billReference,
      billDate: new Date(bill.billDate),
      dueDate: new Date(bill.dueDate),
      purchaseOrderId: bill.purchaseOrderId,
      purchaseOrderItems: bill.purchaseOrder?.purchaseOrderItems || [],
      notes: bill.notes,
    },
  })

  const submit = useSubmit()

  const handleSubmit = ({ billReference, billDate, dueDate, purchaseOrderId, notes }: IBill) => {
    const formData = new FormData()

    formData.append('billReference', billReference)
    formData.append('billDate', JSON.stringify(billDate))
    formData.append('dueDate', JSON.stringify(dueDate))
    formData.append('purchaseOrderId', purchaseOrderId)
    formData.append('notes', notes || '')

    submit(formData, { method: 'post' })
  }

  const purchaseOrderOptions = purchaseOrders.map((purchaseOrder: IPurchaseOrder) => ({
    value: purchaseOrder.id,
    label: purchaseOrder.purchaseOrderReference,
  }))

  const totalAmount = form.values.purchaseOrderItems.reduce(
    (acc, item) => acc + (item.amount || 0),
    0
  )

  const theme = useMantineTheme()

  const rows = form.values.purchaseOrderItems.map(
    ({ id, product, quantity, rate, tax, amount }) => {
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
            <Text size="sm">{rate}</Text>
          </Table.Td>
          <Table.Td>
            <Text size="sm">{tax || undefined}</Text>
          </Table.Td>
          <Table.Td>
            <Text size="sm">{amount}</Text>
          </Table.Td>
          <Table.Td>
            {/* <Badge color={status.color} variant="light">
            {status.label}
          </Badge> */}
          </Table.Td>
        </Table.Tr>
      )
    }
  )

  return (
    <>
      <Grid>
        <Grid.Col>
          <Title backTo={'/bills'}>{bill.id ? t('bills:editBill') : t('bills:addBill')}</Title>

          <Form onSubmit={form.onSubmit(handleSubmit)}>
            <Grid.Col span={6}>
              <TextInput
                withAsterisk
                label={t('bills:billReferenceLabel')}
                name="billReference"
                {...form.getInputProps('billReference')}
                error={form.getInputProps('billReference').error || errors?.billReference}
              />
            </Grid.Col>

            <Grid.Col span={6}>
              <SearchableSelect
                withAsterisk
                placeholder={t('bills:selectPurchaseOrder')}
                data={purchaseOrderOptions}
                label={t('bills:purchaseOrder')}
                value={form.values.purchaseOrderId}
                name="purchaseOrderId"
                disabled={!!bill.id}
                onChange={(currentPurchaseOrder: string) => {
                  form.setFieldValue('purchaseOrderId', currentPurchaseOrder)
                  form.setFieldValue(
                    'purchaseOrderItems',
                    purchaseOrders.find(
                      (purchaseOrder) => purchaseOrder.id === currentPurchaseOrder
                    )?.purchaseOrderItems || []
                  )
                }}
                error={form.getInputProps('purchaseOrderId').error}
              />
            </Grid.Col>

            <Grid.Col span={6}>
              <DateInput
                withAsterisk
                valueFormat="DD/MM/YYYY"
                label={t('bills:billDate')}
                name="billDate"
                minDate={new Date()}
                {...form.getInputProps('billDate')}
              />
            </Grid.Col>

            <Grid.Col span={6}>
              <DateInput
                withAsterisk
                valueFormat="DD/MM/YYYY"
                label={t('bills:dueDate')}
                name="dueDate"
                minDate={new Date()}
                {...form.getInputProps('dueDate')}
              />
            </Grid.Col>

            <Grid.Col>
              <Textarea
                label={t('bills:notes')}
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
                    <Table.Th>{t('bills:purchaseOrderItem')}</Table.Th>
                    <Table.Th>{t('bills:quantity')}</Table.Th>
                    <Table.Th>{t('bills:rate')}</Table.Th>
                    <Table.Th>{t('bills:tax')}</Table.Th>
                    <Table.Th>{t('bills:amount')}</Table.Th>
                    <Table.Th>{t('common:status')}</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {rows.length > 0 ? (
                    rows
                  ) : (
                    <Table.Tr>
                      <Table.Td colSpan={7} align="center">
                        <Text size="sm" c="dimmed">
                          {t('bills:noPurchaseItemsFound')}
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  )}
                </Table.Tbody>
              </Table>
            </Grid.Col>

            {!!totalAmount && (
              <Grid.Col span={7} offset={5}>
                <Paper withBorder p={20} bg={theme.colors.gray[1]}>
                  <Group justify="space-between">
                    <Text size="md" fw="bold">{`${t('bills:total')} ( ${currency.symbol} )`}</Text>
                    <Text size="md" fw="bold">
                      {totalAmount}
                    </Text>
                  </Group>
                </Paper>
              </Grid.Col>
            )}
          </Form>
        </Grid.Col>
      </Grid>
    </>
  )
}
