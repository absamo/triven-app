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
import { uploadToImagekit } from '~/app/lib/imagekit'
import ProductForm from '~/app/pages/Products/ProductForm'
import { getAgencies } from '~/app/services/agencies.server'
import { requireBetterAuthUser } from '~/app/services/better-auth.server'
import { getCategories } from '~/app/services/categories.server'
import { checkProductNameExists, createProduct } from '~/app/services/products.server'
import { getSuppliers } from '~/app/services/suppliers.server'
import type { Route } from './+types/products.create'

type LoaderData = typeof loader

export const loader: LoaderFunction = async ({ request }: LoaderFunctionArgs) => {
  const user = await requireBetterAuthUser(request, ['create:products'])

  const product = {
    id: '',
    name: '',
    categoryId: '',
    agencyId: user.agencyId,
    siteId: user.siteId,
    description: '',
    costPrice: 0,
    sellingPrice: 0,
    brand: '',
    quantity: '',
    reorderPoint: 0,
    safetyStockLevel: 0,
    barcode: '',
    attributeTypes: [],
    attributes: [],
    openingStock: 0,
    unit: 'Pieces' as const,
    availableQuantity: 0,
    adjustedQuantity: 0,
    openingValue: 0,
    active: true,
    status: 'Available' as const,
    salesOrderItems: [],
    purchaseOrderItems: [],
  }

  const categories = await getCategories(request)
  const suppliers = await getSuppliers(request)
  const agencies = (await getAgencies(request)) as IAgency[]
  const sites = agencies?.find((agency: IAgency) => agency.id === user.agencyId)?.sites || []
  const currency = user?.company?.currencies?.find((currency) => currency.base)

  return {
    product,
    categories,
    suppliers,
    sites,
    agencies,
    currency,
    salesOrders: [],
    purchaseOrders: [],
    stockAdjustments: [],
  }
}

export const action: ActionFunction = async ({ request }: ActionFunctionArgs) => {
  const user = await requireBetterAuthUser(request)

  const formData = await request.formData()

  const name = formData.get('name') as IProduct['name']
  const description = formData.get('description') as IProduct['description']
  const costPrice = JSON.parse(formData.get('costPrice') as string) as IProduct['costPrice']
  const sellingPrice = JSON.parse(
    formData.get('sellingPrice') as string
  ) as IProduct['sellingPrice']
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
  const openingValue = JSON.parse(
    formData.get('openingValue') as string
  ) as IProduct['openingValue']
  const adjustedQuantity = JSON.parse(
    formData.get('adjustedQuantity') as string
  ) as IProduct['adjustedQuantity']
  const availableQuantity = JSON.parse(
    formData.get('availableQuantity') as string
  ) as IProduct['availableQuantity']

  // Check if product name already exists
  const nameExists = await checkProductNameExists(request, name)
  if (nameExists) {
    return {
      errors: {
        name: 'A product with this name already exists. Please choose a different name.',
      },
    }
  }

  // Handle image uploads
  const imageFiles = formData.getAll('imageFiles') as File[]
  const uploadedImages = []

  // Upload new image files to ImageKit
  for (let i = 0; i < imageFiles.length; i++) {
    const file = imageFiles[i]
    if (file && file.size > 0) {
      try {
        const buffer = Buffer.from(await file.arrayBuffer())
        const uploadResult = await uploadToImagekit(buffer, file.name, 'products', [
          'product',
          name.replace(/\s+/g, '_'),
        ])

        if (uploadResult.success && uploadResult.data) {
          // Check if this image should be primary
          const isPrimary: boolean =
            formData.get(`imagePrimary_${i}`) === 'true' || (i === 0 && uploadedImages.length === 0) // First image is primary by default

          uploadedImages.push({
            name: uploadResult.data.name,
            path: uploadResult.data.filePath,
            imagekitId: uploadResult.data.fileId,
            type: 'image',
            primary: isPrimary,
          })
        } else {
          console.error(`Failed to upload ${file.name}:`, uploadResult.error)
        }
      } catch (error) {
        console.error(`Error uploading image ${file.name}:`, error)
      }
    }
  }

  // Create the product with uploaded images
  return await createProduct(request, {
    name,
    description,
    active: true,
    costPrice,
    sellingPrice,
    categoryId,
    barcode,
    reorderPoint,
    safetyStockLevel,
    status,
    siteId,
    agencyId,
    openingStock,
    openingValue,
    unit,
    adjustedQuantity,
    availableQuantity,
    images: uploadedImages,
  } as IProduct)
}

export default function CreateProductsRoute({ loaderData, actionData }: Route.ComponentProps) {
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
  )
}
