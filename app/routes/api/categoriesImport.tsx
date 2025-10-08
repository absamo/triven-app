import type { ActionFunction } from 'react-router'
import { requireBetterAuthUser } from '~/app/services/better-auth.server'
import { createCategory, getCategories } from '~/app/services/categories.server'
import { emitter } from '~/app/utils/emitter.server'

export const action: ActionFunction = async ({ request }) => {
  // Ensure user has permission to create categories
  const user = await requireBetterAuthUser(request, ['create:categories'])

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Read the CSV file
    const fileText = await file.text()
    const lines = fileText.split('\n')

    if (lines.length < 2) {
      return new Response(
        JSON.stringify({ error: 'CSV file must contain at least a header row and one data row' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Parse CSV headers
    const headers = lines[0].split(',').map((h) => h.trim().replace(/"/g, ''))

    // Validate required headers
    if (!headers.includes('name')) {
      return new Response(JSON.stringify({ error: 'CSV file must contain a "name" column' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Get existing categories to check for duplicates
    const existingCategories = await getCategories(request)
    const existingCategoryNames = new Set(
      existingCategories.map((c: any) => c.name.toLowerCase().trim())
    )

    const results = {
      success: 0,
      errors: [] as string[],
      warnings: [] as string[],
      total: 0,
      categories: [] as any[],
    }

    // Process each data row
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue // Skip empty lines

      results.total++

      try {
        // Parse CSV row
        const values = line.split(',').map((v) => v.trim().replace(/"/g, ''))
        const row: Record<string, string> = {}

        headers.forEach((header, index) => {
          row[header] = values[index] || ''
        })

        // Collect all validation errors for this row
        const rowErrors: string[] = []

        // Validate required fields
        if (!row.name) {
          rowErrors.push(`Missing required field: name`)
        }

        // Check for duplicate category names
        const categoryNameLower = row.name ? row.name.toLowerCase().trim() : ''
        if (categoryNameLower && existingCategoryNames.has(categoryNameLower)) {
          rowErrors.push(`Category "${row.name}" already exists in your system`)
        }

        // If there are validation errors, add them to results and skip this row
        if (rowErrors.length > 0) {
          rowErrors.forEach((error) => {
            results.errors.push(`Row ${i}: ${error}`)
          })
          continue
        }

        // Add to existing category names to prevent duplicates within the same import
        if (categoryNameLower) {
          existingCategoryNames.add(categoryNameLower)
        }

        // Create category data
        const categoryData = {
          name: row.name,
          description: row.description || '',
        }

        // Create the category
        const createdCategory = await createCategory(request, categoryData)

        // Ensure we have the category data in the response
        const categoryForResponse = {
          id:
            createdCategory && typeof createdCategory === 'object' && 'id' in createdCategory
              ? createdCategory.id
              : undefined,
          name: categoryData.name, // Use the original name from the CSV
        }

        results.categories.push(categoryForResponse)
        results.success++
      } catch (error) {
        results.errors.push(`Row ${i}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    // Emit dashboard update event for bulk category import
    if (results.success > 0) {
      emitter.emit('dashboard-updates', {
        action: 'bulk_categories_imported',
        categoryCount: results.success,
        totalProcessed: results.total,
        timestamp: Date.now(),
        companyId: user.companyId,
      })
    }

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error importing categories:', error)
    return new Response(
      JSON.stringify({
        error: 'Failed to import categories',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}
