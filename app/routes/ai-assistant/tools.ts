import { prisma } from '~/app/db.server'

// Shared inventory management tools for chat system
export const inventoryTools = [
  {
    type: 'function',
    function: {
      name: 'get_inventory_stats',
      description:
        'Get current inventory statistics including total products, low stock alerts, and value',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'check_stock_level',
      description: 'Check stock level for a specific product',
      parameters: {
        type: 'object',
        properties: {
          product_name: {
            type: 'string',
            description: 'Name of the product to check stock for',
          },
        },
        required: ['product_name'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_low_stock_products',
      description: 'Get list of products with low stock levels',
      parameters: {
        type: 'object',
        properties: {
          threshold: {
            type: 'number',
            description: 'Stock threshold below which products are considered low stock',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_out_of_stock_products',
      description: 'Get list of products that are completely out of stock (zero quantity)',
      parameters: {
        type: 'object',
        properties: {
          include_category: {
            type: 'boolean',
            description: 'Whether to include category information in the results (default: true)',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'calculate_reorder_suggestion',
      description: 'Calculate reorder suggestions for a product based on sales velocity',
      parameters: {
        type: 'object',
        properties: {
          product_name: {
            type: 'string',
            description: 'Name of the product to calculate reorder for',
          },
        },
        required: ['product_name'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_all_products',
      description:
        'Get a comprehensive list of all products in the inventory with their details. Use this tool when user asks for: "show me all products", "list all products", "display all products", "what products do you have", "view all inventory", "liste moi les produits", "liste les produits", "montre moi les produits", "affiche tous les produits", "voir tous les produits", or similar requests.',
      parameters: {
        type: 'object',
        properties: {
          include_out_of_stock: {
            type: 'boolean',
            description: 'Whether to include out of stock products in the results (default: true)',
          },
          category_filter: {
            type: 'string',
            description: 'Filter products by category name (optional)',
          },
          sort_by: {
            type: 'string',
            description: 'Sort products by: name, quantity, price, category (default: name)',
            enum: ['name', 'quantity', 'price', 'category'],
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_current_time',
      description: 'Get the current date and time',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_product_details',
      description: 'Get detailed information about a specific product by name or SKU',
      parameters: {
        type: 'object',
        properties: {
          search_term: {
            type: 'string',
            description: 'Product name or SKU to search for',
          },
        },
        required: ['search_term'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'navigate_to_page',
      description:
        'Navigate user to a specific page in the application. Use this when user requests to go to, view, or navigate to a specific section of the app.',
      parameters: {
        type: 'object',
        properties: {
          page: {
            type: 'string',
            description:
              'The page to navigate to. Available pages include main sections and management areas.',
            enum: [
              'home',
              'dashboard',
              'products',
              'chat',
              'customers',
              'suppliers',
              'categories',
              'sales-orders',
              'purchase-orders',
              'invoices',
              'bills',
              'stock-adjustments',
              'analytics',
              'settings',
              'sites',
              'teams',
              'roles',
              'agencies',
              'payments-made',
              'payments-received',
              'transfer-orders',
            ],
          },
          reason: {
            type: 'string',
            description: 'Brief explanation of why navigation was triggered',
          },
        },
        required: ['page'],
      },
    },
  },
] as any

// Comprehensive executeFunction that handles all tool calls
export async function executeFunction(name: string, args: any) {
  switch (name) {
    case 'get_inventory_stats':
      // Optimized: Single query with aggregations instead of multiple queries
      const [totalProducts, productData, totalCategories] = await Promise.all([
        prisma.product.count(),
        prisma.product.findMany({
          select: {
            availableQuantity: true,
            physicalStockOnHand: true,
            safetyStockLevel: true,
            reorderPoint: true,
            sellingPrice: true,
            costPrice: true,
          },
        }),
        prisma.category.count(),
      ])

      // Optimized calculations using the productData
      const lowStockProducts = productData.filter(
        (p) => p.safetyStockLevel && p.availableQuantity <= p.safetyStockLevel
      ).length
      const outOfStockProducts = productData.filter((p) => p.availableQuantity === 0).length

      // Calculate total inventory value (availableQuantity × sellingPrice for each product)
      const inventoryValue = productData.reduce((total, product) => {
        return total + product.availableQuantity * Number(product.sellingPrice)
      }, 0)

      return {
        total_products: totalProducts,
        total_value: `$${inventoryValue.toLocaleString()}`,
        low_stock_count: lowStockProducts,
        out_of_stock_count: outOfStockProducts,
        categories: totalCategories,
        last_updated: new Date().toISOString(),
      }

    case 'check_stock_level':
      const productName = args.product_name?.toLowerCase() || ''

      const product = await prisma.product.findFirst({
        where: {
          name: {
            contains: productName,
            mode: 'insensitive',
          },
        },
        include: {
          category: true,
          suppliers: true,
        },
      })

      if (!product) {
        const actualProducts = await prisma.product.findMany({
          select: { name: true },
          take: 5,
          orderBy: { name: 'asc' },
        })

        const suggestions =
          actualProducts.length > 0
            ? `Available products include: ${actualProducts.map((p) => p.name).join(', ')}`
            : 'No products found in inventory'

        return {
          error: `Product "${args.product_name}" not found in inventory`,
          suggestion: suggestions,
        }
      }

      return {
        product: product.name,
        sku: product.sku,
        current_stock: product.availableQuantity,
        physical_stock: product.physicalStockOnHand,
        accounting_stock: product.accountingStockOnHand,
        safety_stock_level: product.safetyStockLevel,
        reorder_point: product.reorderPoint,
        status:
          product.availableQuantity === 0
            ? 'Out of Stock'
            : product.safetyStockLevel && product.availableQuantity <= product.safetyStockLevel
              ? 'Low Stock'
              : 'Good Stock',
        category: product.category.name,
        suppliers: product.suppliers.map((s) => s.name).join(', ') || 'No suppliers',
        unit: product.unit,
        last_updated: product.updatedAt?.toISOString() || new Date().toISOString(),
      }

    case 'get_low_stock_products':
      const threshold = args.threshold || 10

      const allProducts = await prisma.product.findMany({
        select: {
          id: true,
          name: true,
          sku: true,
          availableQuantity: true,
          safetyStockLevel: true,
          reorderPoint: true,
          category: { select: { name: true } },
          suppliers: { select: { name: true } },
        },
        orderBy: { availableQuantity: 'asc' },
      })

      const filteredLowStock = allProducts.filter(
        (item) =>
          item.availableQuantity > 0 && // Exclude out of stock
          (item.availableQuantity <= threshold ||
            (item.safetyStockLevel && item.availableQuantity <= item.safetyStockLevel))
      )

      return {
        threshold,
        count: filteredLowStock.length,
        low_stock_products: filteredLowStock.map((item) => ({
          name: item.name,
          sku: item.sku,
          current_stock: item.availableQuantity,
          safety_stock_level: item.safetyStockLevel,
          reorder_point: item.reorderPoint,
          category: item.category.name,
          suppliers: item.suppliers.map((s) => s.name).join(', ') || 'No suppliers',
          status: item.availableQuantity === 0 ? 'Out of Stock' : 'Low Stock',
        })),
      }

    case 'get_out_of_stock_products':
      const includeCategory = args.include_category !== false // Default to true

      const outOfStockProductsList = await prisma.product.findMany({
        where: {
          availableQuantity: 0,
        },
        select: {
          name: true,
          sku: true,
          availableQuantity: true,
          physicalStockOnHand: true,
          accountingStockOnHand: true,
          safetyStockLevel: true,
          reorderPoint: true,
          sellingPrice: true,
          costPrice: true,
          unit: true,
          updatedAt: true,
          category: includeCategory ? { select: { name: true } } : false,
          suppliers: { select: { name: true } },
        },
        orderBy: { name: 'asc' },
      })

      return {
        total_count: outOfStockProductsList.length,
        out_of_stock_products: outOfStockProductsList.map((product) => ({
          name: product.name,
          sku: product.sku,
          category: includeCategory ? product.category?.name || 'No category' : undefined,
          suppliers: product.suppliers.map((s) => s.name).join(', ') || 'No suppliers',
          physical_stock: product.physicalStockOnHand,
          accounting_stock: product.accountingStockOnHand,
          safety_stock_level: product.safetyStockLevel,
          reorder_point: product.reorderPoint,
          unit_price: `$${Number(product.sellingPrice).toFixed(2)}`,
          cost_price: `$${Number(product.costPrice).toFixed(2)}`,
          unit: product.unit,
          status: 'Out of Stock',
          last_updated: product.updatedAt?.toISOString() || new Date().toISOString(),
        })),
      }

    case 'calculate_reorder_suggestion':
      const reorderProductName = args.product_name?.toLowerCase() || ''
      const reorderProduct = await prisma.product.findFirst({
        where: {
          name: {
            contains: reorderProductName,
            mode: 'insensitive',
          },
        },
        include: {
          suppliers: true,
          stockAdjustmentHistories: {
            orderBy: { createdAt: 'desc' },
            take: 30,
          },
        },
      })

      if (!reorderProduct) {
        const actualProducts = await prisma.product.findMany({
          select: { name: true },
          take: 5,
          orderBy: { name: 'asc' },
        })

        const suggestions =
          actualProducts.length > 0
            ? `Available products include: ${actualProducts.map((p) => p.name).join(', ')}`
            : 'No products found in inventory'

        return {
          error: `Product "${args.product_name}" not found in inventory`,
          suggestion: suggestions,
        }
      }

      // Calculate average daily sales from stock adjustment histories
      const dailySales =
        reorderProduct.stockAdjustmentHistories.length > 0
          ? reorderProduct.stockAdjustmentHistories.reduce(
              (sum: number, adjustment: any) => sum + Math.abs(adjustment.adjustedQuantity),
              0
            ) / 30
          : 2 // Default if no history

      const leadTimeDays = 14 // Default lead time
      const safetyStock = Math.ceil(dailySales * 7) // 1 week safety stock
      const reorderPoint =
        reorderProduct.reorderPoint || Math.ceil(dailySales * leadTimeDays + safetyStock)
      const suggestedReorderQty = Math.max(
        reorderProduct.safetyStockLevel ? reorderProduct.safetyStockLevel * 3 : reorderPoint,
        reorderPoint + safetyStock
      )

      return {
        product: reorderProduct.name,
        sku: reorderProduct.sku,
        current_stock: reorderProduct.availableQuantity,
        physical_stock: reorderProduct.physicalStockOnHand,
        accounting_stock: reorderProduct.accountingStockOnHand,
        safety_stock_level: reorderProduct.safetyStockLevel,
        reorder_point: reorderPoint,
        average_daily_sales: Math.round(dailySales * 100) / 100,
        lead_time_days: leadTimeDays,
        suggested_reorder_quantity: suggestedReorderQty,
        safety_stock: safetyStock,
        suppliers: reorderProduct.suppliers.map((s) => s.name).join(', ') || 'No suppliers',
        urgency:
          reorderProduct.availableQuantity <= reorderPoint
            ? 'High'
            : reorderProduct.availableQuantity <= reorderPoint * 1.5
              ? 'Medium'
              : 'Low',
      }

    case 'get_all_products':
      const includeOutOfStock = args.include_out_of_stock !== false // Default to true
      const categoryFilter = args.category_filter?.toLowerCase()
      const sortBy = args.sort_by || 'name'

      // Build where clause
      const whereClause: any = {}
      if (!includeOutOfStock) {
        whereClause.availableQuantity = { gt: 0 }
      }
      if (categoryFilter) {
        whereClause.category = {
          name: {
            contains: categoryFilter,
            mode: 'insensitive',
          },
        }
      }

      // Build orderBy clause
      let orderBy: any = { name: 'asc' }
      switch (sortBy) {
        case 'quantity':
          orderBy = { availableQuantity: 'desc' }
          break
        case 'price':
          orderBy = { sellingPrice: 'desc' }
          break
        case 'category':
          orderBy = { category: { name: 'asc' } }
          break
        default:
          orderBy = { name: 'asc' }
      }

      const productsList = await prisma.product.findMany({
        where: whereClause,
        include: {
          category: true,
          suppliers: true,
        },
        orderBy,
      })

      return {
        total_count: productsList.length,
        filters_applied: {
          include_out_of_stock: includeOutOfStock,
          category_filter: categoryFilter || 'none',
          sorted_by: sortBy,
        },
        products: productsList.map((product) => ({
          name: product.name,
          sku: product.sku,
          category: product.category.name,
          suppliers: product.suppliers.map((s) => s.name).join(', ') || 'No suppliers',
          current_stock: product.availableQuantity,
          physical_stock: product.physicalStockOnHand,
          accounting_stock: product.accountingStockOnHand,
          safety_stock_level: product.safetyStockLevel,
          reorder_point: product.reorderPoint,
          unit_price: `$${Number(product.sellingPrice).toFixed(2)}`,
          cost_price: `$${Number(product.costPrice).toFixed(2)}`,
          total_value: `$${(product.availableQuantity * Number(product.sellingPrice)).toFixed(2)}`,
          unit: product.unit,
          status:
            product.availableQuantity === 0
              ? 'Out of Stock'
              : product.safetyStockLevel && product.availableQuantity <= product.safetyStockLevel
                ? 'Low Stock'
                : 'In Stock',
          last_updated: product.updatedAt?.toISOString() || new Date().toISOString(),
        })),
      }

    case 'get_current_time':
      return {
        current_time: new Date().toISOString(),
        timezone: 'UTC',
        formatted_time: new Date().toLocaleString(),
      }

    case 'get_product_details':
      const searchTerm = args.search_term?.toLowerCase() || ''

      // Search by name or SKU
      const searchProduct = await prisma.product.findFirst({
        where: {
          OR: [
            {
              name: {
                contains: searchTerm,
                mode: 'insensitive',
              },
            },
            {
              sku: {
                contains: searchTerm,
                mode: 'insensitive',
              },
            },
          ],
        },
        include: {
          category: true,
          suppliers: true,
          stockAdjustmentHistories: {
            orderBy: {
              createdAt: 'desc',
            },
            take: 10, // Last 10 stock adjustments
          },
        },
      })

      if (!searchProduct) {
        const [similarProducts, sampleProducts] = await Promise.all([
          prisma.product.findMany({
            where: {
              OR: [
                {
                  name: {
                    contains: searchTerm.split(' ')[0], // First word of search
                    mode: 'insensitive',
                  },
                },
                {
                  category: {
                    name: {
                      contains: searchTerm,
                      mode: 'insensitive',
                    },
                  },
                },
              ],
            },
            select: {
              name: true,
              sku: true,
            },
            take: 5,
          }),
          prisma.product.findMany({
            take: 5,
            select: {
              name: true,
              sku: true,
            },
          }),
        ])

        const fallbackSuggestion =
          sampleProducts.length > 0
            ? `Try searching for: ${sampleProducts.map((p) => `${p.name} (${p.sku})`).join(', ')}`
            : 'No products found in inventory.'

        return {
          error: `Product "${args.search_term}" not found in inventory`,
          suggestions:
            similarProducts.length > 0
              ? `Did you mean: ${similarProducts.map((p) => `${p.name} (${p.sku})`).join(', ')}`
              : fallbackSuggestion,
        }
      }

      return {
        product_details: {
          basic_info: {
            name: searchProduct.name,
            sku: searchProduct.sku,
            category: searchProduct.category.name,
            suppliers:
              searchProduct.suppliers.map((s) => s.name).join(', ') || 'No suppliers assigned',
            unit: searchProduct.unit,
            brand: searchProduct.brand,
            description: searchProduct.description,
          },
          stock_info: {
            available_quantity: searchProduct.availableQuantity,
            physical_stock: searchProduct.physicalStockOnHand,
            accounting_stock: searchProduct.accountingStockOnHand,
            safety_stock_level: searchProduct.safetyStockLevel,
            reorder_point: searchProduct.reorderPoint,
            status:
              searchProduct.availableQuantity === 0
                ? 'Out of Stock'
                : searchProduct.safetyStockLevel &&
                    searchProduct.availableQuantity <= searchProduct.safetyStockLevel
                  ? 'Low Stock'
                  : 'Normal',
          },
          pricing_info: {
            cost_price: `$${Number(searchProduct.costPrice).toFixed(2)}`,
            selling_price: `$${Number(searchProduct.sellingPrice).toFixed(2)}`,
            total_value: `$${(searchProduct.availableQuantity * Number(searchProduct.sellingPrice)).toFixed(2)}`,
          },
        },
      }

    case 'navigate_to_page':
      const page = args.page?.toLowerCase()
      const reason = args.reason || 'User navigation request'

      // Define comprehensive page routes based on the application structure
      const routes = {
        home: '/',
        dashboard: '/dashboard',
        products: '/products',
        chat: '/chat',
        customers: '/customers',
        suppliers: '/suppliers',
        categories: '/categories',
        'sales-orders': '/sales-orders',
        'purchase-orders': '/purchase-orders',
        invoices: '/invoices',
        bills: '/bills',
        'stock-adjustments': '/stock-adjustments',
        analytics: '/analytics',
        settings: '/settings',
        sites: '/sites',
        teams: '/teams',
        roles: '/roles',
        agencies: '/agencies',
        'payments-made': '/payments-made',
        'payments-received': '/payments-received',
        'transfer-orders': '/transfer-orders',
      }

      // Define user-friendly page names
      const pageNames = {
        home: 'Home',
        dashboard: 'Dashboard',
        products: 'Products',
        chat: 'AI Chat',
        customers: 'Customers',
        suppliers: 'Suppliers',
        categories: 'Categories',
        'sales-orders': 'Sales Orders',
        'purchase-orders': 'Purchase Orders',
        invoices: 'Invoices',
        bills: 'Bills',
        'stock-adjustments': 'Stock Adjustments',
        analytics: 'Analytics',
        settings: 'Settings',
        sites: 'Sites',
        teams: 'Teams',
        roles: 'Roles',
        agencies: 'Agencies',
        'payments-made': 'Payments Made',
        'payments-received': 'Payments Received',
        'transfer-orders': 'Transfer Orders',
      }

      if (!routes[page as keyof typeof routes]) {
        return {
          error: `Unknown page "${args.page}". Available pages: ${Object.keys(routes).join(', ')}`,
          available_pages: Object.keys(routes),
          suggestion: 'Try one of the available pages listed above.',
        }
      }

      const pageName = pageNames[page as keyof typeof pageNames]
      const route = routes[page as keyof typeof routes]

      return {
        action: 'provide_link',
        page: page,
        page_name: pageName,
        route: route,
        reason: reason,
        message: `You can access the ${pageName} page using the link below:`,
        link_text: `Go to ${pageName}`,
        success: true,
      }

    default:
      throw new Error(`Unknown function: ${name}`)
  }
}
