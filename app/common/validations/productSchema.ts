import { z } from 'zod'

import { getBoolean } from '~/app/common/helpers/validation'
import { ATTRIBUTE_TYPES, PRODUCT_STATUSES, PRODUCT_UNITS } from '../constants'
import { isEan13 } from '../helpers/inventories'
import { agencySchema } from './agencySchema'
import { assetSchema } from './assetSchema'
import { attributeSchema } from './attributeSchema'
import { categorySchema } from './categorySchema'
import { siteSchema } from './siteSchema'
import { stockAdjustmentHistorySchema } from './stockAdjustmentHistorySchema'
import { supplierSchema } from './supplierSchema'

export const productSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, { message: 'Product name is required' }),
  costPrice: z.preprocess(
    (input) => (input === '' ? parseFloat(z.string().parse(input)) : input),
    z.coerce
      .number({
        invalid_type_error: 'Cost price is required',
      })
      .refine((input) => input >= 0, {
        message: 'cannot be negative',
      })
  ),
  sellingPrice: z.preprocess(
    (input) => (input === '' ? parseFloat(z.string().parse(input)) : input),
    z.coerce
      .number({
        invalid_type_error: 'Selling price is required',
      })
      .refine((input) => input >= 0, {
        message: 'Selling price cannot be negative',
      })
  ),
  description: z.string().optional(),
  sku: z.string().optional().nullable(),
  brand: z.string().max(100).optional().nullable(),
  images: z.array(z.lazy(() => assetSchema)).optional(),
  categoryId: z.string().min(1, { message: 'Category name is required' }),
  subcategoryId: z.string().optional(),
  active: z.preprocess((val) => getBoolean(val), z.boolean()),
  category: z.lazy(() => categorySchema).optional(),
  attributeTypes: z
    .preprocess((selection) => {
      if (typeof selection === 'string') {
        return JSON.parse(selection)
      }
      return selection
    }, z.nativeEnum(ATTRIBUTE_TYPES).array())
    .optional(),
  attributes: z
    .preprocess((attributes) => {
      if (typeof attributes === 'string') {
        return JSON.parse(attributes)
      }
      return attributes
    }, z.array(z.array(z.lazy(() => attributeSchema))).optional())
    .optional(),
  suppliers: z
    .preprocess((suppliers) => {
      if (typeof suppliers === 'string') {
        return JSON.parse(suppliers)
      }
      return suppliers
    }, z.array(supplierSchema).optional())
    .optional(),
  reorderPoint: z.preprocess(
    (input) => (input === '' ? parseInt(z.string().parse(input), 10) : input),
    z.coerce
      .number({
        invalid_type_error: 'ReorderPoint is required',
      })
      .refine((input) => input >= 0, {
        message: 'Reorder Point cannot be negative',
      })
  ),
  safetyStockLevel: z.preprocess(
    (input) => (input === '' ? parseInt(z.string().parse(input), 10) : input),
    z.coerce
      .number({
        invalid_type_error: 'Safety stock Level is required',
      })
      .refine((input) => input >= 0, {
        message: 'Safety stock Level cannot be negative',
      })
  ),
  barcode: z
    .string()
    .min(1, 'Barcode is required')
    // when the barcode is empty we want to trigger the min function
    .refine((input) => (input === '' ? true : isEan13(input)), {
      message: 'Barcode is invalid or not supported',
    }),
  openingStock: z.preprocess(
    (input) => (input === '' ? parseInt(z.string().parse(input), 10) : input),
    z.coerce
      .number({
        invalid_type_error: 'Opening Stock is required',
      })
      .refine((input) => input >= 0, {
        message: 'Initial Stock cannot be negative',
      })
  ),
  openingValue: z.number().optional(),
  // adjustedAvailableQuantity: z.coerce.number(),

  adjustedQuantity: z.coerce.number().optional(),
  availableQuantity: z.coerce.number().optional(),
  // stockOnHand: z.preprocess(
  //   (input) => (input === "" ? parseInt(z.string().parse(input), 10) : input),
  //   z.coerce
  //     .number({
  //       invalid_type_error: "Stock on hand is required",
  //     })
  //     .refine((input) => input >= 0, {
  //       message: "Stock on hand cannot be negative",
  //     })
  // ),
  physicalStockOnHand: z.coerce.number().optional(),
  accountingStockOnHand: z.coerce.number().optional(),
  // quantityAjusted: z.number().optional(),
  status: z
    .nativeEnum(PRODUCT_STATUSES, {
      errorMap: () => ({
        message: 'Product status is required',
      }),
    })
    .optional(),
  siteId: z.string().min(1, 'Site is required'),
  agencyId: z.string().min(1, 'Agency is required'),
  unit: z.nativeEnum(PRODUCT_UNITS, {
    errorMap: () => ({
      message: 'Product unit is required',
    }),
  }),

  stockAdjustmentHistories: z
    .preprocess((stockAdjustmentHistories) => {
      if (typeof stockAdjustmentHistories === 'string') {
        return JSON.parse(stockAdjustmentHistories)
      }
      return stockAdjustmentHistories
    }, z.array(z.lazy(() => stockAdjustmentHistorySchema)).optional())
    .optional(),
  site: z.lazy(() => siteSchema).optional(),
  agency: z.lazy(() => agencySchema).optional(),
})

export type IProduct = z.infer<typeof productSchema>
