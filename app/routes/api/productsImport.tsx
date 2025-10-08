import type { ActionFunction } from 'react-router'
import { PRODUCT_STATUSES } from '~/app/common/constants'
import { getAgencies } from '~/app/services/agencies.server'
import { requireBetterAuthUser } from '~/app/services/better-auth.server'
import { getCategories } from '~/app/services/categories.server'
import { createProduct, getProducts } from '~/app/services/products.server'
import { getSites } from '~/app/services/sites.server'
import { emitter } from '~/app/utils/emitter.server'

export const action: ActionFunction = async ({ request }) => {
  // Ensure user has permission to create products
  const user = await requireBetterAuthUser(request, ['create:products'])

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

    // Get reference data for validation
    const [categories, sites, agencies] = await Promise.all([
      getCategories(request),
      getSites(request),
      getAgencies(request),
    ])

    // Get existing products to check for duplicates
    const existingProducts = await getProducts(request, { limit: 10000 })
    const existingProductNames = new Set(
      existingProducts.map((p: any) => p.name.toLowerCase().trim())
    )

    const results = {
      success: 0,
      errors: [] as string[],
      warnings: [] as string[],
      total: 0,
      products: [] as any[],
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
        let categoryId: string | undefined

        // Validate required fields
        if (!row.name || !row.sellingPrice) {
          rowErrors.push(`Missing required fields (name, sellingPrice)`)
        }

        // Validate selling price
        if (row.sellingPrice) {
          const priceValue = parseFloat(row.sellingPrice)
          if (isNaN(priceValue) || priceValue <= 0) {
            rowErrors.push(
              `Invalid selling price "${row.sellingPrice}" (must be a positive number)`
            )
          }
        }

        // Check for duplicate product names
        const productNameLower = row.name ? row.name.toLowerCase().trim() : ''
        if (productNameLower && existingProductNames.has(productNameLower)) {
          rowErrors.push(`Product "${row.name}" already exists in your system`)
        }

        // Validate category
        if (row.category && row.category.trim()) {
          if (categories && categories.length > 0) {
            const category = categories.find(
              (c) => c.name.toLowerCase() === row.category.toLowerCase()
            )

            if (!category) {
              const availableCategoriesList = categories.map((c) => `\n• ${c.name}`).join('')
              rowErrors.push(
                `Category "${row.category}" does not exist.\nAvailable categories:${availableCategoriesList}`
              )
            } else {
              categoryId = category.id
            }
          } else {
            // Category specified but no categories exist in the system
            rowErrors.push(
              `Category "${row.category}" specified but no categories exist in your system. Please create categories first.`
            )
          }
        } else {
          // No category specified - use first available category if any exist
          if (categories && categories.length > 0) {
            categoryId = categories[0].id
          } else {
            rowErrors.push(
              `No category specified and no categories exist in your system. Please create at least one category first.`
            )
          }
        }

        // If there are validation errors, add them to results and skip this row
        if (rowErrors.length > 0) {
          rowErrors.forEach((error) => {
            results.errors.push(`Row ${i}: ${error}`)
          })
          continue
        }

        // Add to existing product names to prevent duplicates within the same import
        if (productNameLower) {
          existingProductNames.add(productNameLower)
        }

        // Get the first site for the user (or default site)
        const userSite = sites && sites.length > 0 ? sites[0] : undefined
        const userAgency = agencies && agencies.length > 0 ? agencies[0] : undefined

        // Map status
        const status = mapProductStatus(row.status)

        // Create product data with all required fields
        const productData = {
          name: row.name,
          description: row.description || '',
          active: true,
          costPrice: parseFloat(row.costPrice) || 0,
          sellingPrice: parseFloat(row.sellingPrice) || 0,
          categoryId: categoryId!, // We've validated this exists above
          reorderPoint: parseInt(row.reorderLevel) || 0,
          safetyStockLevel: parseInt(row.minStockLevel) || 0,
          barcode: row.barcode || '',
          openingStock: parseInt(row.physicalStockOnHand) || 0,
          openingValue:
            (parseFloat(row.sellingPrice) || 0) * (parseInt(row.physicalStockOnHand) || 0),
          siteId: userSite?.id || '',
          agencyId: userAgency?.id || '',
          unit: mapProductUnit(row.unitOfMeasure) as
            | 'Pieces'
            | 'Box'
            | 'Pack'
            | 'Dozen'
            | 'Kilogram'
            | 'Pound'
            | 'Meter'
            | 'Centimeter'
            | 'Liters'
            | 'Milliliter'
            | 'Gram'
            | 'Milligram'
            | 'Ounce'
            | 'Foot'
            | 'Inch',
        }

        // Create the product
        const createdProduct = await createProduct(request, productData, true)

        // Ensure we have the product data in the response
        const productForResponse = {
          id:
            createdProduct && typeof createdProduct === 'object' && 'id' in createdProduct
              ? createdProduct.id
              : undefined,
          name: productData.name, // Use the original name from the CSV
          sellingPrice: productData.sellingPrice,
          physicalStockOnHand: productData.openingStock,
          status: 'available',
        }

        results.products.push(productForResponse)
        results.success++
      } catch (error) {
        results.errors.push(`Row ${i}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    // Emit dashboard update event for bulk product import
    if (results.success > 0) {
      emitter.emit('dashboard-updates', {
        action: 'bulk_products_imported',
        productCount: results.success,
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
    console.error('Error importing products:', error)
    return new Response(
      JSON.stringify({
        error: 'Failed to import products',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}

function mapProductStatus(status: string): string {
  const statusMap: Record<string, string> = {
    available: PRODUCT_STATUSES.AVAILABLE,
    critical: PRODUCT_STATUSES.CRITICAL,
    'low stock': PRODUCT_STATUSES.LOWSTOCK,
    lowstock: PRODUCT_STATUSES.LOWSTOCK,
    'out of stock': PRODUCT_STATUSES.OUTOFSTOCK,
    outofstock: PRODUCT_STATUSES.OUTOFSTOCK,
    damaged: PRODUCT_STATUSES.DAMAGED,
    discontinued: PRODUCT_STATUSES.DISCONTINUED,
    'in transit': PRODUCT_STATUSES.INTRANSIT,
    intransit: PRODUCT_STATUSES.INTRANSIT,
    reserved: PRODUCT_STATUSES.RESERVED,
    archived: PRODUCT_STATUSES.ARCHIVED,
    'on order': PRODUCT_STATUSES.ONORDER,
    onorder: PRODUCT_STATUSES.ONORDER,
  }

  return statusMap[status?.toLowerCase()] || PRODUCT_STATUSES.AVAILABLE
}

function mapProductUnit(unit: string): string {
  const unitMap: Record<string, string> = {
    pieces: 'Pieces',
    pcs: 'Pieces',
    piece: 'Pieces',
    box: 'Box',
    boxes: 'Box',
    pack: 'Pack',
    packs: 'Pack',
    dozen: 'Dozen',
    dozens: 'Dozen',
    kg: 'Kilogram',
    kilogram: 'Kilogram',
    kilograms: 'Kilogram',
    pound: 'Pound',
    pounds: 'Pound',
    lb: 'Pound',
    lbs: 'Pound',
    meter: 'Meter',
    meters: 'Meter',
    m: 'Meter',
    centimeter: 'Centimeter',
    centimeters: 'Centimeter',
    cm: 'Centimeter',
    liter: 'Liters',
    liters: 'Liters',
    l: 'Liters',
    milliliter: 'Milliliter',
    milliliters: 'Milliliter',
    ml: 'Milliliter',
    gram: 'Gram',
    grams: 'Gram',
    g: 'Gram',
    milligram: 'Milligram',
    milligrams: 'Milligram',
    mg: 'Milligram',
    ounce: 'Ounce',
    ounces: 'Ounce',
    oz: 'Ounce',
    foot: 'Foot',
    feet: 'Foot',
    ft: 'Foot',
    inch: 'Inch',
    inches: 'Inch',
    in: 'Inch',
  }

  return unitMap[unit?.toLowerCase()] || 'Pieces'
}
