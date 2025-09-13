import { z } from "zod"

export const assetSchema = z.object({
    id: z.string().optional(),
    name: z.string(),
    path: z.string(),
    type: z.string().default("image"),
    productId: z.string().optional(),
    primary: z.boolean().default(false),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
})

export type IAsset = z.infer<typeof assetSchema>
