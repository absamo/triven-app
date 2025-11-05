/**
 * Category Management Tools
 *
 * Implements 3 Mastra tools for category operations:
 * 1. listCategories - Get all product categories
 * 2. createCategory - Create a new category
 * 3. updateCategory - Update category details
 *
 * Based on plan.md User Story 2: Category Management
 */

import { z } from 'zod'
import { prisma } from '../../db.server'
import { formatError, formatKeyValue, formatSuccess, formatTable } from './tool-formatters'

/**
 * Tool 1: List Categories
 * Retrieves all categories with product counts
 */
export const listCategories = {
  description:
    'Get a list of all product categories in the system. Shows category names, descriptions, and how many products are in each category. Use this to help users browse the catalog structure.',
  parameters: z.object({
    limit: z
      .number()
      .int()
      .positive()
      .optional()
      .describe('Maximum number of categories to return (default: 50)'),
    includeInactive: z
      .boolean()
      .optional()
      .describe('Include inactive categories (default: false)'),
  }),
  execute: async ({
    limit = 50,
    includeInactive = false,
  }: {
    limit?: number
    includeInactive?: boolean
  }) => {
    try {
      const categories = await prisma.category.findMany({
        where: includeInactive ? {} : { active: true },
        include: {
          _count: {
            select: { products: true },
          },
        },
        orderBy: { name: 'asc' },
        take: limit,
      })

      if (categories.length === 0) {
        return {
          success: true,
          message: 'No categories found.',
          categories: [],
          total: 0,
        }
      }

      // Format as table
      const tableData = categories.map((cat) => [
        cat.name,
        cat.description || 'N/A',
        cat._count.products.toString(),
        cat.active ? '✓' : '✗',
      ])

      const table = formatTable(['Category', 'Description', 'Products', 'Active'], tableData)

      return {
        success: true,
        message: `Found ${categories.length} categories\n\n${table}`,
        categories: categories.map((cat) => ({
          id: cat.id,
          name: cat.name,
          description: cat.description,
          productCount: cat._count.products,
          active: cat.active,
        })),
        total: categories.length,
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      return {
        success: false,
        message: formatError(`Failed to list categories: ${errorMessage}`),
        error: errorMessage,
      }
    }
  },
}

/**
 * Tool 2: Create Category
 * Creates a new product category
 */
export const createCategory = {
  description:
    'Create a new product category in the system. Use this to organize products into logical groups for easier management and browsing.',
  parameters: z.object({
    name: z.string().min(1).describe('Category name'),
    description: z.string().optional().describe('Category description'),
    active: z.boolean().optional().describe('Whether the category is active (default: true)'),
  }),
  execute: async ({
    name,
    description,
    active = true,
  }: {
    name: string
    description?: string
    active?: boolean
  }) => {
    try {
      // TODO: Get user context from runtime
      const companyId = 'default-company'

      // Check if category with same name exists
      const existing = await prisma.category.findFirst({
        where: { name, companyId },
      })

      if (existing) {
        return {
          success: false,
          message: formatError(`Category "${name}" already exists`),
          error: 'Duplicate category name',
        }
      }

      // Create category
      const category = await prisma.category.create({
        data: {
          name,
          description,
          active,
          companyId,
        },
      })

      return {
        success: true,
        message: `${formatSuccess(`Category created: ${category.name}`)}\n\n${formatKeyValue({
          Name: category.name,
          Description: category.description || 'N/A',
          Status: category.active ? 'Active' : 'Inactive',
        })}`,
        category: {
          id: category.id,
          name: category.name,
          description: category.description,
          active: category.active,
        },
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      return {
        success: false,
        message: formatError(`Failed to create category: ${errorMessage}`),
        error: errorMessage,
      }
    }
  },
}

/**
 * Tool 3: Update Category
 * Updates an existing category
 */
export const updateCategory = {
  description:
    'Update an existing product category. Use this to change category names, descriptions, or active status.',
  parameters: z.object({
    categoryId: z.string().describe('The unique ID of the category to update'),
    name: z.string().min(1).optional().describe('New category name'),
    description: z.string().optional().describe('New category description'),
    active: z.boolean().optional().describe('Set category active/inactive status'),
  }),
  execute: async ({
    categoryId,
    name,
    description,
    active,
  }: {
    categoryId: string
    name?: string
    description?: string
    active?: boolean
  }) => {
    try {
      // Find category
      const category = await prisma.category.findUnique({
        where: { id: categoryId },
        include: {
          _count: {
            select: { products: true },
          },
        },
      })

      if (!category) {
        return {
          success: false,
          message: formatError('Category not found'),
          error: 'Category not found',
        }
      }

      // Check if new name conflicts with existing category
      if (name && name !== category.name) {
        const existing = await prisma.category.findFirst({
          where: {
            name,
            companyId: category.companyId,
            id: { not: categoryId },
          },
        })

        if (existing) {
          return {
            success: false,
            message: formatError(`Category "${name}" already exists`),
            error: 'Duplicate category name',
          }
        }
      }

      // Prepare update data
      const updateData: Record<string, unknown> = {}
      if (name !== undefined) updateData.name = name
      if (description !== undefined) updateData.description = description
      if (active !== undefined) updateData.active = active

      // Update category
      const updatedCategory = await prisma.category.update({
        where: { id: categoryId },
        data: updateData,
      })

      const changes: Record<string, string> = {
        Category: updatedCategory.name,
        'Product Count': category._count.products.toString(),
      }

      if (name) changes['Name Updated'] = name
      if (description !== undefined) changes['Description'] = description || 'Removed'
      if (active !== undefined) changes['Status'] = active ? 'Active' : 'Inactive'

      return {
        success: true,
        message: `${formatSuccess('Category updated')}\n\n${formatKeyValue(changes)}`,
        category: {
          id: updatedCategory.id,
          name: updatedCategory.name,
          description: updatedCategory.description,
          active: updatedCategory.active,
        },
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      return {
        success: false,
        message: formatError(`Failed to update category: ${errorMessage}`),
        error: errorMessage,
      }
    }
  },
}

// Export only read-only category tools
export const categoryTools = {
  listCategories,
}

// Write operations kept internal for future use (not exported)
// const categoryWriteTools = {
//   createCategory,
//   updateCategory,
// }
