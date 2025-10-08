import { z } from 'zod'
import { getBoolean } from '~/app/common/helpers/validation'
import { ATTRIBUTE_TYPES } from '~/app/common/constants'

export const categorySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Category name is required'),
  description: z.string().optional(),
  active: z.preprocess((val) => getBoolean(val), z.boolean()).optional(),
  allowedAttributeTypes: z
    .preprocess(
      (selection) => {
        if (typeof selection === 'string') {
          return JSON.parse(selection)
        }
        return selection
      },
      z
        .nativeEnum(
          ATTRIBUTE_TYPES
          //   , {
          //   errorMap: () => ({
          //     message: "At least one attribute type is required",
          //   }),
          // }
        )
        .array()
      // .min(1)
    )
    .optional(),
})

export type ICategory = z.infer<typeof categorySchema>
