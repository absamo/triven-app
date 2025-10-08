import {
  ActionIcon,
  Grid,
  Group,
  NumberInput,
  Select,
  Table,
  Text,
  TextInput,
  Textarea,
  Tooltip,
  rem,
} from '@mantine/core'
import { DateInput } from '@mantine/dates'
import { useForm } from '@mantine/form'
import { IconHistory, IconTrash } from '@tabler/icons-react'
import { zodResolver } from 'mantine-form-zod-resolver'
import { useFetcher, useSubmit } from 'react-router'

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
// import Barcode from "react-barcode"

import { type IProduct } from '~/app/common/validations/productSchema'
import { type ISite } from '~/app/common/validations/siteSchema'
import { type IStockAdjustmentHistory } from '~/app/common/validations/stockAdjustmentHistorySchema'
import { Title } from '~/app/partials/Title'

import { useDisclosure } from '@mantine/hooks'
import { ADJUSTMENT_REASONS } from '~/app/common/constants'
import {
  stockAdjustmentSchema,
  type IStockAdjustment,
} from '~/app/common/validations/stockAdjustmentsSchema'
import { Form, Notification } from '~/app/components'
import { SearchableSelect } from '~/app/partials/SearchableSelect'
import StockAdjustmentHistory from './StockAdjustmentHistory'

interface InventoryFormProps {
  adjustment: IStockAdjustment
  sites: ISite[]
  products: IProduct[]
  errors?: Record<string, string>
}

export default function AdjustmentForm({ adjustment, sites, products }: InventoryFormProps) {
  const { t } = useTranslation('inventory')
  const { t: tCommon } = useTranslation('common')

  const [notification, setNotification] = useState<{
    message: string | null
    status: 'Success' | 'Warning' | 'Error' | null
  } | null>(null)

  const [stockAdjustmentHistories, setStockAdjustmentHistories] = useState<
    IStockAdjustmentHistory[]
  >([])

  const [opened, { open, close }] = useDisclosure(false)
  const [adjustedQuantitiesErrors, setAdjustedQuantitiesErrors] = useState<
    { id: string; message: string }[]
  >([])

  let fetcher = useFetcher()

  const form = useForm({
    validate: zodResolver(stockAdjustmentSchema),
    initialValues: {
      id: adjustment.id,
      reason: adjustment.reason,
      date: new Date(adjustment.date),
      notes: adjustment.notes,
      reference: adjustment.reference,
      siteId: adjustment.siteId,
      products: adjustment.products || [],
      barcode: '',
      adjustedQuantity: 0,
    },
  })

  useEffect(() => {
    if (!fetcher.data || fetcher.state === 'loading') {
      return
    }

    type FetcherData = {
      product: IProduct
      error: string | null
    }

    const data = fetcher.data as FetcherData

    if (data.error) {
      setNotification({
        message: data.error,
        status: 'Error',
      })

      return
    }

    const foundProduct = form.values.products.find((p) => p.id === data.product?.id)

    let message
    if (foundProduct) {
      form.setFieldValue(
        'products',
        form.values.products.reduce((acc: IProduct[], p: IProduct) => {
          if (p.id === data.product.id) {
            return [
              ...acc,
              {
                ...p,
                adjustedQuantity: (p.adjustedQuantity || 0) + 1,
              },
            ]
          }
          return [...acc, p]
        }, [])
      )
      message = t('stockAdjusted')
    } else {
      form.setFieldValue('products', [
        ...form.values.products.filter((p) => p.id !== data.product.id),
        {
          ...data.product,
          adjustedQuantity: (data.product.adjustedQuantity || 0) + 1,
        },
      ])
      message = 'Product added to adjustment'
    }

    setNotification({
      message,
      status: 'Success',
    })
  }, [fetcher, form])

  useEffect(() => {
    let barcode = ''

    const handleScannerInput = (event: KeyboardEvent) => {
      if (event.key in [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]) {
        barcode += event.key
      } else if (event.key === 'Enter') {
        fetcher.load(`/api/productAdjustment?barcode=${barcode}`)
        barcode = ''
      }
    }
    fetcher.data = undefined
    document.addEventListener('keydown', handleScannerInput)
  }, [fetcher, notification])

  const submit = useSubmit()

  const handleSubmit = ({ reference, reason, date, notes, siteId, products }: IStockAdjustment) => {
    const form = new FormData()

    form.append('reference', reference || '')
    form.append('reason', reason)
    form.append('date', JSON.stringify(date))
    form.append('notes', notes || '')
    form.append('siteId', siteId)
    form.append('products', JSON.stringify(products))

    if (adjustedQuantitiesErrors.length === 0) {
      submit(form, { method: 'post' })
    }
  }

  const selectedProductsIds = form.values.products?.map((p) => p.id) ?? []
  const availableProducts = products.filter((p) => !selectedProductsIds.includes(p.id))

  const productsOptions = availableProducts.map((product: IProduct) => ({
    value: product.id || '',
    label: product.name,
  }))

  const rows = form.values.products.map((product: IProduct, _, products) => {
    const newQuantityOnHand = (product.openingStock || 0) + Number(product.adjustedQuantity || 0)
    return (
      <Table.Tr key={product.id}>
        <Table.Td>
          <Text size="sm" w={200}>
            {product.name}
          </Text>
        </Table.Td>
        <Table.Td>
          <Text size="sm">{product.status}</Text>
        </Table.Td>
        <Table.Td>
          <Text size="sm">{product.openingStock}</Text>
        </Table.Td>
        <Table.Td>
          <NumberInput
            name="adjustedQuantity"
            value={product.adjustedQuantity}
            onChange={(value: number | string) => {
              const parsedValue = typeof value === 'string' ? parseInt(value) : value

              if (isNaN(parsedValue)) {
                return
              }
              form.setFieldValue('products', [
                ...products.map((p: IProduct) => {
                  if (p.id === product.id) {
                    if ((p.openingStock || 0) + parsedValue < 0) {
                      setAdjustedQuantitiesErrors([
                        ...adjustedQuantitiesErrors.filter((error) => error.id !== p.id),
                        {
                          id: p.id,
                          message: t('invalidQuantity'),
                        },
                      ] as any)
                    } else {
                      setAdjustedQuantitiesErrors([
                        ...adjustedQuantitiesErrors.filter((error) => error.id !== p.id),
                      ] as any)
                    }

                    return {
                      ...p,
                      adjustedQuantity: parsedValue,
                    }
                  }
                  return p
                }),
              ])
            }}
            error={adjustedQuantitiesErrors.find((error) => error.id === product.id)?.message}
            w={150}
          />
        </Table.Td>
        <Table.Td>
          <Text size="sm">{newQuantityOnHand}</Text>
        </Table.Td>
        <Table.Td>
          <Group>
            <Tooltip label={t('viewProductHistory')} withArrow>
              <ActionIcon
                variant="subtle"
                onClick={() => {
                  setStockAdjustmentHistories(
                    (product.stockAdjustmentHistories || []) as IStockAdjustmentHistory[]
                  )
                  open()
                }}
              >
                <IconHistory style={{ width: rem(16), height: rem(16) }} stroke={1.5} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Table.Td>

        <Table.Td>
          <Group>
            <Tooltip label={t('removeProductFromAdjustment')} withArrow>
              <ActionIcon
                variant="subtle"
                color="red"
                onClick={() =>
                  form.setFieldValue('products', [
                    ...(form.values.products || []).filter((s: IProduct) => s.id !== product.id),
                  ])
                }
              >
                <IconTrash style={{ width: rem(16), height: rem(16) }} stroke={1.5} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Table.Td>
      </Table.Tr>
    )
  })

  return (
    <>
      <Grid>
        <Grid.Col>
          <Title backTo={'/stock-adjustments'}>
            {adjustment.id ? t('editStockAdjustment') : t('addStockAdjustment')}
          </Title>

          <Form onSubmit={form.onSubmit(handleSubmit)}>
            <Grid.Col span={6}>
              <SearchableSelect
                label={t('site')}
                placeholder={t('selectSite')}
                name="siteId"
                withAsterisk
                data={sites.map((site) => {
                  return {
                    value: site.id || '',
                    label: site.name,
                  }
                })}
                {...form.getInputProps('siteId')}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <Select
                withAsterisk
                label={t('reason')}
                placeholder={t('selectReason')}
                name="reason"
                data={[
                  {
                    value: ADJUSTMENT_REASONS.DAMAGED_ITEMS,
                    label: t('damaged'),
                  },
                  { value: ADJUSTMENT_REASONS.DEMO, label: t('demo') },
                  {
                    value: ADJUSTMENT_REASONS.EXCESS_STOCK,
                    label: t('excessStock'),
                  },
                  {
                    value: ADJUSTMENT_REASONS.INTERNAL_TRANSFER,
                    label: t('internalTransfer'),
                  },
                  {
                    value: ADJUSTMENT_REASONS.LOST_ITEMS,
                    label: t('lost'),
                  },
                  { value: ADJUSTMENT_REASONS.PURCHASE, label: t('purchase') },
                  {
                    value: ADJUSTMENT_REASONS.QUALITY_CONTROL,
                    label: t('qualityControl'),
                  },
                  { value: ADJUSTMENT_REASONS.REFUND, label: t('refund') },
                  { value: ADJUSTMENT_REASONS.RETURN, label: t('return') },
                  {
                    value: ADJUSTMENT_REASONS.RETURN_SUPPLIER,
                    label: t('returnSupplier'),
                  },
                  { value: ADJUSTMENT_REASONS.SALE, label: t('sale') },
                  {
                    value: ADJUSTMENT_REASONS.UNACCOUNTED_INVENTORY,
                    label: t('unaccountedInventory'),
                  },
                ]}
                {...form.getInputProps('reason')}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <DateInput
                valueFormat="DD/MM/YYYY"
                label={t('date')}
                name="date"
                {...form.getInputProps('date')}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <TextInput
                withAsterisk
                label={t('reference')}
                name="reference"
                {...form.getInputProps('reference')}
                error={form.getInputProps('reference').error}
              />
            </Grid.Col>
            <Grid.Col>
              <Textarea
                label={t('notes')}
                name="notes"
                autosize
                minRows={4}
                {...form.getInputProps('notes')}
              />
            </Grid.Col>
            <Grid.Col>
              <SearchableSelect
                label={t('products')}
                placeholder={t('selectOrScanProduct')}
                data={productsOptions}
                onChange={(productId: string) => {
                  const currentProduct: IProduct | undefined = products.find(
                    (product: IProduct) => product.id === productId
                  )

                  if (!currentProduct) return

                  const stockOnHand =
                    (currentProduct.openingStock !== currentProduct.accountingStockOnHand
                      ? currentProduct.accountingStockOnHand
                      : currentProduct.openingStock) || 0

                  form.setFieldValue('products', [
                    ...(form.values.products || []).filter(
                      (product: IProduct) => product.id !== productId
                    ),
                    {
                      ...currentProduct,
                      adjustedQuantity: 1,
                      accountingStockOnHand: stockOnHand + 1,
                      openingStock: stockOnHand,
                    },
                  ])
                }}
                value={''}
                onKeyDown={(e: KeyboardEvent) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                  }
                  return e
                }}
              />
              <Table verticalSpacing="sm" highlightOnHover withTableBorder mt={'md'}>
                <Table.Thead fz={12}>
                  <Table.Tr>
                    <Table.Th>{t('productHeader')}</Table.Th>
                    <Table.Th>{t('statusHeader')}</Table.Th>
                    <Table.Th>{t('availableQtyHeader')}</Table.Th>
                    <Table.Th>{t('adjustedQtyHeader')}</Table.Th>
                    <Table.Th>{t('newQtyOnHandHeader')}</Table.Th>
                    <Table.Th></Table.Th>
                    <Table.Th></Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <tbody>{rows}</tbody>
              </Table>
            </Grid.Col>
          </Form>
        </Grid.Col>
      </Grid>
      {opened && (
        <StockAdjustmentHistory
          stockAdjustmentHistories={stockAdjustmentHistories}
          onClose={close}
          opened={opened}
        />
      )}
      {notification && <Notification notification={notification} />}
    </>
  )
}
