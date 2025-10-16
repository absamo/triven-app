import { Alert, Button, Grid, Group, Select, Text, Textarea, TextInput } from '@mantine/core'
import { DateInput } from '@mantine/dates'
import { useForm } from '@mantine/form'
import { IconExclamationCircle, IconEye } from '@tabler/icons-react'
import { zodResolver } from 'mantine-form-zod-resolver'
import { useTranslation } from 'react-i18next'
import { Link, useSubmit } from 'react-router'

import { BACKORDER_STATUSES } from '~/app/common/constants'
import type { IAgency } from '~/app/common/validations/agencySchema'
import { backorderSchema, type IBackorder } from '~/app/common/validations/backorderSchema'
import type { ICustomer } from '~/app/common/validations/customerSchema'
import type { IProduct } from '~/app/common/validations/productSchema'
import type { ISite } from '~/app/common/validations/siteSchema'
import { Form } from '~/app/components'
import { formatLocalizedDate } from '~/app/lib/dayjs'
import { AgencySites } from '~/app/partials/AgencySites'
import { Title } from '~/app/partials/Title'
import BackorderItemsForm from './BackorderItemsForm'

interface BackorderFormProps {
  backorder?: IBackorder
  customers: ICustomer[]
  agencies: IAgency[]
  products: IProduct[]
  sites: ISite[]
  errors: Record<string, string>
  isEdit?: boolean
}

export default function BackorderForm({
  backorder,
  customers,
  agencies,
  products,
  sites,
  errors,
  isEdit = false,
}: BackorderFormProps) {
  const { t, i18n } = useTranslation(['backorders', 'common'])

  const form = useForm({
    mode: 'uncontrolled',
    validate: zodResolver(backorderSchema),
    validateInputOnBlur: true,
    initialValues: {
      id: backorder?.id || '',
      backorderReference: backorder?.backorderReference || '',
      customerId: backorder?.customerId || '',
      agencyId: backorder?.agencyId || '',
      siteId: backorder?.siteId || '',
      status: backorder?.status || 'Pending',
      originalOrderDate: backorder?.originalOrderDate
        ? new Date(backorder.originalOrderDate)
        : new Date(),
      notes: backorder?.notes || '',
      backorderItems: backorder?.backorderItems || [],
    },
  })

  const submit = useSubmit()

  const handleSubmit = (values: typeof form.values) => {
    const formData = new FormData()
    formData.append('backorderData', JSON.stringify(values))
    submit(formData, { method: 'post' })
  }

  const validateBackorderItems = (backorderItems: any[]) => {
    // Check if no backorder items exist
    if (!backorderItems || backorderItems.length === 0) {
      return t(
        'backorders:backorderItemRequired',
        'Please add a backorder item before submitting the form'
      )
    }

    // Check if any backorder items don't have a product selected
    const invalidItems = backorderItems.filter((item) => !item.productId || item.productId === '')
    if (invalidItems.length > 0) {
      return t(
        'backorders:noProductSelectedError',
        'Please select a product for all backorder items'
      )
    }

    // Check if any backorder items have invalid quantities
    const invalidQuantityItems = backorderItems.filter(
      (item) => !item.orderedQuantity || item.orderedQuantity <= 0
    )
    if (invalidQuantityItems.length > 0) {
      return t(
        'backorders:invalidQuantityError',
        'Please enter a valid quantity for all backorder items'
      )
    }

    return null
  }

  const customerOptions = customers
    .filter((customer) => customer.id)
    .map((customer) => ({
      value: customer.id!,
      label: `${customer.firstName} ${customer.lastName}`,
    }))

  const statusOptions = Object.entries(BACKORDER_STATUSES).map(([key, value]) => ({
    value: value,
    label: t(`backorders:status.${value.toLowerCase()}`, value),
  }))

  return (
    <>
      <Title backTo="/backorders">
        {isEdit ? t('backorders:editBackorder') : t('backorders:createBackorder')}
      </Title>

      {/* Show linked sales order information when editing */}
      {isEdit && (backorder as any)?.salesOrder && (
        <Alert variant="light" color="blue" icon={<IconExclamationCircle />} mt="md" mb="md">
          <Group justify="space-between" align="center">
            <div>
              <Text size="sm" fw={500}>
                {t('backorders:salesOrder')}: {(backorder as any).salesOrder.salesOrderReference}
              </Text>
              <Text size="xs" c="dimmed">
                {t('backorders:orderDate')}:{' '}
                {(backorder as any).salesOrder.orderDate
                  ? formatLocalizedDate((backorder as any).salesOrder.orderDate, i18n.language, 'L')
                  : 'N/A'}{' '}
                | {t('common:status')}: {(backorder as any).salesOrder.status}
              </Text>
            </div>
            <Button
              size="xs"
              variant="light"
              component={Link}
              to={`/salesOrders/${(backorder as any).salesOrder.id}/edit`}
              leftSection={<IconEye size={14} />}
            >
              {t('common:viewSalesOrder', 'View Sales Order')}
            </Button>
          </Group>
        </Alert>
      )}

      <Form
        onSubmit={(e) => {
          e.preventDefault()

          // First trigger field validation
          const fieldValidationResult = form.validate()

          // Then manually validate backorder items
          const backorderItemsError = validateBackorderItems(form.values.backorderItems || [])

          if (backorderItemsError) {
            form.setFieldError('backorderItems', backorderItemsError)
          }

          // Only submit if no field errors AND no backorder items errors
          if (!fieldValidationResult.hasErrors && !backorderItemsError) {
            handleSubmit(form.values)
          }
        }}
        showSubmitButton={false}
      >
        <Grid>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <TextInput
              label={t('backorders:backorderReference')}
              placeholder={t('backorders:backorderReference')}
              {...form.getInputProps('backorderReference')}
              error={form.getInputProps('backorderReference').error || errors?.backorderReference}
              withAsterisk
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Select
              label={t('backorders:customerName')}
              placeholder={t('common:selectCustomer', 'Select customer')}
              data={customerOptions}
              searchable
              {...form.getInputProps('customerId')}
              error={form.getInputProps('customerId').error || errors?.customerId}
              withAsterisk
              onChange={(value) => {
                form.setFieldValue('customerId', value || '')
              }}
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 6 }}>
            <Select
              label={t('common:status', 'Status')}
              placeholder={t('common:selectStatus', 'Select status')}
              data={statusOptions}
              {...form.getInputProps('status')}
              error={form.getInputProps('status').error || errors?.status}
              withAsterisk
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 6 }}>
            <DateInput
              label={t('backorders:originalOrderDate')}
              placeholder="DD/MM/YYYY"
              valueFormat="DD/MM/YYYY"
              clearable
              {...form.getInputProps('originalOrderDate')}
              error={form.getInputProps('originalOrderDate').error || errors?.originalOrderDate}
              withAsterisk
            />
          </Grid.Col>

          <AgencySites
            extraProps={{ colSpan: 6 }}
            agencyId={form.values.agencyId}
            agencies={agencies}
            sites={sites}
            siteId={form.values.siteId}
            onChange={({ agencyId, siteId }) => {
              form.setFieldValue('agencyId', agencyId)
              form.setFieldValue('siteId', siteId)
            }}
            error={{
              siteId: form.getInputProps('siteId').error || errors?.siteId,
              agencyId: form.getInputProps('agencyId').error || errors?.agencyId,
            }}
          />

          <Grid.Col span={12}>
            <Textarea
              label={t('backorders:notes')}
              placeholder={t('common:enterNotes', 'Enter any additional notes')}
              rows={3}
              {...form.getInputProps('notes')}
              error={form.getInputProps('notes').error || errors?.notes}
            />
          </Grid.Col>

          <Grid.Col span={12}>
            <BackorderItemsForm
              form={form}
              products={products}
              agencyId={form.values.agencyId}
              siteId={form.values.siteId}
              errors={errors}
              alertComponent={
                form.errors.backorderItems && (
                  <Alert
                    variant="light"
                    color="red"
                    icon={<IconExclamationCircle />}
                    mt="md"
                    classNames={{
                      root: 'backorder-error-alert',
                    }}
                  >
                    <Text size="sm" c="red">
                      {form.errors.backorderItems}
                    </Text>
                  </Alert>
                )
              }
            />
          </Grid.Col>
        </Grid>
      </Form>
    </>
  )
}
