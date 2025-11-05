import {
  ActionIcon,
  Badge,
  Button,
  Container,
  Divider,
  Grid,
  Group,
  Image,
  Title as MantineTitle,
  Modal,
  NumberInput,
  rem,
  Select,
  Stack,
  Table,
  Tabs,
  Text,
  Textarea,
  TextInput,
  Tooltip,
} from '@mantine/core'
import { Dropzone, type FileWithPath } from '@mantine/dropzone'
import { useForm } from '@mantine/form'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import {
  IconBarcode,
  IconInfoCircle,
  IconPhoto,
  IconStar,
  IconTrash,
  IconUpload,
  IconX,
} from '@tabler/icons-react'
import { zodResolver } from 'mantine-form-zod-resolver'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useActionData, useNavigate, useSubmit } from 'react-router'

// Import ImageKit utilities - now using server-side approach
import { generateProductImageUrl } from '~/app/lib/imagekit.client-config'

// import Barcode from "react-barcode"
// import Ean from "ean-generator"

import dayjs from 'dayjs'
import {
  PRODUCT_STATUSES,
  PRODUCT_UNITS,
  PURCHASE_ORDER_STATUSES,
  SALES_ORDERS_STATUSES,
} from '~/app/common/constants'
import { createEan13 } from '~/app/common/helpers/inventories'
import { getPurchaseOrderStatusLabel } from '~/app/common/helpers/purchase'
import { getSalesOrderStatusLabel } from '~/app/common/helpers/sales'
import type { IAgency } from '~/app/common/validations/agencySchema'
import type { IAsset } from '~/app/common/validations/assetSchema'
import type { ICategory } from '~/app/common/validations/categorySchema'
import type { ICurrency } from '~/app/common/validations/currencySchema'
import type { IInvoice } from '~/app/common/validations/invoiceSchema'
import { type IProduct, productSchema } from '~/app/common/validations/productSchema'
import type { IPurchaseOrderItem } from '~/app/common/validations/purchaseOrderItemSchema'
import type { IPurchaseOrder } from '~/app/common/validations/purchaseOrderSchema'
import type { IPurchaseReceiveItem } from '~/app/common/validations/purchaseReceiveItemSchema'
import type { ISalesOrderItem } from '~/app/common/validations/salesOrderItemSchema'
import type { ISalesOrder } from '~/app/common/validations/salesOrderSchema'
import type { ISite } from '~/app/common/validations/siteSchema'
import type { IStockAdjustment } from '~/app/common/validations/stockAdjustmentsSchema'
import { Form } from '~/app/components'
import { AgencySites } from '~/app/partials/AgencySites'
import { SearchableSelect } from '~/app/partials/SearchableSelect'
import { Title } from '~/app/partials/Title'
import classes from './ProductForm.module.css'

interface ProductFormProps {
  product: IProduct & {
    images?: IAsset[]
    salesOrderItems: {
      quantity: ISalesOrderItem['quantity']
      salesOrder: { invoices: IInvoice[] }
    }[]
    purchaseOrderItems: {
      quantity: IPurchaseOrderItem['quantity']
      purchaseOrder: {
        bills: { purchaseOrder: { purchaseOrderItems: [] } }[]
        purchaseReceives: { purchaseReceiveItems: IPurchaseReceiveItem[] }[]
      }
    }[]
  }
  categories: ICategory[]
  sites: ISite[]
  agencies: IAgency[]
  salesOrders: ISalesOrder[]
  purchaseOrders: IPurchaseOrder[]
  stockAdjustments: IStockAdjustment[]
  currency: ICurrency
  errors: Record<string, string>
}

export default function ProductForm({
  product,
  categories = [],
  sites = [],
  agencies = [],
  salesOrders = [],
  purchaseOrders = [],
  stockAdjustments = [],
  currency,
  errors,
}: ProductFormProps) {
  const { t } = useTranslation('inventory')

  // State for managing product images - simple approach with files
  const [productImages, setProductImages] = useState<IAsset[]>(product.images || [])
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([])
  const [pendingImageFiles, setPendingImageFiles] = useState<
    { file: File; primary: boolean; id: string; blobUrl?: string }[]
  >([]) // Files ready to upload
  const [uploadErrors, setUploadErrors] = useState<string[]>([])

  // Confirmation modal state
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] =
    useDisclosure(false)
  const [imageToDelete, setImageToDelete] = useState<{ id: string; name: string } | null>(null)

  // Ref to track all created blob URLs for cleanup
  const blobUrlsRef = useRef<Set<string>>(new Set())

  // Simple combined images - existing + pending files
  const allImages = (() => {
    const existingImages = productImages.sort((a, b) => (b.primary ? 1 : 0) - (a.primary ? 1 : 0))

    // Convert pending files to display format using existing blob URLs if available
    const pendingAsImages = pendingImageFiles.map((item) => {
      // Create blob URL if not already created, or reuse existing
      let blobUrl = item.blobUrl
      if (!blobUrl) {
        blobUrl = URL.createObjectURL(item.file)
        blobUrlsRef.current.add(blobUrl) // Track for cleanup
        // Store the blob URL back to the item to avoid recreating
        item.blobUrl = blobUrl
      }

      return {
        id: item.id, // Use the existing ID from the item
        name: item.file.name,
        path: blobUrl,
        type: 'image' as const,
        productId: product.id,
        primary: item.primary,
        isPending: true,
      }
    })

    const result = [...existingImages, ...pendingAsImages]
    return result
  })() // Get the first image to display as main (either primary or first)
  const getDisplayMainImage = () => {
    const primaryImage = allImages.find((img) => img.primary)
    return primaryImage || allImages[0]
  }

  // Get images for additional slots (all except the one shown as main)
  const getDisplayAdditionalImages = () => {
    const mainImg = getDisplayMainImage()
    const additionalImages = allImages.filter((img) => img.id !== mainImg?.id)
    return additionalImages
  }

  // Cleanup object URLs on component unmount
  useEffect(() => {
    return () => {
      // Cleanup all tracked blob URLs
      blobUrlsRef.current.forEach((url) => {
        URL.revokeObjectURL(url)
      })
      blobUrlsRef.current.clear()
    }
  }, []) // Only cleanup on unmount

  // Clear uploaded images when component loads/product changes
  const previousProductId = useRef<string | undefined>('')

  useEffect(() => {
    // Only clear if the product ID actually changed
    if (product.id !== previousProductId.current) {
      // Clean up existing blob URLs before clearing
      pendingImageFiles.forEach((item) => {
        if (item.blobUrl) {
          URL.revokeObjectURL(item.blobUrl)
          blobUrlsRef.current.delete(item.blobUrl)
        }
      })

      // Clear pending images from previous form loads
      setPendingImageFiles([])
      setImagesToDelete([])
      setUploadErrors([])

      // Reset product images to match the current product
      setProductImages(product.images || [])

      // Update the ref to track the current product ID
      previousProductId.current = product.id
    }
  }, [product.id, product.images?.length]) // Only reset when product ID changes or images count changes

  const form = useForm({
    validate: zodResolver(productSchema),
    initialValues: {
      //sku: product.sku,
      id: product.id,
      name: product.name,
      description: product.description,
      active: product.active,
      costPrice: product.costPrice,
      sellingPrice: product.sellingPrice,
      categoryId: product.categoryId,
      subcategoryId: product.subcategoryId,
      attributeTypes: product.attributeTypes,
      openingStock: product.openingStock,
      openingValue: product.openingValue,
      barcode: product.barcode,
      reorderPoint: product.reorderPoint,
      safetyStockLevel: product.safetyStockLevel,
      status: product.status,
      siteId: product.siteId,
      agencyId: product.agencyId,
      unit: product.unit,
    },
  })

  const navigate = useNavigate()
  const submit = useSubmit()
  const actionData = useActionData() as
    | { error?: string; notification?: { message: string; status: string } }
    | undefined

  // Handle server-side errors
  useEffect(() => {
    if (actionData?.error) {
      notifications.show({
        title: 'Error',
        message: actionData.error,
        color: 'red',
        autoClose: false,
      })
    }
    if (actionData?.notification) {
      const color =
        actionData.notification.status === 'Success'
          ? 'green'
          : actionData.notification.status === 'warning'
            ? 'yellow'
            : 'red'

      notifications.show({
        title: actionData.notification.status === 'Success' ? 'Success' : 'Error',
        message: actionData.notification.message,
        color,
        autoClose: actionData.notification.status === 'Success' ? 3000 : false,
      })

      // Navigate back to products list after successful update
      if (actionData.notification.status === 'Success') {
        navigate('/products')
      }
    }
  }, [actionData, navigate])

  const handleSubmit = (values: typeof form.values, event?: React.FormEvent<HTMLFormElement>) => {
    // Prevent default form submission
    if (event) event.preventDefault()

    // Create FormData manually
    const formData = new FormData()

    // Add basic form fields
    if (values.id) formData.append('id', values.id)
    formData.append('name', values.name)
    formData.append('description', values.description || '')
    formData.append('barcode', values.barcode)
    formData.append('unit', values.unit)
    formData.append('categoryId', values.categoryId)
    formData.append('status', values.status || '')
    formData.append('agencyId', values.agencyId)
    formData.append('siteId', values.siteId)

    // Add numeric fields as strings
    formData.append('costPrice', String(values.costPrice))
    formData.append('sellingPrice', String(values.sellingPrice))
    formData.append('reorderPoint', String(values.reorderPoint))
    formData.append('safetyStockLevel', String(values.safetyStockLevel))
    formData.append('openingStock', String(values.openingStock))
    formData.append('openingValue', String(values.openingValue))

    // Add image data - send complete images array
    formData.append('imagesToDelete', JSON.stringify(imagesToDelete))

    // Create complete images array combining existing + new
    const completeImages = [
      // Existing images (not deleted)
      ...productImages.filter((img) => !imagesToDelete.includes(img.id!)),
      // New images with primary status (these will be uploaded by server)
      ...pendingImageFiles.map((item) => ({
        name: item.file.name,
        path: '', // Will be set by server after upload
        type: 'image',
        primary: item.primary,
      })),
    ]

    formData.append('images', JSON.stringify(completeImages))

    // Add pending image files for upload
    pendingImageFiles.forEach((item) => {
      formData.append('imageFiles', item.file)
    })

    // Use useSubmit with explicit encType for file uploads
    try {
      submit(formData, { method: 'post', encType: 'multipart/form-data' })
    } catch (error) {
      notifications.show({
        title: 'Submission Error',
        message: 'Failed to submit the form. Please try again.',
        color: 'red',
        autoClose: false,
      })
      console.error('Form submission error:', error)
    }
  }

  // Image upload handlers - store files locally for form submission
  const handleImageUpload = (files: FileWithPath[]) => {
    setUploadErrors([]) // Clear previous errors

    // Check if adding these files would exceed the limit
    const totalImagesAfterUpload = allImages.length + files.length
    if (totalImagesAfterUpload > 5) {
      const errorMessage = `Cannot upload ${files.length} files. Maximum 5 images allowed. Currently have ${allImages.length} images.`
      setUploadErrors([errorMessage])

      notifications.show({
        id: 'limit-exceeded-' + Date.now(),
        title: 'Upload Limit Exceeded',
        message: errorMessage,
        color: 'red',
        autoClose: 10000,
        withCloseButton: true,
        style: { zIndex: 9999 },
        withBorder: true,
      })

      return
    }

    // Validate files before storing
    const validFiles: File[] = []
    const errors: string[] = []

    files.forEach((file) => {
      if (file.size > 2 * 1024 * 1024) {
        // 2MB limit
        errors.push(`${file.name}: File size exceeds 2MB limit`)
        return
      }

      if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
        errors.push(`${file.name}: File type not supported`)
        return
      }

      validFiles.push(file)
    })

    if (errors.length > 0) {
      setUploadErrors(errors)

      notifications.show({
        id: 'upload-error-' + Date.now(),
        title: 'Upload Error',
        message: errors.length === 1 ? errors[0] : `${errors.length} files failed validation.`,
        color: 'red',
        autoClose: 10000,
        withCloseButton: true,
        style: { zIndex: 9999 },
        withBorder: true,
      })

      return
    }

    // Store files with primary status
    const newFileItems = validFiles.map((file, index) => ({
      file,
      id: `pending-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${index}`,
      primary: allImages.length === 0 && !productImages.some((img) => img.primary) && index === 0,
    }))

    // If this is the first image and no existing primary, make it primary
    if (
      newFileItems.length > 0 &&
      allImages.length === 0 &&
      !productImages.some((img) => img.primary)
    ) {
      newFileItems[0].primary = true
    }

    setPendingImageFiles((prev) => [...prev, ...newFileItems])
  }

  // Handle dropzone rejections (file too large, wrong type, etc.)
  const handleImageReject = (rejectedFiles: any[]) => {
    const errors: string[] = []

    rejectedFiles.forEach((rejection) => {
      const file = rejection.file
      const errorCodes = rejection.errors || []

      errorCodes.forEach((error: any) => {
        if (error.code === 'file-too-large') {
          errors.push(`${file.name}: File size exceeds 2MB limit`)
        } else if (error.code === 'file-invalid-type') {
          errors.push(`${file.name}: File type not supported`)
        } else if (error.code === 'too-many-files') {
          errors.push(`Too many files selected. Maximum 5 images allowed.`)
        } else {
          errors.push(`${file.name}: ${error.message}`)
        }
      })
    })

    if (errors.length > 0) {
      notifications.show({
        id: 'dropzone-rejection-' + Date.now(),
        title: 'Upload Error',
        message: errors.length === 1 ? errors[0] : `${errors.length} files were rejected.`,
        color: 'red',
        autoClose: 10000,
        withCloseButton: true,
        style: { zIndex: 9999 },
        withBorder: true,
      })
    }
  }

  const handleImageDelete = (imageId: string) => {
    // Get image name for confirmation dialog
    let imageName = ''
    if (imageId.startsWith('pending-')) {
      const itemToRemove = pendingImageFiles.find((item) => item.id === imageId)
      imageName = itemToRemove?.file.name || 'this image'
    } else {
      const existingImage = productImages.find((img) => img.id === imageId)
      imageName = existingImage?.name || 'this image'
    }

    // Set the image to delete and open confirmation modal
    setImageToDelete({ id: imageId, name: imageName })
    openDeleteModal()
  }

  const confirmImageDelete = () => {
    if (!imageToDelete) return

    const { id: imageId, name: imageName } = imageToDelete

    // Proceed with deletion
    if (imageId.startsWith('pending-')) {
      // Find the item to remove and clean up its blob URL
      const itemToRemove = pendingImageFiles.find((item) => item.id === imageId)
      if (itemToRemove?.blobUrl) {
        URL.revokeObjectURL(itemToRemove.blobUrl)
        blobUrlsRef.current.delete(itemToRemove.blobUrl)
      }

      // Remove from pending images
      setPendingImageFiles((prev) => prev.filter((item) => item.id !== imageId))
    } else {
      // It's an existing image - mark for deletion
      setProductImages((prev) => prev.filter((img) => img.id !== imageId))

      // Add to deleted images if it's an existing image from the original product
      if (product.images?.some((img) => img.id === imageId)) {
        setImagesToDelete((prev) => [...prev, imageId])
      }
    }

    // Close modal and reset state
    closeDeleteModal()
    setImageToDelete(null)
  }

  const handleSetPrimary = (imageId: string) => {
    if (imageId.startsWith('pending-')) {
      // Update pending images primary status
      setPendingImageFiles((prev) =>
        prev.map((item) => ({
          ...item,
          primary: item.id === imageId,
        }))
      )
      // Remove primary from existing images
      setProductImages((prev) => prev.map((img) => ({ ...img, primary: false })))
    } else {
      // Update existing images primary status
      setProductImages((prev) =>
        prev.map((img) => ({
          ...img,
          primary: img.id === imageId,
        }))
      )
      // Remove primary from pending images
      setPendingImageFiles((prev) => prev.map((item) => ({ ...item, primary: false })))
    }
  }

  const handleImageError = (error: string) => {
    // You could add a notification here
  }

  const salesOrdeRows = salesOrders.map((salesOrder: ISalesOrder) => {
    const status = getSalesOrderStatusLabel(salesOrder?.status ?? SALES_ORDERS_STATUSES.PENDING)

    const totalAmount = salesOrder.salesOrderItems?.reduce(
      (acc, item) => acc + (item.amount || 0),
      0
    )

    return (
      <Table.Tr
        key={salesOrder.id}
        onClick={() => {
          navigate(`/salesorders/${salesOrder.id}/edit`)
        }}
      >
        <Table.Td>
          <Text size="sm">{dayjs(salesOrder.orderDate).format('DD-MM-YYYY')}</Text>
        </Table.Td>
        <Table.Td>{salesOrder.salesOrderReference}</Table.Td>
        <Table.Td>{`${salesOrder.customer?.firstName} ${salesOrder.customer?.lastName}`}</Table.Td>

        <Table.Td>
          <Badge color={status.color} variant="light">
            {status.label}
          </Badge>
        </Table.Td>

        <Table.Td>
          <Text size="sm">{`${currency?.symbol}${totalAmount}`}</Text>
        </Table.Td>
      </Table.Tr>
    )
  })

  const purchaseOrdeRows = purchaseOrders.map((purchaseOrder: IPurchaseOrder) => {
    const status = getPurchaseOrderStatusLabel(
      purchaseOrder?.status ?? PURCHASE_ORDER_STATUSES.PENDING
    )

    const totalAmount = purchaseOrder.purchaseOrderItems?.reduce(
      (acc, item) => acc + (item.amount || 0),
      0
    )

    return (
      <Table.Tr
        key={purchaseOrder.id}
        onClick={() => {
          navigate(`/purchase-orders/${purchaseOrder.id}/edit`)
        }}
      >
        <Table.Td>
          <Text size="sm">{dayjs(purchaseOrder.orderDate).format('DD-MM-YYYY')}</Text>
        </Table.Td>
        <Table.Td>{purchaseOrder.purchaseOrderReference}</Table.Td>
        <Table.Td>{purchaseOrder.supplier?.name}</Table.Td>

        <Table.Td>
          <Badge color={status.color} variant="light">
            {status.label}
          </Badge>
        </Table.Td>

        <Table.Td>
          <Text size="sm">{`${currency?.symbol}${totalAmount}`}</Text>
        </Table.Td>
      </Table.Tr>
    )
  })

  const stockAdjusmentsRows = stockAdjustments.map((stockAdjustment: IStockAdjustment) => {
    return (
      <Table.Tr
        key={stockAdjustment.id}
        onClick={() => {
          navigate(`/adjustments/${stockAdjustment.id}/edit`)
        }}
      >
        <Table.Td>
          <Text size="sm">{dayjs(stockAdjustment.date).format('DD-MM-YYYY')}</Text>
        </Table.Td>
        <Table.Td>{stockAdjustment.reference}</Table.Td>
        <Table.Td>{stockAdjustment.reason}</Table.Td>

        <Table.Td>
          <Text size="sm">{stockAdjustment.site?.name}</Text>
        </Table.Td>
      </Table.Tr>
    )
  })

  const accountingStockOnHand = product.accountingStockOnHand || 0
  const accountingCommittedStock =
    product.salesOrderItems.reduce((acc, item) => acc + item.quantity, 0) || 0

  const accountingAvailableStockForSale = accountingStockOnHand - accountingCommittedStock

  const physicalStockOnHand = product.physicalStockOnHand || 0
  const physicalCommittedStock = 0
  const physicalAvailableStockForSale = 0

  const quantityToBeInvoiced = product.salesOrderItems.reduce(
    (acc, item) => (acc + item.salesOrder.invoices.length === 0 ? item.quantity : 0),
    0
  )

  const quantityToBilled = product.purchaseOrderItems.reduce(
    (acc, item) => (acc + item.purchaseOrder.bills.length === 0 ? item.quantity : 0),
    0
  )

  const quantityToBeReceived =
    product.purchaseOrderItems.reduce(
      (acc, item) =>
        acc +
        item.quantity -
        item.purchaseOrder.purchaseReceives.reduce(
          (acc, item) =>
            acc +
            item.purchaseReceiveItems
              .filter((purchaseReceive) => purchaseReceive.productId === product.id)
              .reduce((acc, item) => acc + item.receivedQuantity, 0),
          0
        ),
      0
    ) || 0

  return (
    <>
      <Grid>
        <Grid.Col>
          <Title backTo={'/products'}>{product.id ? t('editProduct') : t('addProduct')}</Title>

          <Form onSubmit={form.onSubmit(handleSubmit)} showSubmitButton={false}>
            <Grid.Col>
              <Tabs defaultValue="details" keepMounted={false}>
                {product.id && (
                  <Tabs.List mb={15}>
                    <Tabs.Tab value="details">{t('details')}</Tabs.Tab>
                    <Tabs.Tab value="stockMovements">{t('stockMovements')}</Tabs.Tab>
                    <Tabs.Tab value="inventoryAdjustments">{t('inventoryAdjustments')}</Tabs.Tab>
                    <Tabs.Tab value="salesOrders">{t('salesOrders')}</Tabs.Tab>
                    <Tabs.Tab value="purchaseOrders">{t('purchaseOrders')}</Tabs.Tab>
                  </Tabs.List>
                )}

                <Tabs.Panel value="details">
                  <Grid>
                    <Grid.Col span={6}>
                      <TextInput
                        withAsterisk
                        label={t('name')}
                        name="name"
                        {...form.getInputProps('name')}
                        error={form.getInputProps('name').error || errors?.name}
                      />
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <TextInput
                        withAsterisk
                        label={t('barcode')}
                        name="barcode"
                        {...form.getInputProps('barcode')}
                        error={form.getInputProps('barcode').error || errors?.barcode}
                        rightSection={
                          <Tooltip label={t('generateBarcode')}>
                            <ActionIcon
                              variant="subtle"
                              onClick={() => form.setFieldValue('barcode', createEan13())}
                            >
                              <IconBarcode
                                style={{ width: rem(18), height: rem(18) }}
                                stroke={1.5}
                              />
                            </ActionIcon>
                          </Tooltip>
                        }
                      />
                    </Grid.Col>

                    {/* <Grid.Col span={6}>
                    <TextInput
                      withAsterisk
                      label="SKU"
                      name="sku"
                      {...form.getInputProps("sku")}
                      error={form.getInputProps("sku").error || errors?.sku}
                    />
                  </Grid.Col> */}

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
                        siteId: form.getInputProps('siteId').error,
                        agencyId: form.getInputProps('agencyId').error,
                      }}
                    />

                    <Grid.Col span={6}>
                      <Select
                        withAsterisk
                        label={t('unit')}
                        placeholder={t('selectUnit')}
                        name="unit"
                        data={[
                          { value: PRODUCT_UNITS.PIECES, label: 'pcs' },
                          { value: PRODUCT_UNITS.BOX, label: 'box' },
                          { value: PRODUCT_UNITS.GRAM, label: 'g' },
                          { value: PRODUCT_UNITS.MILLILITER, label: 'ml' },
                          { value: PRODUCT_UNITS.CENTIMETER, label: 'cm' },
                          {
                            value: PRODUCT_UNITS.KILOGRAM,
                            label: 'kg',
                          },
                          { value: PRODUCT_UNITS.LITER, label: 'l' },
                          { value: PRODUCT_UNITS.METER, label: 'm' },
                        ]}
                        {...form.getInputProps('unit')}
                      />
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <SearchableSelect
                        label={t('category')}
                        placeholder={t('selectCategory')}
                        name="categoryId"
                        withAsterisk
                        data={categories.map((category) => {
                          return {
                            value: category.id || '',
                            label: category.name,
                          }
                        })}
                        {...form.getInputProps('categoryId')}
                      />
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <Select
                        withAsterisk
                        label={t('status')}
                        placeholder={t('selectStatus', 'Select status')}
                        name="status"
                        data={[
                          { value: PRODUCT_STATUSES.AVAILABLE, label: 'Available' },
                          { value: PRODUCT_STATUSES.ARCHIVED, label: 'Archived' },
                          { value: PRODUCT_STATUSES.OUTOFSTOCK, label: 'Out of Stock' },
                          { value: PRODUCT_STATUSES.LOWSTOCK, label: 'Low Stock' },
                          { value: PRODUCT_STATUSES.ONORDER, label: 'On Order' },
                          { value: PRODUCT_STATUSES.RESERVED, label: 'Reserved' },
                          { value: PRODUCT_STATUSES.DISCONTINUED, label: 'Discontinued' },
                          { value: PRODUCT_STATUSES.INTRANSIT, label: 'In Transit' },
                          { value: PRODUCT_STATUSES.DAMAGED, label: 'Damaged' },
                          { value: PRODUCT_STATUSES.CRITICAL, label: 'Critical' },
                        ]}
                        {...form.getInputProps('status')}
                      />
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <NumberInput
                        withAsterisk={!product.id}
                        label={t('openingStock')}
                        name="openingStock"
                        disabled={!!product.id}
                        {...form.getInputProps('openingStock')}
                      />
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <NumberInput
                        withAsterisk={!product.id}
                        label={t('openingValue')}
                        name="openingValue"
                        disabled={!!product.id}
                        {...form.getInputProps('openingValue')}
                      />
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <NumberInput
                        withAsterisk
                        label={t('reorderPoint')}
                        name="reorderPoint"
                        {...form.getInputProps('reorderPoint')}
                      />
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <NumberInput
                        withAsterisk
                        label={t('safetyStockLevel')}
                        name="safetyStockLevel"
                        {...form.getInputProps('safetyStockLevel')}
                      />
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <NumberInput
                        decimalSeparator=","
                        decimalScale={2}
                        withAsterisk
                        label={t('costPrice')}
                        name="costPrice"
                        {...form.getInputProps('costPrice')}
                      />
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <NumberInput
                        decimalSeparator=","
                        decimalScale={2}
                        withAsterisk
                        label={t('sellingPrice')}
                        name="sellingPrice"
                        {...form.getInputProps('sellingPrice')}
                      />
                    </Grid.Col>

                    {/* <Grid.Col span={6}>
                    <Select
                      label="Subcategory"
                      placeholder="Select a subcategory"
                      name="subcategoryId"
                      withAsterisk
                      data={(data?.subcategories || subcategories).map(
                        (subcategory: ISubcategory) => {
                          return {
                            value: subcategory.id || "",
                            label: subcategory.name,
                          }
                        }
                      )}
                      {...form.getInputProps("subcategoryId")}
                      rightSection={
                        fetcher.state === "loading" ? (
                          <Loader size={16} />
                        ) : null
                      }
                    />
                  </Grid.Col> */}
                    <Grid.Col>
                      <Textarea
                        label={t('productDescription')}
                        name="description"
                        autosize
                        minRows={4}
                        {...form.getInputProps('description')}
                      />
                    </Grid.Col>

                    {/* Product Images Section */}
                    <Grid.Col>
                      <Stack gap="md">
                        <Group justify="space-between" align="center">
                          <Group justify="space-between" align="center">
                            <Group gap="xs" align="center">
                              <Text size="lg" fw={600}>
                                {t('productImages')}
                              </Text>
                              <Tooltip
                                label={
                                  <Stack gap="xs">
                                    <Text size="xs">✓ {t('useHighQualityImages')}</Text>
                                    <Text size="xs">✓ {t('supportedFormats')}</Text>
                                    <Text size="xs">✓ {t('maxFileSize')}</Text>
                                    <Text size="xs">⭐ {t('clickImagesToSetPrimary')}</Text>
                                  </Stack>
                                }
                                multiline
                                w={400}
                                withArrow
                                classNames={{
                                  tooltip: classes.imageTooltip,
                                }}
                              >
                                <ActionIcon variant="subtle" size="sm" c="dimmed">
                                  <IconInfoCircle size={16} />
                                </ActionIcon>
                              </Tooltip>
                            </Group>
                          </Group>
                          <Badge variant="light" color="blue" size="sm">
                            {allImages.length}/5
                          </Badge>
                        </Group>

                        {/* Show upload errors */}
                        {uploadErrors.length > 0 && (
                          <Stack gap="xs">
                            {uploadErrors.map((error, index) => (
                              <Text key={index} size="sm" c="red">
                                {error}
                              </Text>
                            ))}
                          </Stack>
                        )}

                        {/* Image Grid */}
                        <Grid className={classes.imageGrid}>
                          {/* Main Image Slot */}
                          <Grid.Col span={{ base: 12, md: 6 }}>
                            <div className={`${classes.imageSlot} ${classes.mainImageSlot}`}>
                              {(() => {
                                const mainImage = getDisplayMainImage()
                                return mainImage ? (
                                  <div className={classes.imageContainer} key={mainImage.id}>
                                    <Image
                                      key={`main-image-${mainImage.id}`}
                                      src={
                                        (mainImage as any).isPending
                                          ? mainImage.path
                                          : generateProductImageUrl(mainImage.path, 'gallery')
                                      }
                                      alt={mainImage.name}
                                      className={classes.productImage}
                                      onError={(e) => {
                                        console.error('Image load failed:', {
                                          imageName: mainImage.name,
                                          imagePath: mainImage.path,
                                          imageId: mainImage.id,
                                        })
                                        handleImageDelete(mainImage.id || '')
                                      }}
                                    />
                                    <div className={classes.imageOverlay}>
                                      <ActionIcon
                                        color="red"
                                        variant="filled"
                                        size="sm"
                                        className={classes.deleteButton}
                                        onClick={() => handleImageDelete(mainImage.id || '')}
                                        style={{
                                          position: 'absolute',
                                          top: 8,
                                          right: 8,
                                          zIndex: 20,
                                        }}
                                      >
                                        <IconTrash size={14} />
                                      </ActionIcon>
                                    </div>
                                    {(mainImage.primary ||
                                      (!productImages.some((img) => img.primary) &&
                                        allImages.length > 0)) && (
                                      <Badge
                                        variant="filled"
                                        color="blue"
                                        size="xs"
                                        className={classes.mainBadge}
                                      >
                                        {t('main')}
                                      </Badge>
                                    )}
                                  </div>
                                ) : (
                                  <Dropzone
                                    onDrop={handleImageUpload}
                                    onReject={handleImageReject}
                                    maxSize={2 * 1024 * 1024}
                                    accept={['image/jpeg', 'image/png', 'image/webp', 'image/gif']}
                                    maxFiles={Math.max(1, 5 - allImages.length)}
                                    className={classes.dropzoneMain}
                                  >
                                    <Stack
                                      align="center"
                                      gap="sm"
                                      className={classes.dropzoneContent}
                                    >
                                      <div className={classes.dropzoneIcon}>
                                        <Dropzone.Accept>
                                          <IconUpload size={32} stroke={1.5} />
                                        </Dropzone.Accept>
                                        <Dropzone.Reject>
                                          <IconX size={32} stroke={1.5} />
                                        </Dropzone.Reject>
                                        <Dropzone.Idle>
                                          <IconPhoto size={32} stroke={1.5} />
                                        </Dropzone.Idle>
                                      </div>
                                      <div style={{ textAlign: 'center' }}>
                                        <Text size="sm" fw={500}>
                                          {t('addMainImage')}
                                        </Text>
                                        <Text size="xs" c="dimmed">
                                          {t('dragDropOrClick')}
                                        </Text>
                                      </div>
                                    </Stack>
                                  </Dropzone>
                                )
                              })()}
                            </div>
                          </Grid.Col>

                          {/* Additional Images Grid */}
                          <Grid.Col span={{ base: 12, md: 6 }}>
                            <Grid className={classes.additionalImages}>
                              {Array.from({ length: 4 }, (_, index) => {
                                const additionalImages = getDisplayAdditionalImages()
                                const image = additionalImages[index]

                                return (
                                  <Grid.Col
                                    key={`additional-slot-${index}`}
                                    span={{ base: 4, sm: 6, md: 6 }}
                                  >
                                    <Stack gap="xs">
                                      <div
                                        className={`${classes.imageSlot} ${classes.additionalImageSlot}`}
                                      >
                                        {image ? (
                                          <div
                                            key={`additional-${image.id}`}
                                            className={classes.imageContainer}
                                            onClick={() => handleSetPrimary(image.id || '')}
                                          >
                                            <Image
                                              key={`additional-image-${image.id}`}
                                              src={
                                                (image as any).isPending
                                                  ? image.path
                                                  : generateProductImageUrl(image.path, 'thumbnail')
                                              }
                                              alt={image.name}
                                              className={classes.productImage}
                                              onError={(e) => {
                                                console.error('Image load failed:', {
                                                  imageName: image.name,
                                                  imagePath: image.path,
                                                  imageId: image.id,
                                                })
                                                handleImageDelete(image.id || '')
                                              }}
                                            />
                                            <div className={classes.imageOverlay}>
                                              <Group gap="xs" className={classes.imageActions}>
                                                {/* Overlay content can go here if needed */}
                                              </Group>
                                            </div>

                                            {/* Always visible star button for swapping */}
                                            <ActionIcon
                                              color="blue"
                                              variant="filled"
                                              size="sm"
                                              className={classes.primaryButton}
                                              onClick={() => {
                                                handleSetPrimary(image.id || '')
                                              }}
                                              title={t('setAsMainImage')}
                                              style={{
                                                position: 'absolute',
                                                top: 8,
                                                left: 8,
                                                zIndex: 20,
                                              }}
                                            >
                                              <IconStar size={14} />
                                            </ActionIcon>

                                            {/* Always visible delete button */}
                                            <ActionIcon
                                              color="red"
                                              variant="filled"
                                              size="xs"
                                              className={classes.deleteButton}
                                              onClick={(e) => {
                                                e.stopPropagation()
                                                handleImageDelete(image.id || '')
                                              }}
                                              style={{
                                                position: 'absolute',
                                                top: 8,
                                                right: 8,
                                                zIndex: 20,
                                              }}
                                            >
                                              <IconTrash size={12} />
                                            </ActionIcon>
                                            {image.primary && (
                                              <Badge
                                                variant="filled"
                                                color="blue"
                                                size="xs"
                                                className={classes.primaryBadge}
                                                leftSection={<IconStar size={8} />}
                                              >
                                                {t('main')}
                                              </Badge>
                                            )}
                                          </div>
                                        ) : (
                                          <Dropzone
                                            onDrop={handleImageUpload}
                                            onReject={handleImageReject}
                                            maxSize={2 * 1024 * 1024}
                                            accept={[
                                              'image/jpeg',
                                              'image/png',
                                              'image/webp',
                                              'image/gif',
                                            ]}
                                            maxFiles={Math.max(1, 5 - allImages.length)}
                                            className={classes.dropzoneAdditional}
                                            disabled={allImages.length >= 5}
                                          >
                                            <div className={classes.dropzoneContentSmall}>
                                              <Dropzone.Accept>
                                                <IconUpload size={16} stroke={1.5} />
                                              </Dropzone.Accept>
                                              <Dropzone.Reject>
                                                <IconX size={16} stroke={1.5} />
                                              </Dropzone.Reject>
                                              <Dropzone.Idle>
                                                <IconPhoto
                                                  size={16}
                                                  stroke={1.5}
                                                  color={
                                                    allImages.length === 0
                                                      ? 'var(--mantine-color-gray-5)'
                                                      : 'currentColor'
                                                  }
                                                />
                                              </Dropzone.Idle>
                                            </div>
                                          </Dropzone>
                                        )}
                                      </div>
                                    </Stack>
                                  </Grid.Col>
                                )
                              })}
                            </Grid>
                          </Grid.Col>
                        </Grid>
                      </Stack>
                    </Grid.Col>
                  </Grid>
                </Tabs.Panel>

                <Tabs.Panel value="stockMovements">
                  <Grid>
                    <Grid.Col>
                      <Container mt="md" size="responsive" className={classes.container} p={15}>
                        <Stack gap={0} w="100%">
                          <MantineTitle order={5} mb={10} pb={10} className={classes.title}>
                            {t('overview')}
                          </MantineTitle>

                          <Group justify="space-between">
                            <Stack gap={5} w="45%">
                              <Group gap={10} justify="space-between">
                                <Text>{t('itemName')}</Text>
                                <Text>{product.name}</Text>
                              </Group>
                              <Group gap={10} justify="space-between">
                                <Text>{t('openingStock')}</Text>
                                <Text>{product.openingStock}</Text>
                              </Group>
                              <Group gap={10} justify="space-between">
                                <Text>{t('reorderPoint')}</Text>
                                <Text>{product.reorderPoint}</Text>
                              </Group>
                            </Stack>

                            <Divider orientation="vertical" />

                            <Stack gap={5} w="45%">
                              <Group gap={10} justify="space-between">
                                <Text>{t('quantityToBeInvoiced')}</Text>
                                <Text>{quantityToBeInvoiced}</Text>
                              </Group>
                              <Group gap={10} justify="space-between">
                                <Text>{t('quantityToBeReceived')}</Text>
                                <Text>{quantityToBeReceived}</Text>
                              </Group>
                              <Group gap={10} justify="space-between">
                                <Text>{t('quantityToBeBilled')}</Text>
                                <Text>{quantityToBilled}</Text>
                              </Group>
                            </Stack>
                          </Group>
                        </Stack>
                      </Container>
                    </Grid.Col>

                    <Grid.Col>
                      <Container mt="md" size="responsive" className={classes.container} p={15}>
                        <Stack gap={0} w="100%">
                          <Group justify="space-between">
                            <Stack gap={5} w="45%">
                              <MantineTitle order={5} mb={10} pb={10} className={classes.title}>
                                {t('physicalStock')}
                              </MantineTitle>
                              <Group gap={10} justify="space-between">
                                <Text>{t('stockOnHand')}</Text>
                                <Text>{physicalStockOnHand}</Text>
                              </Group>
                              <Group gap={10} justify="space-between">
                                <Text>{t('committedStock')}</Text>
                                <Text>{physicalCommittedStock}</Text>
                              </Group>
                              <Group gap={10} justify="space-between">
                                <Text>{t('availableStockForSale')}</Text>
                                <Text>{physicalAvailableStockForSale}</Text>
                              </Group>
                            </Stack>

                            <Divider orientation="vertical" />

                            <Stack gap={5} w="45%">
                              <MantineTitle order={5} mb={10} pb={10} className={classes.title}>
                                {t('accountingStock')}
                              </MantineTitle>
                              <Group gap={10} justify="space-between">
                                <Text>{t('stockOnHand')}</Text>
                                <Text>{accountingStockOnHand}</Text>
                              </Group>
                              <Group gap={10} justify="space-between">
                                <Text>{t('committedStock')}</Text>
                                <Text>{accountingCommittedStock}</Text>
                              </Group>
                              <Group gap={10} justify="space-between">
                                <Text>{t('availableStockForSale')}</Text>
                                <Text>{accountingAvailableStockForSale}</Text>
                              </Group>
                            </Stack>
                          </Group>
                        </Stack>
                      </Container>
                    </Grid.Col>
                  </Grid>
                </Tabs.Panel>
                <Tabs.Panel value="inventoryAdjustments">
                  <Table verticalSpacing="xs" highlightOnHover withTableBorder striped mt={35}>
                    <Table.Thead fz={12}>
                      <Table.Tr>
                        <Table.Th>{t('dateHeader')}</Table.Th>
                        <Table.Th>{t('referenceHeader')}</Table.Th>
                        <Table.Th>{t('reasonHeader')}</Table.Th>
                        <Table.Th>{t('siteHeader')}</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {stockAdjusmentsRows.length > 0 ? (
                        stockAdjusmentsRows
                      ) : (
                        <Table.Tr>
                          <Table.Td colSpan={7} align="center">
                            <Text size="sm" c="dimmed">
                              {t('noStockAdjustmentsFound')}
                            </Text>
                          </Table.Td>
                        </Table.Tr>
                      )}
                    </Table.Tbody>
                  </Table>
                </Tabs.Panel>
                <Tabs.Panel value="salesOrders">
                  <Table verticalSpacing="xs" highlightOnHover withTableBorder striped mt={35}>
                    <Table.Thead fz={12}>
                      <Table.Tr>
                        <Table.Th>{t('dateHeader')}</Table.Th>
                        <Table.Th>{t('salesOrderHeader')}</Table.Th>
                        <Table.Th>{t('customerNameHeader')}</Table.Th>
                        <Table.Th>{t('orderStatusHeader')}</Table.Th>
                        <Table.Th>{t('amountHeader')}</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {salesOrdeRows.length > 0 ? (
                        salesOrdeRows
                      ) : (
                        <Table.Tr>
                          <Table.Td colSpan={7} align="center">
                            <Text size="sm" c="dimmed">
                              {t('noSalesOrdersFound')}
                            </Text>
                          </Table.Td>
                        </Table.Tr>
                      )}
                    </Table.Tbody>
                  </Table>
                </Tabs.Panel>
                <Tabs.Panel value="purchaseOrders">
                  <Table verticalSpacing="xs" highlightOnHover withTableBorder striped mt={35}>
                    <Table.Thead fz={12}>
                      <Table.Tr>
                        <Table.Th>{t('dateHeader')}</Table.Th>
                        <Table.Th>{t('purchaseOrderHeader')}</Table.Th>
                        <Table.Th>{t('supplierNameHeader')}</Table.Th>
                        <Table.Th>{t('orderStatusHeader')}</Table.Th>
                        <Table.Th>{t('amountHeader')}</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {purchaseOrdeRows.length > 0 ? (
                        purchaseOrdeRows
                      ) : (
                        <Table.Tr>
                          <Table.Td colSpan={7} align="center">
                            <Text size="sm" c="dimmed">
                              {t('noPurchaseOrdersFound')}
                            </Text>
                          </Table.Td>
                        </Table.Tr>
                      )}
                    </Table.Tbody>
                  </Table>
                </Tabs.Panel>
              </Tabs>
            </Grid.Col>
          </Form>
        </Grid.Col>
      </Grid>

      {/* Image Delete Confirmation Modal */}
      <Modal
        opened={deleteModalOpened}
        onClose={closeDeleteModal}
        title={t('confirmDeleteImage')}
        centered
        size="lg"
        overlayProps={{
          backgroundOpacity: 0.8,
        }}
        padding="md"
      >
        <Stack gap="lg">
          <Text>
            {t('confirmDeleteImageMessage')} <strong>"{imageToDelete?.name}"</strong>?
          </Text>
          <Text size="sm" c="dimmed">
            {t('thisActionCannotBeUndone')}
          </Text>
          <Group justify="flex-end" gap="sm">
            <Button variant="default" onClick={closeDeleteModal}>
              {t('cancel')}
            </Button>
            <Button color="red" onClick={confirmImageDelete}>
              {t('delete')}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  )
}
