import { z } from 'zod'

// Schema for form validation (client-side with Date objects)
export const demoRequestFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  workEmail: z.string().email('Invalid email address').min(1, 'Work email is required'),
  companyName: z
    .string()
    .min(1, 'Company name is required')
    .max(100, 'Company name must be less than 100 characters'),
  phoneNumber: z
    .string()
    .min(1, 'Phone number is required')
    .max(20, 'Phone number must be less than 20 characters'),
  companySize: z.enum(['1-10', '11-50', '51-200', '201-500', '501+'], {
    errorMap: () => ({ message: 'Please select your company size' }),
  }),
  preferredDate: z
    .union([z.date(), z.string()])
    .transform((val) => {
      if (typeof val === 'string') {
        const date = new Date(val)
        return isNaN(date.getTime()) ? null : date
      }
      return val
    })
    .nullable()
    .refine((date) => date !== null, {
      message: 'Please select your preferred demo date',
    }),
  preferredTime: z.string().min(1, 'Please select your preferred demo time'),
  timezone: z.string().min(1, 'Timezone is required'),
  message: z.string().optional(),
  submittedAt: z.date().optional(),
})

// Schema for API validation (server-side with date strings)
export const demoRequestSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  workEmail: z.string().email('Invalid email address').min(1, 'Work email is required'),
  companyName: z
    .string()
    .min(1, 'Company name is required')
    .max(100, 'Company name must be less than 100 characters'),
  phoneNumber: z
    .string()
    .min(1, 'Phone number is required')
    .max(20, 'Phone number must be less than 20 characters'),
  companySize: z.enum(['1-10', '11-50', '51-200', '201-500', '501+'], {
    errorMap: () => ({ message: 'Please select your company size' }),
  }),
  preferredDate: z
    .union([z.date(), z.string().datetime()])
    .transform((val) => {
      if (typeof val === 'string') {
        return new Date(val)
      }
      return val
    })
    .refine(
      (date) => {
        return date instanceof Date && !isNaN(date.getTime())
      },
      {
        message: 'Please select a valid date',
      }
    ),
  preferredTime: z.string().min(1, 'Please select your preferred demo time'),
  timezone: z.string().min(1, 'Timezone is required'),
  message: z.string().optional(),
  submittedAt: z.date().optional(),
})

export type IDemoRequest = z.infer<typeof demoRequestFormSchema>
