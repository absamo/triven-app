import { type FileUpload, parseFormData } from '@remix-run/form-data-parser'
import type {
  ActionFunction,
  ActionFunctionArgs,
  LoaderFunction,
  LoaderFunctionArgs,
} from 'react-router'

import type { IAgency } from '~/app/common/validations/agencySchema'
import type { ICategory } from '~/app/common/validations/categorySchema'
import type { ICurrency } from '~/app/common/validations/currencySchema'
import type { IInvoice } from '~/app/common/validations/invoiceSchema'
import type { IProduct } from '~/app/common/validations/productSchema'
import type { IPurchaseOrderItem } from '~/app/common/validations/purchaseOrderItemSchema'
import type { IPurchaseOrder } from '~/app/common/validations/purchaseOrderSchema'
import type { IPurchaseReceiveItem } from '~/app/common/validations/purchaseReceiveItemSchema'
import type { ISalesOrderItem } from '~/app/common/validations/salesOrderItemSchema'
import type { ISalesOrder } from '~/app/common/validations/salesOrderSchema'
import type { ISite } from '~/app/common/validations/siteSchema'
import type { IStockAdjustment } from '~/app/common/validations/stockAdjustmentsSchema'
import type { ISupplier } from '~/app/common/validations/supplierSchema'
import { Notification } from '~/app/components'
import { uploadToImagekit } from '~/app/lib/imagekit'
import ProductForm from '~/app/pages/Products/ProductForm'
import { getAgencies } from '~/app/services/agencies.server'
import { requireBetterAuthUser } from '~/app/services/better-auth.server'
import { getCategories } from '~/app/services/categories.server'
import { checkProductNameExists, getProduct, updateProduct } from '~/app/services/products.server'
import { getPurchaseOrdersByProductId } from '~/app/services/purchases.server'
import { getSalesOrdersByProductId } from '~/app/services/sales.server'
import { getStockAdjustmentsByProductId } from '~/app/services/stockAdjustment.server'
import type { Route } from './+types/products.edit'

export const loader: LoaderFunction = async ({ request, params }: LoaderFunctionArgs) => {
  const user = await requireBetterAuthUser(request, ['update:products'])

  const product = await getProduct(request, params.id)
  const categories = await getCategories(request)
  const agencies = (await getAgencies(request)) as IAgency[]
  const sites = agencies?.find((agency: IAgency) => agency.id === user.agencyId)?.sites || []
  const currency = user?.company?.currencies?.find((currency) => currency.base)
  const salesOrders = await getSalesOrdersByProductId(request, params.id)
  const purchaseOrders = await getPurchaseOrdersByProductId(request, params.id)
  const stockAdjustments = await getStockAdjustmentsByProductId(request, params.id)

  return {
    product,
    categories,
    sites,
    agencies,
    currency,
    salesOrders,
    purchaseOrders,
    stockAdjustments,
  }
}

export const action: ActionFunction = async ({ request, params }: ActionFunctionArgs) => {
  // Store uploaded images for later use
  const uploadedImages: any[] = []

  // Handle file uploads using parseFormData
  const uploadHandler = async (fileUpload: FileUpload) => {
    if (fileUpload.fieldName === 'imageFiles') {
      try {
        // Read the stream properly
        const chunks: Uint8Array[] = []
        const stream = fileUpload.stream()
        const reader = stream.getReader()

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          chunks.push(value)
        }

        // Convert chunks to buffer
        const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0)
        const buffer = new Uint8Array(totalLength)
        let offset = 0
        for (const chunk of chunks) {
          buffer.set(chunk, offset)
          offset += chunk.length
        }

        const uploadResult = await uploadToImagekit(
          Buffer.from(buffer),
          fileUpload.name || 'uploaded-image', // Use original filename
          'products',
          ['product', fileUpload.name?.replace(/\s+/g, '_') || 'image']
        )

        if (uploadResult.success && uploadResult.data) {
          // Store the uploaded image data
          const imageData = {
            name: uploadResult.data.name,
            path: uploadResult.data.filePath, // Store ImageKit file path
            type: 'image',
            primary: false, // Will be set from frontend data
          }
          uploadedImages.push(imageData)

          // Return a File object for the FormData
          return new File([buffer], fileUpload.name || 'uploaded-image', {
            type: fileUpload.type,
          })
        } else {
          return null
        }
      } catch (error) {
        return null
      }
    }
  }

  const formData = await parseFormData(request, uploadHandler)

  const name = formData.get('name') as IProduct['name']

  const description = formData.get('description') as IProduct['description']

  const active = JSON.parse(formData.get('active') as string) as IProduct['active']

  const costPrice = JSON.parse(formData.get('costPrice') as string) as IProduct['costPrice']

  const sellingPrice = JSON.parse(
    formData.get('sellingPrice') as string
  ) as IProduct['sellingPrice']

  const brand = formData.get('brand') as IProduct['brand']

  const sku = formData.get('sku') as IProduct['sku']

  const barcode = formData.get('barcode') as IProduct['barcode']

  const reorderPoint = JSON.parse(
    formData.get('reorderPoint') as string
  ) as IProduct['reorderPoint']

  const safetyStockLevel = JSON.parse(
    formData.get('safetyStockLevel') as string
  ) as IProduct['safetyStockLevel']

  const status = formData.get('status') as IProduct['status']

  const categoryId = formData.get('categoryId') as IProduct['categoryId']

  const siteId = formData.get('siteId') as IProduct['siteId']

  const agencyId = formData.get('agencyId') as IProduct['agencyId']

  const unit = formData.get('unit') as IProduct['unit']

  const openingStock = JSON.parse(
    formData.get('openingStock') as string
  ) as IProduct['openingStock']

  const adjustedQuantity = JSON.parse(
    formData.get('adjustedQuantity') as string
  ) as IProduct['adjustedQuantity']

  const availableQuantity = JSON.parse(
    formData.get('availableQuantity') as string
  ) as IProduct['availableQuantity']

  // Check if product name already exists (excluding current product)
  const nameExists = await checkProductNameExists(request, name, params.id)
  if (nameExists) {
    return {
      errors: {
        name: 'A product with this name already exists. Please choose a different name.',
      },
    }
  }

  // Get images to delete
  const imagesToDelete = JSON.parse((formData.get('imagesToDelete') as string) || '[]')

  // Get complete images array from frontend (includes existing + new with primary status)
  const images = JSON.parse((formData.get('images') as string) || '[]')

  // Apply primary status to newly uploaded images based on frontend data
  uploadedImages.forEach((uploadedImage, index) => {
    // Find corresponding image data from frontend by matching array position
    const frontendImage = images.find((img: any) => !img.id && img.name === uploadedImage.name)
    if (frontendImage) {
      uploadedImage.primary = frontendImage.primary
    }
  })

  // Combine existing images with new uploaded images
  const allImages = [
    // Keep existing images that weren't deleted, with updated primary status
    ...images.filter((img: any) => img.id && !imagesToDelete.includes(img.id)),
    // Add newly uploaded images with primary status
    ...uploadedImages,
  ]

  return await updateProduct(request, {
    id: params.id,
    name,
    description,
    active,
    costPrice,
    sellingPrice,
    brand,
    sku,
    barcode,
    reorderPoint,
    safetyStockLevel,
    status,
    categoryId,
    siteId,
    agencyId,
    unit,
    openingStock,
    adjustedQuantity,
    availableQuantity,
    images: allImages, // Complete images array with primary status
  })
}

export default function EditProductsRoute({ loaderData, actionData }: Route.ComponentProps) {
  const {
    product,
    categories,
    sites,
    agencies,
    currency,
    salesOrders,
    purchaseOrders,
    stockAdjustments,
  } = loaderData as unknown as {
    product: IProduct & {
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
    suppliers: ISupplier[]
    sites: ISite[]
    agencies: IAgency[]
    currency: ICurrency
    salesOrders: ISalesOrder[]
    purchaseOrders: IPurchaseOrder[]
    stockAdjustments: IStockAdjustment[]
  }

  return (
    <>
      <ProductForm
        product={product}
        categories={categories}
        sites={sites}
        agencies={agencies}
        currency={currency}
        salesOrders={salesOrders}
        purchaseOrders={purchaseOrders}
        stockAdjustments={stockAdjustments}
        errors={(actionData as unknown as { errors: Record<string, string> })?.errors}
      />
      {actionData && (
        <Notification
          notification={
            (
              actionData as unknown as {
                notification: {
                  message: string | null
                  status: 'Success' | 'Warning' | 'Error' | null
                  redirectTo?: string | null
                  autoClose?: boolean
                }
              }
            )?.notification
          }
        />
      )}
    </>
  )
}
