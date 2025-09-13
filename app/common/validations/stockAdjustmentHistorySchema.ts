import { z } from "zod"
import { userSchema } from "./userSchema"

export const stockAdjustmentHistorySchema = z.object({
  id: z.string().optional(),
  openingStock: z.number().optional(),
  stockOnHand: z.number().optional(),
  adjustedQuantity: z.number().optional(),
  productId: z.string().optional(),
  stockAdjustmentId: z.string().optional(),
  createdById: z.string().optional(),
  createdBy: z.lazy(() => userSchema.omit({ password: true })).optional(),
  createdAt: z.coerce.date().optional(),
  reference: z.string().optional(),
})

export type IStockAdjustmentHistory = z.infer<
  typeof stockAdjustmentHistorySchema
>
