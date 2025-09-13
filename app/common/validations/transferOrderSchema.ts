import { string, z } from "zod"
import { TRANSFER_ORDER_REASONS } from "../constants"
import { siteSchema } from "./siteSchema"

export const transferOrderSchema = z.object({
  id: z.string().optional(),
  transferOrderReference: z
    .string()
    .min(1, "Transfer order reference is required"),
  transferOrderDate: z.coerce.date(),
  reason: z.nativeEnum(TRANSFER_ORDER_REASONS, {
    errorMap: () => ({
      message: "Reason is required",
    }),
  }),
  otherReason: z.string().optional(),
  siteFromId: z.string().min(1, "Source site is required"),
  siteToId: z.string().min(1, "Destination site is required"),
  siteFrom: siteSchema.optional(),
  siteTo: siteSchema.optional(),
  transferOrderItems: z
    .array(
      z.object({
        transferOrderId: z.string(),
        quantity: z.number(),
        productId: z.string(),
      })
    )
    .optional(),
  status: z.string().optional(),
})

export type ITransferOrder = z.infer<typeof transferOrderSchema>
