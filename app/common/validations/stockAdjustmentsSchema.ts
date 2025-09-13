import { z } from "zod"

import { ADJUSTMENT_REASONS } from "../constants"
import { productSchema } from "./productSchema"
import { siteSchema } from "./siteSchema"
// import { adjustedQuantitySchema } from "./adjustedQuantitySchema"
// import dayjs from "dayjs"

export const stockAdjustmentSchema = z.object({
  id: z.string().optional(),
  // date: z.coerce.date().refine(
  //   (input) => {
  //     return input
  //   },
  //   {
  //     message: "Date is required",
  //   }
  // ),
  date: z.coerce.date(),
  reason: z.nativeEnum(ADJUSTMENT_REASONS, {
    errorMap: () => ({
      message: "Adjustment reason is required",
    }),
  }),
  reference: z.string().min(1, "Reference is required"),
  notes: z.string().optional(),
  //  product: productSchema?.optional(),
  site: z.lazy(() => siteSchema).optional(),
  siteId: z.string().min(1, "Site is required"),
  products: z
    .preprocess((products) => {
      if (typeof products === "string") {
        return JSON.parse(products)
      }
      return products
    }, z.array(z.lazy(() => productSchema)))
    .optional(),

  // adjustedQuantities: z
  //   .preprocess((adjustedQuantities) => {
  //     if (typeof adjustedQuantities === "string") {
  //       return JSON.parse(adjustedQuantities)
  //     }
  //     return adjustedQuantities
  //   }, z.array(adjustedQuantitySchema).optional())
  //   .optional(),
})

export type IStockAdjustment = z.infer<typeof stockAdjustmentSchema>
