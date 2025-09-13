import { z } from "zod"
import { ATTRIBUTE_TYPES } from "../constants"

const literalSchema = z.union([z.string(), z.number(), z.boolean(), z.null()])
type Literal = z.infer<typeof literalSchema>
type Json = Literal | { [key: string]: Json } | Json[]
const jsonSchema: z.ZodType<Json> = z.lazy(() =>
  z.union([literalSchema, z.array(jsonSchema), z.record(jsonSchema)])
)

export const attributeSchema = z.object({
  id: z.string().optional(),
  type: z.nativeEnum(ATTRIBUTE_TYPES),
  productId: z.string().optional(),
  fields: z.array(jsonSchema.optional()),
})

export type IAttribute = z.infer<typeof attributeSchema>
